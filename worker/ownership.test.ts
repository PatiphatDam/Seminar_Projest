import { describe, expect, it } from "vitest";
import { assertOwner, canChange, ownerLabel } from "./routes/admin/common";

describe("ownership (decision A)", () => {
  it("only the owner or the emergency account may change an item", () => {
    expect(canChange("keerakarn.som@mfu.ac.th", { email: "keerakarn.som@mfu.ac.th" })).toBe(true);
    expect(canChange("keerakarn.som@mfu.ac.th", { email: "wacharawan.int@mfu.ac.th" })).toBe(false);
    expect(canChange(null, { email: "wacharawan.int@mfu.ac.th" })).toBe(false);
    expect(canChange(null, { email: "local:admin123" })).toBe(true);
    expect(() => assertOwner("a@mfu.ac.th", { email: "b@mfu.ac.th" }, "test")).toThrow(/only its owner/);
  });

  it("labels class names with the instructor (decision B)", () => {
    expect(ownerLabel({ email: "keerakarn.som@mfu.ac.th", name: null })).toBe("Keerakarn");
    expect(ownerLabel({ email: "x@mfu.ac.th", name: "Wacharawan Int" })).toBe("Wacharawan");
    expect(ownerLabel({ email: "local:admin123", name: null })).toBe("Admin");
  });
});
