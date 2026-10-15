import { describe, expect, it } from "vitest";
import type { StudentQuestion, StudentTestItem } from "@shared/contract";
import { answerText, attemptsLeft, buildPages, canStart, clock, isAnswered, matchesFilter, unanswered } from "./testHelpers";

const item = (over: Partial<StudentTestItem> = {}): StudentTestItem => ({
  assignmentId: 1,
  testId: 1,
  title: "Pretest",
  kind: "pretest",
  questionCount: 10,
  timeLimitMin: 20,
  maxAttempts: 2,
  attemptsUsed: 0,
  scorePolicy: "highest",
  isOpen: true,
  opensAt: null,
  closesAt: null,
  status: "open",
  inProgressAttemptId: null,
  countedScore: null,
  maxScore: null,
  lastSubmittedAttemptId: null,
  ...over,
});

const q = (id: number, required: boolean): StudentQuestion => ({
  id,
  position: id,
  type: "single",
  prompt: `Q${id}`,
  description: "",
  imageUrl: null,
  options: [{ id: "a", text: "A" }],
  points: 1,
  required,
});

describe("clock", () => {
  it("formats minutes and hours, clamps negatives", () => {
    expect(clock(872_000)).toBe("14:32");
    expect(clock(3_725_000)).toBe("1:02:05");
    expect(clock(-5)).toBe("0:00");
    expect(clock(400)).toBe("0:01"); // rounds up so 0:00 means time is really up
  });
});

describe("isAnswered", () => {
  it("matches the server rule", () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered("  ")).toBe(false);
    expect(isAnswered([])).toBe(false);
    expect(isAnswered(false)).toBe(true);
    expect(isAnswered(["a"])).toBe(true);
    expect(isAnswered("x")).toBe(true);
  });
});

describe("answerText", () => {
  const opts = [
    { id: "a", text: "Actin" },
    { id: "b", text: "Myosin" },
    { id: "c", text: "Troponin" },
  ];
  it("maps ids to option text", () => {
    expect(answerText("multi", opts, ["a", "c"])).toBe("Actin, Troponin");
    expect(answerText("single", opts, "b")).toBe("Myosin");
  });
  it("handles true/false, short and blanks", () => {
    expect(answerText("truefalse", [], false)).toBe("False");
    expect(answerText("truefalse", [], true)).toBe("True");
    expect(answerText("short", [], "Sarcomere")).toBe("Sarcomere");
    expect(answerText("short", [], "")).toBe("No answer");
    expect(answerText("multi", opts, null)).toBe("No answer");
  });
});

describe("attempts / canStart", () => {
  it("counts attempts left and unlimited", () => {
    expect(attemptsLeft(item({ attemptsUsed: 1 }))).toBe(1);
    expect(attemptsLeft(item({ maxAttempts: null, attemptsUsed: 5 }))).toBeNull();
  });
  it("only allows starting open tests with attempts left", () => {
    expect(canStart(item())).toBe(true);
    expect(canStart(item({ status: "submitted", attemptsUsed: 1 }))).toBe(true);
    expect(canStart(item({ status: "submitted", attemptsUsed: 2 }))).toBe(false);
    expect(canStart(item({ status: "not_open", isOpen: false }))).toBe(false);
    expect(canStart(item({ status: "closed", isOpen: false }))).toBe(false);
    expect(canStart(item({ status: "in_progress" }))).toBe(true);
  });
});

describe("unanswered / filter", () => {
  it("splits missing questions by required", () => {
    expect(unanswered([q(1, true), q(2, false), q(3, true)], { "3": "a" })).toEqual({ required: [1], optional: [2] });
  });
  it("filters the list pills", () => {
    expect(matchesFilter(item({ status: "in_progress" }), "open")).toBe(true);
    expect(matchesFilter(item({ status: "submitted" }), "done")).toBe(true);
    expect(matchesFilter(item({ status: "closed", lastSubmittedAttemptId: null }), "done")).toBe(false);
  });
});

describe("buildPages (Google Forms sections)", () => {
  const item = (id: number, type: StudentQuestion["type"]): StudentQuestion => ({ ...q(id, true), type });

  it("without sections: one question per page, blocks stay with the next question", () => {
    const r = buildPages([item(1, "text"), item(2, "single"), item(3, "image"), item(4, "short")]);
    expect(r.pages.map((p) => p.items.map((x) => x.id))).toEqual([[1, 2], [3, 4]]);
    expect(r.questions.map((x) => [x.id, x.position])).toEqual([[2, 1], [4, 2]]);
    expect(r.pageOfQuestion).toEqual([0, 1]);
  });

  it("with sections: one page per section, questions renumbered across pages", () => {
    const r = buildPages([item(1, "single"), item(2, "single"), item(3, "section"), item(4, "text"), item(5, "multi")]);
    expect(r.pages).toHaveLength(2);
    expect(r.pages[0].section).toBeNull();
    expect(r.pages[1].section?.id).toBe(3);
    expect(r.pages[1].items.map((x) => x.id)).toEqual([4, 5]);
    expect(r.questions.map((x) => x.position)).toEqual([1, 2, 3]);
    expect(r.pageOfQuestion).toEqual([0, 0, 1]);
  });

  it("a test that starts with a section has no empty first page", () => {
    const r = buildPages([item(1, "section"), item(2, "single")]);
    expect(r.pages).toHaveLength(1);
    expect(r.pages[0].section?.id).toBe(1);
  });
});
