import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { rng, sample, shuffle } from './util.js';
import { CastleArt, SkyClouds, TownArt, WizardArt } from '../art.jsx';
import { pick, useFx } from '../fx/Fx.jsx';
import { TimerBar, useCountdown } from '../components/Hud.jsx';
import { scoreOutOf10 } from './meta.js';
// the raider balloon as one picture (made from AirshipShapes by scripts/airship-svg.mjs): the browser draws it once
// and reuses it for every balloon, instead of building the drawing again for each balloon every round
import AIRSHIP from '../airship.svg';
import {
  BOMB_FUSE, FirePortal, ICE_FREEZE, IceSigil, RisingRunes, RuneLines, ULT_LENGTH, ULT_POP, ULT_STRIKE, UltSky, UltStrike, VOLT_SATELLITES,
} from './BalloonSkills.jsx';

// OL1 — functions and physiological properties of muscle tissue (lecture §1–2).
const PROPERTIES = ['Excitability', 'Conductivity', 'Contractility', 'Extensibility', 'Elasticity'];
const FUNCTIONS = ['Movement', 'Posture & stability', 'Regulating passages', 'Heat production', 'Blood glucose control'];

const CLUES = [
  { answer: 'Excitability', text: 'The ability of a muscle cell to respond to a stimulus.' },
  { answer: 'Excitability', text: 'A neurotransmitter or a stretch triggers an electrical response in the cell membrane.' },
  { answer: 'Conductivity', text: 'The ability to transmit an electrical signal from one region of the cell to another.' },
  { answer: 'Conductivity', text: 'The signal spreads along the sarcolemma and into the fiber through T-tubules.' },
  { answer: 'Contractility', text: 'The ability to generate force after stimulation — even without shortening.' },
  { answer: 'Contractility', text: 'Depends mainly on the interaction between actin and myosin.' },
  { answer: 'Extensibility', text: 'The triceps contracts while the biceps must lengthen without damage.' },
  { answer: 'Extensibility', text: 'The ability to lengthen when an external force is applied.' },
  { answer: 'Elasticity', text: 'The ability to return toward its previous length after being stretched.' },
  { answer: 'Movement', text: 'Speech, facial expression and writing let us communicate.' },
  { answer: 'Movement', text: 'Respiratory muscles drive ventilation; cardiac muscle drives circulation.' },
  { answer: 'Posture & stability', text: 'Antigravity muscles keep the body upright and joints stable.' },
  { answer: 'Regulating passages', text: 'Muscular rings control the flow of food, bile and blood through organs.' },
  { answer: 'Heat production', text: 'Shivering: rapid involuntary contractions when you are cold.' },
  { answer: 'Heat production', text: 'Most of the chemical energy used during contraction is released this way.' },
  { answer: 'Blood glucose control', text: 'Skeletal muscle is a major site of glucose uptake and glycogen storage.' },
  { answer: 'Blood glucose control', text: 'Low muscle mass and inactivity raise the risk of type 2 diabetes.' },
];

const ROUNDS = 10;
const LIVES = 3;
const TIME = 100;
const ATP_MAX = 4;
// Stripe colour and its shade for each lane's balloon.
const SWING_AT = 280; // ms into the cast animation when the staff swings forward
const FIRE_FLIGHT = 200;
const PRAISE = ['Great spell! ✨', 'Bullseye!', 'Correct! 💪', 'Nice one!', 'Magic! 🪄'];
const OOPS = ['Oops! Not that one', 'So close, try another!', 'Wrong balloon 😅'];

// Ice and bomb flyers are skill orbs: the same glossy pearl as the wizard's staff orb (dark at the top, pale at the
// bottom, a white shine), tinted for the skill and set in its spinning rune circle, the one the wizard casts with it.
// Ice: the ice rune round a frost-blue pearl with a white snowflake inside, and a ring that pulses out. Bomb: the fire
// rune, spinning the other way, round a red pearl with a little lit bomb inside, and a slow red warning pulse. Drawn
// around (0, 0) in a 48 x 48 box.
const ORB_R = 11;
const ORB_COLORS = {
  ice: ['#0b3a8a', '#38a8f5', '#bfe6ff', '#ffffff'],
  bomb: ['#7a1010', '#e0322b', '#ff9a6b', '#ffe0b0'],
};
const SIXTHS = [0, 60, 120, 180, 240, 300];

// a star with `n` points, as polygon points
function star(x, y, outer, inner, n) {
  return Array.from({ length: n * 2 }, (_, k) => {
    const r = k % 2 ? inner : outer;
    const a = (Math.PI * k) / n - Math.PI / 2;
    return `${(x + Math.cos(a) * r).toFixed(2)},${(y + Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
}
const FUSE_SPARK = star(7, -6.5, 2.5, 0.85, 5);

function SkillPearl({ kind }) {
  const id = `mg-skill-${kind}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {ORB_COLORS[kind].map((c, k) => (
            <stop key={k} offset={[0, 0.5, 0.85, 1][k]} stopColor={c} />
          ))}
        </linearGradient>
        <radialGradient id={`${id}-shade`} cx=".42" cy=".38" r=".64">
          <stop offset=".55" stopColor="#2e3358" stopOpacity="0" />
          <stop offset="1" stopColor="#2e3358" stopOpacity=".45" />
        </radialGradient>
      </defs>
      <circle r={ORB_R} fill={`url(#${id})`} />
      <circle r={ORB_R} fill={`url(#${id}-shade)`} />
    </>
  );
}

// the pearl's shine, over whatever sits inside it: a bounce light at the bottom, a small highlight at the top left
function PearlShine() {
  return (
    <>
      <ellipse cy="6.9" rx="6.4" ry="2.2" fill="#fff" opacity="0.45" />
      <ellipse cx="-4.8" cy="-5.6" rx="2.8" ry="1.8" transform="rotate(-35 -4.8 -5.6)" fill="#fff" opacity="0.95" />
      <circle cx="4.6" cy="-4.6" r="1.1" fill="#fff" />
    </>
  );
}

function IceIcon() {
  return (
    <svg className="mg-flyer__icon" viewBox="-24 -24 48 48" aria-hidden="true">
      <circle className="mg-flyer__pulse" r="18" fill="none" stroke="#7dd3fc" strokeWidth="0.8" opacity="0.7" />
      <g transform="scale(0.36)">
        <g className="mg-flyer__rune">
          <RuneLines kind="ice" />
        </g>
      </g>
      <SkillPearl kind="ice" />
      <Snowflake r={6} width={1.4} color="#fff" />
      <PearlShine />
    </svg>
  );
}

function BombIcon() {
  return (
    <svg className="mg-flyer__icon" viewBox="-24 -24 48 48" aria-hidden="true">
      <circle className="mg-flyer__pulse" r="18" fill="#ef4444" opacity="0.25" />
      <g transform="scale(0.36)">
        <g className="mg-flyer__rune mg-flyer__rune--back">
          <RuneLines kind="fire" />
        </g>
      </g>
      <SkillPearl kind="bomb" />
      <path d="M2.5 -4q1.5 -2.7 4 -2.1" stroke="#1f1f23" strokeWidth="1.05" fill="none" strokeLinecap="round" />
      <circle r="4.75" fill="#1f1f23" />
      <path d="M-2.7 -1.5a2.9 2.9 0 0 1 1.9 -1.9" stroke="#fff" strokeWidth="0.75" fill="none" strokeLinecap="round" opacity="0.7" />
      <polygon className="mg-flyer__spark" points={FUSE_SPARK} fill="#fde047" />
      <PearlShine />
    </svg>
  );
}

// a snow crystal of radius r round (0, 0): three crossing arms with a small V near each tip
function Snowflake({ r, width, color }) {
  const v = `M${(-r * 0.32).toFixed(2)} ${(-r * 0.78).toFixed(2)}L0 ${(-r * 0.48).toFixed(2)}L${(r * 0.32).toFixed(2)} ${(-r * 0.78).toFixed(2)}`;
  return (
    <g stroke={color} strokeLinecap="round" fill="none">
      {[0, 60, 120].map((a) => (
        <path key={a} d={`M0 ${-r}V${r}`} strokeWidth={width} transform={`rotate(${a})`} />
      ))}
      {SIXTHS.map((a) => (
        <path key={a} d={v} strokeWidth={width * 0.8} transform={`rotate(${a})`} />
      ))}
    </g>
  );
}

// Hitting the ice orb: it flashes white and shatters into twelve shards of ice that fly out, spin and fade. Drawn in
// pixels round the hit point.
const ICE_SHARDS = (() => {
  const r = rng(7);
  return Array.from({ length: 12 }, (_, k) => {
    const a = (k / 12) * Math.PI * 2 + (r() - 0.5) * 0.4;
    const d = 60 + r() * 60;
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d + 20, rot: (r() - 0.5) * 480, s: 4 + r() * 5 };
  });
})();

function IceShatter({ x, y }) {
  return (
    <svg className="mg-shatter" style={{ left: x, top: y }} viewBox="-130 -130 260 260" aria-hidden="true">
      <circle className="mg-shatter__flash" r="18" fill="#fff" />
      {ICE_SHARDS.map(({ dx, dy, rot, s }, k) => (
        <polygon
          key={k}
          className="mg-shatter__shard"
          points={`0,${(-s).toFixed(1)} ${(s * 0.5).toFixed(1)},${(s * 0.4).toFixed(1)} ${(-s * 0.4).toFixed(1)},${(s * 0.6).toFixed(1)}`}
          fill={s > 6 ? '#e0f2fe' : '#7dd3fc'}
          stroke="#fff"
          strokeWidth="0.6"
          style={{ '--dx': `${dx.toFixed(1)}px`, '--dy': `${dy.toFixed(1)}px`, '--rot': `${rot.toFixed(0)}deg` }}
        />
      ))}
    </svg>
  );
}

// Lightning in the style of 2D anime effects: each bolt is a solid shape, wide at its root and sharp at its tip, with a
// white core, a cyan body and a blue glow. A bolt keeps a few shapes ("poses") and flips between them every few frames
// so it seems to boil.

// The centre line of a bolt from (x1, y1) to (x2, y2), kinked `kinks` times, each kink thrown sideways up to `jag` of
// the length.
function jagged(x1, y1, x2, y2, kinks, jag, seed) {
  const r = rng(seed);
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const nx = -(y2 - y1) / len;
  const ny = (x2 - x1) / len;
  return Array.from({ length: kinks + 1 }, (_, k) => {
    const t = k / kinks;
    const off = k === 0 || k === kinks ? 0 : (r() * 2 - 1) * jag * len;
    return [x1 + (x2 - x1) * t + nx * off, y1 + (y2 - y1) * t + ny * off];
  });
}

// Polygon points round a centre line, `w` wide at the root and narrowing to a point.
function taper(spine, w) {
  const left = [];
  const right = [];
  spine.forEach(([x, y], k) => {
    const [ax, ay] = spine[Math.max(0, k - 1)];
    const [bx, by] = spine[Math.min(spine.length - 1, k + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const hw = (w / 2) * (1 - k / (spine.length - 1));
    const nx = (-(by - ay) / len) * hw;
    const ny = ((bx - ax) / len) * hw;
    left.push(`${(x + nx).toFixed(1)},${(y + ny).toFixed(1)}`);
    right.unshift(`${(x - nx).toFixed(1)},${(y - ny).toFixed(1)}`);
  });
  return [...left, ...right].join(' ');
}

function Bolt({ spine, w }) {
  const body = taper(spine, w);
  return (
    <>
      <polygon points={body} fill="#60a5fa" stroke="#3b82f6" strokeWidth={w * 0.9} strokeLinejoin="round" opacity="0.35" />
      <polygon points={body} fill="#67e8f9" stroke="#a5f3fc" strokeWidth="0.6" strokeLinejoin="round" />
      <polygon points={taper(spine, w * 0.45)} fill="#f0fdff" />
    </>
  );
}

// Round the full tube: three poses of four thin bolts, cyan and yellow in turn, each with a small white fork. They sit
// on the tube's border and the slant comes from the wrapper they share with the tube, so they follow its edges
// exactly and never cross the TAP! label. Drawn in tube space: the tube runs x 0-125, y 0-27.
const EDGE_COLORS = {
  cyan: ['#0ea5e9', '#22d3ee', '#f0fdff'],
  yellow: ['#f59e0b', '#facc15', '#fffbe6'],
};
const EDGE_POSES = [
  [[10, 0, 38, -1, 'cyan'], [70, 0, 98, 1, 'yellow'], [115, 27, 88, 28, 'cyan'], [125, 4, 124, 22, 'yellow']],
  [[40, 0, 66, -1, 'yellow'], [30, 27, 58, 28, 'cyan'], [126, 6, 124, 24, 'cyan'], [96, 0, 120, 0, 'yellow']],
  [[60, 0, 86, 0, 'cyan'], [75, 27, 48, 28, 'yellow'], [118, 27, 100, 28, 'yellow'], [14, 0, 34, 0, 'cyan']],
].map((pose, p) =>
  pose.map(([x1, y1, x2, y2, color], k) => {
    const spine = jagged(x1, y1, x2, y2, 5, 0.1, 11 + p * 10 + k);
    // the fork leaves from the middle kink, pointing away from the tube
    const [mx, my] = spine[2];
    const out = x1 > 120 ? 0 : y1 > 13 ? 1 : -1;
    const fork = out === 0 ? `M${mx} ${my} l4 -3 l2 3 l3 -1` : `M${mx} ${my} l-2 ${4 * out} l3 ${out} l1 ${3 * out}`;
    return { spine, color, fork };
  })
);

function EdgeBolt({ spine, color, fork, w = 1.8 }) {
  const [glow, body, core] = EDGE_COLORS[color];
  const pts = taper(spine, w);
  return (
    <>
      <polygon points={pts} fill={body} stroke={glow} strokeWidth={w * 1.1} strokeLinejoin="round" opacity="0.45" />
      <polygon points={pts} fill={body} />
      <polygon points={taper(spine, w / 2)} fill={core} />
      <path d={fork} fill="none" stroke="#fff" strokeWidth={w * 0.4} strokeLinejoin="round" strokeLinecap="round" />
    </>
  );
}

// The full tube: two sparks with tails race round its border all the time, one cyan and one yellow, and every 1.2 s
// it surges: a white flash and a burst of the edge bolts. Dashes on the border outline (perimeter 304) are the sparks.
function GaugeLightning() {
  return (
    <svg className="mg-gauge__sparks" viewBox="-6 -6 137 39" aria-hidden="true">
      <g className="mg-gauge__run" fill="none" strokeLinecap="round">
        <rect x="0" y="0" width="125" height="27" rx="4" stroke="#67e8f9" strokeWidth="3" strokeDasharray="26 278" opacity="0.5" />
        <rect x="0" y="0" width="125" height="27" rx="4" stroke="#fff" strokeWidth="2.2" strokeDasharray="5 299" strokeDashoffset="-21" />
        <rect className="mg-gauge__run-b" x="0" y="0" width="125" height="27" rx="4" stroke="#fde047" strokeWidth="3" strokeDasharray="26 278" opacity="0.5" />
        <rect className="mg-gauge__run-b" x="0" y="0" width="125" height="27" rx="4" stroke="#fff" strokeWidth="2.2" strokeDasharray="5 299" strokeDashoffset="-21" />
      </g>
      <g className="mg-gauge__surge">
        <rect x="0" y="0" width="125" height="27" rx="4" fill="#fff" className="mg-gauge__flash" />
        {EDGE_POSES.map((bolts, k) => (
          <g key={k} className="mg-pose" style={{ animationDelay: `${-0.08 * k}s` }}>
            {bolts.map((b, j) => (
              <EdgeBolt key={j} {...b} />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

// The badge icon: a lightning bolt fading from cyan through white to yellow, with two white crackles. When the tube is
// full it flickers like a neon sign, and its outline wobbles between two shapes.
function BadgeBolt() {
  return (
    <svg className="mg-gauge__icon" viewBox="0 0 24 24">
      <defs>
        <linearGradient id="mg-badge-bolt" x1="0.8" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#f0fdff" />
          <stop offset="1" stopColor="#facc15" />
        </linearGradient>
      </defs>
      <g className="mg-gauge__neon">
        <polygon className="mg-gauge__shape-a" points="15,1 4.5,13.5 11,13.5 8,23 19.5,9.5 13,9.5" fill="url(#mg-badge-bolt)" stroke="#0c2a4d" strokeWidth="1" strokeLinejoin="round" />
        <polygon className="mg-gauge__shape-b" points="15.5,1 5,13 11.5,13.8 7.5,23 19,10 13.2,9.2" fill="url(#mg-badge-bolt)" stroke="#0c2a4d" strokeWidth="1" strokeLinejoin="round" />
        <path d="M7 9 l-2.5 -1 l-1 -2.5 M16 14 l2.5 1 l1 2.5" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

// the middle of the balloon's envelope, as a share of the art's height (the art is 120 x 172; the envelope is centred
// at (60, 64))
const ENVELOPE_MID = 64 / 172;

function buildQuestions() {
  return sample(CLUES, ROUNDS).map((c, i) => {
    const pool = PROPERTIES.includes(c.answer) ? PROPERTIES : FUNCTIONS;
    const wrong = sample(pool.filter((p) => p !== c.answer), 3);
    const roll = Math.random();
    return {
      ...c,
      options: shuffle([c.answer, ...wrong]),
      special: i === 0 ? null : roll < 0.3 ? 'ice' : roll < 0.55 ? 'bomb' : null,
    };
  });
}

function Round({ q, duration, ult, fire, staffAt, onHit, onWrong, onMiss, onSpecial }) {
  const [state, setState] = useState({});
  const stateRef = useRef(state);
  stateRef.current = state;
  const riders = useRef({});
  const [portal, setPortal] = useState(null);
  const [strikes, setStrikes] = useState({});
  const done = useRef(false);
  const [flyerGone, setFlyerGone] = useState(false);
  const flyerShot = useRef(false);
  const delays = useMemo(() => shuffle([0, 0.35, 0.7, 1.05]).map((d) => d + Math.random() * 0.25), []);
  const flyer = useMemo(() => ({ top: 10 + Math.random() * 24, delay: 1 + Math.random() * 1.5, rev: Math.random() < 0.5 }), []);

  // the ATP ultimate marks two wrong balloons at once, and ULT_STRIKE s later a bolt from the sky rune's lower small
  // circles hits each (the left balloon from the left circle), measured then since they keep falling; a balloon not
  // yet below its circle is struck straight down from the top of the sky instead
  useEffect(() => {
    if (!ult) return undefined;
    const wrong = q.options.filter((o) => o !== q.answer && !stateRef.current[o]).slice(0, 2);
    setState((s) => ({ ...s, ...Object.fromEntries(wrong.map((o) => [o, 'ult'])) }));
    const timer = setTimeout(() => {
      const hit = wrong
        .map((o) => {
          const r = riders.current[o]?.querySelector('.mg-rider__balloon')?.getBoundingClientRect();
          return r && { o, x: r.left + r.width / 2, y: r.top + r.height * ENVELOPE_MID };
        })
        .filter(Boolean)
        .sort((a, b) => a.x - b.x);
      const from = hit.length === 1 ? [ult.sats[hit[0].x < ult.mid ? 0 : 1]] : ult.sats;
      const start = ([x, y], h) => (h.y > y + 40 ? [x - h.x, y - h.y] : [0, ult.top - h.y]);
      setStrikes(Object.fromEntries(hit.map((h, k) => [h.o, { from: start(from[k], h), blue: k === 1 }])));
      setState((s) => ({ ...s, ...Object.fromEntries(hit.map((h) => [h.o, 'struck'])) }));
    }, ULT_STRIKE * 1000);
    return () => clearTimeout(timer);
  }, [ult, q]);

  const shoot = (el, opt) => {
    if (done.current || state[opt]) return;
    setState((s) => ({ ...s, [opt]: 'aim' }));
    fire(el, (x, y) => {
      if (done.current) return;
      if (opt === q.answer) {
        done.current = true;
        setState((s) => ({ ...s, [opt]: 'good' }));
        onHit({ x, y });
      } else {
        setState((s) => ({ ...s, [opt]: 'bad' }));
        onWrong({ opt, x, y });
      }
    });
  };

  const landed = (e, opt) => {
    if (e.animationName !== 'mg-fall' || opt !== q.answer || done.current) return;
    done.current = true;
    onMiss();
  };

  return (
    <div className="mg-sky__balloons">
      {q.options.map((opt, k) => (
        <button
          key={opt}
          ref={(el) => {
            riders.current[opt] = el;
          }}
          type="button"
          className={`mg-rider${state[opt] ? ` mg-rider--${state[opt]}` : ''}`}
          style={{ '--lane': k, '--dur': `${duration}s`, '--delay': `${delays[k]}s` }}
          onPointerDown={(e) => {
            e.preventDefault();
            shoot(e.currentTarget, opt);
          }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && shoot(e.currentTarget, opt)}
          onAnimationEnd={(e) => landed(e, opt)}
          disabled={['good', 'bad', 'gone', 'ult', 'struck', 'bombed'].includes(state[opt])}
        >
          <span className="mg-rider__balloon">
            <img className="mg-air" src={AIRSHIP} alt="" draggable={false} />
            {state[opt] === 'struck' && strikes[opt] && <UltStrike {...strikes[opt]} />}
            {state[opt] === 'bombed' && portal && <FirePortal {...portal} />}
          </span>
          <span className="mg-rider__banner" lang="en">{opt}</span>
        </button>
      ))}
      {q.special && !flyerGone && (
        <button
          type="button"
          className={`mg-flyer mg-flyer--${q.special}${flyer.rev ? ' mg-flyer--rev' : ''}`}
          style={{ top: `${flyer.top}%`, '--fdelay': `${flyer.delay}s` }}
          onPointerDown={(e) => {
            e.preventDefault();
            if (flyerShot.current) return;
            flyerShot.current = true;
            fire(e.currentTarget, (x, y) => {
              setFlyerGone(true);
              // the bomb's fire rune flies from the staff to one wrong balloon that is still in play and burns it
              // away; the blast is reported where that balloon is
              const wrong = q.special === 'bomb' && q.options.find((o) => o !== q.answer && !stateRef.current[o]);
              const art = wrong && riders.current[wrong]?.querySelector('.mg-rider__balloon');
              if (art) {
                const r = art.getBoundingClientRect();
                const cx = r.left + r.width / 2;
                const cy = r.top + r.height * ENVELOPE_MID;
                const [sx, sy] = staffAt();
                setPortal({ from: [sx - cx, sy - cy], lift: cy - r.top + 20 });
                setState((st) => ({ ...st, [wrong]: 'bombed' }));
                onSpecial(q.special, cx, cy);
              } else {
                onSpecial(q.special, x, y);
              }
            });
          }}
          aria-label={q.special === 'ice' ? 'Ice balloon: slows every balloon' : 'Bomb balloon: blows away one wrong balloon'}
        >
          {q.special === 'ice' ? <IceIcon /> : <BombIcon />}
        </button>
      )}
    </div>
  );
}

export default function BalloonPop({ onScore, onFinish }) {
  const fx = useFx();
  const questions = useMemo(buildQuestions, []);
  const st = useRef({
    // right = clues answered right (a wrong tap first costs a heart, not the point); each is worth 1 of the 10 points.
    i: 0, right: 0, lives: LIVES, atp: 0, over: false, mistakes: [],
  });
  const [, rerender] = useReducer((x) => x + 1, 0);
  const [frozen, setFrozen] = useState(false);
  const [shake, setShake] = useState(false);
  const [shatter, setShatter] = useState(null);
  // the skills on screen: the runes rising round the wizard, the ice sky rune, and the ATP ultimate (with the round
  // it was used in); each carries n so a new cast replays its animation (several start in the same millisecond, so
  // their keys also name the effect)
  const [rising, setRising] = useState(null);
  const [sigil, setSigil] = useState(null);
  const [ult, setUlt] = useState(null);
  // The wizard's last move ('cast' = fireball, 'ice' / 'fire' = casting that skill, 'ult' = the ATP ultimate); n
  // remounts him so the animation replays.
  const [wizardMove, setWizardMove] = useState({ n: 0, kind: '' });
  const skyRef = useRef(null);
  const wizardRef = useRef(null);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const s = st.current;
  const q = questions[s.i];
  const duration = Math.max(7, 10.5 - s.i * 0.35);
  const [left] = useCountdown(TIME, { running: !s.over, onExpire: () => end('Time’s up! ⏰') });

  function end(line) {
    if (s.over) return;
    s.over = true;
    if (line) fx.say(line, 'sad');
    rerender();
    later(() => {
      onFinish(scoreOutOf10(s.right, ROUNDS), {
        summary: `${s.right}/${ROUNDS} clues right`,
        mistakes: s.mistakes,
      });
    }, 1000);
  }

  const nextRound = () =>
    later(() => {
      if (s.over) return;
      if (s.lives <= 0 || s.i + 1 >= ROUNDS) end();
      else {
        s.i += 1;
        rerender();
      }
    }, 1000);

  // where the staff's orb is, in the page
  const staffAt = () => {
    const box = skyRef.current.getBoundingClientRect();
    const orb = wizardRef.current?.querySelector('.mg-wizard__orb')?.getBoundingClientRect();
    return orb ? [orb.left + orb.width / 2, orb.top + orb.height / 2] : [box.left + box.width / 2, box.bottom - 90];
  };

  // The wizard raises his staff to cast a skill and his orb takes its colour; for the ultimate, runes rise round him.
  const castSkill = (kind) => {
    const box = skyRef.current?.getBoundingClientRect();
    const wiz = wizardRef.current?.getBoundingClientRect();
    setWizardMove((m) => ({ n: m.n + 1, kind: kind === 'volt' ? 'ult' : kind }));
    if (kind === 'volt' && box && wiz) {
      setRising({ n: Date.now(), x: wiz.left + wiz.width * 0.46 - box.left });
      later(() => setRising(null), ULT_LENGTH * 1000);
    }
  };

  const loseLife = () => {
    s.lives -= 1;
    rerender();
    if (s.lives <= 0) end('Out of hearts 💔');
  };

  // The wizard raises the staff and swings it; at the swing a tiny fireball flies from the orb
  // to the element, dropping embers, and the hit resolves where it lands.
  const fire = (el, land) => {
    const sky = skyRef.current;
    if (!sky || !el) return;
    const aim = (r) => [r.left + r.width / 2, r.top + Math.min(r.height / 2, 40)];
    let [tx, ty] = aim(el.getBoundingClientRect());
    setWizardMove((m) => ({ n: m.n + 1, kind: 'cast' }));
    later(() => {
      const box = sky.getBoundingClientRect();
      if (el.isConnected) [tx, ty] = aim(el.getBoundingClientRect());
      const orb = wizardRef.current?.querySelector('.mg-wizard__orb')?.getBoundingClientRect();
      const sx = orb ? orb.left + orb.width / 2 : box.left + box.width / 2;
      const sy = orb ? orb.top + orb.height / 2 : box.bottom - 90;
      fx.sound('whoosh');
      const ball = document.createElement('div');
      ball.className = 'mg-fireball';
      sky.appendChild(ball);
      const at = (p) => [sx + (tx - sx) * p * p - box.left, sy + (ty - sy) * p * p - box.top];
      const anim = ball.animate(
        [
          { transform: `translate(${sx - box.left}px, ${sy - box.top}px) scale(0.6)` },
          { transform: `translate(${tx - box.left}px, ${ty - box.top}px) scale(1)` },
        ],
        { duration: FIRE_FLIGHT, easing: 'ease-in' }
      );
      for (let k = 1; k <= 5; k++)
        later(() => {
          const [x, y] = at(k / 6);
          const ember = document.createElement('div');
          ember.className = 'mg-ember';
          ember.style.transform = `translate(${x}px, ${y}px)`;
          sky.appendChild(ember);
          later(() => ember.remove(), 460);
        }, (FIRE_FLIGHT * k) / 6);
      anim.onfinish = () => {
        ball.remove();
        land(tx, ty);
      };
    }, SWING_AT);
  };

  const hit = ({ x, y }) => {
    s.right += 1;
    s.atp = Math.min(ATP_MAX, s.atp + 1);
    onScore(scoreOutOf10(s.right, ROUNDS));
    fx.sound('pop');
    fx.sound('good');
    fx.burst(x, y, 16);
    fx.float(x, y - 24, '+1', 'good');
    fx.say(s.atp === ATP_MAX ? 'ATP is full! Tap to use your power ⚡' : pick(PRAISE), 'happy');
    rerender();
    nextRound();
  };

  const wrong = ({ opt, x, y }) => {
    s.mistakes.push({ prompt: q.text, yours: opt, answer: q.answer });
    fx.sound('pop');
    fx.sound('bad');
    fx.vibrate(120);
    fx.float(x, y, '✗', 'bad');
    fx.say(pick(OOPS), 'sad');
    loseLife();
  };

  const miss = () => {
    s.mistakes.push({ prompt: q.text, yours: 'Let it reach the castle', answer: q.answer });
    fx.sound('bad');
    fx.vibrate(120);
    fx.say(`It reached the castle! The answer was ${q.answer}`, 'sad');
    setShake(true);
    later(() => setShake(false), 500);
    loseLife();
    nextRound();
  };

  const special = (kind, x, y) => {
    if (s.over) return;
    if (kind === 'ice') {
      fx.sound('pop');
      fx.sound('freeze');
      // the orb shatters, the wizard casts, and his ice rune flies up behind the balloons and opens across the sky
      const sky = skyRef.current?.getBoundingClientRect();
      if (sky) {
        setShatter({ n: Date.now(), x: x - sky.left, y: y - sky.top });
        later(() => setShatter(null), 1000);
        const [sx, sy] = staffAt();
        setSigil({ n: Date.now(), from: [sx - sky.left, sy - sky.top], to: [sky.width / 2, sky.height * 0.38], d: sky.width * 0.88 });
        later(() => setSigil(null), (ICE_FREEZE + 2.6) * 1000);
      }
      castSkill('ice');
      fx.say('Ice spell! Everything falls slower ❄️', 'wow');
      const setRate = (rate) =>
        skyRef.current?.getAnimations({ subtree: true }).forEach((a) => {
          if (a.animationName === 'mg-fall') a.playbackRate = rate;
        });
      later(() => {
        setRate(0.35);
        setFrozen(true);
        later(() => {
          setRate(1);
          setFrozen(false);
        }, 3500);
      }, ICE_FREEZE * 1000);
    } else {
      castSkill('fire');
      fx.say('Boom! The bomb blew away a wrong balloon 💥', 'wow');
      // the blast lands when the fire pillar hits the balloon (see FirePortal)
      later(() => {
        fx.sound('boom');
        fx.vibrate([80, 40, 80]);
        fx.burst(x, y, 26, ['#1f2937', '#f97316', '#fbbf24', '#ef4444']);
        setShake(true);
        later(() => setShake(false), 500);
      }, BOMB_FUSE * 1000);
    }
  };

  // The ATP ultimate, Heaven's seal: the sky darkens, the wizard's lightning rune opens high in the sky and two bolts
  // come down on two wrong balloons (UltSky here, UltStrike in the balloons).
  const fireAtp = () => {
    if (s.atp < ATP_MAX || s.over) return;
    const box = skyRef.current?.getBoundingClientRect();
    if (!box) return;
    s.atp = 0;
    castSkill('volt');
    const [sx, sy] = staffAt();
    const r = Math.min(box.width * 0.42, 150);
    const at = [box.width / 2, box.height * 0.2];
    // the rune's two lower small circles, in the page, left then right
    const sat = (i) => [box.left + at[0] + (VOLT_SATELLITES[i][0] * r) / 50, box.top + at[1] + (VOLT_SATELLITES[i][1] * r) / 50];
    setUlt({ n: Date.now(), round: s.i, from: [sx - box.left, sy - box.top], at, d: r * 2, sats: [sat(3), sat(2)], mid: box.left + at[0], top: box.top });
    later(() => setUlt(null), ULT_LENGTH * 1000);
    fx.sound('power');
    fx.say('ATP power! Two wrong balloons removed ⚡', 'wow');
    fx.vibrate(40);
    later(() => {
      fx.sound('boom');
      fx.vibrate([60, 30, 60]);
      later(() => {
        fx.sound('pop');
        setShake(true);
        later(() => setShake(false), 500);
      }, ULT_POP * 1000);
    }, ULT_STRIKE * 1000);
    rerender();
  };

  return (
    <section className="mg-balloon-game">
      <div className="mg-hud">
        <TimerBar left={left} total={TIME} />
        <div className="mg-hud__row">
          <span className="mg-hud__q">
            Q {s.i + 1}/{ROUNDS}
          </span>
        </div>
      </div>

      <div className="mg-prompt">
        <p className="mg-prompt__label">🪄 Tap the balloon that matches:</p>
        <p className="mg-prompt__text" key={s.i}>
          {q.text}
        </p>
      </div>

      <div ref={skyRef} className={`mg-sky${frozen ? ' mg-sky--frozen' : ''}${shake ? ' mg-shake' : ''}`}>
        <div className="mg-sky__moon" aria-hidden="true" />
        {/* the far town and castle fade as one picture, so where they overlap neither shows through the other */}
        <div className="mg-sky__far" aria-hidden="true">
          <TownArt layer="far" />
          <CastleArt layer="far" />
        </div>
        <TownArt layer="near" />
        <CastleArt layer="near" />
        <div className="mg-sky__haze" aria-hidden="true" />
        <SkyClouds />
        {ult && <UltSky key={`ult${ult.n}`}from={ult.from} at={ult.at} d={ult.d} />}
        {ult && <div key={`flash${ult.n}`} className="mg-ult-flash" aria-hidden="true" />}
        {sigil && <IceSigil key={`sigil${sigil.n}`}from={sigil.from} to={sigil.to} d={sigil.d} />}
        {!s.over && (
          <Round
            key={s.i}
            q={q}
            duration={duration}
            ult={ult?.round === s.i ? ult : null}
            fire={fire}
            staffAt={staffAt}
            onHit={hit}
            onWrong={wrong}
            onMiss={miss}
            onSpecial={special}
          />
        )}
        {shatter && <IceShatter key={`shatter${shatter.n}`}x={shatter.x} y={shatter.y} />}
        {rising && <RisingRunes key={`rising${rising.n}`} x={rising.x} />}
        <div className="mg-castle" aria-hidden="true" />
        <div ref={wizardRef} key={`wizard${wizardMove.n}`} className={`mg-wizard${wizardMove.kind ? ` mg-wizard--${wizardMove.kind}` : ''}`} aria-hidden="true">
          <WizardArt />
        </div>
        {/* fighting-game gauge: three blood-vessel life bars over the ATP storage tube, which is tapped once full */}
        <div className="mg-gauge">
          <div className="mg-gauge__lives" role="img" aria-label={`${s.lives} of ${LIVES} lives left`}>
            {Array.from({ length: LIVES }, (_, k) => (
              <i key={k} className={k < s.lives ? 'mg-on' : undefined} />
            ))}
          </div>
          <button
            type="button"
            className={`mg-gauge__atp${s.atp >= ATP_MAX ? ' mg-gauge__atp--ready' : ''}`}
            onClick={fireAtp}
            disabled={s.atp < ATP_MAX || s.over}
            aria-label={`ATP power ${s.atp} of ${ATP_MAX}. ${s.atp >= ATP_MAX ? 'Ready: removes two wrong balloons' : 'Answer correctly to charge'}`}
          >
            <span className="mg-gauge__bolt" aria-hidden="true">
              <BadgeBolt />
              {s.atp >= ATP_MAX && <i className="mg-gauge__ripple" />}
            </span>
            <span className="mg-gauge__slant" aria-hidden="true">
              <span className="mg-gauge__tube">
                {Array.from({ length: ATP_MAX }, (_, k) => (
                  <i key={k} className={k < s.atp ? 'mg-on' : undefined} />
                ))}
                {s.atp >= ATP_MAX && <span className="mg-gauge__tap">TAP!</span>}
              </span>
              {s.atp >= ATP_MAX && <GaugeLightning />}
            </span>
          </button>
        </div>
      </div>
      <p className="mg-legend">
        🧙 Tap a balloon and the wizard zaps it · ✅ Each right answer = 1 point · ❄️ Ice = slow motion · 💣 Bomb = removes 1 wrong balloon · ⚡ ATP removes 2 wrong balloons
      </p>
    </section>
  );
}
