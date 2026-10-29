import { useCallback } from "react";
import { useMatch } from "react-router";
import type { GameRunBody } from "@shared/contract";
import { api } from "@/lib/api";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { MuscleGames, type MuscleGameRun } from "@/muscle-games";
// Cover-title fonts, self-hosted: the CSP blocks Google Fonts. Text and heading fonts come from index.css.
import "@fontsource/bungee/latin-400.css";
import "@fontsource/cinzel-decorative/latin-700.css";
import "@fontsource/cinzel-decorative/latin-900.css";

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
  // The hub gets the same page header as the other student pages (breadcrumb, phone back button);
  // each game keeps its own bar with "← Games".
  const onHub = useMatch("/games") !== null;
  return (
    <>
      {onHub && (
        <StudentPageHeader
          title="Games"
          subtitle="Muscular Tissues I · 3 games — play in any order"
          crumbs={[{ to: "/", label: "Home" }, { label: "Games" }]}
          back="/"
        />
      )}
      {/* On phones the games keep their sticky piece tray above the fixed bottom tab bar (StudentLayout BottomTabs). */}
      <MuscleGames
        onGameFinish={saveRun}
        hubTitle={!onHub}
        className="[--mg-bottom-inset:calc(76px+env(safe-area-inset-bottom))] md:[--mg-bottom-inset:0px]"
      />
    </>
  );
}
