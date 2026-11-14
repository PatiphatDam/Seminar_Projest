import { describe, expect, it } from "vitest";
import type { AuditEntry } from "@shared/contract";
import { describeAudit } from "./auditText";

const entry = (action: string, targetType: string, detail: Record<string, unknown> = {}, names?: AuditEntry["names"]): AuditEntry => ({
  id: 1,
  adminEmail: "keerakarn.som@mfu.ac.th",
  action,
  targetType,
  targetId: "7",
  detail,
  createdAt: "2026-11-11T08:00:00Z",
  names,
});

describe("activity sentences", () => {
  it("names the student and the section", () => {
    expect(describeAudit(entry("student.withdraw", "enrollment", { studentId: 3, classId: 1 }, { student: "6731503109", className: "2569/2 · Section 1" }))).toBe(
      "Withdrew 6731503109 from 2569/2 · Section 1",
    );
    expect(describeAudit(entry("student.move", "enrollment", {}, { student: "6731503109", fromClass: "Sec A", toClass: "Sec B" }))).toBe(
      "Moved 6731503109 from Sec A to Sec B",
    );
  });

  it("falls back to what the entry stored when the thing is gone", () => {
    expect(describeAudit(entry("class.delete", "class", { name: "2569/1 · Section 2", students: 1, attempts: 3 }))).toBe(
      "Deleted 2569/1 · Section 2 (1 student, 3 test attempts)",
    );
    expect(describeAudit(entry("test.delete", "test", { title: "Quiz 1" }))).toBe("Deleted test “Quiz 1”");
    expect(describeAudit(entry("student.withdraw", "enrollment", { studentId: 3, classId: 1 }))).toBe("Withdrew a student from a section");
  });

  it("describes class settings and unknown actions", () => {
    expect(describeAudit(entry("class.update", "class", { joinCode: "MUS-4K7P" }, { className: "Sec 1" }))).toBe("Made a new join code MUS-4K7P for Sec 1");
    expect(describeAudit(entry("class.owner", "class", { name: "2569/1 · Section 1 · Keerakarn", owner: "k@mfu.ac.th" }))).toBe(
      "Gave 2569/1 · Section 1 · Keerakarn to k@mfu.ac.th",
    );
    expect(describeAudit(entry("test.owner", "test", { title: "Quiz 1", owner: "k@mfu.ac.th" }))).toBe("Gave test “Quiz 1” to k@mfu.ac.th");
    expect(describeAudit(entry("something.new_thing", "x"))).toBe("Something new thing");
  });
});
