import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useBlocker, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isLayoutType, saveTestBody, type AdminTestDetail, type AdminTestSaveResult, type LayoutType, type QuestionType, type TestKind } from "@shared/contract";
import { api } from "@/lib/api";
import { Badge, Button, Card, cx, EmptyState, ErrorNote, Input, PageLoader, Select } from "@/components/ui";
import {
  QUESTION_TYPES,
  TYPE_LABEL,
  blankBlock,
  blankQuestion,
  questionCount,
  questionNumbers,
  changeType,
  draftFromServer,
  duplicateQuestion,
  maxScoreOf,
  nextOptionId,
  toSaveBody,
  MAX_QUESTIONS,
  validateDraft,
  type DraftQuestion,
  type DraftTest,
} from "@/components/admin/builder";
import { QueryError, Switch } from "@/components/admin/controls";
import { errorMessage, formatDateTime, isApiStatus } from "@/components/admin/format";
import { IconCheck, IconChevronDown, IconClose, IconDrag, IconPlus } from "@/components/admin/icons";
import { adminKeys } from "@/components/admin/keys";
import { ConfirmDialog, Modal } from "@/components/admin/Modal";
import { useToast } from "@/components/admin/toastContext";
import { uploadImage } from "@/components/admin/imageUpload";

const AUTOSAVE_MS = 1500;

export default function TestBuilder() {
  const params = useParams();
  const id = Number(params.testId);
  const valid = Number.isInteger(id) && id > 0;
  const q = useQuery({
    queryKey: adminKeys.test(id),
    queryFn: () => api.get<AdminTestDetail>(`/admin/tests/${id}`),
    enabled: valid,
    // Always refetch when the builder opens: versionLocked / questions may have changed since the cache was filled.
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  });
  // The draft is initialised once, so wait for data fetched after this mount (never seed it from stale cache).
  const [mountedAt] = useState(() => Date.now());
  const fresh = q.dataUpdatedAt >= mountedAt;

  if (!valid || isApiStatus(q.error, 404))
    return (
      <EmptyState title="Test not found" action={<Link to="/admin/tests" className="font-semibold underline">Back to tests</Link>}>
        It may have been deleted.
      </EmptyState>
    );
  if (q.isError) return <QueryError error={q.error} onRetry={() => void q.refetch()} what="the test" />;
  if (q.isPending || !fresh) return <PageLoader />;
  return <Builder key={id} testId={id} initial={q.data} />;
}

type Tab = "questions" | "settings" | "versions";

function Builder({ testId, initial }: { testId: number; initial: AdminTestDetail }) {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<DraftTest>(() => draftFromServer(initial));
  const [server, setServer] = useState<AdminTestDetail>(initial);
  const [tab, setTab] = useState<Tab>("questions");
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  /** Which card is in edit mode ("title" or a question key) — Figma shows only one expanded editor. */
  const [active, setActive] = useState<string>(() => "title");
  const activeRef = useRef(active);
  activeRef.current = active;

  // Revision counters: rev increments on every edit; savedRev = last revision persisted.
  const [rev, setRev] = useState(0);
  const [savedRev, setSavedRev] = useState(0);
  const revRef = useRef(0);
  const savedRevRef = useRef(0);
  const draftRef = useRef(draft);
  const inFlight = useRef<Promise<boolean> | null>(null);
  /** Question ids that belong to the test on the server right now (see toSaveBody). */
  const serverIds = useRef<ReadonlySet<number>>(new Set(initial.questions.map((x) => x.id)));
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const dirty = rev !== savedRev;
  const validation = useMemo(() => validateDraft(draft), [draft]);
  const locked = server.versionLocked;

  const update = useCallback((fn: (d: DraftTest) => DraftTest) => {
    setDraft(fn);
    setSaveError(null);
    revRef.current += 1;
    setRev(revRef.current);
  }, []);

  const updateQuestion = useCallback(
    (key: string, fn: (q: DraftQuestion) => DraftQuestion) => update((d) => ({ ...d, questions: d.questions.map((q) => (q.key === key ? fn(q) : q)) })),
    [update],
  );

  /** Persist the current draft. Serialised: waits for a running save, then saves again if still dirty. */
  const save = useCallback(
    async (manual: boolean): Promise<boolean> => {
      while (inFlight.current) await inFlight.current;
      if (revRef.current === savedRevRef.current) return true;
      const d = draftRef.current;
      const r = revRef.current;
      const v = validateDraft(d);
      if (v.count > 0) {
        if (manual) {
          setShowErrors(true);
          setTab(v.title && Object.keys(v.byQuestion).length === 0 ? "settings" : "questions");
          toast.show(`Fix ${v.count} issue${v.count === 1 ? "" : "s"} before saving.`, "error");
        }
        return false;
      }
      const body = saveTestBody.safeParse(toSaveBody(d, serverIds.current));
      if (!body.success) {
        const issue = body.error.issues[0];
        const msg = `Can’t save: ${issue ? `${issue.path.join(".")} — ${issue.message}` : "the test has invalid fields."}`;
        setSaveError(msg); // always visible in the header status, also for autosave
        if (manual) toast.show(msg, "error");
        return false;
      }
      const run = (async () => {
        setSaving(true);
        setSaveError(null);
        try {
          const res = await api.put<AdminTestSaveResult>(`/admin/tests/${testId}`, body.data);
          const serverQs = [...res.test.questions].sort((a, b) => a.position - b.position);
          const idByKey = new Map(d.questions.map((q, i) => [q.key, serverQs[i]?.id]));
          setDraft((cur) => ({ ...cur, questions: cur.questions.map((q) => (idByKey.get(q.key) ? { ...q, id: idByKey.get(q.key) } : q)) }));
          serverIds.current = new Set(res.test.questions.map((x) => x.id));
          setServer(res.test);
          qc.setQueryData(adminKeys.test(testId), res.test);
          void qc.invalidateQueries({ queryKey: adminKeys.tests });
          savedRevRef.current = Math.max(savedRevRef.current, r);
          setSavedRev(savedRevRef.current);
          if (res.newVersionCreated)
            toast.show(`Saved as version ${res.test.currentVersion}. Earlier attempts keep version ${res.test.currentVersion - 1}.`, "success");
          return true;
        } catch (e) {
          setSaveError(`Couldn’t save: ${errorMessage(e)}`);
          if (manual) toast.show(errorMessage(e, "Couldn’t save."), "error");
          return false;
        } finally {
          setSaving(false);
        }
      })();
      inFlight.current = run;
      const ok = await run;
      inFlight.current = null;
      return ok;
    },
    [qc, testId, toast],
  );

  // Debounced autosave — paused while the version is locked (each save would create a new version).
  useEffect(() => {
    if (!dirty || locked || validation.count > 0 || saveError) return;
    const t = setTimeout(() => void save(false), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [rev, dirty, locked, validation.count, saveError, save]);

  const flushOnBlur = () => {
    if (dirty && !locked && validation.count === 0) void save(false);
  };

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);
  // Read refs (not state) so a navigate() right after a successful save isn't blocked by a stale render.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => revRef.current !== savedRevRef.current && currentLocation.pathname !== nextLocation.pathname);

  // Focus the prompt of a newly added question.
  useEffect(() => {
    if (!focusKey) return;
    const el = document.getElementById(`prompt-${focusKey}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
    }
    setFocusKey(null);
  }, [focusKey]);

  const atMax = draft.questions.length >= MAX_QUESTIONS;
  /** Like Google Forms: new items go right after the selected card (or at the end when the title card is selected). */
  const insertItem = (item: DraftQuestion) => {
    if (draftRef.current.questions.length >= MAX_QUESTIONS) {
      toast.show(`A test can have at most ${MAX_QUESTIONS} items.`, "error");
      return;
    }
    update((d) => {
      const at = d.questions.findIndex((x) => x.key === activeRef.current);
      const qs = [...d.questions];
      qs.splice(at < 0 ? qs.length : at + 1, 0, item);
      return { ...d, questions: qs };
    });
    setTab("questions");
    setActive(item.key);
    setFocusKey(item.key);
  };
  const addQuestion = (type: QuestionType = "single") => insertItem(blankQuestion(type));
  const addBlock = (type: Exclude<LayoutType, "image">) => insertItem(blankBlock(type));

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const addImage = async (file: File) => {
    setUploading(true);
    try {
      insertItem(blankBlock("image", await uploadImage(file)));
    } catch (e) {
      toast.show(`Couldn’t add the image: ${errorMessage(e)}`, "error");
    } finally {
      setUploading(false);
    }
  };

  const removeQuestion = (key: string) => {
    const index = draft.questions.findIndex((q) => q.key === key);
    const removed = draft.questions[index];
    if (!removed) return;
    const what = isLayoutType(removed.type) ? TYPE_LABEL[removed.type] : `Question ${questionNumbers(draft.questions)[index]}`;
    update((d) => ({ ...d, questions: d.questions.filter((q) => q.key !== key) }));
    toast.show(
      <span className="flex items-center justify-between gap-3">
        {what} deleted
        <button
          type="button"
          className="rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold hover:bg-white/25"
          onClick={() =>
            update((d) => {
              if (d.questions.some((q) => q.key === removed.key)) return d;
              const qs = [...d.questions];
              qs.splice(Math.min(index, qs.length), 0, removed);
              return { ...d, questions: qs };
            })
          }
        >
          Undo
        </button>
      </span>,
    );
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    update((d) => {
      const from = d.questions.findIndex((q) => q.key === active.id);
      const to = d.questions.findIndex((q) => q.key === over.id);
      if (from < 0 || to < 0) return d;
      return { ...d, questions: arrayMove(d.questions, from, to) };
    });
  };

  const onAssign = async () => {
    if (dirty) {
      const ok = await save(true);
      if (!ok) return;
    }
    navigate(`/admin/tests/${testId}/assign`);
  };

  const maxScore = maxScoreOf(draft);
  const nQuestions = questionCount(draft.questions);
  const numbers = questionNumbers(draft.questions);
  const sectionTotal = draft.questions.filter((q) => q.type === "section").length + 1;
  const sectionNumbers = (() => {
    let n = 1;
    return draft.questions.map((q) => (q.type === "section" ? ++n : null));
  })();
  const tools: { label: string; short: string; glyph: ReactNode; onClick: () => void; disabled: boolean }[] = [
    { label: "Add question", short: "Question", glyph: <IconPlus size={20} />, onClick: () => addQuestion(), disabled: atMax },
    {
      label: "Add title and description",
      short: "Title",
      glyph: <span className="text-[15px] font-bold leading-none">T</span>,
      onClick: () => addBlock("text"),
      disabled: atMax,
    },
    {
      label: uploading ? "Uploading image…" : "Add image",
      short: uploading ? "Uploading…" : "Image",
      glyph: uploading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <IconImage size={17} />,
      onClick: () => imageInputRef.current?.click(),
      disabled: atMax || uploading,
    },
    {
      label: "Add section (new page for students)",
      short: "Section",
      glyph: <IconSection size={18} />,
      onClick: () => addBlock("section"),
      disabled: atMax,
    },
  ];
  const startedAttempts = server.versions.find((v) => v.versionNo === server.currentVersion)?.attemptCount ?? 0;
  const statusNode = saving ? (
    <span className="text-[12px] font-semibold text-muted">Saving…</span>
  ) : saveError ? (
    <span className="max-w-[260px] text-[12px] font-semibold text-danger">
      {saveError}{" "}
      <button type="button" className="underline" onClick={() => void save(true)}>
        Retry
      </button>
    </span>
  ) : !dirty ? (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-success">
      <IconCheck size={14} /> Autosaved
    </span>
  ) : validation.count > 0 ? (
    <button type="button" className="text-[12px] font-semibold text-amber-700 underline" onClick={() => setShowErrors(true)}>
      {validation.count} issue{validation.count === 1 ? "" : "s"} to fix
    </button>
  ) : (
    <span className="text-[12px] font-semibold text-muted">Unsaved{locked ? " · autosave paused" : "…"}</span>
  );

  return (
    <div onBlur={flushOnBlur}>
      {/* Header (Figma: plain title, "Test builder · N questions · N points", status + Preview + Assign) */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[32px] font-bold leading-10 text-ink">{draft.title || "Untitled test"}</h1>
          <p className="mt-1 text-[15px] leading-[22px] text-muted">
            Test builder · {nQuestions} question{nQuestions === 1 ? "" : "s"} · {maxScore} point{maxScore === 1 ? "" : "s"}
            {sectionTotal > 1 && ` · ${sectionTotal} sections`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 lg:mt-[15px]">
          <span aria-live="polite" className="px-1">
            {statusNode}
          </span>
          {(locked || saveError) && (
            <button
              type="button"
              onClick={() => void save(true)}
              disabled={saving || (!dirty && !saveError)}
              className="h-[43px] rounded-[11.5px] border border-line bg-surface px-5 text-[15px] font-semibold text-ink hover:bg-zinc-50 disabled:opacity-50"
            >
              Save
            </button>
          )}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="h-[43px] w-[95px] rounded-[11.5px] border border-line bg-surface text-[15px] font-semibold text-ink hover:bg-zinc-50"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => void onAssign()}
            className="h-11 w-[177px] whitespace-nowrap rounded-xl bg-tests text-[15px] font-semibold text-white hover:bg-blue-700"
          >
            Assign to sections
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Builder sections" className="mt-[34px] flex gap-[38px] pl-[17px]">
        {(["questions", "settings", "versions"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`panel-${t}`}
            tabIndex={tab === t ? 0 : -1}
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              const order: Tab[] = ["questions", "settings", "versions"];
              const i = order.indexOf(tab);
              if (e.key === "ArrowRight") setTab(order[(i + 1) % 3]);
              if (e.key === "ArrowLeft") setTab(order[(i + 2) % 3]);
            }}
            className={cx("py-1 text-[15px] capitalize transition-colors", tab === t ? "font-semibold text-tests" : "text-muted hover:text-ink")}
          >
            {t}
            {t === "versions" && ` (${server.versions.length})`}
          </button>
        ))}
      </div>

      {locked && (
        <p className="mt-[39px] rounded-[13.5px] border border-violet-200 bg-violet-50 px-5 py-[15px] text-[12px] font-semibold leading-[18px] text-games-ink" role="note">
          {startedAttempts > 0 ? `${startedAttempts} student${startedAttempts === 1 ? "" : "s"}` : "Students"} already started version {server.currentVersion}. Your edits create
          version {server.currentVersion + 1} — their attempts keep using the version they started. Autosave is paused; press Save when you’re done.
        </p>
      )}

      {showErrors && validation.general.length > 0 && (
        <div className="mt-5">
          <ErrorNote>{validation.general.join(" ")}</ErrorNote>
        </div>
      )}

      {tab === "questions" && (
        <div role="tabpanel" id="panel-questions" aria-labelledby="tab-questions" className={cx("flex gap-[21px]", locked ? "mt-[27px]" : "mt-[39px]")}>
          <div className="min-w-0 max-w-[859px] flex-1 space-y-4">
            {/* Title card */}
            <div
              onFocusCapture={() => setActive("title")}
              onClick={() => setActive("title")}
              className={cx("rounded-[17px] border bg-surface px-[23px] py-[26px]", active === "title" ? "border-2 border-tests" : "border-line")}
            >
              <label className="sr-only" htmlFor="builder-title">
                Title
              </label>
              <input
                id="builder-title"
                value={draft.title}
                maxLength={200}
                onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
                placeholder="Test title"
                className={cx(
                  "w-full bg-transparent text-[20px] font-semibold leading-7 text-ink outline-none placeholder:text-faint",
                  showErrors && validation.title && "text-danger",
                )}
              />
              {showErrors && validation.title && <p className="mt-1 text-xs text-danger">{validation.title}</p>}
              <label className="sr-only" htmlFor="builder-desc">
                Description
              </label>
              <textarea
                id="builder-desc"
                value={draft.description}
                maxLength={2000}
                onChange={(e) => update((d) => ({ ...d, description: e.target.value }))}
                placeholder="Description (shown to students before they start)"
                rows={1}
                className="mt-1.5 field-sizing-content w-full resize-none bg-transparent text-[12px] leading-[18px] text-muted outline-none placeholder:text-faint"
              />
            </div>

            {draft.questions.length === 0 ? (
              <EmptyState title="No questions yet" action={<Button onClick={() => addQuestion()} disabled={atMax}>+ Add question</Button>}>
                Add single-choice, multiple-choice, true/false or short-answer questions.
              </EmptyState>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={draft.questions.map((q) => q.key)} strategy={verticalListSortingStrategy}>
                  {draft.questions.map((q) =>
                    isLayoutType(q.type) ? (
                      <BlockCard
                        key={q.key}
                        q={q}
                        sectionNo={sectionNumbers[draft.questions.indexOf(q)]}
                        sectionTotal={sectionTotal}
                        active={active === q.key}
                        onActivate={() => setActive(q.key)}
                        errors={showErrors ? validation.byQuestion[q.key] : undefined}
                        onChange={(fn) => updateQuestion(q.key, fn)}
                        onDuplicate={() =>
                          update((d) => {
                            if (d.questions.length >= MAX_QUESTIONS) return d;
                            const qs = [...d.questions];
                            qs.splice(qs.findIndex((x) => x.key === q.key) + 1, 0, duplicateQuestion(q));
                            return { ...d, questions: qs };
                          })
                        }
                        onDelete={() => removeQuestion(q.key)}
                      />
                    ) : (
                    <QuestionCard
                      key={q.key}
                      q={q}
                      index={(numbers[draft.questions.indexOf(q)] ?? 1) - 1}
                      active={active === q.key}
                      onActivate={() => setActive(q.key)}
                      errors={showErrors ? validation.byQuestion[q.key] : undefined}
                      onChange={(fn) => updateQuestion(q.key, fn)}
                      onDuplicate={() =>
                        update((d) => {
                          if (d.questions.length >= MAX_QUESTIONS) return d;
                          const qs = [...d.questions];
                          const idx = qs.findIndex((x) => x.key === q.key);
                          qs.splice(idx + 1, 0, duplicateQuestion(q));
                          return { ...d, questions: qs };
                        })
                      }
                      onDelete={() => removeQuestion(q.key)}
                    />
                    ),
                  )}
                </SortableContext>
              </DndContext>
            )}

            <div className="flex flex-wrap justify-center gap-2 lg:hidden">
              {tools.map((t) => (
                <Button key={t.label} variant="outline" onClick={t.onClick} disabled={t.disabled}>
                  {t.glyph} {t.short}
                </Button>
              ))}
            </div>
          </div>

          {/* Floating toolbar (Google Forms): add question · title and description · image · section */}
          <div className="hidden w-[55px] shrink-0 lg:block">
            <div
              className="sticky top-6 flex flex-col items-center gap-2 rounded-[20px] border border-line bg-surface py-2.5"
              role="toolbar"
              aria-label="Add to the test"
              aria-orientation="vertical"
            >
              {tools.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={t.onClick}
                  disabled={t.disabled}
                  aria-label={t.label}
                  title={t.label}
                  className="grid size-9 place-items-center rounded-xl text-muted hover:bg-zinc-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t.glyph}
                </button>
              ))}
            </div>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void addImage(f);
            }}
          />
        </div>
      )}

      {tab === "settings" && (
        <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" className="mt-[39px]">
          <Card className="max-w-2xl space-y-5 p-6">
            <Input
              name="settings-title"
              label="Title"
              value={draft.title}
              maxLength={200}
              onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
              error={showErrors ? validation.title : undefined}
            />
            <label className="block" htmlFor="settings-desc">
              <span className="mb-1.5 block text-sm font-semibold">Description</span>
              <textarea
                id="settings-desc"
                value={draft.description}
                maxLength={2000}
                rows={4}
                onChange={(e) => update((d) => ({ ...d, description: e.target.value }))}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] outline-none focus:border-ink"
              />
            </label>
            <Select name="settings-kind" label="Kind" value={draft.kind} onChange={(e) => update((d) => ({ ...d, kind: e.target.value as TestKind }))}>
              {/* Only shown for old tests saved as "other" — saving asks for Pretest or Posttest. */}
              {draft.kind === "other" && (
                <option value="other" disabled>
                  Choose Pretest or Posttest
                </option>
              )}
              <option value="pretest">Pretest</option>
              <option value="posttest">Posttest</option>
            </Select>
            <p className="text-xs text-muted">Results compare one pretest with one posttest. Timing, attempts and availability are set per section when you assign the test.</p>
          </Card>
        </div>
      )}

      {tab === "versions" && (
        <div role="tabpanel" id="panel-versions" aria-labelledby="tab-versions" className="mt-[39px]">
          <Card className="max-w-2xl overflow-hidden">
            {server.versions.length === 0 ? (
              <p className="p-6 text-sm text-muted">No frozen versions yet. A version is frozen the first time a student starts the test.</p>
            ) : (
              <ul>
                {[...server.versions]
                  .sort((a, b) => b.versionNo - a.versionNo)
                  .map((v) => (
                    <li key={v.versionNo} className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 last:border-b-0">
                      <div>
                        <p className="font-semibold">
                          Version {v.versionNo} {v.versionNo === server.currentVersion && <Badge tone="tests" className="ml-1.5">Current</Badge>}
                        </p>
                        <p className="text-xs text-muted">Frozen {formatDateTime(v.createdAt)}</p>
                      </div>
                      <p className="text-sm tabular-nums text-muted">
                        {v.attemptCount} attempt{v.attemptCount === 1 ? "" : "s"}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} draft={draft} />

      <ConfirmDialog
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Leave without saving?"
        confirmLabel="Leave anyway"
        cancelLabel="Stay"
        accent="danger"
      >
        <p>{validation.count > 0 ? `You have unsaved changes with ${validation.count} issue(s) to fix.` : "You have unsaved changes."} They’ll be lost if you leave now.</p>
      </ConfirmDialog>
    </div>
  );
}

function IconSection({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <rect x="4" y="14" width="16" height="6" rx="1.5" />
    </svg>
  );
}

function IconImage({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

/* ───────────────────────── Question card ─────────────────────────
 * Figma (Google-Form style): every question shows as a read-only preview; the selected one gets a
 * blue outline + 6 px left bar and turns into the editor (type, prompt, options, points, required). */

const optionsOf = (q: DraftQuestion) =>
  q.type === "truefalse"
    ? [
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ]
    : q.options;

const isCorrectOption = (q: DraftQuestion, id: string) =>
  q.type === "single" ? q.single === id : q.type === "multi" ? q.multi.includes(id) : q.type === "truefalse" ? (q.tf === null ? false : String(q.tf) === id) : false;

function Marker({ q }: { q: DraftQuestion }) {
  return q.type === "multi" ? (
    <span className="size-[18px] shrink-0 rounded-[5px] border border-zinc-300 bg-surface" aria-hidden="true" />
  ) : (
    <span className="size-[18px] shrink-0 rounded-full border border-zinc-300" aria-hidden="true" />
  );
}

function QuestionCard({
  q,
  index,
  active,
  onActivate,
  errors,
  onChange,
  onDuplicate,
  onDelete,
}: {
  q: DraftQuestion;
  index: number;
  active: boolean;
  onActivate: () => void;
  errors?: string[];
  onChange: (fn: (q: DraftQuestion) => DraftQuestion) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: q.key });
  const uid = useId();
  const typeId = `${uid}-type`;
  const pointsId = `${uid}-points`;
  const hasErrors = !!errors?.length;

  const toggleCorrect = (id: string) =>
    onChange((x) =>
      x.type === "single"
        ? { ...x, single: id }
        : x.type === "multi"
          ? { ...x, multi: x.multi.includes(id) ? x.multi.filter((m) => m !== id) : [...x.multi, id] }
          : x.type === "truefalse"
            ? { ...x, tf: id === "true" }
            : x,
    );

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Reorder question ${index + 1} (press space, then arrow keys)`}
      className="-ml-0.5 cursor-grab touch-none rounded-md p-0.5 text-faint hover:bg-zinc-100 hover:text-ink active:cursor-grabbing"
    >
      <IconDrag size={18} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cx(isDragging && "relative z-10")}>
      <div
        onFocusCapture={onActivate}
        onClick={onActivate}
        className={cx(
          "relative overflow-hidden rounded-[19.5px] border bg-surface",
          active ? "border-tests" : hasErrors ? "border-red-300" : "border-line",
          isDragging && "shadow-xl",
        )}
      >
        {active && <span className="absolute inset-y-0 left-0 w-1.5 bg-tests" aria-hidden="true" />}

        {!active ? (
          /* ── Read-only preview ── */
          <div className="px-[31px] pb-[22px] pt-[21px]">
            <div className="flex items-center gap-2.5">
              {handle}
              <span className="text-[12px] font-semibold text-muted">Q{index + 1}</span>
              <span className="ml-auto text-[12px] text-muted">
                {TYPE_LABEL[q.type]} · {q.points} pt{q.points === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-[19px] whitespace-pre-line text-[15px] font-semibold leading-[22px] text-ink">
              {q.prompt || <span className="font-normal text-faint">(no question text — click to edit)</span>}
            </p>
            {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 max-h-48 rounded-xl border border-line object-contain" />}
            {q.type === "short" ? (
              <div className="mt-[18px] flex h-[43px] max-w-[359px] items-center rounded-[11.5px] border border-line px-[15px] text-[13px] text-faint">Short answer text</div>
            ) : (
              <ul className="mt-[17px] space-y-3">
                {optionsOf(q).map((o) => (
                  <li key={o.id} className="flex items-center gap-[14px] text-[14px] leading-[18px] text-ink">
                    <Marker q={q} />
                    <span className="min-w-0 flex-1 truncate">{o.text || <span className="text-faint">(empty option)</span>}</span>
                    {isCorrectOption(q, o.id) && <IconCheck size={16} className="shrink-0 text-success" />}
                  </li>
                ))}
              </ul>
            )}
            {hasErrors && <p className="mt-3 text-xs text-danger">{errors!.length} issue{errors!.length === 1 ? "" : "s"} — click to fix</p>}
          </div>
        ) : (
          /* ── Editor ── */
          <div className="px-[31px] pb-[21px] pt-[22px]">
            <div className="flex flex-wrap items-center gap-2.5">
              {handle}
              <span className="text-[12px] font-semibold text-muted">Q{index + 1}</span>
              <div className="relative ml-auto w-[209px]">
                <label htmlFor={typeId} className="sr-only">
                  Question type
                </label>
                <select
                  id={typeId}
                  value={q.type}
                  onChange={(e) => onChange((x) => changeType(x, e.target.value as QuestionType))}
                  className="h-[37px] w-full cursor-pointer appearance-none rounded-[11.5px] border border-line bg-surface pl-4 pr-8 text-[13px] text-ink outline-none focus:border-gray-800"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
                <IconChevronDown size={12} strokeWidth={3} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint" />
              </div>
            </div>

            <label htmlFor={`prompt-${q.key}`} className="sr-only">
              Question {index + 1} prompt
            </label>
            <textarea
              id={`prompt-${q.key}`}
              value={q.prompt}
              maxLength={2000}
              rows={1}
              onChange={(e) => onChange((x) => ({ ...x, prompt: e.target.value }))}
              placeholder="Question"
              className="mt-[18px] field-sizing-content w-full resize-none rounded-md bg-transparent text-[17px] font-semibold leading-6 text-ink outline-none placeholder:text-faint focus:bg-zinc-50"
            />

            <QuestionImage q={q} onChange={onChange} />

            {q.type === "short" ? (
              <div className="mt-4">
                <ShortEditor q={q} onChange={onChange} />
              </div>
            ) : (
              <fieldset className="mt-[26px]">
                <legend className="sr-only">Options — mark the correct {q.type === "multi" ? "ones" : "one"}</legend>
                <ul className="space-y-[15px]">
                  {optionsOf(q).map((o, i) => {
                    const correct = isCorrectOption(q, o.id);
                    return (
                      <li key={o.id} className="group flex items-center gap-[13px]">
                        <Marker q={q} />
                        {q.type === "truefalse" ? (
                          <span className="min-w-0 flex-1 text-[14px] text-ink">{o.text}</span>
                        ) : (
                          <input
                            value={o.text}
                            maxLength={500}
                            onChange={(e) => onChange((x) => ({ ...x, options: x.options.map((p) => (p.id === o.id ? { ...p, text: e.target.value } : p)) }))}
                            placeholder={`Option ${i + 1}`}
                            aria-label={`Option ${i + 1}`}
                            className="min-w-0 flex-1 rounded-md bg-transparent text-[14px] text-ink outline-none placeholder:text-faint focus:bg-zinc-50"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => toggleCorrect(o.id)}
                          aria-pressed={correct}
                          aria-label={`${correct ? "Correct answer" : "Mark as correct"}: option ${i + 1}`}
                          className={cx(
                            "shrink-0",
                            correct
                              ? "inline-flex h-[25px] items-center gap-1 rounded-full bg-[#e8f5ec] px-3 text-[12px] font-semibold text-success"
                              : "text-[12px] text-faint hover:text-ink",
                          )}
                        >
                          {correct ? (
                            <>
                              <IconCheck size={12} /> Correct
                            </>
                          ) : (
                            "mark correct"
                          )}
                        </button>
                        {q.type !== "truefalse" && (
                          <button
                            type="button"
                            onClick={() =>
                              onChange((x) => ({
                                ...x,
                                options: x.options.filter((p) => p.id !== o.id),
                                single: x.single === o.id ? "" : x.single,
                                multi: x.multi.filter((m) => m !== o.id),
                              }))
                            }
                            disabled={q.options.length <= 1}
                            className="shrink-0 rounded p-0.5 text-faint opacity-0 hover:text-ink focus:opacity-100 group-hover:opacity-100 disabled:hidden"
                            aria-label={`Remove option ${i + 1}`}
                          >
                            <IconClose size={14} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                  {q.type !== "truefalse" && q.options.length < 12 && (
                    <li>
                      <button
                        type="button"
                        onClick={() => onChange((x) => ({ ...x, options: [...x.options, { id: nextOptionId(x.options), text: `Option ${x.options.length + 1}` }] }))}
                        className="flex items-center gap-[13px] text-[13px] text-faint hover:text-ink"
                      >
                        <Marker q={q} />
                        Add option
                      </button>
                    </li>
                  )}
                </ul>
              </fieldset>
            )}

            {hasErrors && (
              <ul className="mt-3 space-y-0.5 text-xs text-danger" role="alert">
                {errors!.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-[15px]">
              <label htmlFor={pointsId} className="text-[12px] text-muted">
                Points
              </label>
              <input
                id={pointsId}
                type="number"
                min={0}
                max={100}
                step={1}
                value={Number.isFinite(q.points) ? q.points : ""}
                onChange={(e) => onChange((x) => ({ ...x, points: e.target.value === "" ? NaN : Math.trunc(Number(e.target.value)) }))}
                className="h-[35px] w-[63px] rounded-[11.5px] border border-line bg-surface text-center text-[13px] tabular-nums outline-none focus:border-gray-800"
              />
              <div className="ml-auto flex items-center gap-[21px] text-[12px] text-muted">
                <button type="button" onClick={onDuplicate} className="hover:text-ink">
                  Duplicate
                </button>
                <button type="button" onClick={onDelete} className="hover:text-danger">
                  Delete
                </button>
                <Switch checked={q.required} onChange={(v) => onChange((x) => ({ ...x, required: v }))} label="Required" showLabel labelFirst accent="tests" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Upload (or replace / remove) a picture. Used inside a question and by image blocks. */
function ImagePicker({
  url,
  onPicked,
  onRemove,
  addLabel,
}: {
  url: string | null;
  onPicked: (url: string) => void;
  onRemove?: () => void;
  addLabel: string;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (file: File) => {
    setBusy(true);
    try {
      onPicked(await uploadImage(file));
    } catch (e) {
      toast.show(`Couldn’t upload the image: ${errorMessage(e)}`, "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mt-3">
      {url && <img src={url} alt="" className="max-h-72 rounded-xl border border-line object-contain" />}
      <div className={cx("flex flex-wrap items-center gap-3 text-[13px]", url && "mt-2")}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 font-semibold text-tests hover:underline disabled:opacity-60"
        >
          <IconImage size={14} /> {busy ? "Uploading…" : url ? "Replace image" : addLabel}
        </button>
        {url && onRemove && (
          <button type="button" onClick={onRemove} className="text-muted hover:text-danger">
            Remove image
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void pick(f);
        }}
      />
    </div>
  );
}

function QuestionImage({ q, onChange }: { q: DraftQuestion; onChange: (fn: (q: DraftQuestion) => DraftQuestion) => void }) {
  return (
    <ImagePicker
      url={q.imageUrl}
      addLabel="Add image to this question"
      onPicked={(url) => onChange((x) => ({ ...x, imageUrl: url }))}
      onRemove={() => onChange((x) => ({ ...x, imageUrl: null }))}
    />
  );
}

/* ───────────────────────── Layout blocks (Google Forms: title, image, section) ───────────────────────── */

function BlockCard({
  q,
  sectionNo,
  sectionTotal,
  active,
  onActivate,
  errors,
  onChange,
  onDuplicate,
  onDelete,
}: {
  q: DraftQuestion;
  sectionNo: number | null;
  sectionTotal: number;
  active: boolean;
  onActivate: () => void;
  errors?: string[];
  onChange: (fn: (q: DraftQuestion) => DraftQuestion) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: q.key });
  const hasErrors = !!errors?.length;
  const isSection = q.type === "section";
  const kindLabel = isSection ? `Section ${sectionNo} of ${sectionTotal}` : TYPE_LABEL[q.type];

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${kindLabel.toLowerCase()} (press space, then arrow keys)`}
      className="-ml-0.5 cursor-grab touch-none rounded-md p-0.5 text-faint hover:bg-zinc-100 hover:text-ink active:cursor-grabbing"
    >
      <IconDrag size={18} />
    </button>
  );

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cx(isDragging && "relative z-10", isSection && "pt-3")}>
      {isSection && (
        <span className="inline-block rounded-t-xl bg-tests px-4 py-1.5 text-[12px] font-semibold text-white">{kindLabel}</span>
      )}
      <div
        onFocusCapture={onActivate}
        onClick={onActivate}
        className={cx(
          "relative overflow-hidden border bg-surface",
          isSection ? "rounded-b-[19.5px] rounded-tr-[19.5px] border-t-4 border-t-tests" : "rounded-[19.5px]",
          active ? "border-tests" : hasErrors ? "border-red-300" : "border-line",
          isDragging && "shadow-xl",
        )}
      >
        {active && <span className="absolute inset-y-0 left-0 w-1.5 bg-tests" aria-hidden="true" />}
        <div className="px-[31px] pb-[18px] pt-[18px]">
          <div className="flex items-center gap-2.5">
            {handle}
            <span className="text-[12px] font-semibold text-muted">{isSection ? "New page for students" : kindLabel}</span>
          </div>

          {q.type === "image" ? (
            <>
              <ImagePicker url={q.imageUrl} addLabel="Upload image" onPicked={(url) => onChange((x) => ({ ...x, imageUrl: url }))} />
              <label htmlFor={`prompt-${q.key}`} className="sr-only">
                Image caption
              </label>
              <input
                id={`prompt-${q.key}`}
                value={q.prompt}
                maxLength={2000}
                onChange={(e) => onChange((x) => ({ ...x, prompt: e.target.value }))}
                placeholder="Image caption (optional)"
                className="mt-3 w-full rounded-md bg-transparent text-[14px] text-ink outline-none placeholder:text-faint focus:bg-zinc-50"
              />
            </>
          ) : (
            <>
              <label htmlFor={`prompt-${q.key}`} className="sr-only">
                {isSection ? "Section title" : "Title"}
              </label>
              <input
                id={`prompt-${q.key}`}
                value={q.prompt}
                maxLength={2000}
                onChange={(e) => onChange((x) => ({ ...x, prompt: e.target.value }))}
                placeholder={isSection ? "Section title (optional)" : "Title"}
                className={cx(
                  "mt-3 w-full rounded-md bg-transparent font-semibold text-ink outline-none placeholder:text-faint focus:bg-zinc-50",
                  isSection ? "text-[20px] leading-7" : "text-[17px] leading-6",
                )}
              />
              <label htmlFor={`desc-${q.key}`} className="sr-only">
                Description
              </label>
              <textarea
                id={`desc-${q.key}`}
                value={q.description}
                maxLength={4000}
                rows={1}
                onChange={(e) => onChange((x) => ({ ...x, description: e.target.value }))}
                placeholder="Description (optional)"
                className="mt-1.5 field-sizing-content w-full resize-none rounded-md bg-transparent text-[14px] leading-5 text-muted outline-none placeholder:text-faint focus:bg-zinc-50"
              />
            </>
          )}

          {hasErrors && (
            <ul className="mt-3 space-y-0.5 text-xs text-danger" role="alert">
              {errors!.map((e) => (
                <li key={e}>• {e}</li>
              ))}
            </ul>
          )}

          {active && (
            <div className="mt-4 flex items-center justify-end gap-[21px] border-t border-line pt-[13px] text-[12px] text-muted">
              {!isSection && (
                <button type="button" onClick={onDuplicate} className="hover:text-ink">
                  Duplicate
                </button>
              )}
              <button type="button" onClick={onDelete} className="hover:text-danger">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShortEditor({ q, onChange }: { q: DraftQuestion; onChange: (fn: (q: DraftQuestion) => DraftQuestion) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[12px] text-muted">Accepted answers (not case-sensitive; extra spaces are ignored)</legend>
      <ul className="space-y-2">
        {q.accepted.map((a, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              value={a}
              maxLength={200}
              onChange={(e) => onChange((x) => ({ ...x, accepted: x.accepted.map((s, j) => (j === i ? e.target.value : s)) }))}
              placeholder={`Accepted answer ${i + 1}`}
              aria-label={`Accepted answer ${i + 1}`}
              className="h-[43px] min-w-0 max-w-[359px] flex-1 rounded-[11.5px] border border-line bg-surface px-[15px] text-[14px] outline-none focus:border-gray-800"
            />
            <button
              type="button"
              onClick={() => onChange((x) => ({ ...x, accepted: x.accepted.filter((_, j) => j !== i) }))}
              disabled={q.accepted.length <= 1}
              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-zinc-100 disabled:opacity-30"
              aria-label={`Remove accepted answer ${i + 1}`}
            >
              <IconClose size={16} />
            </button>
          </li>
        ))}
      </ul>
      {q.accepted.length < 20 && (
        <button type="button" onClick={() => onChange((x) => ({ ...x, accepted: [...x.accepted, ""] }))} className="mt-2 text-[13px] font-semibold text-tests hover:underline">
          + Add accepted answer
        </button>
      )}
    </fieldset>
  );
}

/* ───────────────────────── Preview ───────────────────────── */

function PreviewModal({ open, onClose, draft }: { open: boolean; onClose: () => void; draft: DraftTest }) {
  return (
    <Modal open={open} onClose={onClose} title="Student preview" description="What students see — correct answers are hidden." size="lg">
      <div className="space-y-4">
        <div className="rounded-2xl border-t-4 border-t-tests bg-app p-5">
          <p className="text-xl font-bold">{draft.title || "Untitled test"}</p>
          {draft.description && <p className="mt-1 text-sm whitespace-pre-line text-zinc-700">{draft.description}</p>}
          <p className="mt-2 text-xs text-muted">
            {questionCount(draft.questions)} questions · {maxScoreOf(draft)} points
          </p>
        </div>
        {draft.questions.length === 0 && <p className="text-sm text-muted">No questions yet.</p>}
        {draft.questions.map((q, i) =>
          q.type === "section" ? (
            <div key={q.key} className="rounded-2xl border-t-4 border-t-tests bg-app p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Next page</p>
              {q.prompt && <p className="mt-1 text-lg font-bold">{q.prompt}</p>}
              {q.description && <p className="mt-1 text-sm whitespace-pre-line text-zinc-700">{q.description}</p>}
            </div>
          ) : q.type === "text" ? (
            <div key={q.key} className="rounded-2xl border border-line p-5">
              {q.prompt && <p className="font-semibold">{q.prompt}</p>}
              {q.description && <p className="mt-1 text-sm whitespace-pre-line text-zinc-700">{q.description}</p>}
            </div>
          ) : q.type === "image" ? (
            <figure key={q.key} className="rounded-2xl border border-line p-4">
              {q.imageUrl && <img src={q.imageUrl} alt={q.prompt} className="mx-auto max-h-80 rounded-lg object-contain" />}
              {q.prompt && <figcaption className="mt-2 text-center text-sm text-muted">{q.prompt}</figcaption>}
            </figure>
          ) : (
            <PreviewQuestion key={q.key} q={q} n={questionNumbers(draft.questions)[i] ?? i + 1} />
          ),
        )}
      </div>
    </Modal>
  );
}

function PreviewQuestion({ q, n }: { q: DraftQuestion; n: number }): ReactNode {
  return (
    <fieldset className="rounded-2xl border border-line p-5">
      <legend className="sr-only">Question {n}</legend>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold whitespace-pre-line">
          {n}. {q.prompt || <span className="text-faint">(no question text)</span>}
          {q.required && <span className="ml-1 text-danger" aria-label="required">*</span>}
        </p>
        <span className="shrink-0 text-xs text-muted">
          {q.points} pt{q.points === 1 ? "" : "s"}
        </span>
      </div>
      {q.imageUrl && <img src={q.imageUrl} alt="" className="mt-3 max-h-64 rounded-lg object-contain" />}
      <div className="mt-3 space-y-2 text-sm">
        {(q.type === "single" || q.type === "multi") &&
          q.options.map((o) => (
            <label key={o.id} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
              <input type={q.type === "single" ? "radio" : "checkbox"} name={`preview-${q.key}`} className="size-4" />
              {o.text || <span className="text-faint">(empty option)</span>}
            </label>
          ))}
        {q.type === "truefalse" &&
          ["True", "False"].map((t) => (
            <label key={t} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
              <input type="radio" name={`preview-${q.key}`} className="size-4" />
              {t}
            </label>
          ))}
        {q.type === "short" && <input aria-label="Your answer" placeholder="Your answer" className="h-10 w-full rounded-xl border border-line px-3" />}
      </div>
    </fieldset>
  );
}

