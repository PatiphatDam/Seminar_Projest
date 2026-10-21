import { Hono } from "hono";
import { GAME_SCORE_KEYS, GAME_SCORE_LABELS, type AdminGameResults, type EnrollmentStatus } from "../../../shared/contract";
import { queryAll, type SqlValue } from "../../db";
import type { AppEnv } from "../../env";
import { round2 } from "../../grading";
import { badRequest } from "../../http";
import { ANONYMIZED_LABEL, loadClassBasics, scopeWhere } from "./common";

export const gameResultRoutes = new Hono<AppEnv>();

interface BestRow {
  enrollment_id: number;
  score_key: string;
  best: number;
  stars: number;
  plays: number;
  last_played_at: string;
}

/**
 * GET /api/admin/game-results?classId=&status=all
 * Best score, stars and number of plays per student for each game/mode (GAME-7).
 * Withdrawn enrollments are excluded unless status=all.
 */
gameResultRoutes.get("/game-results", async (c) => {
  const db = c.env.DB;
  const classIdRaw = c.req.query("classId");
  const includeWithdrawn = c.req.query("status") === "all";
  let classId: number | null = null;
  if (classIdRaw) {
    if (!/^\d+$/.test(classIdRaw)) throw badRequest("classId must be a number.");
    classId = Number(classIdRaw);
    await loadClassBasics(db, classId);
  }
  const own = scopeWhere(c.req.query("scope"), c.get("admin").email);
  const classWhere = classId === null ? `c.status = 'active' AND ${own.sql}` : "c.id = ?";
  const classParams: SqlValue[] = classId === null ? own.params : [classId];
  const statusWhere = includeWithdrawn ? "" : "AND e.status = 'active'";

  const enrollments = await queryAll<{
    id: number;
    status: EnrollmentStatus;
    class_name: string;
    student_code: string | null;
    first_name: string | null;
  }>(
    db,
    `SELECT e.id, e.status, c.name AS class_name, s.student_code, s.first_name
       FROM enrollments e JOIN students s ON s.id = e.student_id JOIN classes c ON c.id = e.class_id
      WHERE ${classWhere} ${statusWhere}
      ORDER BY c.academic_year DESC, c.semester DESC, c.section, s.student_code`,
    ...classParams,
  );

  const best = await queryAll<BestRow>(
    db,
    `SELECT g.enrollment_id, g.score_key, MAX(g.score) AS best, MAX(g.stars) AS stars, COUNT(*) AS plays,
            MAX(g.updated_at) AS last_played_at
       FROM game_runs g JOIN enrollments e ON e.id = g.enrollment_id JOIN classes c ON c.id = e.class_id
      WHERE ${classWhere} ${statusWhere}
      GROUP BY g.enrollment_id, g.score_key`,
    ...classParams,
  );

  const byEnrollment = new Map<number, BestRow[]>();
  for (const b of best) byEnrollment.set(b.enrollment_id, [...(byEnrollment.get(b.enrollment_id) ?? []), b]);

  const rows: AdminGameResults["rows"] = enrollments.map((e) => {
    const games: AdminGameResults["rows"][number]["games"] = Object.fromEntries(GAME_SCORE_KEYS.map((k) => [k, null]));
    for (const b of byEnrollment.get(e.id) ?? []) {
      games[b.score_key] = { best: b.best, stars: b.stars, plays: b.plays, lastPlayedAt: b.last_played_at };
    }
    return {
      studentCode: e.student_code ?? ANONYMIZED_LABEL,
      firstName: e.first_name,
      className: e.class_name,
      enrollmentStatus: e.status,
      games,
    };
  });

  const keys: AdminGameResults["keys"] = GAME_SCORE_KEYS.map((k) => {
    const played = rows.map((r) => r.games[k]).filter((g) => g !== null);
    return {
      scoreKey: k,
      label: GAME_SCORE_LABELS[k],
      players: played.length,
      plays: played.reduce((n, g) => n + g.plays, 0),
      meanBest: played.length ? round2(played.reduce((n, g) => n + g.best, 0) / played.length) : null,
    };
  });

  return c.json<AdminGameResults>({ classId, keys, rows });
});
