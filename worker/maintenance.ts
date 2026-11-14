/**
 * Keeps the database small on the Workers Free plan (see docs/ARCHITECTURE.md → "Capacity").
 *  - Daily Cron Trigger (wrangler.jsonc → triggers.crons, 03:00 Thai time) runs `pruneOldData`.
 *  - Admin → Settings → Storage shows `usage()` with a warning near the limit.
 */
import type { UsageReport } from "../shared/contract";
import { nowIso, placeholders } from "./db";
import { imageKey } from "./routes/images";

/** D1 database size limit we plan against (Workers Free). Warn from 80 %. */
export const DB_LIMIT_BYTES = 500 * 1024 * 1024;
export const DB_WARN_RATIO = 0.8;
/** R2 free tier storage (question images, migration 0008). */
export const R2_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
/** Orphan images removed per daily run (IN lists stay ≤ 90 values; leftovers go the next day). */
const ORPHAN_IMAGE_BATCH = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Audit entries older than this are removed. */
export const AUDIT_KEEP_DAYS = 365;
/** Unowned tests that are still empty and untouched for this long are removed (decision A, ARCHITECTURE.md §7.1). */
export const EMPTY_UNOWNED_TEST_DAYS = 7;

export interface PruneResult {
  auditLog: number;
  loginAttempts: number;
  orphanImages: number;
  emptyUnownedTests: number;
}

/**
 * Removes data nobody needs any more. Scores, students and classes are never touched here — those are removed by an
 * instructor (export, then Delete class) at the end of a semester.
 */
export async function pruneOldData(db: D1Database, images: R2Bucket, now = new Date()): Promise<PruneResult> {
  const auditBefore = nowIso(new Date(now.getTime() - AUDIT_KEEP_DAYS * DAY_MS));
  const loginBefore = nowIso(new Date(now.getTime() - DAY_MS));
  const imageBefore = nowIso(new Date(now.getTime() - DAY_MS));
  const emptyTestBefore = nowIso(new Date(now.getTime() - EMPTY_UNOWNED_TEST_DAYS * DAY_MS));

  // Uploaded images that no question and no frozen test version points to (e.g. the question was deleted).
  // Their R2 objects go first: if that fails the rows stay and the next run tries again, so R2 never keeps orphans.
  const orphans = (
    await db
      .prepare(
        `SELECT id, in_r2 FROM images
          WHERE created_at < ?
            AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.image_url = '/api/images/' || images.id)
            AND NOT EXISTS (SELECT 1 FROM test_versions v WHERE instr(v.snapshot, '"/api/images/' || images.id || '"') > 0)
          LIMIT ${ORPHAN_IMAGE_BATCH}`,
      )
      .bind(imageBefore)
      .all<{ id: number; in_r2: number }>()
  ).results;
  const inR2 = orphans.filter((o) => o.in_r2 === 1).map((o) => imageKey(o.id));
  if (inR2.length > 0) await images.delete(inR2);
  const orphanIds = orphans.map((o) => o.id);

  const [audit, logins, removedImages, tests] = await db.batch([
    db.prepare("DELETE FROM audit_log WHERE created_at < ?").bind(auditBefore),
    db.prepare("DELETE FROM admin_login_attempts WHERE attempted_at < ?").bind(loginBefore),
    orphanIds.length > 0
      ? db.prepare(`DELETE FROM images WHERE id IN (${placeholders(orphanIds.length)})`).bind(...orphanIds)
      : db.prepare("SELECT 0 WHERE 0"),
    // Tests without an owner (made before owners were recorded) that have no questions, were never published or
    // assigned, and were not edited for 7 days. Nobody but the emergency account could change them anyway.
    db
      .prepare(
        `DELETE FROM tests
          WHERE owner_email IS NULL
            AND updated_at < ?
            AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.test_id = tests.id)
            AND NOT EXISTS (SELECT 1 FROM test_versions v WHERE v.test_id = tests.id)
            AND NOT EXISTS (SELECT 1 FROM test_assignments a WHERE a.test_id = tests.id)`,
      )
      .bind(emptyTestBefore),
  ]);
  return {
    auditLog: audit.meta.changes,
    loginAttempts: logins.meta.changes,
    orphanImages: orphanIds.length > 0 ? removedImages.meta.changes : 0,
    emptyUnownedTests: tests.meta.changes,
  };
}

export async function usage(db: D1Database): Promise<UsageReport> {
  const r = await db
    .prepare(
      `SELECT (SELECT COALESCE(MAX(id), 0) FROM students) AS students,
              (SELECT COALESCE(MAX(id), 0) FROM attempts) AS attempts,
              (SELECT COUNT(*) FROM images) AS images,
              (SELECT COALESCE(SUM(size), 0) FROM images WHERE in_r2 = 1) AS image_bytes,
              (SELECT COUNT(*) FROM classes) AS classes`,
    )
    .all<{ students: number; attempts: number; images: number; image_bytes: number; classes: number }>();
  const row = r.results[0] ?? { students: 0, attempts: 0, images: 0, image_bytes: 0, classes: 0 };
  return {
    dbBytes: Number(r.meta.size_after ?? 0),
    limitBytes: DB_LIMIT_BYTES,
    warnRatio: DB_WARN_RATIO,
    approx: { students: row.students, attempts: row.attempts, images: row.images },
    classes: row.classes,
    imageBytes: row.image_bytes,
    imageLimitBytes: R2_LIMIT_BYTES,
  };
}
