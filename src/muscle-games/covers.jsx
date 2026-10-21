import { Myo } from './fx/Fx.jsx';
import { jigsawPath } from './fx/jigsaw.jsx';

// Animated cartoon scenes for the hub cards.
// Idle loops run all the time; ".is-preview" on the cover plays a short gameplay preview.

function Balloon({ x, y, color, delay, gold }) {
  return (
    <g className="mg-sc-bob" style={{ animationDelay: `${delay}s` }}>
      <g className={gold ? 'mg-pv-pop' : undefined} style={{ transformOrigin: `${x}px ${y}px` }}>
        <path d={`M${x} ${y + 26} q-5 16 3 34`} stroke="#6b5b95" strokeWidth="1.4" fill="none" />
        <ellipse cx={x} cy={y} rx="20" ry="25" fill={color} />
        <ellipse cx={x - 7} cy={y - 9} rx="5" ry="7" fill="#fff" opacity=".5" />
        <path d={`M${x - 4} ${y + 24} h8 l-4 5z`} fill={color} />
        {gold && <text x={x} y={y + 5} textAnchor="middle" fontSize="13">⭐</text>}
      </g>
    </g>
  );
}

function Cloud({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity=".9">
      <ellipse cx="0" cy="0" rx="22" ry="12" />
      <ellipse cx="18" cy="-6" rx="16" ry="12" />
      <ellipse cx="34" cy="2" rx="16" ry="10" />
    </g>
  );
}

export function BalloonScene() {
  return (
    <svg viewBox="0 0 320 200" className="mg-scene" aria-hidden="true">
      <defs>
        <linearGradient id="bs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset=".6" stopColor="#ddd6fe" />
          <stop offset="1" stopColor="#fce7f3" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bs-sky)" />
      <g className="mg-sc-spin" style={{ transformOrigin: '272px 40px' }}>
        {Array.from({ length: 10 }, (_, k) => (
          <line key={k} x1="272" y1="14" x2="272" y2="6" stroke="#fde68a" strokeWidth="3" strokeLinecap="round" transform={`rotate(${k * 36} 272 40)`} />
        ))}
      </g>
      <circle cx="272" cy="40" r="17" fill="#fde68a" />
      <g className="mg-sc-drift">
        <Cloud x={30} y={42} />
      </g>
      <g className="mg-sc-drift mg-sc-drift--slow">
        <Cloud x={170} y={78} s={0.8} />
      </g>
      <path d="M0 172 Q80 148 160 170 T320 162 V200 H0Z" fill="#8b5cf6" opacity=".45" />
      <path d="M0 186 Q100 166 200 186 T320 180 V200 H0Z" fill="#6d28d9" opacity=".55" />
      <Balloon x={78} y={98} color="#c084fc" delay={0} />
      <Balloon x={128} y={78} color="#f472b6" delay={0.7} />
      <Balloon x={226} y={100} color="#7dd3fc" delay={1.3} />
      <Balloon x={176} y={60} color="#fbbf24" delay={0.3} gold />
      <g className="mg-pv-confetti" style={{ transformOrigin: '176px 60px' }}>
        {Array.from({ length: 10 }, (_, k) => (
          <circle key={k} cx={176 + Math.cos(k * 0.63) * 26} cy={60 + Math.sin(k * 0.63) * 26} r="3" fill={['#fbbf24', '#f472b6', '#8b5cf6', '#34d399'][k % 4]} />
        ))}
      </g>
      <text className="mg-pv-score" x="196" y="42" fontSize="16" fontWeight="800" fill="#b45309">
        +30 ×2
      </text>
      <g className="mg-pv-dart">
        <line x1="160" y1="186" x2="160" y2="166" stroke="#3b0764" strokeWidth="3" />
        <path d="M155 168 l5 -10 5 10z" fill="#3b0764" />
        <path d="M156 188 l4 -6 4 6z" fill="#f472b6" />
      </g>
      <g transform="translate(150 178)">
        <rect x="-4" y="0" width="28" height="18" rx="6" fill="#4c1d95" />
        <circle cx="10" cy="0" r="7" fill="#7c3aed" />
      </g>
      <Myo mood="happy" x="8" y="128" width="64" height="64" className="mg-sc-hop" />
    </svg>
  );
}

function MiniCard({ x, y, face }) {
  return (
    <g>
      <rect x={x} y={y} width="30" height="40" rx="5" fill="#fff" stroke="#c4b5fd" strokeWidth="1.5" />
      {face === 'skeletal' && (
        <g>
          <rect x={x + 5} y={y + 13} width="20" height="12" rx="5" fill="#f9a8d4" />
          {[8, 12, 16, 20, 24].map((d) => (
            <line key={d} x1={x + d} y1={y + 14} x2={x + d} y2={y + 24} stroke="#be185d" strokeWidth="1.4" opacity=".5" />
          ))}
        </g>
      )}
      {face === 'text' && (
        <text x={x + 15} y={y + 24} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4c1d95">
          Skeletal
        </text>
      )}
    </g>
  );
}

function CardBack({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="30" height="40" rx="5" fill="#7c3aed" stroke="#fff" strokeWidth="2" />
      <text x={x + 15} y={y + 26} textAnchor="middle" fontSize="15" fontWeight="800" fill="#ede9fe">
        ?
      </text>
    </g>
  );
}

export function CardTableScene() {
  const backs = [
    [70, 46], [108, 46], [184, 46], [222, 46],
    [70, 96], [146, 96], [184, 96],
  ];
  return (
    <svg viewBox="0 0 320 200" className="mg-scene" aria-hidden="true">
      <defs>
        <linearGradient id="ct-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ede9fe" />
          <stop offset="1" stopColor="#c4b5fd" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#ct-bg)" />
      <ellipse cx="160" cy="92" rx="148" ry="72" fill="#5b21b6" />
      <ellipse cx="160" cy="90" rx="138" ry="64" fill="#7c3aed" />
      <ellipse cx="160" cy="90" rx="120" ry="52" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 5" opacity=".7" />
      {backs.map(([x, y], k) => (
        <g key={k} className="mg-sc-deal" style={{ animationDelay: `${k * 0.25}s` }}>
          <CardBack x={x} y={y} />
        </g>
      ))}
      {[
        [146, 46, 'skeletal'],
        [108, 96, 'text'],
        [222, 96, 'skeletal'],
      ].map(([x, y, face], k) => (
        <g key={k} className={k < 2 ? 'mg-pv-flipcard' : undefined}>
          <g className="mg-pv-back" style={{ transformOrigin: `${x + 15}px ${y + 20}px` }}>
            <CardBack x={x} y={y} />
          </g>
          <g className={k < 2 ? 'mg-pv-face' : 'mg-pv-face-static'} style={{ transformOrigin: `${x + 15}px ${y + 20}px` }}>
            <MiniCard x={x} y={y} face={face} />
          </g>
        </g>
      ))}
      <g className="mg-pv-sparkle">
        {[[150, 40], [180, 70], [100, 92], [140, 140]].map(([x, y], k) => (
          <path key={k} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z`} fill="#fde68a" />
        ))}
      </g>
      <rect x="0" y="170" width="320" height="22" fill="#3b0764" />
      <line x1="0" y1="181" x2="320" y2="181" stroke="#7c3aed" strokeWidth="14" strokeDasharray="10 8" className="mg-sc-belt" />
      {[0, 1, 2].map((k) => (
        <g key={k} className="mg-sc-convey" style={{ animationDelay: `${-k * 2}s` }}>
          <rect x="0" y="158" width="22" height="16" rx="3" fill="#fff" stroke="#f472b6" strokeWidth="1.5" />
        </g>
      ))}
      <Myo mood="wow" x="256" y="116" width="58" height="58" className="mg-sc-hop" />
    </svg>
  );
}

export function MicroscopeScene() {
  const fibers = [];
  for (let r = -3; r <= 3; r++) {
    for (let c = -3; c <= 3; c++) {
      const x = 120 + c * 17 + (r % 2 ? 8 : 0);
      const y = 100 + r * 15;
      if (Math.hypot(x - 120, y - 100) < 58) fibers.push([x, y]);
    }
  }
  const gap = jigsawPath(132, 92, 26, 26, { top: 1, right: -1, bottom: 1, left: -1 }, 7);
  const pieces = [
    { x: 236, y: 44, c: '#a78bfa', e: { top: 1, right: -1, bottom: 1, left: 1 }, d: 0 },
    { x: 262, y: 100, c: '#fbbf24', e: { top: -1, right: 1, bottom: -1, left: 1 }, d: 0.8 },
  ];
  return (
    <svg viewBox="0 0 320 200" className="mg-scene" aria-hidden="true">
      <defs>
        <radialGradient id="ms-bg" cx=".3" cy=".3" r="1">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset="1" stopColor="#c4b5fd" />
        </radialGradient>
        <clipPath id="ms-view">
          <circle cx="120" cy="100" r="66" />
        </clipPath>
      </defs>
      <rect width="320" height="200" fill="url(#ms-bg)" />
      {[[30, 30], [290, 170], [210, 20], [30, 175]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={4 + k} fill="#fff" opacity=".6" className="mg-sc-twinkle" style={{ animationDelay: `${k * 0.5}s` }} />
      ))}
      <circle cx="120" cy="100" r="80" fill="#2e1065" />
      <circle cx="120" cy="100" r="72" fill="#4c1d95" />
      <g clipPath="url(#ms-view)">
        <rect x="40" y="20" width="160" height="160" fill="#fdf2f8" />
        <g className="mg-sc-breathe mg-pv-zoom" style={{ transformOrigin: '145px 105px' }}>
          {fibers.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" fill="#f9a8d4" stroke="#c4b5fd" strokeWidth="2" />
          ))}
          <circle cx="120" cy="100" r="58" fill="none" stroke="#a78bfa" strokeWidth="4" />
          <path d={gap} fill="#fdf2f8" stroke="#7c3aed" strokeWidth="1.6" strokeDasharray="3 3" />
        </g>
        <line x1="120" y1="28" x2="120" y2="172" stroke="#4c1d95" strokeWidth=".8" opacity=".3" />
        <line x1="48" y1="100" x2="192" y2="100" stroke="#4c1d95" strokeWidth=".8" opacity=".3" />
      </g>
      {pieces.map((p, k) => (
        <g key={k} className="mg-sc-bob" style={{ animationDelay: `${p.d}s` }}>
          <path d={jigsawPath(p.x, p.y, 26, 26, p.e, 7)} fill={p.c} stroke="#fff" strokeWidth="2" />
        </g>
      ))}
      <g className="mg-pv-snap">
        <path d={jigsawPath(250, 150, 26, 26, { top: 1, right: -1, bottom: 1, left: -1 }, 7)} fill="#f472b6" stroke="#fff" strokeWidth="2" />
      </g>
      <g className="mg-pv-sparkle">
        {[[132, 84], [168, 120], [150, 74]].map(([x, y], k) => (
          <path key={k} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z`} fill="#fde68a" />
        ))}
      </g>
      <Myo mood="happy" x="196" y="128" width="62" height="62" className="mg-sc-hop" />
      <g className="mg-sc-bob" style={{ animationDelay: '.4s' }}>
        <circle cx="262" cy="150" r="11" fill="#e0e7ff" stroke="#3b0764" strokeWidth="3" opacity=".9" />
        <line x1="270" y1="158" x2="282" y2="170" stroke="#3b0764" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
