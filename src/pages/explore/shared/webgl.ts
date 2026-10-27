/** What the browser can draw. three.js (r163+) renders with WebGL 2 only, so `ok` needs WebGL 2. */
export type WebGLSupport = { ok: boolean; webgl2: boolean; webgl1: boolean };

/**
 * Probe one context type on its own throw-away canvas and release it straight away: iPad Safari allows only a few
 * live WebGL contexts, and a probe that is never released takes one of the slots the real 3D viewer needs.
 */
function probe(type: "webgl2" | "webgl"): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext(type, { failIfMajorPerformanceCaveat: false }) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function webglSupport(): WebGLSupport {
  if (typeof document === "undefined") return { ok: false, webgl2: false, webgl1: false };
  const webgl2 = probe("webgl2");
  const webgl1 = webgl2 || probe("webgl");
  return { ok: webgl2, webgl2, webgl1 };
}

/** True when the 3D viewers can run (otherwise the 3D pages show their 2D fallback). */
export const hasWebGL = () => webglSupport().ok;

/** "iPadOS 14.8" / "iOS 16.7" from the user agent (iPads in desktop mode report as Mac with touch). Pure — unit tested. */
export function appleOsVersion(ua: string, touchPoints = 0): string | null {
  const m = /OS (\d+)[_.](\d+)/.exec(ua);
  if (/iPad/.test(ua) && m) return `iPadOS ${m[1]}.${m[2]}`;
  if (/iPhone|iPod/.test(ua) && m) return `iOS ${m[1]}.${m[2]}`;
  const v = /Version\/(\d+)\.(\d+)/.exec(ua);
  if (/Macintosh/.test(ua) && touchPoints > 1 && v) return `iPadOS (Safari ${v[1]}.${v[2]})`;
  return null;
}

/** Why 3D is off and what the student can do — shown in the 2D fallback. Pure — unit tested. */
export function webglHelp(s: WebGLSupport, os: string | null): { reason: string; tips: string[] } {
  const reason = s.webgl1
    ? "This browser has WebGL 1 but not WebGL 2, which the 3D viewer needs."
    : "This browser could not start WebGL (3D graphics).";
  const tips = [
    os ? `Update the device: Settings → General → Software Update (now ${os}; WebGL 2 needs iPadOS / iOS 15 or later).` : "Update the browser or the operating system to the latest version.",
    "Close other tabs that show 3D or video, then reload this page.",
    "On iPad / iPhone: Settings → Safari → Advanced → Feature Flags (or Experimental Features) — make sure WebGL 2.0 is on. Lockdown Mode also turns 3D graphics off.",
  ];
  return { reason, tips };
}

/** Respect "reduce motion": no auto-playing animation. */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/**
 * Renderer options for both viewers. On high-density (retina) screens multisample antialiasing costs a lot of graphics
 * memory for little visible gain — older iPads lose the WebGL context when it runs out — so it is only used below 2×.
 */
export const GL_OPTIONS = {
  antialias: typeof window === "undefined" || window.devicePixelRatio < 2,
  powerPreference: "high-performance" as const,
};
