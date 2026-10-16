import type { AdminStudentRow } from "@shared/contract";
import { api } from "@/lib/api";

/** Enrollment rows of `studentId` in classes other than `classId` (pure — unit tested). */
export function otherEnrollments(rows: AdminStudentRow[], studentId: number, classId: number): AdminStudentRow[] {
  return rows.filter((r) => r.studentId === studentId && r.classId !== classId && r.enrollmentId !== null);
}

/**
 * Hard delete removes the student's attempts in EVERY section, but "Export this class first" only exports
 * the current one. Look the student up in every other class (archived included — `/admin/students`
 * without classId only covers active classes) so the caller can block the delete.
 */
export async function findOtherEnrollments(student: { studentId: number; studentCode: string }, classId: number): Promise<AdminStudentRow[]> {
  // One request, every class (any owner, archived included).
  const rows = await api.get<AdminStudentRow[]>(`/admin/students/${student.studentId}/enrollments`);
  return otherEnrollments(rows, student.studentId, classId);
}
