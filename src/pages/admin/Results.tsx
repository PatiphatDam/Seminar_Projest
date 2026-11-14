import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { AdminClass, AdminResults, AdminTestSummary, TestKind } from "@shared/contract";
import { api } from "@/lib/api";
import { Button, Card, cx, EmptyState, PageHeader, PageLoader } from "@/components/ui";
import { useAdminClass } from "@/components/admin/adminClass";
import { PairedBars, PercentBars, type BarSeries } from "@/components/admin/charts";
import { FilterSelect, QueryError, SearchBox, StatCard, StatusChip } from "@/components/admin/controls";
import { distributionCounts, distributionMaxX, exportResultsToExcel } from "@/components/admin/exportResults";
import { errorMessage, fmtNum } from "@/components/admin/format";
import { IconDownload } from "@/components/admin/icons";
import { adminKeys } from "@/components/admin/keys";
import { useToast } from "@/components/admin/toastContext";
import { LiveIndicator, useLiveInterval } from "@/components/admin/live";

/** Score colour in the table: at or above this share of the full score is green, below is red (same cut as item analysis). */
const GOOD_RATIO = 0.6;
type SortKey = "student" | "section" | `test:${number}`;
const KIND_LABEL: Record<TestKind, string> = { pretest: "Pretest", posttest: "Posttest", other: "Other tests" };

const SERIES_STYLE: Record<TestKind, { fill: string; swatch: string }[]> = {
  pretest: [{ fill: "fill-[#c4c4cc]", swatch: "bg-[#c4c4cc]" }],
  posttest: [{ fill: "fill-tests", swatch: "bg-tests" }],
  other: [
    { fill: "fill-games", swatch: "bg-games" },
    { fill: "fill-explore", swatch: "bg-explore" },
    { fill: "fill-amber-500", swatch: "bg-amber-500" },
  ],
};

/** The test shown first: the latest posttest, else the latest pretest, else the latest test. */
function defaultTest(tests: AdminTestSummary[]): number | null {
  const byRecent = [...tests].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (byRecent.find((t) => t.kind === "posttest") ?? byRecent.find((t) => t.kind === "pretest") ?? byRecent[0])?.id ?? null;
}

/**
 * One test at a time (scores of different tests are never mixed), for the active students of the chosen section.
 * A section lists only the tests assigned to it; "All classes" lists every test.
 */
export default function Results() {
  const { classId: currentId } = useAdminClass();
  const toast = useToast();
  const classesQ = useQuery({ queryKey: adminKeys.classes("all"), queryFn: () => api.get<AdminClass[]>("/admin/classes?status=all") });

  const [classSel, setClassSel] = useState<string | null>(null); // null = the last section picked on an admin page
  const [testSel, setTestSel] = useState<number | null>(null); // null = the section's default test
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "section", dir: 1 });
  const [exporting, setExporting] = useState(false);

  const classes = classesQ.data ?? [];
  // a section deleted since it was picked falls back to "All classes" (once the class list has loaded)
  const wanted = classSel ?? (currentId ? String(currentId) : "all");
  const classValue = wanted === "all" || !classesQ.data || classes.some((c) => String(c.id) === wanted) ? wanted : "all";
  const classId = classValue === "all" ? null : Number(classValue);
  const testsQ = useQuery({
    queryKey: [...adminKeys.tests, "class", classId ?? "all"],
    queryFn: () => api.get<AdminTestSummary[]>(classId ? `/admin/tests?classId=${classId}` : "/admin/tests"),
    placeholderData: (prev) => prev,
  });
  const tests = useMemo(() => testsQ.data ?? [], [testsQ.data]);
  const pickClass = (v: string) => {
    setClassSel(v);
    setTestSel(null); // other sections have other tests
  };
  const testId = testSel !== null && tests.some((t) => t.id === testSel) ? testSel : defaultTest(tests);
  const testIds = useMemo(() => (testId === null ? [] : [testId]), [testId]);
  const chosen = tests.find((t) => t.id === testId) ?? null;

  const resultsQ = useQuery({
    queryKey: adminKeys.results(classId, testIds, "active"),
    queryFn: () => api.get<AdminResults>(`/admin/results?${new URLSearchParams({ ...(classId ? { classId: String(classId) } : {}), testIds: testIds.join(","), status: "active" })}`),
    enabled: testIds.length > 0,
    placeholderData: (prev) => prev,
    refetchInterval: useLiveInterval(30_000), // only while "Live" is on — scores arrive during a test
  });

  const classLabel = classId ? (classes.find((c) => c.id === classId)?.name ?? `Class ${classId}`) : "All classes";
  const data = resultsQ.data;
  const test = data?.tests[0] ?? null;

  const rows = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    // Students without a score sort last whichever way the column is sorted.
    const value = (r: (typeof data.rows)[number]): number | null => (sort.key.startsWith("test:") ? (r.scores[sort.key.slice(5)] ?? null) : null);
    const byName = (a: (typeof data.rows)[number], b: (typeof data.rows)[number]) =>
      (sort.key === "student" ? 0 : a.className.localeCompare(b.className)) || a.studentCode.localeCompare(b.studentCode);
    return data.rows
      .filter((r) => r.enrollmentStatus === "active") // server already filters; keep as a guard
      .filter((r) => !term || r.studentCode.includes(term) || (r.firstName ?? "").toLowerCase().includes(term))
      .sort((a, b) => {
        if (sort.key === "student" || sort.key === "section") return byName(a, b) * sort.dir;
        const va = value(a);
        const vb = value(b);
        if (va === null || vb === null) return va === vb ? byName(a, b) : va === null ? 1 : -1;
        return (va - vb) * sort.dir || byName(a, b);
      });
  }, [data, search, sort]);
  const sortBy = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "student" || key === "section" ? 1 : -1 }));

  async function onExport() {
    if (!data) return;
    setExporting(true);
    try {
      const name = await exportResultsToExcel(data, { classLabel, includeWithdrawn: false });
      toast.show(`Exported ${name}`, "success");
    } catch (e) {
      toast.show(`Export failed: ${errorMessage(e)}`, "error");
    } finally {
      setExporting(false);
    }
  }

  const series: BarSeries[] = useMemo(() => {
    if (!data) return [];
    return data.tests.map((t) => {
      const st = SERIES_STYLE[t.kind][0];
      const bins = data.distribution.find((d) => d.testId === t.testId)?.bins ?? [];
      return { id: String(t.testId), label: t.title, fillClass: st.fill, swatchClass: st.swatch, counts: distributionCounts(t.maxScore, bins) };
    });
  }, [data]);
  const maxX = data ? distributionMaxX(data) : 0;

  const items = test ? (data?.itemAnalysis.find((i) => i.testId === test.testId)?.items ?? []) : [];

  const roster = data?.rows.length ?? 0;
  const scores = data && test ? data.rows.map((r) => r.scores[String(test.testId)]).filter((v): v is number => v != null) : [];
  const notTaken = data && test ? roster - scores.length : null;
  const good = test && test.maxScore > 0 ? scores.filter((v) => v / test.maxScore >= GOOD_RATIO).length : 0;

  return (
    <>
      <PageHeader
        title="Results"
        subtitle="One test at a time · active students of the chosen class"
        actions={
          <>
            {testIds.length > 0 && (
              <LiveIndicator updatedAt={resultsQ.dataUpdatedAt} fetching={resultsQ.isFetching} onRefresh={() => void resultsQ.refetch()} />
            )}
            <Button
              accent="success"
              size="lg"
              className="w-[156px] whitespace-nowrap rounded-xl px-0"
              onClick={() => void onExport()}
              loading={exporting}
              disabled={!data || resultsQ.isFetching}
            >
              <IconDownload size={18} /> Export Excel
            </Button>
          </>
        }
      />

      {/* Filters (Figma: white fields, no card) */}
      <div className="mb-[25px] flex flex-wrap items-center gap-[13px]">
        <FilterSelect label="Class" value={classValue} onChange={pickClass} display={classLabel} className="w-full sm:w-[239px]">
          <option value="all">All classes</option>
          <optgroup label="Active">
            {classes
              .filter((c) => c.status === "active")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </optgroup>
          {classes.some((c) => c.status === "archived") && (
            <optgroup label="Archived">
              {classes
                .filter((c) => c.status === "archived")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          )}
        </FilterSelect>
        <FilterSelect
          label="Test"
          value={testId === null ? "" : String(testId)}
          onChange={(v) => setTestSel(Number(v))}
          display={chosen ? chosen.title : "None"}
          className="w-full sm:w-[320px]"
        >
          {testId === null && <option value="">None</option>}
          {(["pretest", "posttest", "other"] as const).map((kind) => {
            const list = tests.filter((t) => t.kind === kind);
            return list.length === 0 ? null : (
              <optgroup key={kind} label={KIND_LABEL[kind]}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.maxScore} {t.maxScore === 1 ? "pt" : "pts"})
                  </option>
                ))}
              </optgroup>
            );
          })}
        </FilterSelect>
        {resultsQ.isFetching && data && <span className="text-xs text-muted">Updating…</span>}
      </div>

      {testsQ.isPending || classesQ.isPending ? (
        <PageLoader />
      ) : testsQ.isError ? (
        <QueryError error={testsQ.error} onRetry={() => void testsQ.refetch()} what="tests" />
      ) : tests.length === 0 && classId !== null ? (
        <EmptyState title={`No tests assigned to ${classLabel} yet`} action={<Link to="/admin/tests" className="font-semibold underline">Assign a test</Link>}>
          Assign a test to this section on the Tests page — its results appear here once students submit it.
        </EmptyState>
      ) : tests.length === 0 ? (
        <EmptyState title="No tests yet" action={<Link to="/admin/tests" className="font-semibold underline">Create a test</Link>}>
          Results appear once students submit an assigned test.
        </EmptyState>
      ) : resultsQ.isPending ? (
        <PageLoader />
      ) : resultsQ.isError ? (
        <QueryError error={resultsQ.error} onRetry={() => void resultsQ.refetch()} what="results" />
      ) : data ? (
        <div className="space-y-[25px]">
          <div className="grid gap-[17px] sm:grid-cols-2 xl:grid-cols-3">
            <AverageCard label="Average score" tone="tests" test={test} roster={roster} empty="No test selected" />
            <StatCard
              label={`Scored ${Math.round(GOOD_RATIO * 100)}% or more`}
              tone="success"
              value={
                scores.length > 0 ? (
                  <>
                    {good}
                    <span className="text-[18px] font-semibold text-muted"> / {scores.length}</span>
                  </>
                ) : (
                  "—"
                )
              }
              sub={scores.length > 0 ? `${Math.round((good / scores.length) * 100)}% of the students who took it` : "Nobody has taken it yet"}
            />
            <StatCard
              label="Haven’t taken it"
              value={notTaken ?? "—"}
              sub={`of ${roster} active ${roster === 1 ? "student" : "students"} · “Not taken” in the table`}
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-[18px] xl:grid-cols-[minmax(0,612fr)_minmax(0,482fr)]">
            <Card className="px-6 pb-6 pt-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[17px] font-semibold leading-6 text-ink">Score distribution</h2>
                <div className="flex flex-wrap gap-4 text-[12px] text-muted">
                  {series.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-[7px]" title={s.label}>
                      <span className={cx("size-2.5 rounded-[3px]", s.swatchClass)} aria-hidden="true" />
                      {shortKind(data.tests.find((t) => String(t.testId) === s.id))}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-[50px] overflow-x-auto">
                {data.tests.every((t) => t.stats.n === 0) ? (
                  <p className="py-12 text-center text-sm text-muted">No submissions yet.</p>
                ) : (
                  <PairedBars series={series} maxX={maxX} />
                )}
              </div>
            </Card>
            <Card className="px-6 pb-6 pt-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[17px] font-semibold leading-6 text-ink">
                  Item analysis
                </h2>
                <span className="text-[12px] text-muted" title="% of students who answered each question correctly (latest version). Red = below 60%.">
                  % correct
                </span>
              </div>
              <div className="mt-[13px] max-h-[280px] overflow-y-auto pr-1">
                {items.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted">No answers to analyse yet.</p>
                ) : (
                  <PercentBars
                    items={[...items]
                      .sort((a, b) => a.position - b.position)
                      .map((it) => ({ key: it.questionId, label: `Q${it.position}`, title: it.prompt, percent: it.percentCorrect, n: it.n }))}
                  />
                )}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3 pl-5 pr-[18px] pt-[17px]">
              <div>
                <h2 className="text-[17px] font-semibold leading-6 text-ink">Scores</h2>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-success" aria-hidden="true" /> {Math.round(GOOD_RATIO * 100)}% or more
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-danger" aria-hidden="true" /> below {Math.round(GOOD_RATIO * 100)}%
                  </span>
                  <span>· click a column title to sort</span>
                </p>
              </div>
              <div className="w-full sm:w-[239px]">
                <SearchBox value={search} onChange={setSearch} placeholder="Search student ID..." label="Search by student ID or name" />
              </div>
            </div>
            <div className="relative mt-[28px] overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed text-[14px]">
                <caption className="sr-only">Scores per student</caption>
                <colgroup>
                  <col className="w-[224px]" />
                  <col className="w-[223px]" />
                  <col className="w-[160px]" />
                  {data.tests.map((t) => (
                    <col key={t.testId} className="w-[160px]" />
                  ))}
                </colgroup>
                <thead>
                  <tr className="text-left text-[12px] uppercase text-faint">
                    <SortTh label="Student ID" k="student" sort={sort} onSort={sortBy} className="pl-5" />
                    <th scope="col" className="pb-[14px] font-semibold">First name</th>
                    <SortTh label="Section" k="section" sort={sort} onSort={sortBy} />
                    {data.tests.map((t) => (
                      <SortTh
                        key={t.testId}
                        label={`${t.kind === "other" ? t.title : t.kind} /${t.maxScore}`}
                        title={`${t.title} (out of ${t.maxScore})`}
                        k={`test:${t.testId}`}
                        sort={sort}
                        onSort={sortBy}
                        className="pr-3"
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={3 + data.tests.length} className="px-5 py-10 text-center text-muted">
                        {data.rows.length === 0 ? "No students in this selection." : "No students match the search."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      return (
                        <tr key={`${r.className}-${r.studentCode}`} className={cx("h-[49px]", r.enrollmentStatus === "withdrawn" ? "text-muted" : "text-ink")}>
                          <td className="pl-5 tabular-nums">{r.studentCode}</td>
                          <td className="truncate pr-3">
                            {r.firstName ?? <span className="text-faint">—</span>}
                            {r.enrollmentStatus === "withdrawn" && <StatusChip tone="neutral">Withdrawn</StatusChip>}
                          </td>
                          <td className="whitespace-nowrap">{shortSection(r.className)}</td>
                          {data.tests.map((t) => (
                            <td key={t.testId} className="pr-3">
                              <ScorePill score={r.scores[String(t.testId)] ?? null} max={t.maxScore} />
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}

type TestColumn = AdminResults["tests"][number];

/** "6.2 / 10" with "62% · 18 of 20 students took it" and, smaller, the spread (SD, lowest–highest). */
function AverageCard({ label, test, roster, empty, tone }: { label: string; test: TestColumn | null; roster: number; empty: string; tone?: "tests" }) {
  const st = test?.stats;
  const has = !!test && !!st && st.n > 0 && st.mean != null;
  return (
    <StatCard
      label={label}
      tone={tone}
      value={
        has ? (
          <>
            {fmtNum(st.mean)}
            <span className="text-[18px] font-semibold text-muted"> / {test.maxScore}</span>
          </>
        ) : (
          "—"
        )
      }
      sub={
        !test ? (
          empty
        ) : !has ? (
          `Nobody has taken it yet · ${roster} ${roster === 1 ? "student" : "students"}`
        ) : (
          <>
            {test.maxScore > 0 && <>{Math.round(((st.mean ?? 0) / test.maxScore) * 100)}% · </>}
            {st.n} of {roster} took it
            <span className="mt-1 block text-faint">
              SD {fmtNum(st.sd)}
              {st.min != null && st.max != null && <> · lowest {st.min} · highest {st.max}</>}
            </span>
          </>
        )
      }
    />
  );
}

/** "7/10" in green (≥ 60%) or red (below), "Not taken" when there is no score. */
function ScorePill({ score, max }: { score: number | null; max: number }) {
  if (score === null) return <span className="inline-flex h-[25px] items-center rounded-full bg-[#e9eaee] px-3 text-[12px] font-semibold text-gray-800">Not taken</span>;
  const good = max > 0 && score / max >= GOOD_RATIO;
  return (
    <span
      className={cx(
        "inline-flex h-[25px] items-center rounded-full px-2.5 text-[13px] font-semibold tabular-nums",
        good ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
      )}
      title={`${score} out of ${max} (${max > 0 ? Math.round((score / max) * 100) : 0}%)`}
    >
      {score}
      <span className="font-normal opacity-70">/{max}</span>
    </span>
  );
}

function SortTh({
  label,
  k,
  sort,
  onSort,
  className,
  title,
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  className?: string;
  title?: string;
}) {
  const active = sort.key === k;
  return (
    <th scope="col" aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={cx("pb-[14px] font-semibold", className)}>
      <button type="button" onClick={() => onSort(k)} title={title} className={cx("inline-flex max-w-full items-center gap-1 uppercase hover:text-ink", active && "text-ink")}>
        <span className="truncate">{label}</span>
        <span aria-hidden="true" className={cx("text-[10px]", !active && "opacity-30")}>
          {active && sort.dir === -1 ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}

/** "2569/1 · Section 1" → "Sec 1" (Figma scores table). */
function shortSection(className: string) {
  const m = /Section\s+(\d+)/.exec(className);
  return m ? `Sec ${m[1]}` : className;
}

function shortKind(t: { kind: TestKind; title: string } | undefined) {
  if (!t) return "";
  return t.kind === "pretest" ? "Pretest" : t.kind === "posttest" ? "Posttest" : t.title;
}
