import { useEffect, useState, useSyncExternalStore } from "react";
import type { AdminStudentRow } from "@shared/contract";

/** While "Live" is on, lists that change during class (students scanning the QR code, submitting) refresh this often. */
export const LIVE_REFRESH_MS = 15_000;
/** Live mode switches itself off after this long, so a forgotten tab doesn't poll all day (Workers Free quota). */
const LIVE_MAX_MS = 2 * 60 * 60 * 1000;
const LIVE_KEY = "dm_admin_live_until";

/** Joined within the last 30 minutes → highlighted as "New" so the instructor sees who just arrived. */
const RECENT_JOIN_MS = 30 * 60 * 1000;

export function isRecentJoin(r: Pick<AdminStudentRow, "status" | "joinedAt">, now = Date.now()): boolean {
  if (r.status !== "active" || !r.joinedAt) return false;
  const t = Date.parse(r.joinedAt);
  return Number.isFinite(t) && now - t >= 0 && now - t < RECENT_JOIN_MS;
}

/* ── Live mode (off by default; shared by all admin pages, remembered for up to 2 hours) ── */

const listeners = new Set<() => void>();
function readUntil(): number {
  try {
    return Number(localStorage.getItem(LIVE_KEY)) || 0;
  } catch {
    return 0;
  }
}
let liveUntil = readUntil();

export function setLive(on: boolean) {
  liveUntil = on ? Date.now() + LIVE_MAX_MS : 0;
  try {
    if (on) localStorage.setItem(LIVE_KEY, String(liveUntil));
    else localStorage.removeItem(LIVE_KEY);
  } catch {
    /* storage unavailable — still applies to this tab */
  }
  listeners.forEach((l) => l());
}

/**
 * `refetchInterval` for an admin query: the given interval while Live is on, otherwise false (refresh by hand).
 * Hidden tabs never poll (TanStack Query's default refetchIntervalInBackground: false).
 */
export function useLiveInterval(ms: number = LIVE_REFRESH_MS): number | false {
  const until = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => liveUntil,
  );
  // Expire on time even if nothing else re-renders.
  useEffect(() => {
    if (!until) return;
    const left = until - Date.now();
    if (left <= 0) {
      setLive(false);
      return;
    }
    const t = window.setTimeout(() => setLive(false), left);
    return () => window.clearTimeout(t);
  }, [until]);
  return until > Date.now() ? ms : false;
}

/**
 * "● Live · updated 8 s ago  [Live ⏻] [Refresh]" — refreshing is manual unless the instructor turns Live on during class.
 */
export function LiveIndicator({ updatedAt, fetching, onRefresh }: { updatedAt: number; fetching: boolean; onRefresh: () => void }) {
  const live = useLiveInterval() !== false;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => window.clearInterval(t);
  }, []);
  const secs = updatedAt ? Math.max(0, Math.round((now - updatedAt) / 1000)) : null;
  const ago = secs === null ? "" : secs < 5 ? "just now" : secs < 60 ? `${secs} s ago` : `${Math.round(secs / 60)} min ago`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-[12px] text-muted">
      <span className="inline-flex items-center gap-1.5" aria-live="polite">
        <span className="relative flex size-2" aria-hidden="true">
          {live && fetching && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />}
          <span className={live ? "relative inline-flex size-2 rounded-full bg-success" : "relative inline-flex size-2 rounded-full bg-zinc-300"} />
        </span>
        {live ? "Live" : "Updated"} {ago && `· ${ago}`}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={live}
        onClick={() => setLive(!live)}
        title={live ? "Stop refreshing automatically" : "Refresh every 15 seconds for the next 2 hours (use during class)"}
        className={
          live
            ? "rounded-lg bg-success-soft px-2.5 py-1 font-semibold text-success hover:brightness-95"
            : "rounded-lg border border-line px-2.5 py-1 font-semibold text-ink hover:bg-zinc-50"
        }
      >
        {live ? "Live on" : "Go live"}
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={fetching}
        className="rounded-lg border border-line px-2.5 py-1 font-semibold text-ink hover:bg-zinc-50 disabled:opacity-50"
      >
        {fetching ? "Refreshing…" : "Refresh"}
      </button>
    </span>
  );
}
