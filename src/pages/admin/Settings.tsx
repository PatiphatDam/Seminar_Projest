import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addAdminBody, type AdminUser, type AuditEntry, type UsageReport } from "@shared/contract";
import { api } from "@/lib/api";
import { Link, useNavigate } from "react-router";
import { useAppConfig, useLogout, useMe } from "@/lib/auth";
import { Button, Card, ErrorNote, Input, PageHeader, Spinner } from "@/components/ui";
import { CardTitle, QueryError } from "@/components/admin/controls";
import { errorMessage, formatDateTime, relativeTime } from "@/components/admin/format";
import { adminKeys } from "@/components/admin/keys";
import { ConfirmDialog } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/toastContext";
import { describeAudit } from "@/components/admin/auditText";
import { useAdminClass } from "@/components/admin/adminClass";
import { loginMethodStore } from "@/components/admin/session";

export default function Settings() {
  const me = useMe().data;
  // Only the username (emergency) account manages instructors; everyone else sees just their own account.
  const manager = me?.role === "admin" && me.admin.email.startsWith("local:");
  return (
    <>
      <PageHeader title="Settings" subtitle="Your account, storage space and the changes you made." />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <MyAccountCard />
          {manager && <AdminsCard />}
          <StorageCard />
        </div>
        <ActivityCard />
      </div>
    </>
  );
}

/* ───────── My account ───────── */

function MyAccountCard() {
  const me = useMe().data;
  const config = useAppConfig();
  const { classes } = useAdminClass();
  const logout = useLogout();
  const navigate = useNavigate();
  if (me?.role !== "admin") return null;
  const email = me.admin.email;
  const local = email.startsWith("local:");
  const method = local ? "password" : (loginMethodStore.get() ?? (config.data && !config.data.googleClientId ? "dev" : "google"));
  const mine = classes.filter((c) => c.ownerEmail === email);
  const rows: [string, string][] = [
    ["E-mail", local ? `${email.slice("local:".length)} (username account)` : email],
    ["Signed in with", method === "password" ? "Username and password" : method === "dev" ? "Dev login (this computer only)" : "Google"],
  ];
  return (
    <Card className="p-5">
      <CardTitle>My account</CardTitle>
      <dl className="mt-3 divide-y divide-line text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted">{k}</dt>
            <dd className="truncate text-right font-semibold" title={v}>
              {v}
            </dd>
          </div>
        ))}
        <div className="py-2.5">
          <dt className="text-muted">My sections</dt>
          <dd className="mt-1.5">
            {local ? (
              <p className="text-[13px] text-muted">This account can change every section.</p>
            ) : mine.length === 0 ? (
              <p className="text-[13px] text-muted">
                None yet — <Link to="/admin/classes" className="font-semibold text-ink underline">create a class</Link> to get a QR code for your students.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {mine.map((c) => (
                  <li key={c.id} className="rounded-full bg-zinc-100 px-3 py-1 text-[12.5px] font-semibold">
                    {c.name} <span className="font-normal text-muted">· {c.studentCount} student{c.studentCount === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>
      <Button
        variant="outline"
        className="mt-3"
        loading={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSuccess: () => {
              loginMethodStore.clear();
              navigate("/admin/login", { replace: true });
            },
          })
        }
      >
        Sign out
      </Button>
    </Card>
  );
}

/* ───────── Storage (Workers Free plan) ───────── */

const mb = (b: number) => (b / (1024 * 1024)).toFixed(b < 10 * 1024 * 1024 ? 1 : 0);

function StorageCard() {
  const q = useQuery({ queryKey: adminKeys.usage, queryFn: () => api.get<UsageReport>("/admin/usage") });
  const u = q.data;
  const ratio = u ? Math.min(1, u.dbBytes / u.limitBytes) : 0;
  const warn = !!u && ratio >= u.warnRatio;
  return (
    <Card className="p-5">
      <CardTitle>Storage</CardTitle>
      {q.isError ? (
        <div className="mt-3">
          <QueryError error={q.error} onRetry={() => void q.refetch()} what="storage usage" />
        </div>
      ) : !u ? (
        <Spinner className="mt-3 size-5 text-muted" />
      ) : (
        <>
          <p className="mt-3 text-sm">
            Database <strong className="tabular-nums">{mb(u.dbBytes)} MB</strong> of {mb(u.limitBytes)} MB{" "}
            <span className="text-muted">({Math.round(ratio * 100)}%)</span>
          </p>
          <div
            className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-200"
            role="meter"
            aria-label="Database size"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(ratio * 100)}
          >
            <div className={warn ? "h-full rounded-full bg-danger" : "h-full rounded-full bg-success"} style={{ width: `${Math.max(1, ratio * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted tabular-nums">
            {u.classes} classes · about {u.approx.students.toLocaleString()} students · about {u.approx.attempts.toLocaleString()} test attempts ·{" "}
            {u.approx.images} images
          </p>
          {warn && (
            <div className="mt-3">
              <ErrorNote>The database is over {Math.round(u.warnRatio * 100)}% full. Export the results of past semesters, then delete those classes.</ErrorNote>
            </div>
          )}
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer font-semibold text-ink">End-of-semester checklist</summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>Results → export each class to Excel and keep the files.</li>
              <li>Classes → Delete class for sections that have finished (type the join code to confirm).</li>
              <li>Automatic every week: activity older than 1 year and unused images are removed.</li>
            </ol>
          </details>
        </>
      )}
    </Card>
  );
}

/* ───────── Admins ───────── */

function AdminsCard() {
  const qc = useQueryClient();
  const toast = useToast();
  const me = useMe();
  const myEmail = me.data?.role === "admin" ? me.data.admin.email.toLowerCase() : "";
  const q = useQuery({ queryKey: adminKeys.admins, queryFn: () => api.get<AdminUser[]>("/admin/admins") });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fieldErr, setFieldErr] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<AdminUser | null>(null);

  const add = useMutation({
    mutationFn: (body: { email: string; name?: string }) => api.post<AdminUser>("/admin/admins", body),
    onSuccess: (_d, body) => {
      toast.show(`${body.email} can now sign in as an instructor`, "success");
      setEmail("");
      setName("");
      void qc.invalidateQueries({ queryKey: adminKeys.admins });
      void qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });
  const remove = useMutation({
    mutationFn: (a: AdminUser) => api.del<unknown>(`/admin/admins/${a.id}`),
    onSuccess: (_d, a) => {
      toast.show(`${a.email} removed`, "success");
      setToRemove(null);
      void qc.invalidateQueries({ queryKey: adminKeys.admins });
      void qc.invalidateQueries({ queryKey: adminKeys.audit });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = addAdminBody.safeParse({ email, name: name.trim() || undefined });
    if (!parsed.success) {
      setFieldErr("Enter a valid e-mail address.");
      return;
    }
    if (q.data?.some((a) => a.email.toLowerCase() === parsed.data.email)) {
      setFieldErr("That e-mail is already an instructor.");
      return;
    }
    setFieldErr(null);
    add.mutate(parsed.data);
  }

  return (
    <Card className="p-5">
      <CardTitle>Instructors</CardTitle>
      <p className="mt-1 text-xs text-muted">
        Only this username account sees this list. Everyone listed can sign in to the dashboard with their Google account (“For instructors” on the sign-in
        page); each sees only their own sections, students and tests. To hand a section or test to someone, use its Owner menu (Classes / Tests).
      </p>
      {q.isPending ? (
        <div className="grid place-items-center py-8 text-muted">
          <Spinner />
        </div>
      ) : q.isError ? (
        <div className="mt-3">
          <QueryError error={q.error} onRetry={() => void q.refetch()} what="admins" />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {q.data.length === 0 && <li className="py-3 text-sm text-muted">No instructors added yet.</li>}
          {q.data.map((a) => {
            const isMe = a.email.toLowerCase() === myEmail;
            return (
              <li key={`${a.source}-${a.email}`} className="flex items-center gap-3 py-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-bold" aria-hidden="true">
                  {(a.name || a.email).charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {a.name || a.email}
                    {isMe && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
                  </p>
                  {a.name && <p className="truncate text-xs text-muted">{a.email}</p>}
                </div>
                {a.source === "env" && (
                  <span className="text-xs text-muted" title="Set on the server (ADMIN_EMAILS) — the developer changes it, not this page">
                    Built in
                  </span>
                )}
                {a.source === "database" && a.id !== null ? (
                  <Button size="sm" variant="ghost" onClick={() => setToRemove(a)} disabled={isMe} title={isMe ? "You can’t remove yourself" : undefined}>
                    Remove
                  </Button>
                ) : (
                  <span className="w-[74px]" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submit} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end" noValidate>
        <Input name="new-admin-email" type="email" label="E-mail" placeholder="name@mfu.ac.th" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldErr ?? undefined} autoComplete="off" />
        <Input name="new-admin-name" label="Name (optional)" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        <Button type="submit" loading={add.isPending} className={fieldErr ? "sm:mb-5" : undefined}>
          Add instructor
        </Button>
      </form>
      {add.isError && (
        <div className="mt-3">
          <ErrorNote>{errorMessage(add.error)}</ErrorNote>
        </div>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => {
          setToRemove(null);
          remove.reset();
        }}
        onConfirm={() => {
          if (toRemove) remove.mutate(toRemove);
        }}
        loading={remove.isPending}
        error={remove.isError ? errorMessage(remove.error) : null}
        title={`Remove ${toRemove?.email ?? ""}?`}
        confirmLabel="Remove instructor"
        accent="danger"
      >
        <p>They’ll lose access to the admin dashboard on their next request. You can add them again later.</p>
      </ConfirmDialog>
    </Card>
  );
}

/* ───────── Activity ───────── */

function ActivityCard() {
  const q = useQuery({ queryKey: adminKeys.audit, queryFn: () => api.get<AuditEntry[]>("/admin/audit?limit=50") });
  return (
    <Card className="p-5">
      <CardTitle right={q.isFetching && !q.isPending ? <Spinner className="size-4 text-muted" /> : undefined}>My recent changes</CardTitle>
      <p className="mt-1 text-xs text-muted">The last 50 changes you made — students withdrawn or moved, tests edited or assigned, classes created or deleted.</p>
      {q.isPending ? (
        <div className="grid place-items-center py-12 text-muted">
          <Spinner />
        </div>
      ) : q.isError ? (
        <div className="mt-3">
          <QueryError error={q.error} onRetry={() => void q.refetch()} what="activity" />
        </div>
      ) : q.data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">You haven’t changed anything yet.</p>
      ) : (
        <ol className="mt-2 max-h-[640px] divide-y divide-line overflow-y-auto">
          {q.data.slice(0, 50).map((e) => (
            <li key={e.id} className="py-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 text-sm">{describeAudit(e)}</p>
                <time dateTime={e.createdAt} title={formatDateTime(e.createdAt)} className="shrink-0 text-xs text-muted">
                  {relativeTime(e.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
