import { Hono } from "hono";
import { addAdminBody, type AdminUser, type AuditEntry } from "../../../shared/contract";
import { auditStmt, auditStmtForLastInsert, nowIso, parseJson, queryAll, queryFirst, stmt } from "../../db";
import { envAdminEmails, type AppEnv } from "../../env";
import { conflict, forbidden, idParam, notFound, readBody } from "../../http";
import { usage } from "../../maintenance";
import { isEmergencyAdmin } from "./common";

export const adminUserRoutes = new Hono<AppEnv>();

/** Managing instructors is for the username (emergency) account only; each instructor sees just their own account. */
const assertManager = (admin: { email: string }) => {
  if (!isEmergencyAdmin(admin)) throw forbidden("Only the admin username account can manage instructors.", "not_manager");
};

async function listAdmins(db: D1Database, env: Env): Promise<AdminUser[]> {
  const rows = await queryAll<{ id: number; email: string; name: string | null }>(
    db,
    "SELECT id, email, name FROM admins ORDER BY email",
  );
  const inDb = new Set(rows.map((r) => r.email.toLowerCase()));
  return [
    ...envAdminEmails(env)
      .filter((e) => !inDb.has(e))
      .map<AdminUser>((email) => ({ id: null, email, name: null, source: "env" })),
    ...rows.map<AdminUser>((r) => ({ id: r.id, email: r.email.toLowerCase(), name: r.name, source: "database" })),
  ];
}

adminUserRoutes.get("/admins", async (c) => {
  assertManager(c.get("admin"));
  return c.json(await listAdmins(c.env.DB, c.env));
});

adminUserRoutes.post("/admins", async (c) => {
  assertManager(c.get("admin"));
  const body = await readBody(c, addAdminBody);
  const db = c.env.DB;
  if (await queryFirst(db, "SELECT 1 AS one FROM admins WHERE email = ?", body.email)) {
    throw conflict(`${body.email} is already an instructor.`);
  }
  const name = body.name?.trim() || null;
  await db.batch([
    stmt(db, "INSERT INTO admins (email, name, created_at) VALUES (?, ?, ?)", body.email, name, nowIso()),
    auditStmtForLastInsert(db, c.get("admin").email, "admin.add", "admin", { email: body.email }),
  ]);
  const row = await queryFirst<{ id: number; email: string; name: string | null }>(
    db,
    "SELECT id, email, name FROM admins WHERE email = ?",
    body.email,
  );
  if (!row) throw new Error("Admin insert failed");
  return c.json<AdminUser>({ id: row.id, email: row.email.toLowerCase(), name: row.name, source: "database" }, 201);
});

/** Removes a database admin. ENV admins have no id and cannot be removed here; you cannot remove yourself. */
adminUserRoutes.delete("/admins/:id", async (c) => {
  const id = idParam(c);
  const db = c.env.DB;
  const me = c.get("admin");
  assertManager(me);
  const row = await queryFirst<{ email: string }>(db, "SELECT email FROM admins WHERE id = ?", id);
  if (!row) throw notFound("Instructor not found.");
  if (row.email.toLowerCase() === me.email) throw conflict("You cannot remove your own instructor access.");
  await db.batch([
    stmt(db, "DELETE FROM admins WHERE id = ?", id),
    auditStmt(db, me.email, "admin.remove", "admin", id, { email: row.email.toLowerCase() }),
  ]);
  return c.json({ ok: true as const });
});

/** Settings → Storage (username account only): database size against the Free-plan limit and rough row counts. */
adminUserRoutes.get("/usage", async (c) => {
  assertManager(c.get("admin"));
  return c.json(await usage(c.env.DB));
});

/** Settings → "My recent changes": the signed-in instructor's own entries. */
adminUserRoutes.get("/audit", async (c) => {
  const raw = Number(c.req.query("limit") ?? 50);
  const limit = Number.isFinite(raw) ? Math.min(200, Math.max(1, Math.floor(raw))) : 50;
  const rows = await queryAll<{
    id: number;
    admin_email: string;
    action: string;
    target_type: string;
    target_id: string | null;
    detail: string;
    created_at: string;
  }>(
    c.env.DB,
    "SELECT id, admin_email, action, target_type, target_id, detail, created_at FROM audit_log WHERE admin_email = ? ORDER BY id DESC LIMIT ?",
    c.get("admin").email,
    limit,
  );
  const entries = rows.map<AuditEntry>((r) => ({
    id: r.id,
    adminEmail: r.admin_email,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    detail: parseJson<Record<string, unknown>>(r.detail, {}),
    createdAt: r.created_at,
  }));
  return c.json<AuditEntry[]>(await withNames(c.env.DB, entries));
});

const idOf = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

/** Look up the student IDs, section names and test titles the entries point at (three queries for the whole page). */
async function withNames(db: D1Database, entries: AuditEntry[]): Promise<AuditEntry[]> {
  const ids = { student: new Set<number>(), class: new Set<number>(), test: new Set<number>() };
  const refs = entries.map((e) => {
    const d = e.detail;
    const target = idOf(e.targetId);
    const r = {
      student: idOf(d.studentId) ?? (e.targetType === "student" ? target : null),
      className: idOf(d.classId) ?? (e.targetType === "class" ? target : null),
      fromClass: idOf(d.fromClassId),
      toClass: idOf(d.toClassId),
      test: e.targetType === "test" ? target : null,
    };
    if (r.student) ids.student.add(r.student);
    for (const k of ["className", "fromClass", "toClass"] as const) if (r[k]) ids.class.add(r[k]);
    if (r.test) ids.test.add(r.test);
    return r;
  });
  const lookup = async (sql: string, set: Set<number>) => {
    if (set.size === 0) return new Map<number, string>();
    const list = [...set];
    const rows = await queryAll<{ id: number; label: string | null }>(db, sql.replace("?", list.map(() => "?").join(",")), ...list);
    return new Map(rows.filter((r) => r.label).map((r) => [r.id, r.label as string]));
  };
  const [students, classes, tests] = await Promise.all([
    lookup("SELECT id, student_code AS label FROM students WHERE id IN (?)", ids.student),
    lookup("SELECT id, name AS label FROM classes WHERE id IN (?)", ids.class),
    lookup("SELECT id, title AS label FROM tests WHERE id IN (?)", ids.test),
  ]);
  return entries.map((e, i) => {
    const r = refs[i];
    const names: NonNullable<AuditEntry["names"]> = {};
    if (r.student && students.has(r.student)) names.student = students.get(r.student);
    if (r.className && classes.has(r.className)) names.className = classes.get(r.className);
    if (r.fromClass && classes.has(r.fromClass)) names.fromClass = classes.get(r.fromClass);
    if (r.toClass && classes.has(r.toClass)) names.toClass = classes.get(r.toClass);
    if (r.test && tests.has(r.test)) names.test = tests.get(r.test);
    return Object.keys(names).length > 0 ? { ...e, names } : e;
  });
}
