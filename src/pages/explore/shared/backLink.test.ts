import { describe, expect, it } from "vitest";
import { DEFAULT_EXPLORE_BACK, backState, exploreBack } from "./backLink";

describe("sarcomere back link", () => {
  it("returns to the 3D Explore level the student came from", () => {
    const state = backState({ pathname: "/explore", search: "?topic=cardiac&level=sarcomere" });
    expect(exploreBack(state)).toEqual({ to: "/explore?topic=cardiac&level=sarcomere", label: "Cardiac muscle · Sarcomere" });
  });

  it("falls back to the skeletal sarcomere level when opened directly", () => {
    expect(exploreBack(null).to).toBe(DEFAULT_EXPLORE_BACK);
    expect(exploreBack(undefined).label).toBe("Skeletal muscle · Sarcomere");
  });

  it("never follows a non-/explore address from history state", () => {
    expect(exploreBack({ from: "https://evil.example/explore" }).to).toBe(DEFAULT_EXPLORE_BACK);
    expect(exploreBack({ from: "/admin" }).to).toBe(DEFAULT_EXPLORE_BACK);
    expect(exploreBack({ from: "//evil.example" }).to).toBe(DEFAULT_EXPLORE_BACK);
  });
});
