import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { pick, useFx } from '../../fx/Fx.jsx';
import { ComboMeter, Lives, TimerBar, comboMult, useCountdown } from '../../components/Hud.jsx';
import { shuffle } from '../util.js';
import { GROUPS, TEXT_CARDS, groupLabel } from './data.js';

const TIME = 60;
const LIVES = 3;
// The arm slides to the crate, reaches down and closes its claws at REACH_MS, then lifts it away.
const REACH_MS = 360;
const GRAB_MS = 720;

function Crate({ card, mark }) {
  return (
    <span className="mg-crate__box">
      <span className="mg-crate__tape" aria-hidden="true" />
      <span className="mg-crate__label">{card.text}</span>
      {mark && (
        <span className={`mg-crate__stamp mg-crate__stamp--${mark}`} aria-hidden="true">
          {mark === 'good' ? '✓' : '✗'}
        </span>
      )}
    </span>
  );
}

function Arm({ arm }) {
  return (
    <div className={`mg-arm${arm.key ? ' mg-arm--grab' : ''}`} style={{ left: arm.x }} key={arm.key} aria-hidden="true">
      <span className="mg-arm__carriage" />
      <span className="mg-arm__cable" />
      <span className="mg-arm__head">
        <span className="mg-arm__claw mg-arm__claw--l" />
        <span className="mg-arm__claw mg-arm__claw--r" />
        {arm.card && (
          <span className="mg-arm__held">
            <Crate card={arm.card} mark={arm.mark} />
          </span>
        )}
      </span>
    </div>
  );
}

function FactoryBackdrop() {
  return (
    <>
      {/* Small, faint arms hanging from the rail read as machines further back in the hall. */}
      {['24%', '52%', '80%'].map((left) => (
        <svg key={left} className="mg-factory__ghost" style={{ left }} viewBox="0 0 40 46" aria-hidden="true">
          <path
            fill="currentColor"
            d="M18 0h4v18h6l4 7H8l4-7h6zM8 25h5l-3 12 4 6-3 2-6-8zM32 25h-5l3 12-4 6 3 2 6-8z"
          />
        </svg>
      ))}
    </>
  );
}

// Background workers: solid silhouettes walking behind the belt in both directions, on a back and a
// front lane. Later entries paint on top, so a front worker fully hides a back one as they pass.
// Different speeds and start offsets keep them passing each other without bunching up; `step` is the
// leg swing, slower for slower walkers so their feet don't slide.
const WORKERS = [
  { kind: 'carry', dir: 'l', lane: 'back', dur: 19, step: 0.48, delay: -6 },
  { kind: 'clipboard', dir: 'r', lane: 'back', dur: 22, step: 0.5, delay: -15 },
  { kind: 'hardhat', dir: 'r', lane: 'front', dur: 16, step: 0.42, delay: -3 },
  { kind: 'cart', dir: 'l', lane: 'front', dur: 24, step: 0.55, delay: -13 },
];

function Worker({ kind }) {
  return (
    <svg viewBox="-12 -46 54 47" aria-hidden="true">
      <g fill="currentColor">
        {kind === 'carry' && (
          // Far-side arm holding the box on the far shoulder: drawn first so the body overlaps it.
          <>
            <rect x="-11" y="-44" width="13" height="10" rx="1.5" />
            <rect x="-6.5" y="-37" width="3.4" height="10" rx="1.7" />
          </>
        )}
        <rect className="mg-worker__limb" x="-2.5" y="-15" width="4" height="15" rx="2" />
        <rect className="mg-worker__limb mg-worker__limb--alt" x="-1.5" y="-15" width="4" height="15" rx="2" />
        <rect x="-5.5" y="-30" width="11" height="16" rx="3.5" />
        <circle cx="0" cy="-35" r="4.2" />
        <path d="M-6 -36.5Q0 -45 6 -36.5h1.5v1.5h-15v-1.5z" />
        {kind !== 'cart' && <rect className="mg-worker__limb mg-worker__limb--alt" x="-1.8" y="-28" width="3.6" height="13" rx="1.8" />}
        {kind === 'cart' && (
          <>
            <rect x="0" y="-28.5" width="12" height="3.5" rx="1.7" transform="rotate(20 0 -27)" />
            <path d="M11 -21h3v12h23v4H11z" />
            <rect x="15" y="-24" width="18" height="15" rx="2" />
            <circle cx="16" cy="-2" r="2.6" />
            <circle cx="33" cy="-2" r="2.6" />
          </>
        )}
        {kind === 'clipboard' && (
          <>
            <rect x="0" y="-28.5" width="9" height="3.4" rx="1.7" transform="rotate(35 0 -27)" />
            <rect x="6" y="-27" width="7" height="9" rx="1" />
          </>
        )}
      </g>
    </svg>
  );
}

function Workers() {
  return WORKERS.map((w) => (
    <span
      key={w.kind}
      className={`mg-worker mg-worker--${w.dir} mg-worker--${w.lane}`}
      style={{ animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s`, '--step': `${w.step}s` }}
      aria-hidden="true"
    >
      <Worker kind={w.kind} />
    </span>
  ));
}

export default function Conveyor({ onScore, onFinish }) {
  const fx = useFx();
  const pool = useMemo(() => shuffle(TEXT_CARDS), []);
  const [belt, setBelt] = useState([]);
  const [grabbed, setGrabbed] = useState(null);
  const [arm, setArm] = useState({ x: '50%', key: 0, card: null, mark: null });
  const [binFx, setBinFx] = useState({});
  const [over, setOver] = useState(false);
  const st = useRef({ score: 0, streak: 0, maxStreak: 0, sorted: 0, wrong: 0, fell: 0, lives: LIVES, mistakes: [], n: 0, grabs: 0, t0: performance.now() });
  const [, rerender] = useReducer((x) => x + 1, 0);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const s = st.current;
  const beltRef = useRef(belt);
  beltRef.current = belt;
  const beltEl = useRef(null);
  const busy = useRef(false);
  const overRef = useRef(false);

  const [left] = useCountdown(TIME, { running: !over, onExpire: () => end('Time’s up! ⏰') });

  useEffect(() => {
    fx.say('Press a picture button — the robot arm packs the glowing crate!', 'happy');
    let t;
    const spawn = () => {
      if (overRef.current) return;
      const elapsed = (performance.now() - s.t0) / 1000;
      const card = pool[s.n % pool.length];
      s.n += 1;
      setBelt((b) => [...b, { uid: s.n, card, dur: Math.max(4.4, 8 - elapsed * 0.07) }]);
      t = setTimeout(spawn, Math.max(1300, 2600 - elapsed * 25));
    };
    t = setTimeout(spawn, 300);
    return () => {
      clearTimeout(t);
      timers.current.forEach(clearTimeout);
    };
  }, [fx, pool, s]);

  function end(line) {
    if (overRef.current) return;
    overRef.current = true;
    setOver(true);
    fx.say(line, s.lives > 0 ? 'happy' : 'sad');
    later(
      () =>
        onFinish(s.score, {
          summary: `${s.sorted} crates packed · ${s.wrong + s.fell} missed`,
          mistakes: s.mistakes,
          stats: { convSorted: s.sorted, maxStreak: s.maxStreak },
        }),
      1100
    );
  }

  const loseLife = () => {
    s.lives -= 1;
    s.streak = 0;
    rerender();
    if (s.lives <= 0) end('Out of hearts 💔');
  };

  const flashBin = (bin, kind) => {
    setBinFx((f) => ({ ...f, [bin]: kind }));
    later(() => setBinFx((f) => ({ ...f, [bin]: null })), 450);
  };

  const sort = (item, bin) => {
    setBelt((b) => b.filter((c) => c.uid !== item.uid));
    const { x, y } = fx.centerOf(`[data-drop="bin-${bin}"]`);
    if (item.card.answer === bin) {
      s.streak += 1;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      s.sorted += 1;
      const mult = comboMult(s.streak);
      const pts = 10 * mult;
      s.score += pts;
      onScore(s.score);
      fx.sound(mult > 1 ? 'combo' : 'good', mult);
      fx.burst(x, y - 20, 14);
      fx.float(x, y - 30, `+${pts}${mult > 1 ? ` ×${mult}` : ''}`);
      if (mult > 1 && s.streak % 3 === 0) fx.say(`Combo ×${mult}! Quick hands 🔥`, 'wow');
      else if (s.sorted % 4 === 0) fx.say(pick(['Great packing!', 'The belt is speeding up!', 'Keep going! 💪']), 'happy');
      flashBin(bin, 'good');
      rerender();
      return 'good';
    }
    s.wrong += 1;
    s.mistakes.push({ prompt: item.card.text, yours: groupLabel(bin), answer: groupLabel(item.card.answer), why: item.card.why });
    fx.sound('bad');
    fx.vibrate(120);
    fx.float(x, y - 30, '✗', 'bad');
    fx.say(`Not ${groupLabel(bin)}, it’s ${groupLabel(item.card.answer)}`, 'sad');
    flashBin(bin, 'bad');
    loseLife();
    return 'bad';
  };

  const fell = (uid) => {
    const item = beltRef.current.find((c) => c.uid === uid);
    if (!item || item.falling || overRef.current) return;
    // Keep the crate on screen while it tips off the end; it is removed when the fall animation ends.
    setBelt((b) => b.map((c) => (c.uid === uid ? { ...c, falling: true } : c)));
    s.fell += 1;
    s.mistakes.push({ prompt: item.card.text, yours: 'Fell off the belt', answer: groupLabel(item.card.answer), why: item.card.why });
    fx.sound('bad');
    fx.vibrate(100);
    fx.say('A crate fell off! 😱', 'sad');
    loseLife();
  };

  const lead = belt.find((c) => c.uid !== grabbed && !c.falling);

  const press = (bin) => {
    if (overRef.current || busy.current || !lead) return;
    const crate = beltEl.current?.querySelector(`[data-uid="${lead.uid}"]`);
    if (!crate) return;
    const box = beltEl.current.getBoundingClientRect();
    const r = crate.getBoundingClientRect();
    // Still inside the machine: nothing on the belt to grab yet.
    const machine = beltEl.current.querySelector('.mg-factory__machine');
    if (r.left + r.width / 2 < box.left + (machine?.offsetWidth ?? 0)) return;
    busy.current = true;
    const item = lead;
    s.grabs += 1;
    setGrabbed(item.uid);
    setArm({ x: r.left - box.left + r.width / 2, key: s.grabs, card: null, mark: null });
    later(() => {
      if (overRef.current) return;
      const mark = sort(item, bin);
      setArm((a) => ({ ...a, card: item.card, mark }));
    }, REACH_MS);
    later(() => {
      busy.current = false;
      setGrabbed(null);
      setArm((a) => ({ ...a, card: null, mark: null }));
    }, GRAB_MS);
  };

  return (
    <section className="mg-conveyor">
      <div className="mg-hud">
        <TimerBar left={left} total={TIME} />
        <div className="mg-hud__row">
          <span className="mg-hud__q">📦 {s.sorted} packed</span>
          <Lives lives={s.lives} max={LIVES} />
          <ComboMeter streak={s.streak} />
        </div>
      </div>

      <div ref={beltEl} className={`mg-factory${over ? ' mg-factory--stopped' : ''}`}>
        <FactoryBackdrop />
        <Workers />
        <span className="mg-factory__rail" aria-hidden="true" />
        <Arm arm={arm} />
        <span className="mg-factory__machine" aria-hidden="true">
          <span className="mg-factory__screen" />
          <span className="mg-factory__dial" />
        </span>
        {belt.map((c) => (
          <div
            key={c.uid}
            data-uid={c.uid}
            className={`mg-crate${lead?.uid === c.uid ? ' mg-crate--lead' : ''}${grabbed === c.uid ? ' mg-crate--grabbed' : ''}${
              c.falling ? ' mg-crate--falling' : ''
            }`}
            style={{ '--dur': `${c.dur}s` }}
            onAnimationEnd={(e) => {
              if (e.animationName === 'mg-belt') fell(c.uid);
              else if (e.animationName === 'mg-crate-fall') setBelt((b) => b.filter((x) => x.uid !== c.uid));
            }}
            role="img"
            aria-label={`Crate: ${c.card.text}`}
          >
            <Crate card={c.card} />
          </div>
        ))}
        <span className="mg-factory__belt" aria-hidden="true" />
        <span className="mg-factory__legs" aria-hidden="true" />
      </div>

      <div className="mg-panel">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            data-drop={`bin-${g.id}`}
            className={`mg-bin mg-bin--${g.id}${binFx[g.id] ? ` mg-bin--${binFx[g.id]}` : ''}`}
            onClick={() => press(g.id)}
            disabled={over}
          >
            <span className="mg-bin__art" aria-hidden="true">
              <g.Art />
            </span>
            <span className="mg-bin__label">{g.label}</span>
          </button>
        ))}
      </div>
      <p className="mg-legend">Press a picture button — the robot arm grabs the glowing crate and packs it into that group.</p>
    </section>
  );
}
