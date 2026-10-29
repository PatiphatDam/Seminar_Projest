import { useEffect, useState } from 'react';
import { useScores } from '../scores.jsx';
import { starsFor } from './meta.js';
import { Stars } from '../components/Hud.jsx';
import { ConveyorCoverScene } from '../covers.jsx';
import Memory from './sort/Memory.jsx';
import Conveyor from './sort/Conveyor.jsx';

const MODES = [
  {
    id: 'memory',
    title: 'Picture Match',
    icon: '🖼️',
    desc: 'All pictures are shown face up. Tap a picture, then its name or key feature — 3 rounds to clear.',
    meta: '3 rounds · 18 pairs · 150 s',
  },
  {
    id: 'conveyor',
    title: 'Conveyor Sort',
    icon: '📦',
    desc: 'Crates roll down the factory belt. Press a picture button and the robot arm packs the crate into Skeletal, Cardiac or Smooth.',
    meta: '60 s · 3 lives',
  },
];

function ModeSelect({ onPick }) {
  const { best } = useScores();
  return (
    <div className="mg-modes">
      {MODES.map((m) => {
        const key = `group-sort:${m.id}`;
        return (
          <button key={m.id} type="button" className={`mg-mode mg-mode--${m.id}`} onClick={() => onPick(m.id)}>
            <span className="mg-mode__art" aria-hidden="true">
              {m.id === 'memory' ? (
                <span className="mg-mode__cards">
                  {['🫀', 'Aa', '💪', 'Aa'].map((c, k) => (
                    <i key={k} style={{ animationDelay: `${k * 0.15}s` }}>
                      {c}
                    </i>
                  ))}
                </span>
              ) : (
                <ConveyorCoverScene />
              )}
            </span>
            <span className="mg-mode__title">
              <span aria-hidden="true">{m.icon}</span> {m.title}
            </span>
            <span className="mg-mode__desc">{m.desc}</span>
            <span className="mg-mode__meta">
              <span>{m.meta}</span>
              <Stars n={starsFor(key, best[key])} size="sm" />
            </span>
            <span className="mg-btn mg-btn--primary mg-btn--block">▶ Play {m.title}</span>
          </button>
        );
      })}
    </div>
  );
}

// The mode played last. GamePage remounts the game on ↻ / Play again (`fresh`), which should replay that
// mode straight away instead of going back to the mode picker.
let lastMode = null;

export default function GroupSort({ onScore, onFinish, setScoreKey, fresh }) {
  const [mode, setMode] = useState(() => (fresh ? lastMode : null));
  useEffect(() => {
    if (mode) setScoreKey(`group-sort:${mode}`);
  }, [mode, setScoreKey]);
  if (!mode) {
    return (
      <ModeSelect
        onPick={(m) => {
          lastMode = m;
          setMode(m);
        }}
      />
    );
  }
  const finish = (score, info) => onFinish(score, { ...info, key: `group-sort:${mode}` });
  return mode === 'memory' ? <Memory onScore={onScore} onFinish={finish} /> : <Conveyor onScore={onScore} onFinish={finish} />;
}
