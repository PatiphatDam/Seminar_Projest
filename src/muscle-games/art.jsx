// Hand-drawn SVG illustrations used by the games.
import { useId } from 'react';

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

/* ---------- Balloon Pop: the hooded sage wizard ---------- */

const ROBE = '#2f5fd6';
const ROBE_SHADE = '#1d3f9e';
const ROBE_DEEP = '#122a6b';
const TRIM = '#9cbcff';
const STAFF = '#8a5a32';
const STAFF_DARK = '#6b4325';
const STAFF_LIGHT = '#c48a55';
const ORB = '#ffffff';

// The staff arm (.mg-wizard__arm) pivots on the hand; fireballs start from .mg-wizard__orb.
// WizardShapes is the drawing on its own (200x260 units), for placing inside another SVG such as a cover.
export function WizardShapes() {
  return (
    <>
      <path d="M60 252 L78 124 Q108 104 138 124 L156 252 Z" fill={ROBE} />
      <path d="M60 252 L78 124 Q90 116 100 114 L88 252 Z" fill={ROBE_SHADE} />
      <path d="M76 176 H140 V184 H76 Z M96 184 L102 184 L98 212 L92 210 Z" fill={TRIM} />
      <path d="M74 132 Q70 74 108 54 Q146 74 142 132 Q108 114 74 132 Z M108 54 L128 38 L122 62 Z" fill={ROBE_SHADE} />
      <path d="M90 124 Q90 88 108 82 Q126 88 126 124 Z" fill={ROBE_DEEP} />
      <path d="M94 114 H122 L115 160 L108 182 L101 160 Z" fill="#f3f5ff" />
      <rect x="97" y="99" width="7" height="3.4" rx="1.5" fill={ORB} />
      <rect x="112" y="99" width="7" height="3.4" rx="1.5" fill={ORB} />
      <g className="mg-wizard__arm">
        <circle className="mg-wizard__glow" cx="161" cy="54" r="26" fill={ORB} opacity=".18" />
        <path d="M156 100 H165 Q163 170 164 236 Q165 246 160 252 Q155 246 156 236 Q157 170 156 100 Z" fill={STAFF} />
        <circle className="mg-wizard__orb" cx="161" cy="54" r="17" fill={ORB} />
        <ellipse cx="155" cy="46" rx="6" ry="4" transform="rotate(-30 155 46)" fill={TRIM} opacity=".65" />
        <path d="M159 98 Q141 86 141 66 Q141 52 148 44 Q147 60 152 72 Q156 82 164 90 Z" fill={STAFF} />
        <path d="M157 102 Q172 92 179 74 Q184 56 175 38 Q188 48 188 68 Q186 90 165 104 Z" fill={STAFF_DARK} />
        <path d="M155 104 Q160 92 172 86 Q166 96 166 104 Z" fill={STAFF} />
        <rect x="153.5" y="104" width="14" height="5" rx="2.5" fill={STAFF_LIGHT} />
        <rect x="155" y="112" width="11" height="3.5" rx="1.75" fill={STAFF_LIGHT} />
        <path d="M126 150 L154 160 L154 182 L130 176 Z" fill={ROBE_SHADE} />
        <rect x="153" y="164" width="14" height="13" rx="2" fill="#f0d3b8" />
      </g>
    </>
  );
}

export function WizardArt(props) {
  return (
    <svg viewBox="0 0 200 260" aria-hidden="true" {...props}>
      <WizardShapes />
    </svg>
  );
}

/* ---------- Balloon Pop: castle backdrop (shadow silhouette) ---------- */

// Foliage outline: an ellipse edged with small, slightly uneven scallops (seeded, so it never changes).
function foliage(cx, cy, rx, ry, n, seed) {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rand() * 0.25;
    const k = 0.9 + rand() * 0.18;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % n];
    const r = (Math.hypot(q[0] - p[0], q[1] - p[1]) / 2) * (1.15 + rand() * 0.3);
    d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  });
  return `${d}Z`;
}

// Trees stand behind the buildings; only their crowns peek out.
const TREES = [
  foliage(274, 100, 22, 13, 13, 3),
  foliage(358, 128, 15, 20, 11, 11),
  foliage(386, 176, 13, 16, 11, 23),
  foliage(212, 198, 15, 9, 10, 29),
];
const TREE_LIT = foliage(268, 95, 12, 7, 9, 7);

// Everything stands on one ground line, y = 250, laid in the same courses as the town in front of it.
const BD_ROCK = 'M174 250 H400 V290 H180 L178 270 Z M0 250 H70 L73 270 L71 290 H0 Z';
const BD_GAP = 'M66 250 H180 V290 H66 Z'; // closes the ground between the two ledges
const BD_MASONRY = [
  'M290 104 H298 V140 H290 Z', // chimney (the roof covers its foot)
  'M188 212 H232 V250 H188 Z M188 204 H196 V212 H188 Z M200 204 H208 V212 H200 Z M212 204 H220 V212 H212 Z M224 204 H232 V212 H224 Z', // gatehouse
  'M232 226 H362 V250 H232 Z M234 220 H240 V226 H234 Z M306 220 H312 V226 H306 Z M352 220 H358 V226 H352 Z', // curtain wall
  'M244 190 H304 V250 H244 Z', // hall, stone ground floor
  'M316 74 H350 V250 H316 Z', // tall tower
  'M362 196 H386 V250 H362 Z', // small tower
].join(' ');
const BD_ROOFS = 'M234 150 L274 110 L314 150 Z M306 74 L333 18 L360 74 Z M356 196 L374 162 L392 196 Z';
// Windows sit symmetric about each building's centre line.
const BD_WINDOWS = [
  'M252 214 V206 Q255 202 258 206 V214 Z M290 214 V206 Q293 202 296 206 V214 Z', // hall ground floor
  'M255 156 h6 v9 h-6 Z M270 156 h8 v9 h-8 Z M287 156 h6 v9 h-6 Z M255 175 h6 v9 h-6 Z M270 175 h8 v9 h-8 Z M287 175 h6 v9 h-6 Z', // hall upper floor
  'M274 130 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0', // gable roundel
  'M330 90 V83 Q333 79 336 83 V90 Z M330 128 V120 Q333 116 336 120 V128 Z M330 160 V152 Q333 148 336 152 V160 Z M330 192 V184 Q333 180 336 184 V192 Z', // tall tower
  'M371 216 V209 Q374 205 377 209 V216 Z', // small tower
  'M207 220 V214 Q210 211 213 214 V220 Z', // gatehouse
].join(' ');
const BD_DOORS = [
  'M202 250 V234 Q210 224 218 234 V250 Z M267 250 V232 Q274 224 281 232 V250 Z',
  'M195 219 h3 v10 h-3 Z M222 219 h3 v10 h-3 Z M331.5 214 h3 v10 h-3 Z M372.5 232 h3 v9 h-3 Z',
].join(' ');
const BD_MOSS = [
  'M236 150 Q240 145 246 148 Q250 144 256 149 L258 150 Z M290 150 Q296 144 302 148 Q307 145 312 150 Z',
  'M308 74 Q312 68 318 72 Q322 67 328 73 L330 74 Z M342 74 Q348 68 354 72 L358 74 Z',
  'M358 196 Q362 190 368 194 L370 196 Z',
  'M188 204 Q192 200 196 204 Z M224 204 Q228 200 232 204 Z',
  'M244 250 V245 Q250 241 256 246 Q262 242 268 247 V250 Z M316 250 V244 Q322 239 330 245 L332 250 Z M362 250 V246 Q368 242 374 247 V250 Z',
].join(' ');
const MORTAR = 'rgba(255, 255, 255, 0.09)';

// The town that runs out to both edges behind the castle: one 320×110 tile repeated sideways.
// Its ground line (y = 70) and scale match the castle's (y = 250 of 290), so the two sit on one ground.
const TOWN_COLORS = {
  near: { body: '#372d4d', roof: '#2e2640', rock: '#2b243f', window: '#18112a', tree: '#1d1a2e', moss: 'rgba(55, 73, 64, 0.75)' },
  far: { body: '#664f7c', roof: '#5f4a74', rock: '#5c4870', window: '#4d3a5f', tree: '#4f4166', moss: 'rgba(92, 103, 122, 0.6)' },
};
// Each tree stands in a gap between buildings. The one in the gap across the tile seam is drawn at both
// edges (x = 322 and x = 2, one tile apart), so its two halves meet as one whole tree when the tile repeats.
const SEAM_TREE = (cx) => foliage(cx, 20, 14, 13, 11, 31);
const TOWN_TREES = [foliage(84, 22, 16, 12, 11, 5), foliage(214, 12, 14, 12, 10, 9), foliage(137, 18, 12, 12, 9, 19), SEAM_TREE(322), SEAM_TREE(2)];

// Moss on every building: along each roof's eaves, a patch on each roof, the ruined tower's broken top,
// a few merlons and the foot of the town wall, always sitting on a surface rather than hanging down.
const TOWN_MOSS = [
  'M14 18q4-5 9-1q4-4 9 1z M44 18q4-5 9-1q4-3 9 1z M30 9q4-4 8 0q-3 4-7 3z',
  'M98 24q3-4 7-1q3-3 7 1z M116 24q3-4 7 0z M108 13q3-3 6 0q-2 3-5 2z',
  'M146 14q4-5 9-1q4-4 9 1z M184 14q4-5 9-1q5-3 11 1z M166 6q4-3 8 0q-3 3-7 2z',
  'M230 9q3-4 6-1q3-3 6 1v2h-12z M244 8q3-3 6 0q2-2 2 1v2h-8z',
  'M264 22q4-5 9-1q4-4 9 1z M292 22q4-5 9-1q4-3 8 1z M282 12q4-4 8 0q-3 3-7 2z',
  'M20 38q4-3 8 0z M68 38q4-3 8 0z M164 38q4-3 8 0z M260 38q4-3 8 0z',
  'M30 70v-4q6-4 12 0q6-3 10 1v3z M120 70v-3q6-4 12 0v3z M210 70v-4q5-4 11 0q5-3 9 1v3z M290 70v-3q5-3 10 0v3z',
].join(' ');

function townTile({ body, roof, rock, window, tree, moss }) {
  const merlons = Array.from({ length: 20 }, (_, i) => `M${4 + i * 16} 38h8v6h-8z`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="110" viewBox="0 0 320 110">
<defs><pattern id="b" width="16" height="7" patternUnits="userSpaceOnUse"><path d="M0 .5H16M0 4H16M.5 .5V4M8.5 4V7" stroke="${MORTAR}" fill="none"/></pattern>
<pattern id="r" width="32" height="14" patternUnits="userSpaceOnUse"><path d="M0 .5H32M0 7.5H32M.5 .5V7.5M16.5 7.5V14" stroke="${MORTAR}" fill="none"/></pattern></defs>
<g fill="${tree}"><path d="M82 70V24M212 70V14M137 70V20M322 70V22M2 70V22" stroke="${tree}" stroke-width="4"/>${TOWN_TREES.map((d) => `<path d="${d}"/>`).join('')}</g>
<path fill="${body}" d="M18 18h40v52H18zM100 24h24v46h-24zM150 14h52v56h-52zM230 8l4 -4l4 5l5 -6l4 4l5 -3v66h-22zM268 22h38v48h-38z"/>
<path fill="url(#b)" d="M18 18h40v52H18zM100 24h24v46h-24zM150 14h52v56h-52zM230 8l4 -4l4 5l5 -6l4 4l5 -3v66h-22zM268 22h38v48h-38z"/>
<path fill="${roof}" d="M12 18L38 0L64 18zM96 24L112 -2L128 24zM144 14L160 2H192L208 14zM262 22L287 4L312 22z"/>
<path fill="${window}" d="M24 26h6v8h-6zM46 26h6v8h-6zM109 32v-5q3-3 6 0v5zM158 20h7v8h-7zM187 20h7v8h-7zM172 20h8v8h-8zM239 16h3v9h-3zM239 32h3v9h-3zM276 30h6v8h-6zM292 30h6v8h-6z"/>
<path fill="${body}" d="M0 44h320v26H0z${merlons}"/><path fill="url(#b)" d="M0 44h320v26H0z"/>
<path fill="${rock}" d="M0 70h320v40H0z"/><path fill="url(#r)" d="M0 70h320v40H0z"/>
<path fill="${moss}" d="${TOWN_MOSS}"/>
</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const TOWN_TILES = { near: townTile(TOWN_COLORS.near), far: townTile(TOWN_COLORS.far) };

export function TownArt({ layer }) {
  return <div className={`mg-town mg-town--${layer}`} style={{ backgroundImage: TOWN_TILES[layer] }} aria-hidden="true" />;
}

export function CastleArt({ layer }) {
  const id = (name) => `mg-bd-${layer}-${name}`;
  return (
    <svg className={`mg-backdrop mg-backdrop--${layer}`} viewBox="0 0 400 290" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs>
        {/* bricks share the town's size and phase (its tile starts at y = 180, x offset 8), so walls that meet line up */}
        <pattern id={id('bricks')} x="8" y="180" width="16" height="7" patternUnits="userSpaceOnUse">
          <path d="M0 .5 H16 M0 4 H16 M.5 .5 V4 M8.5 4 V7" stroke={MORTAR} fill="none" />
        </pattern>
        <pattern id={id('blocks')} x="8" y="250" width="32" height="14" patternUnits="userSpaceOnUse">
          <path d="M0 .5 H32 M0 7.5 H32 M.5 .5 V7.5 M16.5 7.5 V14" stroke={MORTAR} fill="none" />
        </pattern>
        <pattern id={id('shingles')} width="7" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 4.5 Q1.75 1.5 3.5 4.5 Q5.25 1.5 7 4.5" stroke={MORTAR} fill="none" />
        </pattern>
      </defs>
      <path className="mg-bd-trunk" d="M274 250 V104 M356 250 V128 M386 250 V176 M212 250 V196" />
      {TREES.map((d) => (
        <path key={d} className="mg-bd-tree" d={d} />
      ))}
      <path className="mg-bd-tree-lit" d={TREE_LIT} />
      {/* ground laid as castle blocks, same colour and courses as the town's, so the two run on as one */}
      <path className="mg-bd-rock" d={BD_ROCK} />
      <path d={BD_ROCK} fill={`url(#${id('blocks')})`} />
      <path className="mg-bd-rock" d={BD_GAP} />
      <path d={BD_GAP} fill={`url(#${id('blocks')})`} />
      <path className="mg-bd-body" d={BD_MASONRY} />
      <path d={BD_MASONRY} fill={`url(#${id('bricks')})`} />
      {/* hall: jettied timber upper floor on brackets */}
      <path className="mg-bd-body" d="M240 150 H308 V190 H240 Z M240 190 H244 V196 Z M308 190 H304 V196 Z" />
      <path className="mg-bd-timber" d="M240 151 H308 M240 170 H308 M240 189 H308 M252 151 V189 M264 151 V189 M284 151 V189 M296 151 V189 M240 151 L252 189 M252 151 L240 189 M296 151 L308 189 M308 151 L296 189" />
      {/* tall tower: gallery on corbels */}
      <path className="mg-bd-body" d="M310 96 H356 V104 H310 Z M312 104 H318 L315 111 Z M324 104 H330 L327 111 Z M336 104 H342 L339 111 Z M348 104 H354 L351 111 Z" />
      <path className="mg-bd-line" d="M310 96 H356 M316 96 V104 M324 96 V104 M333 96 V104 M342 96 V104 M350 96 V104 M333 18 V6 M374 162 V154" />
      <path className="mg-bd-roof" d={`${BD_ROOFS} M333 6 L345 9 L333 12 Z`} />
      <path d={BD_ROOFS} fill={`url(#${id('shingles')})`} />
      <path className="mg-bd-dark" d={BD_DOORS} />
      <path className="mg-bd-window" d={BD_WINDOWS} />
      <path className="mg-bd-moss" d={BD_MOSS} />
    </svg>
  );
}

/* ---------- Balloon Pop: drifting clouds (moonlit pastel) ---------- */

// A small, chubby cloud outline: a low rounded dome edged with round puffs, big ones mixed with small ones,
// tapering to slight points at both ends. profile(t) is the dome height (0..1) from the left tip to the right.
function cloudOutline(w, h, profile, seed) {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const tipY = h * 0.8;
  const steps = [];
  for (let t = 0, i = 0; t < 1; i++) {
    const big = i % 3 === 1 && t > 0.08 && t < 0.86; // small, big, small, small, big, ...
    const step = big ? 0.22 + rand() * 0.08 : 0.08 + rand() * 0.04;
    steps.push(Math.min(step, 1 - t));
    t += step;
  }
  let t = 0;
  const top = [[0, tipY]].concat(
    steps.map((st) => {
      t += st;
      const f = t >= 0.999 ? 0 : profile(t) * (0.9 + rand() * 0.15);
      return [t * w, tipY - f * (tipY - 2)];
    })
  );
  const arc = (p, q, k) => {
    const r = (Math.hypot(q[0] - p[0], q[1] - p[1]) / 2) * k;
    return ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  };
  let d = `M0 ${tipY.toFixed(1)}`;
  for (let i = 1; i < top.length; i++) d += arc(top[i - 1], top[i], 1.02 + rand() * 0.08); // near-semicircles: round puffs
  d += ` Q${(w * 0.97).toFixed(1)} ${(h * 0.97).toFixed(1)} ${(w * 0.88).toFixed(1)} ${h}`;
  let prev = [w * 0.88, h];
  for (let i = 1; i <= 3; i++) {
    const q = [w * 0.88 - (w * 0.76 * i) / 3, h - rand() * 1.5];
    d += arc(prev, q, 1.6 + rand() * 0.6);
    prev = q;
  }
  return `${d} Q${(w * 0.03).toFixed(1)} ${(h * 0.95).toFixed(1)} 0 ${tipY.toFixed(1)}Z`;
}

const sinp = (t, e) => Math.pow(Math.sin(Math.PI * t), e);
const CLOUD_SHAPES = {
  round: { w: 120, h: 50, profile: (t) => sinp(t, 0.7) },
  small: { w: 90, h: 40, profile: (t) => sinp(t, 0.7) },
  double: { w: 130, h: 52, profile: (t) => Math.max(sinp(t, 0.9) * 0.75, Math.exp(-(((t - 0.6) / 0.2) ** 2))) },
  lean: { w: 116, h: 48, profile: (t) => sinp(t, 0.8) * (0.8 + 0.2 * t) },
};
// Each cloud: a shadow body, a smaller main-colour layer above it, and moonlight on that layer's top-right rim.
const CLOUDS = Object.entries(CLOUD_SHAPES).map(([name, c], i) => {
  const pad = c.w * 0.18; // headroom so the big round puffs are never cut flat
  return {
    name,
    ...c,
    pad,
    body: cloudOutline(c.w, c.h, c.profile, 20 + i * 13),
    top: cloudOutline(c.w * 0.84, c.h * 0.84, c.profile, 23 + i * 17),
    topAt: `translate(${(c.w * 0.1).toFixed(1)} 0)`,
    rim: `translate(${(c.w * 0.1 - c.h * 0.084).toFixed(1)} ${(c.h * 0.12).toFixed(1)})`,
  };
});
// Heights alternate high/low; everyone moves at one speed, an even quarter of the crossing apart, so they never bunch up.
const CLOUD_FLIGHT = [
  { y: '0%', w: 110 },
  { y: '55%', w: 76 },
  { y: '10%', w: 118 },
  { y: '62%', w: 100 },
];
const CLOUD_CROSSING = 60;

export function SkyClouds() {
  return (
    <div className="mg-clouds" aria-hidden="true">
      {CLOUDS.map((c, i) => {
        const box = { x: 0, y: -c.pad, width: c.w, height: c.h + c.pad };
        return (
          <svg
            key={c.name}
            className="mg-cloud"
            viewBox={`0 ${-c.pad} ${c.w} ${c.h + c.pad}`}
            style={{
              top: CLOUD_FLIGHT[i].y,
              width: CLOUD_FLIGHT[i].w,
              animationDuration: `${CLOUD_CROSSING}s`,
              animationDelay: `${-(CLOUD_CROSSING * i) / CLOUDS.length}s`,
            }}
          >
            <defs>
              <mask id={`mg-cloud-lit-${c.name}`}>
                <rect {...box} fill="#000" />
                <path d={c.top} transform={c.topAt} fill="#fff" />
                <path d={c.top} transform={c.rim} fill="#000" />
              </mask>
            </defs>
            <path className="mg-cloud__shadow" d={c.body} />
            <path className="mg-cloud__body" d={c.top} transform={c.topAt} />
            <rect className="mg-cloud__lit" {...box} mask={`url(#mg-cloud-lit-${c.name})`} />
            <path className="mg-cloud__line" d={c.top} transform={c.topAt} />
          </svg>
        );
      })}
    </div>
  );
}

/* ---------- Balloon Pop: hot-air balloon with a goblin in the basket ---------- */

const AIR_ENVELOPE = 'M60 6 C98 6 114 34 112 62 C110 90 86 108 74 118 L46 118 C34 108 10 90 8 62 C6 34 22 6 60 6 Z';
const AIR_ROPES = 'M60 8 Q86 40 72 118 M60 8 Q34 40 48 118 M9 62 Q60 80 111 62';
const AIR_KNOTS = [[60, 8], [79, 70], [41, 70]];
const CREAM = '#fbf1c7';
const ROPE = '#e8c9a0';
const ROPE_DARK = '#a9805a';
const WICKER = '#a9733f';
const WICKER_DARK = '#7a4f27';
const WICKER_LIGHT = '#c8955c';
const GOBLIN = '#7fb069';
const GOBLIN_DARK = '#4a7a40';

// The envelope takes its stripe colour from --color / --color-dark on the parent (one per lane, gold when golden).
// Ropes down to the basket are drawn before the goblin, so nothing crosses him.
// AirshipShapes is the drawing on its own (120x172 units), for placing inside another SVG such as a cover.
export function AirshipShapes() {
  const id = useId().replace(/:/g, '');
  return (
    <>
      <defs>
        <clipPath id={`${id}-env`}>
          <path d={AIR_ENVELOPE} />
        </clipPath>
        <pattern id={`${id}-weave`} width="6" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 2.5 q1.5 -2.5 3 0 q1.5 2.5 3 0" fill="none" stroke={WICKER_DARK} strokeWidth="1" />
        </pattern>
      </defs>
      <path className="mg-air__fabric" d={AIR_ENVELOPE} />
      <g clipPath={`url(#${id}-env)`}>
        <path d="M60 6 C76 8 80 60 70 118 L50 118 C40 60 44 8 60 6 Z" fill={CREAM} />
        <path d="M22 16 C8 34 10 80 34 110 L28 112 C2 80 2 34 22 16 Z M98 16 C112 34 110 80 86 110 L92 112 C118 80 118 34 98 16 Z" fill={CREAM} />
        <path className="mg-air__shade" d="M60 6 C98 6 114 34 112 62 C110 90 86 108 74 118 L120 118 L120 0 Z" />
        <ellipse cx="38" cy="30" rx="10" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 38 30)" />
      </g>
      <path className="mg-air__edge" d={AIR_ENVELOPE} />
      <path d={AIR_ROPES} fill="none" stroke={ROPE_DARK} strokeWidth="3" strokeLinecap="round" />
      <path d={AIR_ROPES} fill="none" stroke={ROPE} strokeWidth="1.8" strokeDasharray="2.4 1.6" strokeLinecap="round" />
      {AIR_KNOTS.map(([x, y]) => (
        <circle key={x * 1000 + y} cx={x} cy={y} r="2.6" fill={ROPE} stroke={ROPE_DARK} strokeWidth="1" />
      ))}
      <path className="mg-air__mouth" d="M44 117 H76 V121 H44 Z" />
      <path d="M46 120 L36 140 M74 120 L84 140 M48 120 L52 140 M72 120 L68 140" stroke={ROPE_DARK} strokeWidth="1.6" />
      {/* goblin: helmet, yellow eyes, fanged grin */}
      <g transform="translate(60 128) scale(1.18) translate(-60 -128)">
        <path d="M44 124 L28 114 L45 132 Z M76 124 L92 114 L75 132 Z" fill={GOBLIN} />
        <path d="M42 123 L33 118 L43 128 Z M78 123 L87 118 L77 128 Z" fill={GOBLIN_DARK} opacity=".6" />
        <ellipse cx="60" cy="129" rx="17" ry="15" fill={GOBLIN} />
        <ellipse cx="60" cy="133" rx="4" ry="2.4" fill={GOBLIN_DARK} opacity=".5" />
        <path d="M50 124 l9 3 M70 124 l-9 3" stroke="#2b3d24" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="54" cy="129" rx="3.4" ry="2.6" fill="#f6d743" />
        <ellipse cx="66" cy="129" rx="3.4" ry="2.6" fill="#f6d743" />
        <circle cx="54.6" cy="129.2" r="1.3" fill="#1d2a17" />
        <circle cx="65.4" cy="129.2" r="1.3" fill="#1d2a17" />
        <path d="M51 135 Q60 141 69 135" fill="#3a2418" />
        <path d="M54 135.8 l1.6 3 l1.6 -2.6 Z M66 135.8 l-1.6 3 l-1.6 -2.6 Z" fill="#fff" />
        <path d="M42 122 A18 15 0 0 1 78 122 Z" fill="#8f97a3" />
        <path d="M42 122 H78" stroke="#5f6670" strokeWidth="2.4" />
        <circle cx="60" cy="110" r="2" fill="#5f6670" />
      </g>
      {/* basket, hands on the rim, sandbags */}
      <path d="M30 138 H90 L85 168 Q60 171 35 168 Z" fill={WICKER} />
      <path d="M30 138 H90 L85 168 Q60 171 35 168 Z" fill={`url(#${id}-weave)`} />
      <path d="M28 136 H92 V142 H28 Z" fill={WICKER_LIGHT} stroke={WICKER_DARK} strokeWidth="1.2" />
      <circle cx="40" cy="140" r="3.6" fill={GOBLIN} />
      <circle cx="80" cy="140" r="3.6" fill={GOBLIN} />
      <path d="M31 146 q-3 6 0 11 q3 -5 0 -11 Z M89 146 q3 6 0 11 q-3 -5 0 -11 Z" fill="#c9b38f" stroke="#8a7350" strokeWidth="1" />
      <path d="M31 142 V146 M89 142 V146" stroke="#8a7350" strokeWidth="1" />
    </>
  );
}

export function AirshipArt(props) {
  return (
    <svg className="mg-air" viewBox="0 0 120 172" aria-hidden="true" {...props}>
      <AirshipShapes />
    </svg>
  );
}
