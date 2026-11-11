import type { AuditEntry } from "@shared/contract";

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : typeof v === "number" ? String(v) : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/**
 * One activity-log entry as a sentence for Settings → Recent activity, e.g. "Withdrew 6731503109 from 2569/2 · Section 1".
 * Uses the names the API looked up (`names`) and falls back to what the entry stored, then to generic words. Pure — unit tested.
 */
export function describeAudit(e: AuditEntry): string {
  const d = e.detail;
  const n = e.names ?? {};
  const student = n.student ?? "a student";
  const cls = n.className ?? str(d.name) ?? "a section";
  const test = n.test ? `“${n.test}”` : str(d.title) ? `“${str(d.title)}”` : "a test";

  switch (e.action) {
    case "admin.login":
      return "Signed in with the username account";
    case "admin.add":
      return `Added instructor ${str(d.email) ?? ""}`.trim();
    case "admin.remove":
      return `Removed instructor ${str(d.email) ?? ""}`.trim();
    case "class.create":
      return `Created ${cls}`;
    case "class.update": {
      const parts: string[] = [];
      if (typeof d.restrictToRoster === "boolean") parts.push(`${d.restrictToRoster ? "Turned on" : "Turned off"} “only students on the roster can join” for ${cls}`);
      if (str(d.joinCode)) parts.push(`Made a new join code ${str(d.joinCode)} for ${cls}`);
      return parts.length > 0 ? parts.join(" · ") : `Changed ${cls}`;
    }
    case "class.owner":
      return `Gave ${str(d.name) ?? cls} to ${str(d.owner) ?? "an instructor"}`;
    case "class.archive":
      return `Archived ${cls}`;
    case "class.unarchive":
      return `Restored ${cls}`;
    case "class.delete": {
      const s = num(d.students);
      const a = num(d.attempts);
      return `Deleted ${str(d.name) ?? cls}${s !== null && a !== null ? ` (${plural(s, "student")}, ${plural(a, "test attempt")})` : ""}`;
    }
    case "roster.import": {
      const c = num(d.count);
      return `Imported ${c !== null ? plural(c, "student") : "students"} to the roster of ${cls}`;
    }
    case "roster.clear":
      return `Cleared the roster of ${cls}`;
    case "student.enroll":
      return `Added ${student} to ${cls}`;
    case "student.withdraw":
      return `Withdrew ${student} from ${cls}`;
    case "student.reactivate":
      return `Reactivated ${student} in ${cls}`;
    case "student.move":
      return `Moved ${student} from ${n.fromClass ?? "a section"} to ${n.toClass ?? "another section"}`;
    case "student.anonymize":
      return "Anonymized a student (scores kept without identity)";
    case "student.delete":
      return "Deleted a student and all their data";
    case "test.create": {
      const q = num(d.questions);
      return `Created test ${test}${q !== null ? ` (${plural(q, "question")})` : ""}`;
    }
    case "test.owner":
      return `Gave test ${test} to ${str(d.owner) ?? "an instructor"}`;
    case "test.update":
      return `Edited test ${test}`;
    case "test.delete":
      return `Deleted test ${test}`;
    case "assignment.upsert":
      return `Assigned ${test} to ${cls}`;
    case "assignment.delete":
      return `Removed ${test} from ${cls}`;
    default: {
      const words = e.action.replace(/[._]/g, " ");
      return words.charAt(0).toUpperCase() + words.slice(1);
    }
  }
}
