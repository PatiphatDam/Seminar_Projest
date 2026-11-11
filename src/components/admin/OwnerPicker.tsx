import { useId } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminUser } from "@shared/contract";
import { api } from "@/lib/api";
import { useMe } from "@/lib/auth";
import { errorMessage } from "./format";
import { adminKeys } from "./keys";
import { useToast } from "./toastContext";

/** True for the username (emergency) account — the only one that sees everything and can change owners. */
export function useIsManager(): boolean {
  const me = useMe().data;
  return me?.role === "admin" && me.admin.email.startsWith("local:");
}

/**
 * Username account only: who owns this section or test. Instructors see only their own items, so this is how an item
 * without an owner (made before owners were recorded) or one of an instructor who has left is handed to someone.
 */
export function OwnerPicker({ kind, id, ownerEmail, className }: { kind: "class" | "test"; id: number; ownerEmail: string | null; className?: string }) {
  const manager = useIsManager();
  const qc = useQueryClient();
  const toast = useToast();
  const selectId = useId();
  const admins = useQuery({ queryKey: adminKeys.admins, queryFn: () => api.get<AdminUser[]>("/admin/admins"), enabled: manager });
  const save = useMutation({
    mutationFn: (email: string) => api.post<unknown>(`/admin/${kind === "class" ? "classes" : "tests"}/${id}/owner`, { email }),
    onSuccess: (_d, email) => {
      toast.show(`Now owned by ${email}`, "success");
      void qc.invalidateQueries({ queryKey: kind === "class" ? adminKeys.classesRoot : adminKeys.tests });
      if (kind === "test") void qc.invalidateQueries({ queryKey: adminKeys.test(id) });
      void qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
    onError: (e) => toast.show(errorMessage(e), "error"),
  });
  if (!manager) return null;
  const list = (admins.data ?? []).map((a) => a.email);
  return (
    <span className={className}>
      <label htmlFor={selectId} className="sr-only">
        Owner
      </label>
      <select
        id={selectId}
        value={ownerEmail ?? ""}
        disabled={save.isPending || !admins.data}
        onChange={(e) => e.target.value && save.mutate(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        className="h-8 max-w-full cursor-pointer rounded-lg border border-line bg-surface px-2 text-[12.5px] text-ink disabled:opacity-50"
        title="Owner — only this instructor sees and changes it"
      >
        {!ownerEmail && <option value="">No owner — choose…</option>}
        {ownerEmail && !list.includes(ownerEmail) && <option value={ownerEmail}>{ownerEmail}</option>}
        {list.map((email) => (
          <option key={email} value={email}>
            {email}
          </option>
        ))}
      </select>
    </span>
  );
}
