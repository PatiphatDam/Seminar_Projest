// Types for the plain-JS games module (copied from the Muscle Games repo).
import type { ComponentType } from "react";

export interface MuscleGameRun {
  runId: string;
  gameId: "balloon-pop" | "group-sort" | "diameter";
  mode: string | null;
  scoreKey: string;
  /** Out of maxScore (10), one decimal: the share of answers that were right. */
  score: number;
  maxScore: number;
  completed: boolean;
  isNewBest: boolean;
  mistakes: { prompt: string; yours: string; answer: string; why?: string }[];
  summary: string;
  finishedAt: string;
}

export const MuscleGames: ComponentType<{
  onGameFinish?: (run: MuscleGameRun) => void | Promise<unknown>;
  /** false hides the hub's own "Games" heading when the host renders its own page header. */
  hubTitle?: boolean;
  /** The signed-in student; runs that failed to save are re-sent only while this same player is signed in. */
  playerId?: string | null;
  className?: string;
}>;
