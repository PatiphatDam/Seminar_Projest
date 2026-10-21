import { createContext, useCallback, useContext, useRef, useState } from 'react';

// Best scores and unlocked achievements for this browser session only (saving to the DB is GAME-7).
const KEY = 'muscle-games:session';
const ScoresContext = createContext(null);

function load() {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY));
    return { best: data?.best || {}, ach: data?.ach || {} };
  } catch {
    return { best: {}, ach: {} };
  }
}

export function ScoresProvider({ children }) {
  const [state, setState] = useState(load);
  const ref = useRef(state);

  const save = (next) => {
    ref.current = next;
    setState(next);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: keep in memory */
    }
  };

  // Records a finished run under a score key; returns true when it beats the session best.
  const submit = useCallback((key, score) => {
    const prev = ref.current.best[key];
    if (prev !== undefined && score <= prev) return false;
    save({ ...ref.current, best: { ...ref.current.best, [key]: score } });
    return true;
  }, []);

  // Unlocks achievement ids for a game; returns the ones that are new.
  const unlock = useCallback((gameId, ids) => {
    const have = ref.current.ach[gameId] || [];
    const fresh = ids.filter((id) => !have.includes(id));
    if (fresh.length) save({ ...ref.current, ach: { ...ref.current.ach, [gameId]: [...have, ...fresh] } });
    return fresh;
  }, []);

  return (
    <ScoresContext.Provider value={{ best: state.best, ach: state.ach, submit, unlock }}>{children}</ScoresContext.Provider>
  );
}

export const useScores = () => useContext(ScoresContext);
