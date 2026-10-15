import { describe, expect, it } from "vitest";
import { questionInput } from "../shared/contract";
import { canRevealAnswers } from "./grading";
import { anonymizedIdentityHashes, hmacSha256Hex } from "./identityHash";

describe("canRevealAnswers (\"Show answers after submit\")", () => {
  it("reveals right after submitting when the switch is on", () => {
    expect(canRevealAnswers({ showAnswers: true, submitted: true })).toBe(true);
  });
  it("never when show_answers is off or the attempt is not submitted", () => {
    expect(canRevealAnswers({ showAnswers: false, submitted: true })).toBe(false);
    expect(canRevealAnswers({ showAnswers: true, submitted: false })).toBe(false);
  });
});

describe("anonymized identity hashes (M-1)", () => {
  it("HMAC-SHA256 matches the RFC 4231 test vector 2", async () => {
    expect(await hmacSha256Hex("Jefe", "what do ya want for nothing?")).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });
  it("is case-insensitive for e-mail, keyed and domain-separated", async () => {
    const a = await anonymizedIdentityHashes("secret-1", { email: "6531501011@LAMDUAN.mfu.ac.th", studentCode: "6531501011" });
    const b = await anonymizedIdentityHashes("secret-1", { email: "6531501011@lamduan.mfu.ac.th", studentCode: "6531501011" });
    const other = await anonymizedIdentityHashes("secret-2", { email: "6531501011@lamduan.mfu.ac.th" });
    expect(a).toEqual(b);
    expect(a).toHaveLength(2);
    expect(a[0]).not.toBe(a[1]);
    expect(a[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(other[0]).not.toBe(a[0]);
    expect(await anonymizedIdentityHashes("s", { email: null, studentCode: null })).toEqual([]);
  });
});

describe("questionInput.imageUrl (L-3)", () => {
  const q = (imageUrl: unknown) =>
    questionInput.safeParse({ type: "truefalse", prompt: "x", answer: true, imageUrl }).success;
  it("allows https URLs and /images/ paths", () => {
    expect(q("https://example.com/a.png")).toBe(true);
    expect(q("/images/sarcomere.webp")).toBe(true);
    expect(q(null)).toBe(true);
    expect(q(undefined)).toBe(true);
  });
  it("rejects other schemes and traversal", () => {
    expect(q("http://example.com/a.png")).toBe(false);
    expect(q("javascript:alert(1)")).toBe(false);
    expect(q("data:image/png;base64,AAAA")).toBe(false);
    expect(q("/images/../api/admin")).toBe(false);
    expect(q("//evil.example/x.png")).toBe(false);
  });
});

describe("dev login host guard (M-3)", async () => {
  const { isDevLoginEnabled } = await import("./env");
  const env = (DEV_LOGIN: string) => ({ DEV_LOGIN }) as unknown as Env;
  it("requires DEV_LOGIN=true and a loopback host", () => {
    expect(isDevLoginEnabled(env("true"), "http://localhost:5173/api/config")).toBe(true);
    expect(isDevLoginEnabled(env("true"), "http://127.0.0.1:8787/api/auth/dev")).toBe(true);
    expect(isDevLoginEnabled(env("true"), "http://[::1]:8787/api/auth/dev")).toBe(true);
    expect(isDevLoginEnabled(env("true"), "https://digital-muscle.example.workers.dev/api/auth/dev")).toBe(false);
    expect(isDevLoginEnabled(env("false"), "http://localhost:5173/api/config")).toBe(false);
    expect(isDevLoginEnabled(env(""), "http://localhost/api/config")).toBe(false);
  });
});
