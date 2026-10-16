import type { Me } from "@shared/contract";
import { useMe } from "@/lib/auth";

/** Username/password admins sign in as "local:<username>" — the emergency account (docs/ARCHITECTURE.md §7.1). */
const LOCAL_ADMIN_PREFIX = "local:";

/**
 * Mirrors the server rule (worker/routes/admin/common.ts → canChange): instructors change only what they created;
 * the emergency account changes anything; unowned items only the emergency account. Pure — unit tested.
 */
export function canChange(ownerEmail: string | null, me: Me | null | undefined): boolean {
  if (!me || me.role !== "admin") return false;
  const email = me.admin.email;
  return email.startsWith(LOCAL_ADMIN_PREFIX) || (ownerEmail !== null && ownerEmail === email);
}

/** `(ownerEmail) => boolean` for the signed-in admin. */
export function useCanChange(): (ownerEmail: string | null) => boolean {
  const me = useMe().data;
  return (ownerEmail) => canChange(ownerEmail, me);
}

/** "Owned by keerakarn.som@mfu.ac.th" / "No owner" — shown where actions are hidden. */
export function ownerNote(ownerEmail: string | null): string {
  return ownerEmail ? `View only — owned by ${ownerEmail}` : "View only — no owner (only the emergency account can change it)";
}
