import { api } from "@/lib/api";

/** Longest side after resizing — big enough for a projector, small enough to store in D1. */
const MAX_SIDE = 1600;
/** The upload request is capped at 1 MB of JSON; base64 adds about a third, so stay under ~700 KB of image. */
const MAX_BYTES = 700 * 1024;
const MAX_INPUT_BYTES = 20 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't an image this browser can open. Try a JPG or PNG."));
    };
    img.src = url;
  });
}

const dataUrlBytes = (dataUrl: string) => Math.floor(((dataUrl.length - dataUrl.indexOf(",") - 1) * 3) / 4);

/** Resize to ≤ 1600 px and re-encode as WebP (JPEG if the browser can't), shrinking until it fits. */
export async function resizeImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file (JPG, PNG, WebP or GIF).");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is larger than 20 MB. Choose a smaller one.");
  const img = await loadImage(file);
  let scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  for (let round = 0; round < 6; round++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("This browser can't resize images.");
    ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background (JPEG fallback has no alpha)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.75, 0.62]) {
      let out = canvas.toDataURL("image/webp", quality);
      if (!out.startsWith("data:image/webp")) out = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlBytes(out) <= MAX_BYTES) return out;
    }
    scale *= 0.75;
  }
  throw new Error("Couldn't make this image small enough. Try a simpler picture.");
}

/** Upload a picture for the test builder; returns its URL (/api/images/:id). */
export async function uploadImage(file: File): Promise<string> {
  const dataUrl = await resizeImage(file);
  const res = await api.post<{ url: string }>("/admin/images", { dataUrl });
  return res.url;
}
