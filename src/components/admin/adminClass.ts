import { createContext, useContext } from "react";
import type { AdminClass } from "@shared/contract";

export const ADMIN_CLASS_KEY = "dm_admin_class";

export interface AdminClassState {
  /** Active classes of every instructor. Empty while loading or when there are none. */
  classes: AdminClass[];
  loading: boolean;
  /** Last section the instructor picked on a page (persisted in localStorage) — the default section of the next page. */
  classId: number | null;
  currentClass: AdminClass | null;
  setClassId: (id: number | null) => void;
}

export const AdminClassContext = createContext<AdminClassState | null>(null);

/** The admin's active classes and the remembered section. Pages use it as the default for their own section pickers. */
export function useAdminClass(): AdminClassState {
  const ctx = useContext(AdminClassContext);
  if (!ctx) throw new Error("useAdminClass must be used inside AdminLayout");
  return ctx;
}

/** Pick the class to show: the stored one if it is still active, else the newest active class. */
export function resolveCurrentClass(classes: AdminClass[], stored: number | null): number | null {
  if (classes.length === 0) return null;
  if (stored !== null && classes.some((c) => c.id === stored)) return stored;
  const sorted = [...classes].sort((a, b) => b.academicYear - a.academicYear || b.semester - a.semester || a.section - b.section);
  return sorted[0].id;
}
