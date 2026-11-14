import { Hono } from "hono";
import { z } from "zod";
import { readSession, requireAdmin } from "../auth";
import { execute, nowIso, queryFirst } from "../db";
import type { AppEnv } from "../env";
import { badRequest, idParam, notFound, readBody, unauthenticated } from "../http";

/**
 * Images uploaded from the test builder. The browser resizes the picture first, then sends it as a data URL inside
 * JSON (the CSRF guard only accepts application/json bodies).
 *
 * Storage (migration 0008): the bytes live in Cloudflare R2 (binding IMAGES, key `images/<id>`, free tier 10 GB) so
 * pictures don't fill the 500 MB D1 database. D1 keeps one small row per image — its id is the URL questions store
 * (/api/images/:id), so questions and frozen test versions never change. Images uploaded before 0008 still have their
 * bytes in D1 (`in_r2 = 0`); the first view copies them to R2 and empties `data`.
 */
export const imageRoutes = new Hono<AppEnv>();

/** Raw bytes after decoding; the request body limit for this path is 1 MB (base64 adds about a third). */
const MAX_IMAGE_BYTES = 750 * 1024;
const MIME = ["image/webp", "image/jpeg", "image/png", "image/gif"] as const;

/** R2 object key of an image. */
export const imageKey = (id: number) => `images/${id}`;

const uploadBody = z.object({
  dataUrl: z.string().max(1024 * 1024).regex(/^data:image\/(webp|jpeg|png|gif);base64,[A-Za-z0-9+/=]+$/, "Expected a base64 image"),
});

function decodeDataUrl(dataUrl: string): { mime: (typeof MIME)[number]; bytes: Uint8Array } {
  const comma = dataUrl.indexOf(",");
  const mime = dataUrl.slice(5, dataUrl.indexOf(";")) as (typeof MIME)[number];
  if (!MIME.includes(mime)) throw badRequest("Use a WebP, JPEG, PNG or GIF image.");
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime, bytes };
}

const imageHeaders = (mime: string) => ({
  "Content-Type": mime,
  "Cache-Control": "private, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
});

/** POST /api/admin/images { dataUrl } → { url: "/api/images/12" } */
imageRoutes.post("/admin/images", requireAdmin, async (c) => {
  const body = await readBody(c, uploadBody);
  const { mime, bytes } = decodeDataUrl(body.dataUrl);
  if (bytes.length === 0) throw badRequest("The image is empty.");
  if (bytes.length > MAX_IMAGE_BYTES) throw badRequest("The image is too large (max 750 KB after resizing).");
  // The row gives the image its id (= its URL); the bytes go to R2. If R2 refuses, the row is removed again.
  const row = await c.env.DB.prepare(
    "INSERT INTO images (mime, data, size, admin_email, created_at, in_r2) VALUES (?, X'', ?, ?, ?, 1) RETURNING id",
  )
    .bind(mime, bytes.length, c.get("admin").email, nowIso())
    .first<{ id: number }>();
  if (!row) throw new Error("Failed to store the image");
  try {
    await c.env.IMAGES.put(imageKey(row.id), bytes, { httpMetadata: { contentType: mime } });
  } catch (err) {
    await execute(c.env.DB, "DELETE FROM images WHERE id = ?", row.id);
    throw err;
  }
  return c.json({ url: `/api/images/${row.id}` }, 201);
});

/** GET /api/images/:id — any signed-in user (students see the pictures inside their test). Images never change. */
imageRoutes.get("/images/:id", async (c) => {
  if (!(await readSession(c))) throw unauthenticated();
  const id = idParam(c);
  const meta = await queryFirst<{ mime: string; in_r2: number }>(c.env.DB, "SELECT mime, in_r2 FROM images WHERE id = ?", id);
  if (!meta) throw notFound("Image not found.");

  if (meta.in_r2 === 1) {
    const obj = await c.env.IMAGES.get(imageKey(id));
    if (!obj) throw notFound("Image not found.");
    return new Response(obj.body, { headers: imageHeaders(meta.mime) });
  }

  // Uploaded before R2: serve from D1 and move it to R2 on the way (once — the UPDATE only runs while in_r2 = 0).
  const old = await queryFirst<{ data: ArrayBuffer | number[] }>(c.env.DB, "SELECT data FROM images WHERE id = ?", id);
  if (!old) throw notFound("Image not found.");
  const data = old.data instanceof ArrayBuffer ? new Uint8Array(old.data) : Uint8Array.from(old.data);
  c.executionCtx.waitUntil(
    c.env.IMAGES.put(imageKey(id), data, { httpMetadata: { contentType: meta.mime } })
      .then(() => execute(c.env.DB, "UPDATE images SET data = X'', in_r2 = 1 WHERE id = ? AND in_r2 = 0", id))
      .catch((err) => console.error("Moving image to R2 failed:", id, err instanceof Error ? err.message : String(err))),
  );
  return new Response(data, { headers: imageHeaders(meta.mime) });
});
