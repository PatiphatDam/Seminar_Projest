import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { pick, useFx } from '../../fx/Fx.jsx';
import { DragGhost, useDragDrop } from '../../fx/drag.jsx';
import { ComboMeter, Lives, TimerBar, comboMult, useCountdown } from '../../components/Hud.jsx';
import { shuffle } from '../util.js';
import { GROUPS, IMAGE_CARDS, TEXT_CARDS, groupLabel } from './data.js';

const TIME = 60;
const LIVES = 3;

function CardFace({ card }) {
  return card.Art ? <card.Art /> : <span>{card.text}</span>;
}

export default function Conveyor({ onScore, onFinish }) {
  const fx = useFx();
  const pool = useMemo(() => shuffle([...IMAGE_CARDS, ...TEXT_CARDS]), []);
  const [belt, setBelt] = useState([]);
  const [selected, setSelected] = useState(null);
  const [binFx, setBinFx] = useState({});
  const [over, setOver] = useState(false);
  const st = useRef({ score: 0, streak: 0, maxStreak: 0, sorted: 0, wrong: 0, fell: 0, lives: LIVES, mistakes: [], n: 0, t0: performance.now() });
  const [, rerender] = useReducer((x) => x + 1, 0);
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const s = st.current;
  const beltRef = useRef(belt);
  beltRef.current = belt;
  const overRef = useRef(false);

  const [left] = useCountdown(TIME, { running: !over, onExpire: () => end('หมดเวลา! ⏰') });

  useEffect(() => {
    fx.say('ลากการ์ดลงตะกร้า หรือแตะตะกร้าเพื่อคัดใบที่เรืองแสง!', 'happy');
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
          summary: `${s.sorted} cards sorted · ${s.wrong + s.fell} missed`,
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
    if (s.lives <= 0) end('หัวใจหมดแล้ว 💔');
  };

  const flashBin = (bin, kind) => {
    setBinFx((f) => ({ ...f, [bin]: kind }));
    later(() => setBinFx((f) => ({ ...f, [bin]: null })), 450);
  };

  const sort = (uid, bin) => {
    if (overRef.current) return;
    const item = beltRef.current.find((c) => c.uid === uid);
    if (!item) return;
    setBelt((b) => b.filter((c) => c.uid !== uid));
    setSelected(null);
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
      if (mult > 1 && s.streak % 3 === 0) fx.say(`คอมโบ ×${mult}! มือไวมาก 🔥`, 'wow');
      else if (s.sorted % 4 === 0) fx.say(pick(['คัดเก่งมาก!', 'สายพานเร็วขึ้นแล้วนะ!', 'ไปต่อ! 💪']), 'happy');
      flashBin(bin, 'good');
      rerender();
    } else {
      s.wrong += 1;
      s.mistakes.push({ prompt: item.card.text, yours: groupLabel(bin), answer: groupLabel(item.card.answer), why: item.card.why });
      fx.sound('bad');
      fx.vibrate(120);
      fx.float(x, y - 30, '✗', 'bad');
      fx.say(`ไม่ใช่ ${groupLabel(bin)} — เป็น ${groupLabel(item.card.answer)} นะ`, 'sad');
      flashBin(bin, 'bad');
      loseLife();
    }
  };

  const fell = (uid) => {
    const item = beltRef.current.find((c) => c.uid === uid);
    if (!item || overRef.current) return;
    setBelt((b) => b.filter((c) => c.uid !== uid));
    s.fell += 1;
    s.mistakes.push({ prompt: item.card.text, yours: 'ตกสายพาน', answer: groupLabel(item.card.answer), why: item.card.why });
    fx.sound('bad');
    fx.vibrate(100);
    fx.say('ร่วงไปหนึ่งใบ! 😱', 'sad');
    loseLife();
  };

  const { drag, hot, start, isTap } = useDragDrop((uid, target) => {
    if (target.startsWith('bin-')) sort(uid, target.slice(4));
  });

  const lead = belt.find((c) => c.uid === selected) ?? belt[0];

  const tapBin = (bin) => {
    if (lead) sort(lead.uid, bin);
  };

  const dragged = drag && belt.find((c) => c.uid === drag.id);

  return (
    <section className="mg-conveyor">
      <div className="mg-hud">
        <TimerBar left={left} total={TIME} />
        <div className="mg-hud__row">
          <span className="mg-hud__q">📦 {s.sorted} sorted</span>
          <Lives lives={s.lives} max={LIVES} />
          <ComboMeter streak={s.streak} />
        </div>
      </div>

      <div className={`mg-belt${over ? ' mg-belt--stopped' : ''}`}>
        <div className="mg-belt__track" aria-hidden="true" />
        {belt.map((c) => (
          <button
            key={c.uid}
            type="button"
            className={`mg-belt-card${c.card.Art ? ' mg-belt-card--art' : ''}${lead?.uid === c.uid ? ' mg-belt-card--lead' : ''}${
              drag?.id === c.uid ? ' mg-belt-card--drag' : ''
            }`}
            style={{ '--dur': `${c.dur}s` }}
            onAnimationEnd={(e) => e.animationName === 'mg-belt' && fell(c.uid)}
            onPointerDown={(e) => {
              const el = e.currentTarget;
              start(e, c.uid, {
                onStart: () => {
                  el.style.animationPlayState = 'paused';
                },
                onCancel: () => {
                  el.style.animationPlayState = '';
                },
              });
            }}
            onClick={() => isTap() && setSelected(c.uid)}
            aria-label={c.card.Art ? 'Tissue picture card' : c.card.text}
          >
            <CardFace card={c.card} />
          </button>
        ))}
      </div>

      <div className="mg-bins">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            data-drop={`bin-${g.id}`}
            className={`mg-bin mg-bin--${g.id}${hot === `bin-${g.id}` ? ' mg-bin--hot' : ''}${binFx[g.id] ? ` mg-bin--${binFx[g.id]}` : ''}`}
            onClick={() => tapBin(g.id)}
            disabled={over}
          >
            <span className="mg-bin__art" aria-hidden="true">
              <g.Art />
            </span>
            <span className="mg-bin__label">{g.label}</span>
          </button>
        ))}
      </div>
      <p className="mg-legend">Drag a card into a bin, or tap a bin to sort the glowing card. Tap a card first to choose a different one.</p>

      <DragGhost drag={drag} className={`mg-belt-card mg-belt-card--ghost${dragged?.card.Art ? ' mg-belt-card--art' : ''}`}>
        {dragged && <CardFace card={dragged.card} />}
      </DragGhost>
    </section>
  );
}
