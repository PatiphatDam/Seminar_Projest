import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { sample, shuffle } from './util.js';
import { AirshipArt, CastleArt, SkyClouds, TownArt, WizardArt } from '../art.jsx';
import { ICE, pick, useFx } from '../fx/Fx.jsx';
import { TimerBar, useCountdown } from '../components/Hud.jsx';
import { scoreOutOf10 } from './meta.js';

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
const COLORS = [
  ['#2fb5a3', '#1f8577'],
  ['#ec7fb0', '#bf5285'],
  ['#4fa5e0', '#2f78ad'],
  ['#f2954a', '#c46c27'],
];
const SWING_AT = 180; // ms into the cast animation when the staff swings forward
const FIRE_FLIGHT = 200;
const PRAISE = ['Great spell! ✨', 'Bullseye!', 'Correct! 💪', 'Nice one!', 'Magic! 🪄'];
const OOPS = ['Oops! Not that one', 'So close, try another!', 'Wrong balloon 😅'];

// Ice and bomb flyer icons, drawn around (0, 0) so they sit exactly in the middle of the round flyer
// (emoji glyphs carry their own padding and baseline, which pushed them off centre).

// A star-shaped burst: `n` spikes alternating between the outer radii in `outer` and radius `inner`.
function burst(n, outer, inner) {
  return Array.from({ length: n * 2 }, (_, k) => {
    const r = k % 2 ? inner : outer[(k / 2) % outer.length];
    const a = (Math.PI * k) / n - Math.PI / 2;
    return `${(Math.cos(a) * r).toFixed(2)},${(Math.sin(a) * r).toFixed(2)}`;
  }).join(' ');
}
const BURST_RED = burst(13, [11.6, 10.4, 11.2, 9.8, 11.8], 7.6);
const BURST_YELLOW = burst(13, [9, 8.2, 8.8, 7.8], 6.6);

// Snow crystal: six feathered arms around a small hexagon.
const ARM = 'M0 -2.4V-10.6 M0 -4.2l-2 -1.6M0 -4.2l2 -1.6 M0 -6.4l-2.6 -2M0 -6.4l2.6 -2 M0 -8.5l-1.7 -1.4M0 -8.5l1.7 -1.4';
const HEX = Array.from({ length: 6 }, (_, k) => {
  const a = (Math.PI * k) / 3 - Math.PI / 2;
  return `${(Math.cos(a) * 2.2).toFixed(2)},${(Math.sin(a) * 2.2).toFixed(2)}`;
}).join(' ');

function IceIcon() {
  return (
    <svg className="mg-flyer__icon mg-flyer__icon--ice" viewBox="-12 -12 24 24" aria-hidden="true">
      <g strokeLinecap="round" strokeLinejoin="round" fill="none">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d={ARM} stroke="#bfe3ff" strokeWidth="1.5" />
            <path d={ARM} stroke="#ffffff" strokeWidth="0.6" />
            <path d="M0 -10.6l-0.9 -0.9 0.9 -0.9 0.9 0.9z" fill="#ffffff" stroke="#ffffff" strokeWidth="0.4" />
          </g>
        ))}
        <polygon points={HEX} stroke="#ffffff" strokeWidth="0.7" fill="#dff1ff" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

function BombIcon() {
  return (
    <svg className="mg-flyer__icon mg-flyer__icon--bomb" viewBox="-12 -12 24 24" aria-hidden="true">
      <polygon points={BURST_RED} fill="#e8392b" stroke="#7a1010" strokeWidth="0.35" strokeLinejoin="round" />
      <polygon points={BURST_YELLOW} fill="#fcd116" />
      {/* fuse from the cap to a yellow spark, up and to the left */}
      <path d="M-4.6 -4.6 C-6 -6.2 -6.4 -7 -7.6 -7.8" stroke="#222" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <polygon points={burst(7, [2.4, 1.8], 1)} transform="translate(-8.6 -8.6)" fill="#fcd116" stroke="#e8a20b" strokeWidth="0.3" />
      <rect x="-1.3" y="-7.6" width="2.6" height="2.4" rx="0.5" transform="rotate(-45)" fill="#2b2b2b" stroke="#111" strokeWidth="0.3" />
      <circle className="mg-bomb-ball" r="6.2" fill="#2f2f33" stroke="#111" strokeWidth="0.4" />
      <path d="M-3.6 -2.4 A4.4 4.4 0 0 1 -0.6 -4.4" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.85" />
      <circle cx="1.6" cy="2" r="3.6" fill="#000" opacity="0.18" />
    </svg>
  );
}

// Lightning crackling round the full ATP tube. Laid over the gauge button, 14px bigger on every side; the two sets of
// bolts flash in turn, and the whole thing bursts in once when the tube fills.
const SPARKS_A = [
  'M48 22 l5 -8 l4 4 l6 -10 l3 7 l7 -5',
  'M171 30 l6 -5 l-1 7 l6 -1 l-4 7 l5 3',
  'M84 50 l4 7 l5 -4 l5 8 l4 -5 l6 6',
  'M12 30 l-7 -4 l2 7 l-6 0 l5 6',
];
const SPARKS_B = [
  'M120 22 l-4 -8 l7 2 l-2 -9 l7 5 l4 -6',
  'M44 50 l-3 8 l6 -3 l0 9',
  'M140 50 l5 6 l3 -5 l6 7 l5 -3',
  'M35 10 l-4 -5 l6 0 l-3 -5',
];

function GaugeSparks() {
  const bolts = (paths) =>
    paths.map((d) => (
      <g key={d}>
        <path d={d} stroke="#facc15" strokeWidth="5" opacity="0.55" />
        <path d={d} stroke="#fffbe0" strokeWidth="1.8" />
      </g>
    ));
  return (
    <svg className="mg-gauge__sparks" viewBox="0 0 180 72" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="mg-gauge__sparks-a">{bolts(SPARKS_A)}</g>
      <g className="mg-gauge__sparks-b">{bolts(SPARKS_B)}</g>
    </svg>
  );
}

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

function Round({ q, duration, assisted, fire, onHit, onWrong, onMiss, onSpecial }) {
  const [state, setState] = useState({});
  const done = useRef(false);
  const [flyerGone, setFlyerGone] = useState(false);
  const flyerShot = useRef(false);
  const delays = useMemo(() => shuffle([0, 0.35, 0.7, 1.05]).map((d) => d + Math.random() * 0.25), []);
  const flyer = useMemo(() => ({ top: 10 + Math.random() * 24, delay: 1 + Math.random() * 1.5, rev: Math.random() < 0.5 }), []);

  useEffect(() => {
    if (!assisted) return;
    setState((s) => {
      const wrong = q.options.filter((o) => o !== q.answer && !s[o]).slice(0, 2);
      return { ...s, ...Object.fromEntries(wrong.map((o) => [o, 'gone'])) };
    });
  }, [assisted, q]);

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
          type="button"
          className={`mg-rider${state[opt] ? ` mg-rider--${state[opt]}` : ''}`}
          style={{ '--lane': k, '--color': COLORS[k][0], '--color-dark': COLORS[k][1], '--dur': `${duration}s`, '--delay': `${delays[k]}s` }}
          onPointerDown={(e) => {
            e.preventDefault();
            shoot(e.currentTarget, opt);
          }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && shoot(e.currentTarget, opt)}
          onAnimationEnd={(e) => landed(e, opt)}
          disabled={['good', 'bad', 'gone'].includes(state[opt])}
        >
          <span className="mg-rider__balloon">
            <AirshipArt />
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
              // the bomb blows away one wrong balloon that is still in play
              if (q.special === 'bomb') {
                setState((st) => {
                  const wrong = q.options.find((o) => o !== q.answer && !st[o]);
                  return wrong ? { ...st, [wrong]: 'gone' } : st;
                });
              }
              onSpecial(q.special, x, y);
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
    // right = clues answered right on the first try; each is worth 1 of the 10 points.
    i: 0, right: 0, roundWrong: false, lives: LIVES, atp: 0, over: false, mistakes: [],
  });
  const [, rerender] = useReducer((x) => x + 1, 0);
  const [assistFor, setAssistFor] = useState(-1);
  const [frozen, setFrozen] = useState(false);
  const [shake, setShake] = useState(false);
  const [casting, setCasting] = useState(0);
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
        summary: `${s.right}/${ROUNDS} clues right on the first try`,
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
        s.roundWrong = false;
        rerender();
      }
    }, 1000);

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
    setCasting((c) => c + 1);
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
    const firstTry = !s.roundWrong;
    if (firstTry) s.right += 1;
    s.atp = Math.min(ATP_MAX, s.atp + 1);
    onScore(scoreOutOf10(s.right, ROUNDS));
    fx.sound('pop');
    fx.sound('good');
    fx.burst(x, y, 16);
    fx.float(x, y - 24, firstTry ? '+1' : '✓', 'good');
    fx.say(s.atp === ATP_MAX ? 'ATP is full! Tap to use your power ⚡' : firstTry ? pick(PRAISE) : 'Got it, but no point this time', 'happy');
    rerender();
    nextRound();
  };

  const wrong = ({ opt, x, y }) => {
    s.roundWrong = true;
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
      fx.burst(x, y, 24, ICE);
      fx.say('Ice spell! Everything falls slower ❄️', 'wow');
      const setRate = (rate) =>
        skyRef.current?.getAnimations({ subtree: true }).forEach((a) => {
          if (a.animationName === 'mg-fall') a.playbackRate = rate;
        });
      setRate(0.35);
      setFrozen(true);
      later(() => {
        setRate(1);
        setFrozen(false);
      }, 3500);
    } else {
      fx.sound('boom');
      fx.vibrate([80, 40, 80]);
      fx.burst(x, y, 26, ['#1f2937', '#f97316', '#fbbf24', '#ef4444']);
      fx.float(x, y, '💥');
      fx.say('Boom! The bomb blew away a wrong balloon 💥', 'wow');
      setShake(true);
      later(() => setShake(false), 500);
    }
  };

  const fireAtp = () => {
    if (s.atp < ATP_MAX || s.over) return;
    s.atp = 0;
    setAssistFor(s.i);
    fx.sound('power');
    fx.say('ATP power! Two wrong balloons removed ⚡', 'wow');
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
        <TownArt layer="far" />
        <CastleArt layer="far" />
        <TownArt layer="near" />
        <CastleArt layer="near" />
        <div className="mg-sky__haze" aria-hidden="true" />
        <SkyClouds />
        {!s.over && (
          <Round
            key={s.i}
            q={q}
            duration={duration}
            assisted={assistFor === s.i}
            fire={fire}
            onHit={hit}
            onWrong={wrong}
            onMiss={miss}
            onSpecial={special}
          />
        )}
        <div className="mg-castle" aria-hidden="true" />
        <div ref={wizardRef} key={`wizard${casting}`} className={`mg-wizard${casting ? ' mg-wizard--cast' : ''}`} aria-hidden="true">
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
              <b>⚡</b>
            </span>
            <span className="mg-gauge__tube" aria-hidden="true">
              {Array.from({ length: ATP_MAX }, (_, k) => (
                <i key={k} className={k < s.atp ? 'mg-on' : undefined} />
              ))}
              {s.atp >= ATP_MAX && <span className="mg-gauge__tap">TAP!</span>}
            </span>
            {s.atp >= ATP_MAX && <GaugeSparks />}
          </button>
        </div>
      </div>
      <p className="mg-legend">
        🧙 Tap a balloon and the wizard zaps it · ✅ Right on the first try = 1 point · ❄️ Ice = slow motion · 💣 Bomb = removes 1 wrong balloon · ⚡ ATP removes 2 wrong balloons
      </p>
    </section>
  );
}
