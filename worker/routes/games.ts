import { Hono } from "hono";
import { gameRunBody, type GameBest, type GameScoreKey } from "../../shared/contract";
import { execute, nowIso, queryAll } from "../db";
import type { AppEnv } from "../env";
import { readBody } from "../http";
import { requireStudent } from "../auth";

/** Game scores (GAME-7): the games module posts every finished (or left) run here. */
export const gameRoutes = new Hono<AppEnv>();

gameRoutes.use("/me/game-runs", requireStudent);

/**
 * POST /api/me/game-runs — saves one run. The same runId sent again (a resumed Diameter run) updates that row,
 * so a run is never counted twice.
 */
gameRoutes.post("/me/game-runs", async (c) => {
  const s = c.get("student");
  const body = await readBody(c, gameRunBody);
  const now = nowIso();
  await execute(
    c.env.DB,
    `INSERT INTO game_runs (student_id, enrollment_id, class_id, run_id, game_id, score_key, score, stars, completed,
                            summary, mistakes, achievements, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (student_id, run_id) DO UPDATE SET
       score = excluded.score, stars = excluded.stars, completed = excluded.completed, summary = excluded.summary,
       mistakes = excluded.mistakes, achievements = excluded.achievements, updated_at = excluded.updated_at`,
    s.id,
    s.enrollment?.id ?? null,
    s.enrollment?.classId ?? null,
    body.runId,
    body.scoreKey.split(":")[0],
    body.scoreKey,
    body.score,
    body.stars,
    body.completed ? 1 : 0,
    body.summary,
    JSON.stringify(body.mistakes),
    JSON.stringify(body.achievements),
    now,
    now,
  );
  return c.json({ ok: true }, 201);
});

/** GET /api/me/game-runs — the signed-in student's best score per game/mode. */
gameRoutes.get("/me/game-runs", async (c) => {
  const s = c.get("student");
  const rows = await queryAll<{ score_key: GameScoreKey; best: number; stars: number; plays: number; last_played_at: string }>(
    c.env.DB,
    `SELECT score_key, MAX(score) AS best, MAX(stars) AS stars, COUNT(*) AS plays, MAX(updated_at) AS last_played_at
       FROM game_runs WHERE student_id = ? GROUP BY score_key`,
    s.id,
  );
  return c.json<GameBest[]>(
    rows.map((r) => ({ scoreKey: r.score_key, best: r.best, stars: r.stars, plays: r.plays, lastPlayedAt: r.last_played_at })),
  );
});
