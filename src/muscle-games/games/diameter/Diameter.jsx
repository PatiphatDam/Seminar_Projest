import { useEffect, useRef, useState } from 'react';
import { Armin, pick, useFx } from '../../fx/Fx.jsx';
import { TimerBar, useCountdown } from '../../components/Hud.jsx';
import { scoreOutOf10 } from '../meta.js';
import { LEVELS } from './levels.js';
import ZoomDive, { ZOOM_PLACEMENTS } from './ZoomDive.jsx';
import LabelPuzzle from './LabelPuzzle.jsx';
import PictureJigsaw, { JIGSAW_PLACEMENTS } from './PictureJigsaw.jsx';
import Contraction from './Contraction.jsx';

// Pieces the student places in each stage (given pieces excluded); all 6 stages together make the 10 points.
const placementsIn = (lv) => (lv.type === 'zoom' ? ZOOM_PLACEMENTS : lv.type === 'jigsaw' ? JIGSAW_PLACEMENTS : lv.pieces.length - lv.given.length);
const TOTAL_PLACEMENTS = LEVELS.reduce((n, lv) => n + placementsIn(lv), 0);
// Cleared stages survive leaving the page (← Games) for the rest of the browser session.
const PROGRESS_KEY = 'muscle-games:diameter-progress';

function loadProgress() {
  try {
    const p = JSON.parse(sessionStorage.getItem(PROGRESS_KEY));
    return p && Number.isInteger(p.current) && Array.isArray(p.results) ? p : null;
  } catch {
    return null;
  }
}

function saveProgress(p) {
  try {
    if (p) sessionStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    else sessionStorage.removeItem(PROGRESS_KEY);
  } catch {
    /* storage unavailable: progress lasts until the page is left */
  }
}

// Node positions on the adventure map, in % of the map box (bottom → top).
const NODES = [
  [20, 88],
  [62, 76],
  [82, 56],
  [42, 46],
  [18, 26],
  [60, 12],
];

function AdventureMap({ current, results, resumed, onPlay, onFinishEarly }) {
  const path = NODES.map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${y}`).join(' ');
  return (
    <div className="mg-adv">
      <div className="mg-adv__map">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mg-adv__path" aria-hidden="true">
          <path d={path} className="mg-adv__road" vectorEffect="non-scaling-stroke" />
          <path
            d={NODES.slice(0, current + 1).map(([x, y], k) => `${k ? 'L' : 'M'}${x} ${y}`).join(' ')}
            className="mg-adv__road mg-adv__road--done"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span className="mg-adv__zone mg-adv__zone--a">Organ</span>
        <span className="mg-adv__zone mg-adv__zone--b">Cell</span>
        <span className="mg-adv__zone mg-adv__zone--c">Clinic</span>
        {LEVELS.map((lv, k) => {
          const state = k < current ? 'done' : k === current ? 'now' : 'locked';
          return (
            <div key={lv.id} className={`mg-adv__node mg-adv__node--${state}`} style={{ left: `${NODES[k][0]}%`, top: `${NODES[k][1]}%` }}>
              {state === 'now' && <Armin mood="happy" className="mg-adv__mascot" />}
              <button
                type="button"
                className="mg-adv__btn"
                onClick={() => onPlay(k)}
                disabled={state !== 'now'}
                aria-label={`Stage ${k + 1}: ${lv.title}${state === 'locked' ? ' (locked)' : state === 'done' ? ' (cleared)' : ''}`}
              >
                <span aria-hidden="true">{state === 'locked' ? '🔒' : lv.icon}</span>
              </button>
              <span className="mg-adv__label">
                {k + 1}. {lv.title}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mg-adv__actions">
        {resumed && <p className="mg-adv__resume">✅ Progress saved. Continue from stage {current + 1}.</p>}
        <button type="button" className="mg-btn mg-btn--primary mg-btn--pulse" onClick={() => onPlay(current)}>
          ▶ Play stage {current + 1}: {LEVELS[current].title}
        </button>
        {current > 0 && (
          <button type="button" className="mg-btn mg-btn--secondary" onClick={onFinishEarly}>
            Finish and see score
          </button>
        )}
      </div>
    </div>
  );
}

function LevelRunner({ level, index, onPlaced, onMissed, onDone }) {
  const fx = useFx();
  const [finished, setFinished] = useState(false);
  const [left] = useCountdown(level.time, {
    running: !finished,
    onExpire: () => fx.say('Time’s up! Take your time and finish the stage ⏰', 'sad'),
  });

  useEffect(() => {
    fx.say(level.intro, 'happy');
  }, [fx, level]);

  const done = () => {
    if (finished) return;
    setFinished(true);
    onDone();
  };
  const props = { level, onPlaced, onMissed, onDone: done };

  return (
    <div className="mg-stage">
      <div className="mg-stage__head">
        <span className="mg-stage__icon" aria-hidden="true">
          {level.icon}
        </span>
        <div>
          <span className="mg-stage__step">
            Stage {index + 1}/{LEVELS.length} · {level.zone}
          </span>
          <h2>{level.title}</h2>
        </div>
      </div>
      <TimerBar left={left} total={level.time} />
      {level.type === 'zoom' && <ZoomDive {...props} />}
      {level.type === 'label' && <LabelPuzzle {...props} />}
      {level.type === 'jigsaw' && <PictureJigsaw {...props} />}
    </div>
  );
}

export default function Diameter({ onScore, onFinish, fresh, runId, setExitReport }) {
  const fx = useFx();
  const [saved] = useState(() => {
    if (fresh) saveProgress(null);
    return fresh ? null : loadProgress();
  });
  const st = useRef({
    runId: saved?.runId || runId,
    right: saved?.right ?? 0,
    misses: saved?.misses ?? 0,
    levelMisses: 0,
    mistakes: saved?.mistakes ?? [],
    results: saved?.results ?? [],
    done: false,
  });
  const [phase, setPhase] = useState('map');
  const [current, setCurrent] = useState(Math.min(saved?.current ?? 0, LEVELS.length - 1));
  const [clear, setClear] = useState(null);
  const s = st.current;
  // Out of 10: right drops over every piece of all 6 stages plus every wrong drop (unplayed stages count against you).
  const score = () => scoreOutOf10(s.right, TOTAL_PLACEMENTS + s.misses);

  const report = () => {
    const cleared = s.results.filter(Boolean).length;
    return {
      runId: s.runId,
      summary: `${cleared}/${LEVELS.length} stages cleared · ${s.misses} wrong ${s.misses === 1 ? 'drop' : 'drops'}`,
      mistakes: s.mistakes,
    };
  };

  useEffect(() => {
    if (saved) {
      onScore(score());
      if (saved.current >= LEVELS.length) {
        finish();
        return;
      }
      fx.say(`Welcome back! Carry on from stage ${saved.current + 1} 🗺️`, 'happy');
    } else {
      fx.say('Let’s explore a muscle! Tap the first stage on the map 🗺️', 'happy');
    }
    // Leaving after clearing at least one stage still saves the run.
    setExitReport?.(() => (!s.done && s.results.some(Boolean) ? { score: score(), info: report() } : null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fx]);

  const placed = (pt) => {
    s.right += 1;
    onScore(score());
    fx.sound('snap');
    fx.burst(pt.x, pt.y, 12);
    fx.float(pt.x, pt.y - 24, '✓');
    fx.say(pick(['Click! Perfect fit 🧩', 'Correct!', 'Great!', 'Spot on! 💪']), 'happy');
  };

  const missed = (pt, mistake) => {
    s.misses += 1;
    s.levelMisses += 1;
    if (mistake) s.mistakes.push(mistake);
    onScore(score());
    fx.sound('bad');
    fx.vibrate(120);
    fx.float(pt.x, pt.y - 20, '✗', 'bad');
    fx.say(pick(['Not there yet', 'Have another look 🤔', 'So close!']), 'sad');
  };

  const levelDone = () => {
    const level = LEVELS[current];
    const misses = s.levelMisses;
    s.results[current] = { misses };
    s.levelMisses = 0;
    saveProgress({
      runId: s.runId,
      current: current + 1,
      right: s.right,
      misses: s.misses,
      mistakes: s.mistakes,
      results: s.results,
    });
    fx.sound('win');
    fx.burst(window.innerWidth / 2, window.innerHeight / 3, 40);
    fx.say(misses === 0 ? 'Flawless stage! 🌟' : 'Stage cleared! 🎉', 'wow');
    setClear({ level, misses });
    setPhase('clear');
  };

  function finish() {
    if (s.done) return;
    s.done = true;
    saveProgress(null);
    onFinish(score(), report());
  }

  const goNext = (toMap) => {
    if (current + 1 >= LEVELS.length) {
      finish();
      return;
    }
    setCurrent(current + 1);
    setClear(null);
    setPhase(toMap ? 'map' : 'play');
    if (toMap) fx.say('Next stage unlocked! 🔓', 'happy');
  };

  return (
    <section className="mg-diameter-game">
      <div className="mg-hud mg-hud--slim">
        <div className="mg-hud__row">
          <span className="mg-hud__q">🗺️ Stage {Math.min(current + 1, LEVELS.length)}/{LEVELS.length}</span>
        </div>
      </div>

      {phase === 'map' && (
        <AdventureMap current={current} results={s.results} resumed={Boolean(saved) && current > 0} onPlay={() => setPhase('play')} onFinishEarly={finish} />
      )}

      {phase === 'play' && <LevelRunner key={current} index={current} level={LEVELS[current]} onPlaced={placed} onMissed={missed} onDone={levelDone} />}

      {phase === 'clear' && clear && (
        <div className="mg-clear">
          <p className="mg-clear__eyebrow">Stage {current + 1} cleared!</p>
          <h2>
            {clear.level.icon} {clear.level.title}
          </h2>
          <p className="mg-clear__bonus">
            {clear.misses === 0 ? 'No wrong drops ✨' : `${clear.misses} wrong ${clear.misses === 1 ? 'drop' : 'drops'}`}
          </p>
          <p className="mg-clear__wrap">{clear.level.wrap}</p>
          {clear.level.contraction && <Contraction />}
          <div className="mg-clear__actions">
            <button type="button" className="mg-btn mg-btn--primary" onClick={() => goNext(false)} autoFocus>
              {current + 1 >= LEVELS.length ? '🏁 See final score' : `▶ Next: ${LEVELS[current + 1].title}`}
            </button>
            {current + 1 < LEVELS.length && (
              <button type="button" className="mg-btn mg-btn--secondary" onClick={() => goNext(true)}>
                🗺️ Back to map
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
