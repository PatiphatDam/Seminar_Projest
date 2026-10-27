import { describe, expect, it } from "vitest";
import { appleOsVersion, webglHelp } from "./webgl";

describe("webgl help", () => {
  it("reads the iPad / iPhone OS version from the user agent", () => {
    expect(appleOsVersion("Mozilla/5.0 (iPad; CPU OS 14_8 like Mac OS X) AppleWebKit/605.1.15")).toBe("iPadOS 14.8");
    expect(appleOsVersion("Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X)")).toBe("iOS 16.7");
    expect(appleOsVersion("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/16.6 Safari/605.1.15", 5)).toBe("iPadOS (Safari 16.6)");
    expect(appleOsVersion("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBeNull();
  });

  it("explains WebGL 1-only browsers differently from no WebGL at all", () => {
    expect(webglHelp({ ok: false, webgl2: false, webgl1: true }, null).reason).toMatch(/not WebGL 2/);
    expect(webglHelp({ ok: false, webgl2: false, webgl1: false }, "iPadOS 14.8").tips[0]).toMatch(/now iPadOS 14\.8/);
  });
});
