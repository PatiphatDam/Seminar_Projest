import { jigsawPath } from './fx/jigsaw.jsx';
import { AirshipShapes, WizardShapes } from './art.jsx';

// Animated cartoon scenes for the hub cards.
// Idle loops run all the time; ".is-preview" on the cover plays a short gameplay preview.

// Balloon Pop: the hooded sage close up, his orb glowing on the left, goblin balloons over the shadow castle.
// Preview: the orb turns red, a fireball flies to the near balloon, it bursts and "+30" floats up.
const BC_SKYLINE =
  'M0 46h320v24H0z M0 40h8v6H0z M16 40h8v6h-8z M300 40h8v6h-8z M284 40h8v6h-8z ' +
  'M20 46V22h20v24z M16 22L30 6l14 16z M60 46V16h30v30z M54 16L75 0l21 16z M120 46V6h40v40z M114 8l26-22 26 22z ' +
  'M178 46v-70h24v70z M172-24l18-32 18 32z M224 46V18h40v28z M218 18l26-20 26 20z M286 46V24h20v22z M282 24l14-16 14 16z';

export function BalloonScene() {
  return (
    <svg viewBox="0 0 320 200" className="mg-scene mg-bc" aria-hidden="true">
      <defs>
        <linearGradient id="bc-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="hsl(245 55% 12%)" />
          <stop offset=".6" stopColor="hsl(262 48% 24%)" />
          <stop offset="1" stopColor="hsl(285 40% 34%)" />
        </linearGradient>
        <radialGradient id="bc-orb">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffd9a8" stopOpacity=".55" />
          <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bc-red">
          <stop offset="0" stopColor="#fff2e0" />
          <stop offset=".3" stopColor="#ff5a3c" stopOpacity=".85" />
          <stop offset="1" stopColor="#e0322b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bc-fire">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset=".45" stopColor="#ffb020" />
          <stop offset="1" stopColor="#e0322b" />
        </radialGradient>
        <linearGradient id="bc-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset=".45" stopColor="#f6c453" />
          <stop offset="1" stopColor="#b9771d" />
        </linearGradient>
        <linearGradient id="bc-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".6" stopColor="#0b0820" stopOpacity="0" />
          <stop offset="1" stopColor="#0b0820" stopOpacity=".6" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#bc-night)" />
      <circle cx="300" cy="22" r="11" fill="#fde68a" opacity=".9" />
      <g fill="#fff">
        <circle cx="40" cy="22" r=".9" />
        <circle cx="170" cy="14" r="1.1" />
        <circle cx="250" cy="44" r=".8" />
        <circle cx="90" cy="60" r=".8" />
      </g>
      <g className="mg-sc-drift">
        <path d="M10 66q8-10 18-4q8-8 18 0q10-3 12 6z" fill="hsl(258 28% 40%)" opacity=".55" />
      </g>
      <path d={BC_SKYLINE} transform="translate(0 140)" fill="hsl(258 26% 20%)" opacity=".9" />
      <g className="mg-pv-pop">
        <g className="mg-sc-bob" style={{ '--color': '#2fb5a3', '--color-dark': '#1f8577' }}>
          <g transform="translate(208 16) scale(0.3167)">
            <AirshipShapes />
          </g>
        </g>
      </g>
      <g className="mg-sc-bob" style={{ animationDelay: '-1s', '--color': '#ec7fb0', '--color-dark': '#bf5285' }}>
        <g transform="translate(262 58) scale(0.25)">
          <AirshipShapes />
        </g>
      </g>
      <g className="mg-pv-confetti" style={{ transformOrigin: '227px 34px' }}>
        {Array.from({ length: 8 }, (_, k) => (
          <circle key={k} cx={227 + Math.cos(k * 0.79) * 14} cy={34 + Math.sin(k * 0.79) * 14} r="2.4" fill={['#ffb020', '#fbf1c7', '#2fb5a3', '#ff5a3c'][k % 4]} />
        ))}
      </g>
      <text className="mg-pv-score" x="244" y="20" fontFamily="'Cinzel Decorative', Georgia, serif" fontWeight="900" fontSize="12" fill="url(#bc-gold)" stroke="#3a2008" strokeWidth=".6">
        +30
      </text>
      {/* warm light from the orb, turning red when he casts */}
      <circle className="mg-bc-glow" cx="130" cy="72" r="70" fill="url(#bc-orb)" opacity=".75" />
      <circle className="mg-bc-redglow" cx="130" cy="72" r="70" fill="url(#bc-red)" />
      {/* the wizard, mirrored so the staff and orb sit on the left, cropped at the chest */}
      <g transform="translate(276 24) scale(-0.9 0.9)">
        <WizardShapes />
      </g>
      <g fill="#ffe1b0">
        <circle className="mg-bc-spark" cx="130" cy="72" r="1.6" style={{ '--dx': '-24px', '--dy': '-30px' }} />
        <circle className="mg-bc-spark" cx="130" cy="72" r="1.2" style={{ '--dx': '22px', '--dy': '-26px', animationDelay: '-0.8s' }} />
        <circle className="mg-bc-spark" cx="130" cy="72" r="1.4" style={{ '--dx': '-30px', '--dy': '8px', animationDelay: '-1.5s' }} />
      </g>
      <circle className="mg-bc-fire" cx="130" cy="72" r="5" fill="url(#bc-fire)" />
      <rect width="320" height="200" fill="url(#bc-fade)" />
      <text x="14" y="172" fontFamily="'Cinzel Decorative', Georgia, serif" fontWeight="900" fontSize="27" fill="url(#bc-gold)" stroke="#2a1606" strokeWidth="1.1" paintOrder="stroke">
        Balloon
      </text>
      <text x="16" y="192" fontFamily="'Cinzel Decorative', Georgia, serif" fontWeight="700" fontSize="15" letterSpacing="6" fill="url(#bc-gold)" stroke="#2a1606" strokeWidth=".9" paintOrder="stroke">
        POP
      </text>
    </svg>
  );
}

function MiniCard({ x, y, face }) {
  return (
    <g>
      <rect x={x} y={y} width="30" height="40" rx="5" fill="#fff" stroke="hsl(165 38% 70%)" strokeWidth="1.5" />
      {face === 'skeletal' && (
        <g>
          <rect x={x + 5} y={y + 13} width="20" height="12" rx="5" fill="#f9a8d4" />
          {[8, 12, 16, 20, 24].map((d) => (
            <line key={d} x1={x + d} y1={y + 14} x2={x + d} y2={y + 24} stroke="#be185d" strokeWidth="1.4" opacity=".5" />
          ))}
        </g>
      )}
      {face === 'text' && (
        <text x={x + 15} y={y + 24} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="hsl(165 50% 20%)">
          Skeletal
        </text>
      )}
    </g>
  );
}

function CardBack({ x, y }) {
  return (
    <g>
      <rect x={x} y={y} width="30" height="40" rx="5" fill="hsl(165 52% 32%)" stroke="#fff" strokeWidth="2" />
      <text x={x + 15} y={y + 26} textAnchor="middle" fontSize="15" fontWeight="800" fill="hsl(165 34% 92%)">
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
          <stop offset="0" stopColor="hsl(165 34% 92%)" />
          <stop offset="1" stopColor="hsl(165 38% 70%)" />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill="url(#ct-bg)" />
      <ellipse cx="160" cy="92" rx="148" ry="72" fill="hsl(165 50% 22%)" />
      <ellipse cx="160" cy="90" rx="138" ry="64" fill="hsl(165 52% 32%)" />
      <ellipse cx="160" cy="90" rx="120" ry="52" fill="none" stroke="hsl(195 55% 66%)" strokeWidth="1.5" strokeDasharray="4 5" opacity=".7" />
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
      <rect x="0" y="170" width="320" height="22" fill="hsl(165 45% 15%)" />
      <line x1="0" y1="181" x2="320" y2="181" stroke="hsl(165 52% 32%)" strokeWidth="14" strokeDasharray="10 8" className="mg-sc-belt" />
      {[0, 1, 2].map((k) => (
        <g key={k} className="mg-sc-convey" style={{ animationDelay: `${-k * 2}s` }}>
          <rect x="0" y="158" width="22" height="16" rx="3" fill="#fff" stroke="#f472b6" strokeWidth="1.5" />
        </g>
      ))}
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
    { x: 236, y: 44, c: 'hsl(195 55% 66%)', e: { top: 1, right: -1, bottom: 1, left: 1 }, d: 0 },
    { x: 262, y: 100, c: '#fbbf24', e: { top: -1, right: 1, bottom: -1, left: 1 }, d: 0.8 },
  ];
  return (
    <svg viewBox="0 0 320 200" className="mg-scene" aria-hidden="true">
      <defs>
        <radialGradient id="ms-bg" cx=".3" cy=".3" r="1">
          <stop offset="0" stopColor="hsl(165 40% 96%)" />
          <stop offset="1" stopColor="hsl(165 38% 70%)" />
        </radialGradient>
        <clipPath id="ms-view">
          <circle cx="120" cy="100" r="66" />
        </clipPath>
      </defs>
      <rect width="320" height="200" fill="url(#ms-bg)" />
      {[[30, 30], [290, 170], [210, 20], [30, 175]].map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={4 + k} fill="#fff" opacity=".6" className="mg-sc-twinkle" style={{ animationDelay: `${k * 0.5}s` }} />
      ))}
      <circle cx="120" cy="100" r="80" fill="hsl(165 40% 12%)" />
      <circle cx="120" cy="100" r="72" fill="hsl(165 50% 20%)" />
      <g clipPath="url(#ms-view)">
        <rect x="40" y="20" width="160" height="160" fill="hsl(38 55% 95%)" />
        <g className="mg-sc-breathe mg-pv-zoom" style={{ transformOrigin: '145px 105px' }}>
          {fibers.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="7.5" fill="#f9a8d4" stroke="hsl(165 38% 70%)" strokeWidth="2" />
          ))}
          <circle cx="120" cy="100" r="58" fill="none" stroke="hsl(195 55% 66%)" strokeWidth="4" />
          <path d={gap} fill="hsl(38 55% 95%)" stroke="hsl(165 52% 32%)" strokeWidth="1.6" strokeDasharray="3 3" />
        </g>
        <line x1="120" y1="28" x2="120" y2="172" stroke="hsl(165 50% 20%)" strokeWidth=".8" opacity=".3" />
        <line x1="48" y1="100" x2="192" y2="100" stroke="hsl(165 50% 20%)" strokeWidth=".8" opacity=".3" />
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
      <g className="mg-sc-bob" style={{ animationDelay: '.4s' }}>
        <circle cx="262" cy="150" r="11" fill="hsl(195 60% 90%)" stroke="hsl(165 45% 15%)" strokeWidth="3" opacity=".9" />
        <line x1="270" y1="158" x2="282" y2="170" stroke="hsl(165 45% 15%)" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// Conveyor Sort mode card: the factory from the game in flat style. A yellow hazard sign carries the title,
// the robot arm holds a crate (bobbing), the belt rollers turn, and a worker at the console watches the
// three tissue buttons on screen.
function CvCrate({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="36" height="26" rx="2" fill="#d9a066" stroke="#a8723d" strokeWidth="1.5" />
      <rect x="14" width="8" height="6" fill="#ecc792" />
      <rect x="5" y="9" width="26" height="13" rx="1.5" fill="#fff8ec" />
      <rect x="8" y="13" width="20" height="1.8" rx="0.9" fill="#a8723d" />
      <rect x="10" y="17" width="16" height="1.8" rx="0.9" fill="#a8723d" />
    </g>
  );
}

function CvTissue({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="22" height="15" rx="2.5" fill="#fff1f7" stroke="#8fb3bb" />
      <rect x="3" y="3" width="16" height="3" rx="1.5" fill="#f08cb4" />
      <rect x="3" y="7.5" width="16" height="3" rx="1.5" fill="#f08cb4" />
      <circle cx="8" cy="4.5" r="0.9" fill="#5b3ea8" />
      <circle cx="14" cy="9" r="0.9" fill="#5b3ea8" />
    </g>
  );
}

export function ConveyorCoverScene() {
  const hazard = [12, 26, 40, 54, 68, 82, 96, 110, 124];
  return (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" className="mg-scene" aria-hidden="true">
      <defs>
        <clipPath id="cv-sign">
          <rect x="10" y="25" width="120" height="25" rx="3" />
        </clipPath>
      </defs>
      <rect width="320" height="150" fill="#8fd0dc" />
      <rect width="320" height="12" fill="#b9e4ec" />
      <rect y="12" width="320" height="6" fill="#3d5560" />
      {[40, 120, 200, 280].map((x) => (
        <g key={x} transform={`translate(${x} 18)`} fill="#fff" opacity="0.28">
          <rect x="-2.5" width="5" height="34" />
          <path d="M-10 34h20l4 7h-28z" />
          <path d="M-14 41h5l-3 12 4 6-3 2-6-8zM14 41h-5l3 12-4 6 3 2 6-8z" />
        </g>
      ))}
      <rect y="118" width="320" height="32" fill="#6aa8b3" />
      <rect y="104" width="214" height="10" rx="5" fill="#2b3d45" />
      <line x1="6" y1="109" x2="208" y2="109" stroke="#e7f3f5" strokeWidth="4" strokeLinecap="round" strokeDasharray="0 18" className="mg-sc-belt" />
      <rect x="20" y="114" width="5" height="36" fill="#2b3d45" />
      <rect x="180" y="114" width="5" height="36" fill="#2b3d45" />
      <CvCrate x={12} y={78} />
      <CvCrate x={78} y={78} />

      <rect x="154" y="18" width="20" height="8" rx="2" fill="#2b3d45" />
      <g className="mg-sc-bob">
        <rect x="161" y="26" width="6" height="22" fill="#2b3d45" />
        <g stroke="#8fb3bb" strokeWidth="1.2">
          {[30, 34, 38, 42, 46].map((y) => (
            <line key={y} x1="161" y1={y} x2="167" y2={y} />
          ))}
        </g>
        <path d="M150 48h28l3 7h-34z" fill="#2b3d45" />
        <rect x="142" y="54" width="44" height="5" rx="2.5" fill="#3d5560" />
        <path d="M143 58l-2 22 4 1 3-20zM185 58l2 22-4 1-3-20z" fill="#2b3d45" />
        <CvCrate x={146} y={64} />
      </g>

      <line x1="22" y1="18" x2="22" y2="25" stroke="#2b3d45" strokeWidth="2" />
      <line x1="118" y1="18" x2="118" y2="25" stroke="#2b3d45" strokeWidth="2" />
      <rect x="10" y="25" width="120" height="25" rx="3" fill="#facc15" stroke="#1d2a30" strokeWidth="1.8" />
      <g clipPath="url(#cv-sign)">
        <rect x="10" y="44" width="120" height="6" fill="#1d2a30" />
        {hazard.map((x) => (
          <path key={x} d={`M${x} 44l6 6h5l-6-6z`} fill="#facc15" />
        ))}
      </g>
      <text x="70" y="40" textAnchor="middle" fontFamily="Bungee, 'Nunito Sans Variable', sans-serif" fontSize="11.5" fill="#1d2a30">
        CONVEYOR SORT
      </text>

      <rect x="198" y="100" width="122" height="50" rx="5" fill="#3d5560" />
      <rect x="198" y="100" width="122" height="7" rx="3" fill="#2b3d45" />
      <rect x="202" y="40" width="84" height="52" rx="4" fill="#2b3d45" />
      <rect x="207" y="45" width="74" height="42" rx="2" fill="#e9f4f6" />
      <CvTissue x={211} y={49} />
      <CvTissue x={235} y={49} />
      <CvTissue x={259} y={49} />
      <rect x="211" y="70" width="66" height="3" rx="1.5" fill="#8fb3bb" />
      <rect x="211" y="76" width="40" height="3" rx="1.5" fill="#8fb3bb" />
      <rect x="259" y="76" width="22" height="7" rx="2" fill="#1d9e75" />
      <rect x="238" y="92" width="10" height="8" fill="#2b3d45" />
      <rect x="222" y="95" width="40" height="5" rx="2" fill="#55707c" />

      {/* Worker seen from behind: hard hat, orange safety vest, reaching for the keyboard. */}
      <g transform="translate(294 150)">
        <path d="M-24 0V-30C-24-46-14-52 0-52S24-46 24-30V0Z" fill="#2f4a6b" />
        <path d="M-20 0V-31C-20-43-12-48-4-48H4C12-48 20-43 20-31V0Z" fill="#f59e0b" />
        <rect x="-20" y="-26" width="40" height="4" fill="#fde7a8" />
        <rect x="-20" y="-14" width="40" height="4" fill="#fde7a8" />
        <rect x="-3" y="-48" width="6" height="48" fill="#e08a00" opacity="0.5" />
        <path d="M-20-42C-30-46-38-50-44-52" stroke="#2f4a6b" strokeWidth="10" strokeLinecap="round" fill="none" />
        <circle cx="-48" cy="-53" r="4" fill="#c98a63" />
        <rect x="-6" y="-58" width="12" height="10" rx="3" fill="#c98a63" />
        <ellipse cx="-12" cy="-66" rx="2.6" ry="4" fill="#c98a63" />
        <ellipse cx="12" cy="-66" rx="2.6" ry="4" fill="#c98a63" />
        <circle cy="-67" r="12" fill="#3b2a20" />
        <path d="M-14-70C-14-86 14-86 14-70Z" fill="#facc15" />
        <rect x="-17" y="-71" width="34" height="5" rx="2.5" fill="#eab308" />
        <rect x="-2.5" y="-83" width="5" height="12" rx="2" fill="#eab308" />
      </g>
    </svg>
  );
}

// Picture Match cover: a noir detective in a fedora, seen from behind with his pipe, studies an evidence wall of muscle photos tied
// with red string, lit by a beam through the window blinds.
function NoirPhoto({ x, y, w, h, r, children }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <rect width={w} height={h} fill="#8d7f6b" />
      <rect x="2.5" y="2.5" width={w - 5} height={h - 9} fill="#2b2520" />
      <g transform="translate(2.5 2.5)" stroke="#a8977d" fill="none" strokeWidth="1">
        {children}
      </g>
    </g>
  );
}

export function DetectiveCoverScene() {
  const pins = { a: [41, 25], b: [131, 15], c: [256, 72], d: [24, 61], q: [84, 62], n: [247, 38] };
  const strings = [['a', 'b'], ['a', 'd'], ['b', 'c'], ['d', 'q'], ['q', 'b'], ['c', 'n']];
  return (
    <svg viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" className="mg-scene" aria-hidden="true">
      <defs>
        <linearGradient id="nr-beam" x1="1" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#efe3cc" stopOpacity="0.42" />
          <stop offset="1" stopColor="#efe3cc" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="nr-halo">
          <stop offset="0" stopColor="#3a322b" stopOpacity="0.7" />
          <stop offset="1" stopColor="#3a322b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nr-vignette" cx="0.55" cy="0.45" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </radialGradient>
      </defs>
      <rect width="320" height="150" fill="#0f0d0c" />
      <rect width="320" height="150" fill="#1c1815" opacity="0.6" />

      {/* window blinds and the light falling through them */}
      <rect x="266" y="0" width="50" height="64" fill="#050404" />
      {[2, 9, 16, 23, 30, 37, 44, 51].map((y) => (
        <rect key={y} x="269" y={y} width="44" height="4.2" fill="#e9dcc4" />
      ))}
      <g className="mg-sc-flicker">
        <path d="M268 6 L314 4 L196 150 L112 150 Z" fill="url(#nr-beam)" />
        <path d="M282 5 L289 5 L166 150 L156 150 Z M298 4 L304 4 L186 150 L177 150 Z" fill="#0f0d0c" opacity="0.55" />
      </g>

      {/* evidence wall */}
      <NoirPhoto x={22} y={24} w={40} h={32} r={-8}>
        <rect x="4" y="6" width="27" height="10" rx="5" />
        {[8, 12, 16, 20, 24, 28].map((x) => (
          <line key={x} x1={x} y1="7" x2={x} y2="15" />
        ))}
      </NoirPhoto>
      <NoirPhoto x={112} y={14} w={38} h={30} r={5}>
        <path d="M3 8 Q10 4 17 8 Q10 12 3 8Z M15 13 Q22 9 30 13 Q22 17 15 13Z M5 17 Q12 13 19 17 Q12 21 5 17Z" />
      </NoirPhoto>
      <NoirPhoto x={240} y={72} w={34} h={40} r={4}>
        <circle cx="14.5" cy="15" r="11" />
        <circle cx="10" cy="12" r="3" />
        <circle cx="18" cy="11" r="3" />
        <circle cx="14" cy="18" r="3" />
        <circle cx="20" cy="18" r="2.5" />
      </NoirPhoto>
      <g transform="translate(12 61) rotate(-6)">
        <rect width="26" height="32" fill="#968874" />
        <g fill="none" stroke="#2b2520" strokeWidth="0.9">
          {[3, 5.5, 8, 10.5].map((r) => (
            <ellipse key={r} cx="13" cy="16" rx={r} ry={r * 1.3} />
          ))}
        </g>
      </g>
      <g transform="translate(71 62) rotate(3)">
        <rect width="26" height="30" fill="#9c8f7c" />
        <text x="13" y="23" textAnchor="middle" fontFamily="'Playfair Display Variable', Georgia, serif" fontWeight="700" fontSize="20" fill="#1a1613">
          ?
        </text>
      </g>
      <g transform="translate(235 38) rotate(-4)">
        <rect width="24" height="26" fill="#9c8f7c" />
        <path d="M4 7h15M4 12h12M4 17h14M4 22h8" stroke="#2b2520" strokeWidth="1" strokeDasharray="3 1.5" />
      </g>
      <g stroke="#c0262d" strokeWidth="0.9">
        {strings.map(([p, q]) => (
          <line key={p + q} x1={pins[p][0]} y1={pins[p][1]} x2={pins[q][0]} y2={pins[q][1]} />
        ))}
      </g>
      {Object.entries(pins).map(([k, [x, y]]) => (
        <circle key={k} cx={x} cy={y} r="1.9" fill="#e03a3a" />
      ))}

      {/* desk, papers and a coffee mug */}
      <rect y="136" width="320" height="14" fill="#0a0908" />
      <path d="M150 140 L196 137 L204 141 L158 144 Z" fill="#cbbda5" opacity="0.55" />
      <rect x="282" y="123" width="15" height="14" rx="1.5" fill="#1d1916" />
      <path d="M297 126 a4 4 0 0 1 0 8" stroke="#1d1916" strokeWidth="2.2" fill="none" />

      {/* the detective, from behind, drawn flat and boxy like the Conveyor Sort worker: a squared coat with a
          shoulder cape, a noir fedora, and a bent pipe hanging on the right with smoke curling up. Red rim light on the left. */}
      {/* view-box: .mg-scene * uses fill-box, which would move this transform off the figure's own corner */}
      <g transform="translate(158 152) scale(1.45)" style={{ transformBox: 'view-box' }}>
        <ellipse cy="-52" rx="50" ry="48" fill="url(#nr-halo)" />
        <g fill="#050404">
          <path d="M-28 0 V-32 C-28 -42 -21 -47 -11 -48 H11 C21 -47 28 -42 28 -32 V0 Z" />
          <rect x="-5" y="-56" width="10" height="9" />
          <circle cy="-64" r="10" />
        </g>
        <path d="M-28 -24 V-32 C-28 -42 -21 -47 -11 -48 H11 C21 -47 28 -42 28 -32 V-24 Z" fill="#0e0c0b" />
        <path d="M-8 -48 L-11 -41 L0 -45 L11 -41 L8 -48 Z" fill="#141110" />
        <path d="M-10 0 V-22 M10 0 V-22" stroke="#171310" strokeWidth="0.8" />
        {/* pipe: stem from the mouth, bowl with a glowing ember */}
        <path d="M7 -58 C10 -55 13 -53 16 -53" stroke="#050404" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M15 -52 L14.5 -59 L21 -59 L20.5 -52 C19.5 -49.5 16 -49.5 15 -52 Z" fill="#050404" />
        <path d="M14.5 -59 L21 -59" stroke="#efe3cc" strokeWidth="0.6" opacity="0.6" />
        <ellipse cx="17.8" cy="-59.3" rx="2.4" ry="0.8" fill="#e0612a" opacity="0.85" />
        <g stroke="#efe3cc" strokeWidth="1.1" strokeLinecap="round" fill="none">
          <path className="mg-sc-smoke" d="M18 -61 C14 -67 22 -71 18 -77 C14 -83 21 -87 19 -93" />
          <path className="mg-sc-smoke mg-sc-smoke--late" d="M19 -62 C23 -68 16 -73 20 -79 C24 -85 18 -89 21 -95" />
        </g>
        {/* rim light */}
        <path d="M-28 -27 V-32 C-28 -42 -21 -47 -11 -48" stroke="#c0262d" strokeWidth="0.55" fill="none" />
        <path d="M-9.4 -60.6 A10 10 0 0 1 -9.4 -67.4" stroke="#c0262d" strokeWidth="0.45" fill="none" />
        <path d="M28 -2 V-32 C28 -42 21 -47 11 -48" stroke="#efe3cc" strokeWidth="0.4" fill="none" opacity="0.35" />
      </g>
      {/* fedora seen from behind: wide brim, pinched crown with a dark red band, red rim light on the left */}
      <g transform="translate(158 152) scale(1.45)" style={{ transformBox: 'view-box' }}>
        <g fill="#050404">
          <path d="M-19 -72 C-14 -77 14 -78 20 -72 C15 -68.5 -14 -68 -19 -72 Z" />
          <path d="M-10 -74 C-11 -83 -6 -87 1 -87 C8 -87 12 -83 11 -75 Z" />
        </g>
        <path d="M-10.3 -76.5 C-4 -78 5 -78 11.2 -77.5" stroke="#3a1416" strokeWidth="1.6" fill="none" />
        <path d="M-5 -86 C-2 -84 3 -84 6 -86" stroke="#1a1513" strokeWidth="0.5" fill="none" />
        <path d="M-10 -74 C-11 -83 -6 -87 1 -87" stroke="#c0262d" strokeWidth="0.5" fill="none" />
        <path d="M-19 -72 C-17 -74 -14 -75.4 -10.5 -76.2" stroke="#c0262d" strokeWidth="0.5" fill="none" />
        <path d="M11 -75 C12 -83 8 -87 1 -87" stroke="#efe3cc" strokeWidth="0.4" fill="none" opacity="0.45" />
      </g>

      <rect width="320" height="150" fill="url(#nr-vignette)" />

      {/* title */}
      <g transform="translate(14 98) rotate(-4)">
        <rect width="54" height="13" fill="none" stroke="#c0262d" strokeWidth="1.4" />
        <text x="27" y="9.6" textAnchor="middle" fontFamily="'Nunito Sans Variable', sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="1.2" fill="#c0262d">
          CASE FILE
        </text>
      </g>
      <text x="14" y="128" fontFamily="'Playfair Display Variable', Georgia, serif" fontWeight="800" fontSize="16" letterSpacing="1.2" fill="#efe3cc">
        PICTURE MATCH
      </text>
    </svg>
  );
}
