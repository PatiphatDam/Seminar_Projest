import { levelById, topicById } from "@/content/exploreZoom";

/** Where the interactive sarcomere goes back to when it was opened directly (bookmark, shared link). */
export const DEFAULT_EXPLORE_BACK = "/explore?topic=skeletal&level=sarcomere";

type From = { pathname: string; search: string };

/** Link state for "open the sarcomere": remembers the 3D Explore level (topic + level are in the URL). */
export function backState(from: From): { from: string } {
  return { from: from.pathname + from.search };
}

/**
 * The 3D Explore page to return to from the sarcomere, and a short name for it. Only /explore URLs are accepted, so
 * history state can never send the button somewhere else. Pure — unit tested.
 */
export function exploreBack(state: unknown): { to: string; label: string } {
  const raw = typeof state === "object" && state !== null && "from" in state ? (state as { from: unknown }).from : null;
  const to = typeof raw === "string" && /^\/explore(\?[^#]*)?$/.test(raw) ? raw : DEFAULT_EXPLORE_BACK;
  const q = new URLSearchParams(to.split("?")[1] ?? "");
  const level = levelById(q.get("level"));
  const label = level ? `${topicById(q.get("topic")).name} · ${level.crumb}` : "3D Explore";
  return { to, label };
}
