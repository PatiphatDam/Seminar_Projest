import { useMemo } from "react";
import { appleOsVersion, webglHelp, webglSupport } from "./webgl";

/** Why the 3D viewer is off on this device and what to try — shown inside the 2D fallbacks. */
export function WebGLHelp() {
  const help = useMemo(() => {
    const os = typeof navigator === "undefined" ? null : appleOsVersion(navigator.userAgent, navigator.maxTouchPoints);
    return webglHelp(webglSupport(), os);
  }, []);
  return (
    <details className="coast-muted text-[13px]">
      <summary className="cursor-pointer font-semibold text-[var(--c-text)]">Why, and how to fix it</summary>
      <p className="mt-2">{help.reason}</p>
      <ul className="mt-1.5 list-disc space-y-1 pl-5">
        {help.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <button type="button" onClick={() => window.location.reload()} className="coast-btn mt-3 px-3 py-1.5 text-[13px] font-bold">
        Try again
      </button>
    </details>
  );
}

/** Shown over a viewer whose WebGL context was lost (older iPads run out of graphics memory). */
export function ContextLost() {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-[var(--c-bg)]/90 p-6 text-center text-[var(--c-text)]">
      <div>
        <p className="text-[14px] font-semibold">The 3D view stopped — this device ran out of graphics memory.</p>
        <p className="coast-muted mt-1 text-[13px]">Close other tabs, then reload the page.</p>
        <button type="button" onClick={() => window.location.reload()} className="coast-btn mt-3 px-3 py-1.5 text-[13px] font-bold">
          Reload
        </button>
      </div>
    </div>
  );
}
