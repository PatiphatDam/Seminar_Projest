/**
 * Pure model for the test builder (no React) — easy to unit test.
 * The draft keeps an answer slot per question type so switching types doesn't lose work.
 */
import { isLayoutType, UPLOADED_IMAGE_URL, type AdminQuestion, type AdminTestDetail, type LayoutType, type QuestionInput, type QuestionType, type SaveTestBody, type TestKind } from "@shared/contract";

export interface DraftOption {
  id: string;
  text: string;
}

export interface DraftQuestion {
  /** Stable client key (dnd-kit id, React key). */
  key: string;
  /** Server id once saved. */
  id?: number;
  type: QuestionType;
  /** Question text · title of a text / section block · caption of an image block */
  prompt: string;
  /** Text / section blocks only */
  description: string;
  imageUrl: string | null;
  options: DraftOption[];
  single: string;
  multi: string[];
  tf: boolean | null;
  accepted: string[];
  points: number;
  required: boolean;
}

export interface DraftTest {
  title: string;
  description: string;
  kind: TestKind;
  /** Questions and layout blocks (title / image / section) in order. */
  questions: DraftQuestion[];
}

/** Question types an instructor can pick in the type menu (layout blocks come from the side toolbar). */
export const QUESTION_TYPES = ["single", "multi", "truefalse", "short"] as const;

export const TYPE_LABEL: Record<QuestionType, string> = {
  single: "Single choice",
  multi: "Multiple choice",
  truefalse: "True / False",
  short: "Short answer",
  text: "Title and description",
  image: "Image",
  section: "Section",
};

/** Number shown on each real question ("Question 3"); layout blocks get null. */
export function questionNumbers(qs: DraftQuestion[]): (number | null)[] {
  let n = 0;
  return qs.map((q) => (isLayoutType(q.type) ? null : ++n));
}

export const questionCount = (qs: { type: QuestionType }[]) => qs.filter((q) => !isLayoutType(q.type)).length;

let keySeq = 0;
export const newKey = () => `q${Date.now().toString(36)}${(keySeq++).toString(36)}`;

/** Next option id not used in the question: "a", "b", … "z", then "o27", "o28"… (≤ 20 chars). */
export function nextOptionId(options: DraftOption[]): string {
  const used = new Set(options.map((o) => o.id));
  for (let i = 0; i < 26; i++) {
    const id = String.fromCharCode(97 + i);
    if (!used.has(id)) return id;
  }
  let n = 27;
  while (used.has(`o${n}`)) n++;
  return `o${n}`;
}

export function blankQuestion(type: QuestionType = "single"): DraftQuestion {
  return {
    key: newKey(),
    type,
    prompt: "",
    description: "",
    imageUrl: null,
    options: type === "single" || type === "multi" ? [{ id: "a", text: "Option 1" }, { id: "b", text: "Option 2" }] : [],
    single: "",
    multi: [],
    tf: null,
    accepted: [""],
    points: 1,
    required: true,
  };
}

/** A Google-Forms-style block: title + description, an image with a caption, or a new section (page). */
export function blankBlock(type: LayoutType, imageUrl: string | null = null): DraftQuestion {
  return { ...blankQuestion("single"), type, options: [], imageUrl, points: 0, required: false };
}

export function questionFromServer(q: AdminQuestion, key: string = newKey()): DraftQuestion {
  const d: DraftQuestion = {
    key,
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    description: q.description ?? "",
    imageUrl: q.imageUrl,
    options: q.type === "single" || q.type === "multi" ? q.options.map((o) => ({ ...o })) : [],
    single: "",
    multi: [],
    tf: null,
    accepted: [""],
    points: q.points,
    required: q.required,
  };
  const a = q.answer;
  if (q.type === "single") d.single = typeof a === "string" ? a : Array.isArray(a) ? (a[0] ?? "") : "";
  if (q.type === "multi") d.multi = Array.isArray(a) ? [...a] : typeof a === "string" && a ? [a] : [];
  if (q.type === "truefalse") d.tf = typeof a === "boolean" ? a : a === "true" ? true : a === "false" ? false : null;
  if (q.type === "short") d.accepted = Array.isArray(a) && a.length ? [...a] : typeof a === "string" && a ? [a] : [""];
  return d;
}

export function draftFromServer(t: AdminTestDetail): DraftTest {
  return {
    title: t.title,
    description: t.description ?? "",
    kind: t.kind,
    questions: [...t.questions].sort((a, b) => a.position - b.position).map((q) => questionFromServer(q)),
  };
}

/** Switch a question's type, seeding sensible defaults for the new type. */
export function changeType(q: DraftQuestion, type: QuestionType): DraftQuestion {
  if (q.type === type) return q;
  const next: DraftQuestion = { ...q, type };
  const isChoice = type === "single" || type === "multi";
  if (isChoice && next.options.length === 0) next.options = [{ id: "a", text: "Option 1" }, { id: "b", text: "Option 2" }];
  if (type === "single" && !next.single && q.type === "multi") next.single = q.multi[0] ?? "";
  if (type === "multi" && next.multi.length === 0 && q.type === "single" && q.single) next.multi = [q.single];
  return next;
}

export function duplicateQuestion(q: DraftQuestion): DraftQuestion {
  return { ...q, key: newKey(), id: undefined, options: q.options.map((o) => ({ ...o })), multi: [...q.multi], accepted: [...q.accepted] };
}

export function questionAnswer(q: DraftQuestion): QuestionInput["answer"] {
  switch (q.type) {
    case "single":
      return q.single;
    case "multi":
      return q.multi.filter((id) => q.options.some((o) => o.id === id));
    case "truefalse":
      return q.tf ?? false;
    case "short":
      return q.accepted.map((s) => s.trim()).filter(Boolean);
    default:
      return ""; // layout blocks have no answer
  }
}

export const MAX_QUESTIONS = 200;

/**
 * Build the PUT body. `serverIds` = question ids that currently belong to the test on the server;
 * any other id (e.g. a deleted question restored with Undo after an autosave) is stripped so the
 * question is re-created instead of failing with "Question id N does not belong to this test".
 */
export function toSaveBody(d: DraftTest, serverIds?: ReadonlySet<number>): SaveTestBody {
  return {
    title: d.title.trim(),
    description: d.description,
    // Old tests can still be "other"; validateDraft asks the instructor to pick Pretest or Posttest before saving.
    kind: d.kind === "posttest" ? "posttest" : "pretest",
    questions: d.questions.map((q) => ({
      ...(q.id && (!serverIds || serverIds.has(q.id)) ? { id: q.id } : {}),
      type: q.type,
      prompt: q.prompt.trim(),
      description: isLayoutType(q.type) && q.type !== "image" ? q.description.trim() : "",
      imageUrl: q.imageUrl,
      options: q.type === "single" || q.type === "multi" ? q.options.map((o) => ({ id: o.id, text: o.text.trim() })) : [],
      answer: questionAnswer(q),
      points: isLayoutType(q.type) ? 0 : q.points,
      required: isLayoutType(q.type) ? false : q.required,
    })),
  };
}

export interface ValidationResult {
  title?: string;
  /** Test-level problems (e.g. too many questions). */
  general: string[];
  byQuestion: Record<string, string[]>;
  count: number;
}

export function validateDraft(d: DraftTest): ValidationResult {
  const byQuestion: Record<string, string[]> = {};
  let count = 0;
  const title = d.title.trim() ? undefined : "The test needs a title.";
  if (title) count++;
  const general: string[] = [];
  if (d.kind !== "pretest" && d.kind !== "posttest") general.push("Choose whether this is a Pretest or a Posttest.");
  if (d.questions.length > MAX_QUESTIONS) general.push(`A test can have at most ${MAX_QUESTIONS} questions.`);
  count += general.length;
  for (const q of d.questions) {
    const errs: string[] = [];
    if (isLayoutType(q.type)) {
      if (q.type === "text" && !q.prompt.trim() && !q.description.trim()) errs.push("Add a title or a description.");
      if (q.type === "image" && !q.imageUrl) errs.push("Upload an image.");
      if (errs.length) {
        byQuestion[q.key] = errs;
        count += errs.length;
      }
      continue;
    }
    if (!q.prompt.trim()) errs.push("Write the question.");
    if (q.imageUrl && !/^(https:\/\/|\/images\/)\S+$/.test(q.imageUrl) && !UPLOADED_IMAGE_URL.test(q.imageUrl)) {
      errs.push("Image URL must start with https:// or /images/.");
    }
    if (!Number.isInteger(q.points) || q.points < 0 || q.points > 100) errs.push("Points must be a whole number from 0 to 100.");
    if (q.type === "single" || q.type === "multi") {
      if (q.options.length < 1) errs.push("Add at least one option.");
      if (q.options.length > 12) errs.push("Use at most 12 options.");
      if (q.options.some((o) => !o.text.trim())) errs.push("Options can’t be empty.");
      if (q.type === "single" && !q.options.some((o) => o.id === q.single)) errs.push("Mark the correct option.");
      if (q.type === "multi" && !q.multi.some((id) => q.options.some((o) => o.id === id))) errs.push("Mark at least one correct option.");
    }
    if (q.type === "truefalse" && q.tf === null) errs.push("Choose whether the statement is true or false.");
    if (q.type === "short" && !q.accepted.some((s) => s.trim())) errs.push("Add at least one accepted answer.");
    if (errs.length) {
      byQuestion[q.key] = errs;
      count += errs.length;
    }
  }
  return { title, general, byQuestion, count };
}

export const maxScoreOf = (d: DraftTest) =>
  d.questions.reduce((s, q) => s + (!isLayoutType(q.type) && Number.isFinite(q.points) ? q.points : 0), 0);
