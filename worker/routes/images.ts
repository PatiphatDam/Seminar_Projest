import { Hono } from "hono";
import { z } from "zod";
import { readSession, requireAdmin } from "../auth";
import { nowIso, queryFirst } from "../db";
import type { AppEnv } from "../env";
import { badRequest, idParam, notFound, readBody, unauthenticated } from "../http";

/**
 * Images uploaded from the test builder (migration 0005). The browser resizes the picture first, then sends it as a
 * data URL inside JSON (the CSRF guard only accepts application/json bodies). Stored in D1 as a BLOB.
 */
export const imageRoutes = new Hono<AppEnv>();

/** Raw bytes after decoding; the request body limit for this path is 1 MB (base64 adds about a third). */
const MAX_IMAGE_BYTES = 750 * 1024;
const MIME = ["image/webp", "image/jpeg", "image/png", "image/gif"] as const;

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

/** POST /api/admin/images { dataUrl } → { url: "/api/images/12" } */
imageRoutes.post("/admin/images", requireAdmin, async (c) => {
  const body = await readBody(c, uploadBody);
  const { mime, bytes } = decodeDataUrl(body.dataUrl);
  if (bytes.length === 0) throw badRequest("The image is empty.");
  if (bytes.length > MAX_IMAGE_BYTES) throw badRequest("The image is too large (max 750 KB after resizing).");
  const row = await c.env.DB.prepare(
    "INSERT INTO images (mime, data, size, admin_email, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id",
  )
    .bind(mime, bytes, bytes.length, c.get("admin").email, nowIso())
    .first<{ id: number }>();
  if (!row) throw new Error("Failed to store the image");
  return c.json({ url: `/api/images/${row.id}` }, 201);
});

/** GET /api/images/:id — any signed-in user (students see the pictures inside their test). Images never change. */
imageRoutes.get("/images/:id", async (c) => {
  if (!(await readSession(c))) throw unauthenticated();
  const id = idParam(c);
  const row = await queryFirst<{ mime: string; data: ArrayBuffer | number[] }>(c.env.DB, "SELECT mime, data FROM images WHERE id = ?", id);
  if (!row) throw notFound("Image not found.");
  const data = row.data instanceof ArrayBuffer ? new Uint8Array(row.data) : Uint8Array.from(row.data);
  return new Response(data, {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
