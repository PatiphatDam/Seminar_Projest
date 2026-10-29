// Types for the plain-JS games module (copied from the Muscle Games repo).
import type { ComponentType } from "react";

export interface MuscleGameRun {
  runId: string;
  gameId: "balloon-pop" | "group-sort" | "diameter";
  mode: string | null;
  scoreKey: string;
  score: number;
  stars: number;
  completed: boolean;
  isNewBest: boolean;
  achievements: string[];
  newAchievements: string[];
  mistakes: { prompt: string; yours: string; answer: string; why?: string }[];
  summary: string;
  finishedAt: string;
}

export const MuscleGames: ComponentType<{
  onGameFinish?: (run: MuscleGameRun) => void | Promise<unknown>;
  /** false hides the hub's own "Games" heading when the host renders its own page header. */
  hubTitle?: boolean;
  className?: string;
}>;
