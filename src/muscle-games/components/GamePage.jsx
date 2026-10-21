import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScores } from '../scores.jsx';
import { MascotBar, useFx, useFxState } from '../fx/Fx.jsx';
import { starsFor } from '../games/meta.js';
import { useGamesConfig } from '../config.js';
import { Stars } from './Hud.jsx';

const CHEERS = {
  3: 'สุดยอด! สามดาวเต็ม! 🌟',
  2: 'เก่งมาก! อีกนิดเดียวก็สามดาวแล้ว',
  1: 'ดีเลย! ลองอีกรอบเพื่อเก็บดาวเพิ่มไหม?',
  0: 'ไม่เป็นไรนะ ทบทวนข้อที่พลาดแล้วลองใหม่!',
};

const newRunId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function dedupe(mistakes = []) {
  const seen = new Set();
  return mistakes.filter((m) => {
    const id = `${m.prompt}|${m.yours}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Shared frame for every game: header, Myo, live score, session best, results, review and replay.
export default function GamePage({ game, Game }) {
  const { best, submit, unlock } = useScores();
  const fx = useFx();
  const { muted } = useFxState();
  const { onGameFinish } = useGamesConfig();
  const [run, setRun] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState(null);
  const [scoreKey, setScoreKeyState] = useState(game.keys[0]);
  const keyRef = useRef(scoreKey);
  const runIdRef = useRef(newRunId());
  // A game may register a function returning { score, info } for a run that is left before it ends.
  const exitReportRef = useRef(null);
  const reportedRef = useRef(false);

  const setScoreKey = useCallback((key) => {
    keyRef.current = key;
    setScoreKeyState(key);
  }, []);

  // Runs before the game's own effects so the game can set its intro line.
  useLayoutEffect(() => {
    fx.say('', 'idle');
  }, [run, fx]);

  // Saves a run: session best, achievements and the host's onGameFinish hook (GAME-7 database).
  const record = useCallback(
    (final, info, completed) => {
      reportedRef.current = true;
      const key = info.key || keyRef.current;
      const stars = starsFor(key, final);
      const isNewBest = submit(key, final);
      const earned = game.achievements.filter((a) => a.test({ ...info.stats, stars })).map((a) => a.id);
      const fresh = unlock(game.id, earned);
      const mistakes = dedupe(info.mistakes);
      try {
        const saved = onGameFinish?.({
          runId: info.runId || runIdRef.current,
          gameId: game.id,
          mode: key.includes(':') ? key.split(':')[1] : null,
          scoreKey: key,
          score: final,
          stars,
          completed,
          isNewBest,
          achievements: earned,
          newAchievements: fresh,
          mistakes,
          summary: info.summary ?? '',
          finishedAt: new Date().toISOString(),
        });
        Promise.resolve(saved).catch((err) => console.error('[MuscleGames] onGameFinish failed', err));
      } catch (err) {
        console.error('[MuscleGames] onGameFinish failed', err);
      }
      return { key, stars, isNewBest, mistakes, fresh };
    },
    [game, submit, unlock, onGameFinish]
  );

  // Leaving (← Games, Back, restart) in the middle of a run still saves what was played, if the game supports it.
  const reportExit = useCallback(() => {
    if (reportedRef.current) return;
    const report = exitReportRef.current?.();
    if (report) record(report.score, report.info, false);
  }, [record]);
  const reportExitRef = useRef(reportExit);
  reportExitRef.current = reportExit;
  const mountedRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Deferred so StrictMode's dev-only unmount/remount does not count as leaving.
      setTimeout(() => {
        if (!mountedRef.current) reportExitRef.current();
      }, 0);
    };
  }, []);

  const setExitReport = useCallback((fn) => {
    exitReportRef.current = fn;
  }, []);

  const finish = useCallback(
    (final, info = {}) => {
      const { key, stars, isNewBest, mistakes, fresh } = record(final, info, true);
      fx.sound('win');
      if (stars >= 2) fx.burst(window.innerWidth / 2, window.innerHeight / 3, 48);
      fx.say(CHEERS[stars], stars ? 'happy' : 'sad');
      const unlockedNow = game.achievements.filter((a) => fresh.includes(a.id));
      setResult({
        score: final,
        key,
        stars,
        isNewBest,
        summary: info.summary,
        mistakes,
        fresh: unlockedNow,
      });
    },
    [fx, game, record]
  );

  const restart = () => {
    reportExit();
    reportedRef.current = false;
    exitReportRef.current = null;
    runIdRef.current = newRunId();
    setRun((r) => r + 1);
    setScore(0);
    setResult(null);
    setScoreKey(game.keys[0]);
  };

  return (
    <main className="mg-page mg-page--game">
      <header className="mg-game-bar">
        <Link to=".." className="mg-btn mg-btn--ghost">
          ← Games
        </Link>
        <div className="mg-game-bar__title">
          <span className="mg-lo-tag" title={game.loText}>
            {game.lo}
          </span>
          <h1>{game.title}</h1>
        </div>
        <div className="mg-game-bar__stats">
          <div className="mg-stat">
            <span>Score</span>
            <strong key={score} className="mg-stat__bump">
              {score}
            </strong>
          </div>
          <div className="mg-stat">
            <span>Best</span>
            <strong>{best[scoreKey] ?? '—'}</strong>
          </div>
          <button
            type="button"
            className="mg-btn mg-btn--ghost mg-btn--icon"
            onClick={() => fx.setMuted(!muted)}
            aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
            aria-pressed={!muted}
          >
            {muted ? '🔇' : '🔊'}
          </button>
          <button type="button" className="mg-btn mg-btn--ghost mg-btn--icon" onClick={restart} aria-label="Restart game">
            ↻
          </button>
        </div>
      </header>

      <MascotBar fallback={game.intro} />

      <div className="mg-game-stage">
        <Game
          key={run}
          fresh={run > 0}
          runId={runIdRef.current}
          onScore={setScore}
          onFinish={finish}
          setScoreKey={setScoreKey}
          setExitReport={setExitReport}
        />
      </div>

      {result && (
        <div className="mg-result" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <div className="mg-result__card">
            {result.isNewBest && <span className="mg-badge">🏆 New best!</span>}
            <h2 id="result-title">
              {game.title}
              {game.modeLabels ? ` · ${game.modeLabels[result.key]}` : ''}
            </h2>
            <Stars n={result.stars} size="lg" animate />
            <p className="mg-result__score">{result.score}</p>
            {result.summary && <p className="mg-muted">{result.summary}</p>}
            <p className="mg-muted">
              Best this session: <strong>{best[result.key]}</strong>
            </p>

            {result.fresh.length > 0 && (
              <div className="mg-result__ach">
                <p className="mg-result__label">ปลดล็อกเหรียญใหม่!</p>
                <ul>
                  {result.fresh.map((a) => (
                    <li key={a.id} className="mg-ach-chip mg-ach-chip--new" title={a.desc}>
                      <span aria-hidden="true">{a.icon}</span> {a.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.mistakes.length > 0 && (
              <details className="mg-review" open={result.mistakes.length <= 3}>
                <summary>📖 ทบทวนข้อที่พลาด ({result.mistakes.length})</summary>
                <ul>
                  {result.mistakes.map((m, k) => (
                    <li key={k}>
                      <p className="mg-review__q">{m.prompt}</p>
                      <p className="mg-review__a">
                        <span className="mg-review__bad">✗ {m.yours}</span>
                        <span className="mg-review__good">✓ {m.answer}</span>
                      </p>
                      {m.why && <p className="mg-review__why">{m.why}</p>}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="mg-result__actions">
              <button type="button" className="mg-btn mg-btn--primary" onClick={restart} autoFocus>
                ↻ Play again
              </button>
              <Link to=".." className="mg-btn mg-btn--secondary">
                Back to games
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
