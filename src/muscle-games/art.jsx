// Hand-drawn SVG illustrations used by the games.

const PINK = '#f9a8d4';
const PINK_DARK = '#db2777';
const NUCLEUS = '#5b21b6';
const THICK = '#7c3aed';
const THIN = '#ec4899';

const range = (from, to, step) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};

/* ---------- Group Sort: tissue micrographs (drawn) ---------- */

export function SkeletalArt() {
  return (
    <svg viewBox="0 0 240 150" role="img" aria-label="Long cylindrical striated fibers with many nuclei at the edge">
      <rect width="240" height="150" fill="#fff1f7" />
      {[32, 75, 118].map((y) => (
        <g key={y}>
          <rect x="6" y={y - 18} width="228" height="36" rx="16" fill={PINK} stroke={PINK_DARK} strokeWidth="1.5" />
          {range(16, 224, 7).map((x) => (
            <line key={x} x1={x} y1={y - 16} x2={x} y2={y + 16} stroke="#be185d" strokeWidth="2.6" opacity=".45" />
          ))}
          {[40, 112, 186].map((x, k) => (
            <ellipse key={x} cx={x + (y % 2) * 14} cy={k % 2 ? y + 13 : y - 13} rx="11" ry="4" fill={NUCLEUS} />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function CardiacArt() {
  const disc = (x, y) => (
    <path key={`${x}-${y}`} d={`M${x} ${y - 17} l4 6 -4 6 4 6 -4 6 4 6`} stroke="#4c1d95" strokeWidth="4" fill="none" />
  );
  const stripes = (x1, x2, y) =>
    range(x1 + 6, x2 - 6, 8).map((x) => (
      <line key={`${x}-${y}`} x1={x} y1={y - 14} x2={x} y2={y + 14} stroke="#be185d" strokeWidth="2" opacity=".3" />
    ));
  return (
    <svg viewBox="0 0 240 150" role="img" aria-label="Short branched striated cells joined by dark intercalated discs, one central nucleus">
      <rect width="240" height="150" fill="#fff1f7" />
      <g fill={PINK} stroke={PINK_DARK} strokeWidth="1.5">
        <rect x="4" y="22" width="232" height="34" rx="14" />
        <rect x="4" y="96" width="232" height="34" rx="14" />
        <path d="M98 50 L140 100 L162 100 L120 50 Z" />
      </g>
      {stripes(4, 236, 39)}
      {stripes(4, 236, 113)}
      {disc(78, 39)}
      {disc(176, 39)}
      {disc(60, 113)}
      {disc(196, 113)}
      <ellipse cx="38" cy="39" rx="10" ry="6" fill={NUCLEUS} />
      <ellipse cx="128" cy="39" rx="10" ry="6" fill={NUCLEUS} />
      <ellipse cx="128" cy="113" rx="10" ry="6" fill={NUCLEUS} />
      <ellipse cx="216" cy="39" rx="8" ry="6" fill={NUCLEUS} />
    </svg>
  );
}

export function SmoothArt() {
  const cells = [
    [10, 30, 130], [120, 30, 230], [50, 62, 180], [-30, 94, 100], [100, 94, 220], [40, 126, 170],
  ];
  return (
    <svg viewBox="0 0 240 150" role="img" aria-label="Spindle-shaped cells without striations, one central nucleus each">
      <rect width="240" height="150" fill="#fff1f7" />
      {cells.map(([x1, y, x2]) => {
        const cx = (x1 + x2) / 2;
        return (
          <g key={`${x1}-${y}`}>
            <path d={`M${x1} ${y} Q${cx} ${y - 30} ${x2} ${y} Q${cx} ${y + 30} ${x1} ${y} Z`} fill={PINK} stroke={PINK_DARK} strokeWidth="1.5" />
            <ellipse cx={cx} cy={y} rx="16" ry="4" fill={NUCLEUS} />
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- Diameter: hierarchy pieces ---------- */

export function HierarchyArt({ kind }) {
  const box = { viewBox: '0 0 120 64', 'aria-hidden': true };
  switch (kind) {
    case 'muscle':
      return (
        <svg {...box}>
          <path d="M4 32 h14 C36 4 84 4 102 32 h14" stroke="#a8a29e" strokeWidth="5" fill="none" />
          <path d="M18 32 C36 4 84 4 102 32 C84 60 36 60 18 32 Z" fill="#f472b6" stroke={PINK_DARK} strokeWidth="1.5" />
          <path d="M30 26 C50 18 70 18 90 26 M30 38 C50 46 70 46 90 38" stroke="#be185d" strokeWidth="1" fill="none" opacity=".6" />
        </svg>
      );
    case 'fascicle':
      return (
        <svg {...box}>
          <circle cx="60" cy="32" r="28" fill="#fce7f3" stroke={THICK} strokeWidth="2.5" />
          {[[60, 32], [46, 22], [74, 22], [46, 42], [74, 42], [60, 14], [60, 50], [36, 32], [84, 32]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill={PINK} stroke={PINK_DARK} strokeWidth="1" />
          ))}
        </svg>
      );
    case 'fiber':
      return (
        <svg {...box}>
          <rect x="6" y="14" width="108" height="36" rx="16" fill={PINK} stroke={PINK_DARK} strokeWidth="1.5" />
          {range(14, 106, 6).map((x) => (
            <line key={x} x1={x} y1="16" x2={x} y2="48" stroke="#be185d" strokeWidth="2" opacity=".4" />
          ))}
          <ellipse cx="34" cy="18" rx="9" ry="3.5" fill={NUCLEUS} />
          <ellipse cx="84" cy="46" rx="9" ry="3.5" fill={NUCLEUS} />
        </svg>
      );
    case 'myofibril':
      return (
        <svg {...box}>
          <rect x="4" y="24" width="112" height="16" rx="8" fill="#fbcfe8" />
          {range(8, 100, 18).map((x) => (
            <rect key={x} x={x + 4} y="24" width="10" height="16" fill="#be185d" opacity=".75" />
          ))}
          {range(8, 112, 18).map((x) => (
            <line key={x} x1={x} y1="22" x2={x} y2="42" stroke={NUCLEUS} strokeWidth="1.5" />
          ))}
        </svg>
      );
    case 'sarcomere':
      return (
        <svg {...box}>
          {[18, 32, 46].map((y) => (
            <line key={y} x1="40" y1={y} x2="80" y2={y} stroke={THICK} strokeWidth="5" strokeLinecap="round" />
          ))}
          {[11, 25, 39, 53].map((y) => (
            <g key={y} stroke={THIN} strokeWidth="2">
              <line x1="12" y1={y} x2="52" y2={y} />
              <line x1="68" y1={y} x2="108" y2={y} />
            </g>
          ))}
          <path d="M12 4 l-4 7 8 7 -8 7 8 7 -8 7 8 7 -4 7" stroke={NUCLEUS} strokeWidth="2.5" fill="none" />
          <path d="M108 4 l-4 7 8 7 -8 7 8 7 -8 7 8 7 -4 7" stroke={NUCLEUS} strokeWidth="2.5" fill="none" />
        </svg>
      );
    case 'filaments':
      return (
        <svg {...box}>
          <line x1="10" y1="20" x2="110" y2="20" stroke={THICK} strokeWidth="6" strokeLinecap="round" />
          {range(18, 102, 12).map((x) => (
            <path key={x} d={`M${x} 17 l5 -7`} stroke={THICK} strokeWidth="3" strokeLinecap="round" />
          ))}
          <path
            d={`M10 46 ${range(10, 104, 8).map((x, k) => `Q${x + 4} ${k % 2 ? 40 : 52} ${x + 8} 46`).join(' ')}`}
            stroke={THIN}
            strokeWidth="3"
            fill="none"
          />
        </svg>
      );
    default:
      return null;
  }
}

/* ---------- Diameter: labelled diagrams ---------- */

function Pin({ pin, label, hot, n }) {
  const w = label ? label.length * 9.6 + 26 : 38;
  return (
    <g className={`mg-pin${label ? ' mg-pin--filled' : ''}${hot ? ' mg-pin--hot' : ''}`}>
      {pin.tx !== undefined && (
        <line x1={pin.x} y1={pin.y} x2={pin.tx} y2={pin.ty} stroke="#4c1d95" strokeWidth="1.5" strokeDasharray={label ? '' : '4 3'} />
      )}
      {pin.tx !== undefined && <circle cx={pin.tx} cy={pin.ty} r="3.5" fill="#4c1d95" />}
      <rect x={pin.x - w / 2} y={pin.y - 17} width={w} height="34" rx="17" />
      <text x={pin.x} y={pin.y + 6} textAnchor="middle">
        {label || n}
      </text>
    </g>
  );
}

// contract: 0 = relaxed, 1 = fully contracted. Thin filaments and Z discs slide toward the M line;
// the I band and H zone shrink while the A band (thick filaments) keeps its length.
function sarcomerePins(contract) {
  const s = contract * 45;
  return {
    z: { x: 60 + s, y: 22 },
    m: { x: 300, y: 22 },
    i: { x: (60 + s + 170) / 2, y: 252, bracket: [60 + s, 170, 230] },
    h: { x: 300, y: 252, bracket: [250 + s, 350 - s, 230] },
    a: { x: 300, y: 300, bracket: [170, 430, 278] },
  };
}

export function SarcomereDiagram({ slots, filled, hot, contract = 0 }) {
  const s = contract * 45;
  const pins = sarcomerePins(contract);
  const zig = (x) => `M${x} 44 ${range(56, 212, 12).map((y, k) => `L${x + (k % 2 ? -7 : 7)} ${y}`).join(' ')} L${x} 220`;
  return (
    <svg viewBox="0 0 600 322" className="mg-diagram" role="img" aria-label="Sarcomere diagram with numbered parts">
      <rect x="0" y="0" width="600" height="322" rx="16" fill="#fff" />
      {[70, 120, 170, 210].map((y) => (
        <g key={y} stroke={THIN} strokeWidth="4" strokeLinecap="round">
          <line x1={60 + s} y1={y - 15} x2={250 + s} y2={y - 15} />
          <line x1={350 - s} y1={y - 15} x2={540 - s} y2={y - 15} />
        </g>
      ))}
      {[80, 130, 180].map((y) => (
        <g key={y}>
          <line x1="172" y1={y} x2="428" y2={y} stroke={THICK} strokeWidth="11" strokeLinecap="round" />
          {range(184, 280, 16).map((x) => (
            <path key={x} d={`M${x} ${y - 5} l-6 -9 M${x} ${y + 5} l-6 9`} stroke={THICK} strokeWidth="3.5" strokeLinecap="round" />
          ))}
          {range(320, 416, 16).map((x) => (
            <path key={x} d={`M${x} ${y - 5} l6 -9 M${x} ${y + 5} l6 9`} stroke={THICK} strokeWidth="3.5" strokeLinecap="round" />
          ))}
        </g>
      ))}
      <path d={zig(60 + s)} stroke={NUCLEUS} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <path d={zig(540 - s)} stroke={NUCLEUS} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <line x1="300" y1="44" x2="300" y2="216" stroke="#1e1b4b" strokeWidth="4" />
      {Object.entries(pins).map(([id, p]) =>
        p.bracket ? (
          <path
            key={`b-${id}`}
            d={`M${p.bracket[0]} ${p.bracket[2] - 8} v8 H${p.bracket[1]} v-8`}
            stroke="#4c1d95"
            strokeWidth="2"
            fill="none"
          />
        ) : null
      )}
      {slots.map((sl) => (
        <Pin key={sl.id} pin={pins[sl.id]} n={sl.n} label={filled[sl.id]} hot={hot === sl.id} />
      ))}
    </svg>
  );
}

// Fascicles in the muscle cross-section, each packed with fibers.
const FASCICLES = [
  { x: 205, y: 122, r: 58 },
  { x: 340, y: 102, r: 56 },
  { x: 460, y: 168, r: 54 },
  { x: 270, y: 238, r: 56 },
  { x: 395, y: 252, r: 48 },
];

function fibersIn(f) {
  const out = [];
  const step = 21;
  for (let dy = -f.r; dy <= f.r; dy += step * 0.87) {
    const row = Math.round(dy / (step * 0.87));
    for (let dx = -f.r; dx <= f.r; dx += step) {
      const x = dx + (row % 2 ? step / 2 : 0);
      if (Math.hypot(x, dy) <= f.r - 13) out.push([f.x + x, f.y + dy]);
    }
  }
  return out;
}

const SECTION_PINS = {
  epimysium: { x: 92, y: 30, tx: 147, ty: 64 },
  perimysium: { x: 560, y: 52, tx: 498, ty: 128 },
  endomysium: { x: 70, y: 196, tx: 163, ty: 132 },
  fascicle: { x: 130, y: 300, tx: 248, ty: 262 },
  fiber: { x: 560, y: 300, tx: 395, ty: 252 },
};

export function CrossSectionDiagram({ slots, filled, hot }) {
  return (
    <svg viewBox="0 0 640 340" className="mg-diagram" role="img" aria-label="Cross-section of a skeletal muscle with numbered parts">
      <rect x="0" y="0" width="640" height="340" rx="16" fill="#fff" />
      <ellipse cx="320" cy="174" rx="250" ry="150" fill="#fdf2f8" stroke={THICK} strokeWidth="9" />
      {FASCICLES.map((f) => (
        <g key={f.x}>
          <circle cx={f.x} cy={f.y} r={f.r} fill="#ede9fe" stroke="#a78bfa" strokeWidth="5" />
          {fibersIn(f).map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="8.5" fill={PINK} stroke="#c4b5fd" strokeWidth="2.5" />
          ))}
        </g>
      ))}
      {slots.map((s) => (
        <Pin key={s.id} pin={SECTION_PINS[s.id]} n={s.n} label={filled[s.id]} hot={hot === s.id} />
      ))}
    </svg>
  );
}

/* ---------- Diameter: poster for the picture jigsaw ---------- */

export function MusclePoster() {
  return (
    <g>
      <rect width="300" height="300" fill="#f5f3ff" />
      {range(15, 285, 30).map((v) => (
        <g key={v} stroke="#ddd6fe" strokeWidth=".8">
          <line x1={v} y1="0" x2={v} y2="300" />
          <line x1="0" y1={v} x2="300" y2={v} />
        </g>
      ))}
      <text x="150" y="38" textAnchor="middle" fontSize="23" fontWeight="800" fill="#4c1d95" letterSpacing="1">
        SKELETAL MUSCLE
      </text>
      <text x="150" y="58" textAnchor="middle" fontSize="11" fill="#7c3aed">
        organ → cell → molecule
      </text>
      <g fill="#fde68a" stroke="#b45309" strokeWidth="2">
        <rect x="14" y="112" width="26" height="38" rx="6" />
        <circle cx="20" cy="108" r="9" />
        <circle cx="34" cy="108" r="9" />
        <circle cx="20" cy="154" r="9" />
        <circle cx="34" cy="154" r="9" />
        <rect x="260" y="112" width="26" height="38" rx="6" />
        <circle cx="266" cy="108" r="9" />
        <circle cx="280" cy="108" r="9" />
        <circle cx="266" cy="154" r="9" />
        <circle cx="280" cy="154" r="9" />
      </g>
      <path d="M40 131 H78 M222 131 H260" stroke="#d6d3d1" strokeWidth="9" strokeLinecap="round" />
      <path d="M78 131 C110 76 190 76 222 131 C190 186 110 186 78 131 Z" fill="#f472b6" stroke="#be185d" strokeWidth="2.5" />
      {[-22, -11, 0, 11, 22].map((d) => (
        <path key={d} d={`M92 ${131 + d * 0.6} C125 ${118 + d} 175 ${118 + d} 208 ${131 + d * 0.6}`} stroke="#be185d" strokeWidth="1.4" fill="none" opacity=".45" />
      ))}
      <text x="59" y="122" textAnchor="middle" fontSize="9" fill="#78716c">tendon</text>
      <text x="27" y="88" textAnchor="middle" fontSize="9" fill="#b45309">bone</text>
      <path d="M120 165 L60 205 M150 172 V205 M180 165 L240 205" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5 4" />
      <circle cx="52" cy="248" r="42" fill="#fff" stroke="#8b5cf6" strokeWidth="3" />
      <circle cx="52" cy="250" r="27" fill="#ede9fe" stroke="#a78bfa" strokeWidth="3" />
      {[[52, 250], [40, 243], [64, 243], [40, 257], [64, 257], [52, 236], [52, 264]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill={PINK} stroke={PINK_DARK} strokeWidth="1" />
      ))}
      <text x="52" y="218" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4c1d95">fascicle</text>
      <circle cx="150" cy="248" r="42" fill="#fff" stroke="#8b5cf6" strokeWidth="3" />
      <rect x="116" y="234" width="68" height="28" rx="13" fill={PINK} stroke={PINK_DARK} strokeWidth="1.5" />
      {range(122, 178, 5).map((x) => (
        <line key={x} x1={x} y1="236" x2={x} y2="260" stroke="#be185d" strokeWidth="1.6" opacity=".45" />
      ))}
      <ellipse cx="134" cy="237" rx="7" ry="2.6" fill={NUCLEUS} />
      <ellipse cx="166" cy="259" rx="7" ry="2.6" fill={NUCLEUS} />
      <text x="150" y="218" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4c1d95">fiber</text>
      <circle cx="248" cy="248" r="42" fill="#fff" stroke="#8b5cf6" strokeWidth="3" />
      {[240, 252, 264].map((y) => (
        <line key={y} x1="234" y1={y - 6} x2="262" y2={y - 6} stroke={THICK} strokeWidth="5" strokeLinecap="round" />
      ))}
      {[232, 244, 256, 268].map((y) => (
        <g key={y} stroke={THIN} strokeWidth="2">
          <line x1="218" y1={y - 6} x2="244" y2={y - 6} />
          <line x1="252" y1={y - 6} x2="278" y2={y - 6} />
        </g>
      ))}
      <line x1="218" y1="222" x2="218" y2="266" stroke={NUCLEUS} strokeWidth="3" />
      <line x1="278" y1="222" x2="278" y2="266" stroke={NUCLEUS} strokeWidth="3" />
      <text x="248" y="218" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4c1d95">sarcomere</text>
    </g>
  );
}
