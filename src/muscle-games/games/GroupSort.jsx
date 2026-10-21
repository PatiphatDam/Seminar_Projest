import { useState } from 'react';
import { useScores } from '../scores.jsx';
import { starsFor } from './meta.js';
import { Stars } from '../components/Hud.jsx';
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
    desc: 'Cards race along a belt. Drag or tap them into the Skeletal, Cardiac or Smooth bin before they fall off.',
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
                <span className="mg-mode__belt">
                  {['🫀', '💪', '🧬'].map((c, k) => (
                    <i key={k} style={{ animationDelay: `${-k * 1.2}s` }}>
                      {c}
                    </i>
                  ))}
                </span>
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
            <span className="mg-btn mg-btn--primary mg-btn--block">Start {m.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function GroupSort({ onScore, onFinish, setScoreKey }) {
  const [mode, setMode] = useState(null);
  if (!mode) {
    return (
      <ModeSelect
        onPick={(m) => {
          setScoreKey(`group-sort:${m}`);
          setMode(m);
        }}
      />
    );
  }
  const finish = (score, info) => onFinish(score, { ...info, key: `group-sort:${mode}` });
  return mode === 'memory' ? <Memory onScore={onScore} onFinish={finish} /> : <Conveyor onScore={onScore} onFinish={finish} />;
}
