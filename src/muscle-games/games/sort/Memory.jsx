import { useEffect, useMemo, useRef, useState } from 'react';
import { pick, useFx } from '../../fx/Fx.jsx';
import { ComboMeter, TimerBar, comboMult, useCountdown } from '../../components/Hud.jsx';
import { sample, shuffle } from '../util.js';
import { PAIRS } from './data.js';

// Picture Match: every card is face up. Tap a picture, then the name (or feature) that belongs to it.
const TIME = 150;
const COMBO_CAP = 3;
const ROUND_BREAK_MS = 1400;
export const ROUNDS = [
  { id: 'name', title: 'Name it', hint: 'จับคู่ภาพกับชื่อ', count: 6 },
  { id: 'clue', title: 'Key features', hint: 'จับคู่ภาพกับลักษณะเด่น', count: 6 },
  { id: 'mix', title: 'Mix it up', hint: 'ชื่อและลักษณะเด่นปนกัน!', count: 6 },
];
export const TOTAL_PAIRS = ROUNDS.reduce((n, r) => n + r.count, 0);

function dealRound(round) {
  const pairs = sample(PAIRS, round.count);
  const pics = shuffle(pairs.map((p) => ({ uid: `${p.id}-pic`, pair: p.id, kind: 'pic', p })));
  const texts = shuffle(
    pairs.map((p) => {
      const side = round.id === 'mix' ? pick(['name', 'clue']) : round.id;
      return { uid: `${p.id}-txt`, pair: p.id, kind: 'text', text: p[side], p };
    })
  );
  return { pics, texts };
}

export default function Memory({ onScore, onFinish }) {
  const fx = useFx();
  const [round, setRound] = useState(0);
  const deck = useMemo(() => dealRound(ROUNDS[round]), [round]);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrongPair, setWrongPair] = useState([]);
  const [between, setBetween] = useState(false);
  const [over, setOver] = useState(false);
  const st = useRef({ score: 0, streak: 0, maxStreak: 0, misses: 0, found: 0, mistakes: [] });
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const s = st.current;

  const [left, , leftRef] = useCountdown(TIME, { running: !between && !over, onExpire: () => end(false) });

  useEffect(() => {
    fx.say(`รอบ 1: ${ROUNDS[0].hint} — แตะภาพ แล้วแตะคำที่คู่กัน!`, 'happy');
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, [fx]);

  function end(completed) {
    if (s.over) return;
    s.over = true;
    setOver(true);
    const bonus = completed ? Math.round(leftRef.current * 2) : 0;
    s.score += bonus;
    onScore(s.score);
    fx.say(completed ? `ครบทุกคู่! โบนัสเวลา +${bonus} ⏱` : 'หมดเวลาแล้ว! ⏰', completed ? 'wow' : 'sad');
    later(
      () =>
        onFinish(s.score, {
          summary: `${s.found}/${TOTAL_PAIRS} pairs · ${s.misses} wrong · time bonus +${bonus}`,
          mistakes: s.mistakes,
          stats: {
            memPerfect: completed && s.misses === 0,
            memFast: completed && leftRef.current >= 45,
            maxStreak: s.maxStreak,
          },
        }),
      1100
    );
  }

  const roundCleared = () => {
    if (round + 1 >= ROUNDS.length) {
      end(true);
      return;
    }
    const next = ROUNDS[round + 1];
    setBetween(true);
    fx.sound('win');
    fx.say(`ผ่านรอบ ${round + 1}! ต่อไป รอบ ${round + 2}: ${next.hint}`, 'wow');
    later(() => {
      setRound(round + 1);
      setMatched({});
      setSelected(null);
      setBetween(false);
    }, ROUND_BREAK_MS);
  };

  const tap = (card) => {
    if (between || over || matched[card.pair] || wrongPair.length) return;
    if (!selected || selected.uid === card.uid || selected.kind === card.kind) {
      fx.sound('flip');
      setSelected(selected?.uid === card.uid ? null : card);
      return;
    }
    const [pic, text] = card.kind === 'pic' ? [card, selected] : [selected, card];
    setSelected(null);
    if (pic.pair === text.pair) {
      s.streak += 1;
      s.found += 1;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
      const mult = comboMult(s.streak, COMBO_CAP);
      const pts = 20 * mult;
      s.score += pts;
      onScore(s.score);
      const { x, y } = fx.centerOf(`[data-card="${card.uid}"]`);
      fx.sound(mult > 1 ? 'combo' : 'good', mult);
      fx.burst(x, y, 20);
      fx.float(x, y - 20, `+${pts}${mult > 1 ? ` ×${mult}` : ''}`);
      fx.say(mult > 1 ? `คอมโบ ×${mult}! 🔥 ${pic.p.name}` : `${pick(['ถูกคู่!', 'เยี่ยม!', 'ตาไวมาก!'])} ${pic.p.name}`, mult > 1 ? 'wow' : 'happy');
      const nextMatched = { ...matched, [pic.pair]: true };
      setMatched(nextMatched);
      if (Object.keys(nextMatched).length === deck.pics.length) roundCleared();
    } else {
      s.streak = 0;
      s.misses += 1;
      s.mistakes.push({ prompt: `ภาพนี้คืออะไร? (${ROUNDS[round].title})`, yours: text.text, answer: `${pic.p.name} — ${pic.p.clue}`, why: pic.p.why });
      fx.sound('bad');
      fx.vibrate(100);
      fx.say(pick(['ไม่ใช่คู่กัน ลองดูภาพอีกทีนะ', 'อุ๊ย คนละคู่!', 'เกือบแล้ว! 😅']), 'sad');
      setWrongPair([pic.uid, text.uid]);
      later(() => setWrongPair([]), 700);
    }
  };

  const cardClass = (c) =>
    `mg-pcard mg-pcard--${c.kind}${selected?.uid === c.uid ? ' mg-pcard--selected' : ''}${matched[c.pair] ? ' mg-pcard--matched' : ''}${
      wrongPair.includes(c.uid) ? ' mg-pcard--wrong' : ''
    }`;

  return (
    <section className="mg-memory">
      <div className="mg-hud">
        <TimerBar left={left} total={TIME} />
        <div className="mg-hud__row">
          <span className="mg-hud__q">
            🖼️ Round {round + 1}/{ROUNDS.length} · {ROUNDS[round].title} · {Object.keys(matched).length}/{deck.pics.length}
          </span>
          <ComboMeter streak={s.streak} cap={COMBO_CAP} />
        </div>
      </div>
      {between && <p className="mg-peek-banner">✨ Round {round + 2} coming up…</p>}
      <div className={`mg-pmatch${between ? ' mg-pmatch--fade' : ''}`} key={round}>
        <div className="mg-pmatch__col">
          <p className="mg-pmatch__label">🖼️ ภาพ</p>
          <div className="mg-pmatch__grid">
            {deck.pics.map((c) => (
              <button
                key={c.uid}
                type="button"
                data-card={c.uid}
                className={cardClass(c)}
                onClick={() => tap(c)}
                aria-pressed={selected?.uid === c.uid}
                aria-label={matched[c.pair] ? `Picture: ${c.p.name} (matched)` : 'Picture card'}
              >
                <c.p.Art />
              </button>
            ))}
          </div>
        </div>
        <div className="mg-pmatch__col">
          <p className="mg-pmatch__label">🏷️ {ROUNDS[round].id === 'name' ? 'ชื่อ' : ROUNDS[round].id === 'clue' ? 'ลักษณะเด่น' : 'ชื่อ / ลักษณะเด่น'}</p>
          <div className="mg-pmatch__grid">
            {deck.texts.map((c) => (
              <button
                key={c.uid}
                type="button"
                data-card={c.uid}
                className={cardClass(c)}
                onClick={() => tap(c)}
                aria-pressed={selected?.uid === c.uid}
              >
                <strong>{c.text}</strong>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
