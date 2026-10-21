import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { sample, shuffle } from './util.js';
import { GOLD, ICE, pick, useFx } from '../fx/Fx.jsx';
import { ComboMeter, Lives, TimerBar, comboMult, useCountdown } from '../components/Hud.jsx';

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
const COLORS = ['#c084fc', '#f472b6', '#7dd3fc', '#fdba74'];
const PRAISE = ['เยี่ยมมาก! 🎯', 'แม่นสุด ๆ!', 'ถูกต้อง! 💪', 'เก่งจัง!', 'ปังมาก!'];
const OOPS = ['อุ๊ย! ยังไม่ใช่', 'เกือบแล้ว ลองอีกลูก!', 'ไม่ใช่ลูกนั้นนะ 😅'];

function buildQuestions() {
  return sample(CLUES, ROUNDS).map((c, i) => {
    const pool = PROPERTIES.includes(c.answer) ? PROPERTIES : FUNCTIONS;
    const wrong = sample(pool.filter((p) => p !== c.answer), 3);
    const roll = Math.random();
    return {
      ...c,
      options: shuffle([c.answer, ...wrong]),
      golden: Math.random() < 0.4 ? Math.floor(Math.random() * 4) : -1,
      special: i === 0 ? null : roll < 0.3 ? 'ice' : roll < 0.55 ? 'bomb' : null,
    };
  });
}

function Round({ q, duration, assisted, fire, onHit, onWrong, onMiss, onSpecial }) {
  const [state, setState] = useState({});
  const done = useRef(false);
  const started = useRef(performance.now());
  const delays = useMemo(() => shuffle([0, 0.35, 0.7, 1.05]).map((d) => d + Math.random() * 0.25), []);
  const flyer = useMemo(() => ({ top: 12 + Math.random() * 26, delay: 1 + Math.random() * 1.5, rev: Math.random() < 0.5 }), []);
  const [flyerHit, setFlyerHit] = useState(false);

  useEffect(() => {
    if (!assisted) return;
    setState((s) => {
      const wrong = q.options.filter((o) => o !== q.answer && !s[o]).slice(0, 2);
      return { ...s, ...Object.fromEntries(wrong.map((o) => [o, 'gone'])) };
    });
  }, [assisted, q]);

  const shoot = (el, opt, k) => {
    if (done.current || state[opt]) return;
    setState((s) => ({ ...s, [opt]: 'aim' }));
    fire(el, (x, y) => {
      if (done.current) return;
      if (opt === q.answer) {
        done.current = true;
        setState((s) => ({ ...s, [opt]: 'good' }));
        const flight = (performance.now() - started.current) / 1000 - delays[k];
        onHit({ bonus: Math.max(0, Math.round(5 * (1 - flight / duration))), golden: k === q.golden, x, y });
      } else {
        setState((s) => ({ ...s, [opt]: 'bad' }));
        onWrong({ opt, x, y });
      }
    });
  };

  const escaped = (e, opt) => {
    if (e.animationName !== 'mg-rise' || opt !== q.answer || done.current) return;
    done.current = true;
    onMiss();
  };

  return (
    <div className="mg-sky__balloons">
      {q.options.map((opt, k) => (
        <button
          key={opt}
          type="button"
          className={`mg-balloon${k === q.golden ? ' mg-balloon--gold' : ''}${state[opt] ? ` mg-balloon--${state[opt]}` : ''}`}
          style={{ '--lane': k, '--color': COLORS[k], '--dur': `${duration}s`, '--delay': `${delays[k]}s` }}
          onPointerDown={(e) => {
            e.preventDefault();
            shoot(e.currentTarget, opt, k);
          }}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && shoot(e.currentTarget, opt, k)}
          onAnimationEnd={(e) => escaped(e, opt)}
          disabled={['good', 'bad', 'gone'].includes(state[opt])}
        >
          {k === q.golden && <span className="mg-balloon__star" aria-hidden="true">⭐</span>}
          <span>{opt}</span>
        </button>
      ))}
      {q.special && !flyerHit && (
        <button
          type="button"
          className={`mg-flyer mg-flyer--${q.special}${flyer.rev ? ' mg-flyer--rev' : ''}`}
          style={{ top: `${flyer.top}%`, '--fdelay': `${flyer.delay}s` }}
          onPointerDown={(e) => {
            e.preventDefault();
            if (flyerHit) return;
            setFlyerHit(true);
            fire(e.currentTarget, (x, y) => onSpecial(q.special, x, y));
          }}
          aria-label={q.special === 'ice' ? 'Ice balloon: slows every balloon' : 'Bomb balloon: costs a life'}
        >
          <span aria-hidden="true">{q.special === 'ice' ? '❄️' : '💣'}</span>
        </button>
      )}
    </div>
  );
}

export default function BalloonPop({ onScore, onFinish }) {
  const fx = useFx();
  const questions = useMemo(buildQuestions, []);
  const st = useRef({
    i: 0, score: 0, lives: LIVES, correct: 0, wrong: 0, misses: 0, streak: 0, maxStreak: 0,
    golden: 0, ice: 0, atpUsed: 0, atp: 0, over: false, mistakes: [],
  });
  const [, rerender] = useReducer((x) => x + 1, 0);
  const [assistFor, setAssistFor] = useState(-1);
  const [frozen, setFrozen] = useState(false);
  const [shake, setShake] = useState(false);
  const skyRef = useRef(null);
  const launcherRef = useRef(null);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const s = st.current;
  const q = questions[s.i];
  const duration = Math.max(5, 8.5 - s.i * 0.35);
  const [left] = useCountdown(TIME, { running: !s.over, onExpire: () => end('หมดเวลาแล้ว! ⏰') });

  function end(line) {
    if (s.over) return;
    s.over = true;
    if (line) fx.say(line, 'sad');
    rerender();
    later(() => {
      onFinish(s.score, {
        summary: `${s.correct}/${ROUNDS} correct · best streak ${s.maxStreak}`,
        mistakes: s.mistakes,
        stats: {
          perfect: s.correct === ROUNDS && s.wrong === 0 && s.misses === 0,
          maxStreak: s.maxStreak,
          golden: s.golden,
          ice: s.ice,
          atp: s.atpUsed,
        },
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

  const loseLife = () => {
    s.lives -= 1;
    rerender();
    if (s.lives <= 0) end('หัวใจหมดแล้ว 💔');
  };

  // Shoot a dart from the launcher at an element, then resolve the hit where it lands.
  const fire = (el, land) => {
    const sky = skyRef.current;
    if (!sky) return;
    const box = sky.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const tx = r.left + r.width / 2 - box.left;
    const ty = r.top + r.height / 2 - box.top;
    const sx = box.width / 2;
    const sy = box.height - 36;
    const angle = (Math.atan2(ty - sy, tx - sx) * 180) / Math.PI + 90;
    if (launcherRef.current) launcherRef.current.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    const dart = document.createElement('div');
    dart.className = 'mg-dart';
    sky.appendChild(dart);
    fx.sound('whoosh');
    const anim = dart.animate(
      [
        { transform: `translate(${sx}px, ${sy}px) rotate(${angle}deg)` },
        { transform: `translate(${tx}px, ${ty}px) rotate(${angle}deg)` },
      ],
      { duration: 170, easing: 'ease-in' }
    );
    anim.onfinish = () => {
      dart.remove();
      land(tx + box.left, ty + box.top);
    };
  };

  const hit = ({ bonus, golden, x, y }) => {
    s.streak += 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.correct += 1;
    if (golden) s.golden += 1;
    const mult = comboMult(s.streak);
    const pts = (10 + bonus) * mult * (golden ? 2 : 1);
    s.score += pts;
    s.atp = Math.min(ATP_MAX, s.atp + 1);
    onScore(s.score);
    fx.sound('pop');
    fx.sound(mult > 1 || golden ? 'combo' : 'good', mult);
    fx.burst(x, y, golden ? 34 : 16, golden ? GOLD : undefined);
    fx.float(x, y - 24, `+${pts}${mult > 1 ? ` ×${mult}` : ''}${golden ? ' ⭐' : ''}`, golden ? 'gold' : 'good');
    fx.say(
      golden ? 'บอลลูนทอง! คะแนน ×2 ✨' : mult > 1 ? `คอมโบ ×${mult}! ไฟลุกแล้ว 🔥` : s.atp === ATP_MAX ? 'ATP เต็มแล้ว! กดใช้พลังได้เลย ⚡' : pick(PRAISE),
      golden || mult > 2 ? 'wow' : 'happy'
    );
    rerender();
    nextRound();
  };

  const wrong = ({ opt, x, y }) => {
    s.wrong += 1;
    s.streak = 0;
    s.mistakes.push({ prompt: q.text, yours: opt, answer: q.answer });
    fx.sound('pop');
    fx.sound('bad');
    fx.vibrate(120);
    fx.float(x, y, '✗', 'bad');
    fx.say(pick(OOPS), 'sad');
    loseLife();
  };

  const miss = () => {
    s.misses += 1;
    s.streak = 0;
    s.mistakes.push({ prompt: q.text, yours: 'ปล่อยให้ลอยหนีไป', answer: q.answer });
    fx.sound('bad');
    fx.vibrate(120);
    fx.say(`หลุดไปแล้ว! คำตอบคือ ${q.answer}`, 'sad');
    loseLife();
    nextRound();
  };

  const special = (kind, x, y) => {
    if (s.over) return;
    if (kind === 'ice') {
      s.ice += 1;
      fx.sound('pop');
      fx.sound('freeze');
      fx.burst(x, y, 24, ICE);
      fx.say('บอลลูนน้ำแข็ง! ทุกลูกลอยช้าลง ❄️', 'wow');
      const setRate = (rate) =>
        skyRef.current?.getAnimations({ subtree: true }).forEach((a) => {
          if (a.animationName === 'mg-rise') a.playbackRate = rate;
        });
      setRate(0.35);
      setFrozen(true);
      later(() => {
        setRate(1);
        setFrozen(false);
      }, 3500);
    } else {
      s.streak = 0;
      fx.sound('boom');
      fx.vibrate([80, 40, 80]);
      fx.burst(x, y, 26, ['#1f2937', '#f97316', '#fbbf24', '#ef4444']);
      fx.float(x, y, '💥', 'bad');
      fx.say('ตู้ม! โดนระเบิด เสียหัวใจ 1 ดวง', 'sad');
      setShake(true);
      later(() => setShake(false), 500);
      loseLife();
    }
  };

  const fireAtp = () => {
    if (s.atp < ATP_MAX || s.over) return;
    s.atp = 0;
    s.atpUsed += 1;
    setAssistFor(s.i);
    fx.sound('power');
    fx.say('พลัง ATP! ตัดตัวเลือกผิดออก 2 ลูก ⚡', 'wow');
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
          <Lives lives={s.lives} max={LIVES} />
          <ComboMeter streak={s.streak} />
        </div>
      </div>

      <div className="mg-prompt">
        <p className="mg-prompt__label">🎯 Shoot the balloon that matches:</p>
        <p className="mg-prompt__text" key={s.i}>
          {q.text}
        </p>
      </div>

      <div ref={skyRef} className={`mg-sky${frozen ? ' mg-sky--frozen' : ''}${shake ? ' mg-shake' : ''}`}>
        <div className="mg-sky__cloud mg-sky__cloud--a" aria-hidden="true" />
        <div className="mg-sky__cloud mg-sky__cloud--b" aria-hidden="true" />
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
        <div ref={launcherRef} className="mg-launcher" aria-hidden="true">
          <span className="mg-launcher__dart" />
        </div>
        <button
          type="button"
          className={`mg-atp${s.atp >= ATP_MAX ? ' mg-atp--ready' : ''}`}
          onClick={fireAtp}
          disabled={s.atp < ATP_MAX || s.over}
          aria-label={`ATP power ${s.atp} of ${ATP_MAX}. ${s.atp >= ATP_MAX ? 'Ready: removes two wrong balloons' : 'Answer correctly to charge'}`}
        >
          <span className="mg-atp__icon" aria-hidden="true">⚡</span>
          <span className="mg-atp__cells" aria-hidden="true">
            {Array.from({ length: ATP_MAX }, (_, k) => (
              <i key={k} className={k < s.atp ? 'mg-on' : undefined} />
            ))}
          </span>
          <span className="mg-atp__label">{s.atp >= ATP_MAX ? 'USE ATP' : 'ATP'}</span>
        </button>
      </div>
      <p className="mg-legend">⭐ Gold = points ×2 · ❄️ Ice = slow motion · 💣 Bomb = lose a heart · ⚡ ATP removes 2 wrong balloons</p>
    </section>
  );
}
