import { useSyncExternalStore } from "react";

/** Student colour theme (Light / Dark). The CSS lives at the end of src/index.css. */
export type ThemeChoice = "light" | "dark";

const KEY = "dm_theme";
const listeners = new Set<() => void>();

/** A saved choice wins; before the student picks one, start from the device setting. */
function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* storage unavailable */
  }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

let current: ThemeChoice = read();

function apply(choice: ThemeChoice) {
  document.documentElement.setAttribute("data-theme", choice);
}

/** Call once before the first render so the theme applies without a flash. */
export function initTheme() {
  apply(current);
}

export function setTheme(choice: ThemeChoice) {
  current = choice;
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* storage unavailable — the choice still applies for this visit */
  }
  apply(choice);
  listeners.forEach((l) => l());
}

export function useTheme(): ThemeChoice {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
  );
}
