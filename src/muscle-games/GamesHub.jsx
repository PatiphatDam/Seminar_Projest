import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GAMES, starsFor } from './games/meta.js';
import { useScores } from './scores.jsx';
import { BalloonScene, CardTableScene, MicroscopeScene } from './covers.jsx';
import { Armin } from './fx/Fx.jsx';
import { Stars } from './components/Hud.jsx';

const SCENES = { 'balloon-pop': BalloonScene, 'group-sort': CardTableScene, diameter: MicroscopeScene };

function GameCard({ g }) {
  const { best, ach } = useScores();
  const [preview, setPreview] = useState(false);
  const Scene = SCENES[g.id];
  const stars = Math.max(0, ...g.keys.map((k) => starsFor(k, best[k])));
  const unlocked = (ach[g.id] || []).length;
  const played = g.keys.filter((k) => best[k] !== undefined);

  return (
    <li
      className="mg-game-card"
      onMouseEnter={() => setPreview(true)}
      onMouseLeave={() => setPreview(false)}
      onFocus={() => setPreview(true)}
      onBlur={() => setPreview(false)}
    >
      <div className={`mg-game-card__cover${preview ? ' mg-is-preview' : ''}`}>
        <Scene />
        {g.badge && <span className={`mg-ribbon mg-ribbon--${g.badge.toLowerCase()}`}>{g.badge === 'HOT' ? '🔥 HOT' : '✨ NEW'}</span>}
        <button
          type="button"
          className="mg-preview-chip"
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
          aria-label={`Preview ${g.title}`}
        >
          {preview ? '■ Stop' : '▶ Preview'}
        </button>
      </div>
      <div className="mg-game-card__body">
        <div className="mg-game-card__tags">
          <span className="mg-lo-tag" title={g.loText}>
            {g.lo}
          </span>
          <span className="mg-chip">⏱ {g.minutes}</span>
          <span className="mg-chip" title="Achievements unlocked this session">
            🏅 {unlocked}/{g.achievements.length}
          </span>
        </div>
        <div className="mg-game-card__titlerow">
          <h2>{g.title}</h2>
          <Stars n={stars} size="sm" />
        </div>
        <p className="mg-game-card__goal">{g.goal}</p>
        <p className="mg-game-card__best">
          {played.length === 0
            ? 'No score yet this session'
            : g.modeLabels
              ? played.map((k) => `${g.modeLabels[k]} ${best[k]}`).join(' · ')
              : `Best this session: ${best[g.keys[0]]}`}
        </p>
        <Link to={g.id} className="mg-btn mg-btn--primary mg-btn--block mg-btn--pulse" aria-label={`Play ${g.title}`}>
          ▶ Play
        </Link>
      </div>
    </li>
  );
}

export default function GamesHub() {
  return (
    <main className="mg-page">
      <header className="mg-hub-hero">
        <Armin mood="happy" className="mg-hub-hero__mascot" />
        <div>
          <p className="mg-eyebrow">Muscular Tissues I</p>
          <h1>Games</h1>
          <p className="mg-lede">
            Hi, I’m <strong>Armin</strong>, your muscle buddy! Pick a game, beat your best score, collect ⭐ and 🏅. Every
            game is open, so play in any order.
          </p>
        </div>
      </header>

      <ul className="mg-games-grid">
        {GAMES.map((g) => (
          <GameCard key={g.id} g={g} />
        ))}
      </ul>
    </main>
  );
}
