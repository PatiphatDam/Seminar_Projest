import { describe, expect, it } from "vitest";
import { calloutLayout } from "./marker";

describe("hotspot callout layout", () => {
  it("puts the badge up and away from the dot, on the requested side", () => {
    const right = calloutLayout("right", null);
    expect(right.badge[0]).toBeGreaterThan(right.dot[0]);
    expect(right.badge[1]).toBeLessThan(right.dot[1]);
    const left = calloutLayout("left", null);
    expect(left.badge[0]).toBeLessThan(left.dot[0]);
  });

  it("makes room for the name only when one is shown, outside the badge", () => {
    const plain = calloutLayout("right", null);
    const named = calloutLayout("right", 80);
    expect(plain.label).toBeUndefined();
    expect(named.w).toBeGreaterThan(plain.w);
    expect(named.label!.x).toBeGreaterThan(named.badge[0]);
    const left = calloutLayout("left", 80);
    expect(left.label!.x + left.label!.w).toBeLessThan(left.badge[0]);
    expect(left.label!.x).toBeGreaterThanOrEqual(0);
  });
});
