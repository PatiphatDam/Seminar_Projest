-- Question images move from D1 to Cloudflare R2 (bucket digital-muscle-images, Worker binding IMAGES).
-- D1 keeps one small row per image: its id is the URL questions store (/api/images/:id), plus mime, size and uploader.
-- The bytes live in R2 under the key images/<id>; `data` is left empty for those rows.
-- Rows uploaded before this migration (in_r2 = 0) still hold their bytes in `data`; the first time one is viewed it is
-- copied to R2 and its `data` emptied (worker/routes/images.ts), so old images move over without a separate script.
ALTER TABLE images ADD COLUMN in_r2 INTEGER NOT NULL DEFAULT 0;
