import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * The canvases render on demand. A browser pauses rendering while the tab is hidden (opened in the background, phone
 * screen locked), so a model that finished loading then stayed blank until the student touched it. Draw a fresh frame
 * whenever the page becomes visible again, the window regains focus, or the page is restored from the back/forward cache.
 */
export function RedrawOnVisible() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const redraw = () => {
      if (document.visibilityState === "visible") invalidate();
    };
    document.addEventListener("visibilitychange", redraw);
    window.addEventListener("focus", redraw);
    window.addEventListener("pageshow", redraw);
    return () => {
      document.removeEventListener("visibilitychange", redraw);
      window.removeEventListener("focus", redraw);
      window.removeEventListener("pageshow", redraw);
    };
  }, [invalidate]);
  return null;
}
