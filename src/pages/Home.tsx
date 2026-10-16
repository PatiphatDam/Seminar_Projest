import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import type { StudentStatus } from "@shared/contract";
import { cx } from "@/components/ui";
import { useStudentMe } from "@/components/student/RequireStudent";
import { describeAuthError, joinNoticeStore } from "@/components/student/authHelpers";
import { useJoinClass } from "@/lib/auth";
import { TOPICS } from "@/content/lessons";
import { useStudentStatus } from "@/components/student/queries";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { InfoIcon } from "@/components/student/icons";

type Accent = "tests" | "lessons" | "games" | "explore" | "post";

/** Coastal Soft palette (src/index.css): sea blue = Pretest, lilac = Lessons, sea green = Games, sand = 3D Explore, coral = Posttest. */
const coast: Record<Accent, string> = {
  tests: "coast-pre",
  lessons: "coast-lessons",
  games: "coast-games",
  explore: "coast-explore",
  post: "coast-post",
};

export default function Home() {
  const me = useStudentMe();
  useDocumentTitle("Home");
  const enrolled = !!me.enrollment && me.enrollment.status === "active";

  const status = useStudentStatus(enrolled);

  // One-shot notice from the login response (read once, then forget it).
  const [notice, setNotice] = useState<string | undefined>(() => me.joinNotice ?? joinNoticeStore.get());
  useEffect(() => {
    joinNoticeStore.clear();
  }, []);

  return (
    <div>
      <div className="min-w-0">
        <h1 className="text-[26px] font-bold leading-8 text-ink md:text-[33px] md:leading-10 lg:text-[41px] lg:leading-[48px]">
          Hi, {me.student.firstName ?? "there"}
        </h1>
        <p className="mt-1 text-[13px] leading-[18px] text-muted md:mt-1.5 md:text-[15px] md:leading-[22px] lg:mt-2.5 lg:text-[16px] lg:leading-6">
          {me.student.studentCode}
          {me.enrollment && ` · ${sectionLabel(me.enrollment.className)}`}
        </p>
      </div>

      <div className="mt-6 space-y-3 empty:hidden">
        {!enrolled && (
          <Notice tone="warning" title="You're not in a class yet — scan your section's QR code.">
            Scan the QR code your instructor shows, or type the join code below.
            <JoinCodeForm onJoined={setNotice} />
          </Notice>
        )}
        {notice && (
          <Notice tone="info" onDismiss={() => setNotice(undefined)}>
            {notice}
          </Notice>
        )}
        {status.isError && (
          <Notice tone="warning" title="We couldn't load your test status.">
            <button
              type="button"
              className="font-semibold underline disabled:opacity-50"
              disabled={status.isFetching}
              onClick={() => void status.refetch()}
            >
              {status.isFetching ? "Retrying…" : "Retry"}
            </button>
          </Notice>
        )}
      </div>

      <h2 className="mt-[35px] text-[17px] font-semibold leading-6 text-ink md:mt-[47px] md:text-[22px] md:leading-7 lg:mt-[62px]">Start learning</h2>
      <ul className="mt-4 grid gap-[13px] md:mt-[23px] md:grid-cols-2 md:gap-[21px] lg:mt-[26px] lg:gap-[25px] xl:grid-cols-5 xl:gap-[18px]">
        {/* Learning order: pretest first (recommended, not locked), activities, posttest last. */}
        <MenuCard
          accent="tests"
          title="Pretest"
          subtitle="Do this first, before the lesson"
          chips={pretestChips(status.data, enrolled, status.isPending)}
          action="Open"
          to="/pretest"
          badge={enrolled && status.data?.pretest && !status.data.pretest.submitted ? "Start here" : undefined}
        />
        <MenuCard
          accent="lessons"
          title="Lessons"
          subtitle="Read about muscular tissues, any topic first"
          chips={TOPICS.map((t) => tag(t.title))}
          action="Read"
          to="/lessons"
        />
        <MenuCard
          accent="games"
          title="Games"
          subtitle="Practice with quick 2D games"
          chips={["Balloon Pop", "Group Sort", "Diameter"].map(tag)}
          action="Play"
          to="/games"
        />
        <MenuCard
          accent="explore"
          title="3D Explore"
          subtitle="Zoom from muscle to sarcomere"
          chips={["Muscle", "Fascicle", "Fiber", "Myofibril", "Sarcomere"].map(tag)}
          action="Explore"
          to="/explore"
        />
        <MenuCard
          accent="post"
          title="Posttest"
          subtitle="After the lesson — see how much you learned"
          chips={posttestChips(status.data, enrolled, status.isPending)}
          action="Open"
          to="/posttest"
          lastOdd
        />
      </ul>
    </div>
  );
}

/** Join code (e.g. MUS-4K7P) for students who signed in without scanning the section QR. */
function JoinCodeForm({ onJoined }: { onJoined: (notice: string | undefined) => void }) {
  const join = useJoinClass();
  const [code, setCode] = useState("");
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    join.mutate(value, {
      onSuccess: (next) => {
        if (next.role !== "student") return;
        onJoined(next.joinNotice ?? (next.enrollment ? `You joined ${sectionLabel(next.enrollment.className)}.` : undefined));
        setCode("");
      },
    });
  };
  return (
    <form onSubmit={onSubmit} className="mt-2.5 flex flex-wrap items-center gap-2">
      <label htmlFor="join-code" className="sr-only">
        Join code
      </label>
      <input
        id="join-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="MUS-XXXX"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={20}
        className="h-10 w-40 rounded-xl border border-amber-300 bg-surface px-3 font-mono text-sm uppercase text-ink outline-none focus:border-amber-600"
      />
      <button
        type="submit"
        disabled={join.isPending || !code.trim()}
        className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-on-ink hover:bg-zinc-700 disabled:opacity-50"
      >
        {join.isPending ? "Joining…" : "Join class"}
      </button>
      {join.isError && <p className="w-full text-[13px] font-medium text-red-700">{describeAuthError(join.error)}</p>}
    </form>
  );
}

/** "2569/1 · Section 1" → "Section 1 (2569/1)" (Figma greeting line). */
function sectionLabel(className: string) {
  const m = /^(\d{4}\/\d)\s*·\s*(.+)$/.exec(className);
  return m ? `${m[2]} (${m[1]})` : className;
}

type ChipTone = "tag" | "done" | "neutral" | "start" | "post";
type Chip = { label: string; tone: ChipTone };

const tag = (label: string): Chip => ({ label, tone: "tag" });

const done = (score: number | null, max: number | null) => (score !== null && max !== null ? `Done ${score}/${max}` : "Done");
const neutral = (label: string): Chip => ({ label, tone: "neutral" });

function pretestChips(s: StudentStatus | undefined, enrolled: boolean, pending: boolean): Chip[] {
  if (!enrolled) return [neutral("Join a class first")];
  if (pending || !s) return [neutral("Loading…")];
  const p = s.pretest;
  if (!p) return [neutral("Not assigned yet")];
  return p.submitted ? [{ label: done(p.score, p.maxScore), tone: "done" }] : [{ label: "Not done yet", tone: "start" }];
}

function posttestChips(s: StudentStatus | undefined, enrolled: boolean, pending: boolean): Chip[] {
  if (!enrolled) return [neutral("Join a class first")];
  if (pending || !s) return [neutral("Loading…")];
  const p = s.posttest;
  if (!p) return [neutral("Not assigned yet")];
  if (p.submitted) return [{ label: done(p.score, p.maxScore), tone: "done" }];
  return [p.isOpen ? { label: "Open now", tone: "post" } : neutral("Opens after the lesson")];
}

type MenuCardProps = {
  accent: Accent;
  title: string;
  subtitle: string;
  chips: Chip[];
  action: string;
  to: string;
  /** Coral pill on the cover, e.g. "Start here" on the Pretest card until it's done. */
  badge?: string;
  /** Tablet: the 5th card spans both columns so it doesn't sit alone. */
  lastOdd?: boolean;
};

/*
 * Coastal Soft menu card (Downloads/Coastal Soft-html): tinted card, 18 px corners, thin edge,
 * a soft coloured shadow, a darker tinted cover panel with the line icon, Playfair title, pill chips and a hairline footer.
 * Phone: one column, shorter cover · tablet: 2 columns (Posttest spans both) · desktop (≥1280): all five in one row, in learning order.
 */
function MenuCard({ accent, title, subtitle, chips, action, to, badge, lastOdd }: MenuCardProps) {
  return (
    <li className={cx("coast-card relative flex flex-col p-3 pb-4", coast[accent], lastOdd && "md:col-span-2 xl:col-span-1")}>
      <div className="coast-panel relative flex h-[84px] items-center justify-center md:h-[108px]">
        {badge && (
          <span className="coast-badge absolute left-2.5 top-2.5 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]">{badge}</span>
        )}
        <MenuIcon accent={accent} />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-2 pt-[18px]">
        <h3 className="coast-serif text-[23px] leading-7">{title}</h3>
        <p className="coast-muted text-[14.5px] leading-[1.5]">{subtitle}</p>
        <ul className="mt-1 flex flex-wrap gap-2" aria-label={`${title} includes`}>
          {chips.map((c) => (
            <li key={c.label} className="coast-chip px-3 py-[5px] text-[12.5px] font-bold">
              {c.tone === "done" && <span aria-hidden="true">✓ </span>}
              {c.label}
            </li>
          ))}
        </ul>
        <div className="coast-foot mt-auto flex items-center justify-end gap-3 pt-3.5">
          <Link
            to={to}
            aria-label={`${action} — ${title}`}
            // after:inset-0 stretches the link over the whole card, so tapping anywhere on the card opens it.
            className="coast-btn px-6 py-2.5 text-[14.5px] font-bold after:absolute after:inset-0 after:rounded-[18px]"
          >
            {action}
          </Link>
        </div>
      </div>
    </li>
  );
}

/** Line icons from the Coastal Soft design (book icon added for Lessons); stroke follows the card accent. */
function MenuIcon({ accent }: { accent: Accent }) {
  const common = {
    width: 50,
    height: 50,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    "aria-hidden": true,
  };
  if (accent === "games")
    return (
      <svg {...common}>
        <ellipse cx="12" cy="9.5" rx="5.5" ry="6.5" />
        <path d="M11 16 H13 L12 17.4 Z" />
        <path d="M12 17.4 C10.4 18.8 13.6 19.8 12 21.5" />
      </svg>
    );
  if (accent === "lessons")
    return (
      <svg {...common}>
        <path d="M12 6.5c-1.8-1.3-4.3-2-7.5-2v13c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2v-13c-3.2 0-5.7.7-7.5 2Z" />
        <path d="M12 6.5v13" />
      </svg>
    );
  if (accent === "explore")
    return (
      <svg {...common}>
        <path d="M12 2.5 L20 7 V16.5 L12 21 L4 16.5 V7 Z" />
        <path d="M4 7 L12 11.5 L20 7" />
        <path d="M12 11.5 V21" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="5" y="4" width="14" height="17" rx="3" />
      <rect x="9" y="2.5" width="6" height="3" rx="1.2" />
      {accent === "tests" ? (
        <>
          <path d="M8.5 10.5 L9.7 11.7 L11.7 9.5" />
          <path d="M13.5 10.8 H15.8" />
          <path d="M8.5 15.5 L9.7 16.7 L11.7 14.5" />
          <path d="M13.5 15.8 H15.8" />
        </>
      ) : (
        <path d="M12 9.5 L13.1 11.8 L15.6 12.1 L13.8 13.8 L14.3 16.3 L12 15 L9.7 16.3 L10.2 13.8 L8.4 12.1 L10.9 11.8 Z" />
      )}
    </svg>
  );
}

function Notice({
  tone: kind,
  title,
  children,
  onDismiss,
}: {
  tone: "info" | "warning";
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
}) {
  return (
    <div
      role={kind === "warning" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm",
        kind === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-line bg-surface text-ink",
      )}
    >
      <InfoIcon size={18} className="mt-px shrink-0" />
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cx(title && "mt-0.5", kind === "info" && "text-muted")}>{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="rounded px-1 text-muted hover:text-ink" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
