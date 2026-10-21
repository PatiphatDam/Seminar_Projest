import { useCallback } from "react";
import type { GameRunBody } from "@shared/contract";
import { api } from "@/lib/api";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { MuscleGames, type MuscleGameRun } from "@/muscle-games";

/** /games/* — the Muscle Games module. Every finished (or left) run is saved to the student's record (GAME-7). */
export default function MuscleGamesPage() {
  useDocumentTitle("Games");
  const saveRun = useCallback(async (run: MuscleGameRun) => {
    const body: GameRunBody = {
      runId: run.runId,
      scoreKey: run.scoreKey as GameRunBody["scoreKey"],
      score: run.score,
      stars: run.stars,
      completed: run.completed,
      summary: run.summary,
      achievements: run.achievements,
      mistakes: run.mistakes,
    };
    await api.post("/me/game-runs", body);
  }, []);
  return <MuscleGames onGameFinish={saveRun} />;
}
