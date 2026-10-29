import { useEffect, useMemo, useRef, useState } from 'react';
import { pick, useFx } from '../../fx/Fx.jsx';
import { TimerBar, useCountdown } from '../../components/Hud.jsx';
import { scoreOutOf10 } from '../meta.js';
import { sample, shuffle } from '../util.js';
import { PAIRS } from './data.js';

// Picture Match: every card is face up. Tap a picture, then the name (or feature) that belongs to it.
const TIME = 150;
const ROUND_BREAK_MS = 1400;
export const ROUNDS = [
  { id: 'name', title: 'Name it', hint: 'match each picture with its name', count: 6 },
  { id: 'clue', title: 'Key features', hint: 'match each picture with its key feature', count: 6 },
  { id: 'mix', title: 'Mix it up', hint: 'names and features mixed together!', count: 6 },
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
  const st = useRef({ misses: 0, found: 0, mistakes: [] });
  const timers = useRef([]);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const s = st.current;

  // Out of 10: pairs found over every pair plus every wrong match (unfound pairs count against you).
  const score = () => scoreOutOf10(s.found, TOTAL_PAIRS + s.misses);
  const [left] = useCountdown(TIME, { running: !between && !over, onExpire: () => end(false) });

  useEffect(() => {
    fx.say(`Round 1: ${ROUNDS[0].hint}. Tap a picture, then the words that go with it!`, 'happy');
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, [fx]);

  function end(completed) {
    if (s.over) return;
    s.over = true;
    setOver(true);
    fx.say(completed ? 'All pairs found! 🎉' : 'Time’s up! ⏰', completed ? 'wow' : 'sad');
    later(
      () =>
        onFinish(score(), {
          summary: `${s.found}/${TOTAL_PAIRS} pairs · ${s.misses} wrong`,
          mistakes: s.mistakes,
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
    fx.say(`Round ${round + 1} cleared! Next, round ${round + 2}: ${next.hint}`, 'wow');
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
      s.found += 1;
      onScore(score());
      const { x, y } = fx.centerOf(`[data-card="${card.uid}"]`);
      fx.sound('good');
      fx.burst(x, y, 20);
      fx.float(x, y - 20, '✓');
      fx.say(`${pick(['A match!', 'Great!', 'Sharp eyes!'])} ${pic.p.name}`, 'happy');
      const nextMatched = { ...matched, [pic.pair]: true };
      setMatched(nextMatched);
      if (Object.keys(nextMatched).length === deck.pics.length) roundCleared();
    } else {
      s.misses += 1;
      onScore(score());
      s.mistakes.push({ prompt: `What is this picture? (${ROUNDS[round].title})`, yours: text.text, answer: `${pic.p.name} — ${pic.p.clue}`, why: pic.p.why });
      fx.sound('bad');
      fx.vibrate(100);
      fx.say(pick(['Not a pair. Look at the picture again', 'Oops, those don’t match!', 'So close! 😅']), 'sad');
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
        </div>
      </div>
      {between && <p className="mg-peek-banner">✨ Round {round + 2} coming up…</p>}
      <div className={`mg-pmatch${between ? ' mg-pmatch--fade' : ''}`} key={round}>
        <div className="mg-pmatch__col">
          <p className="mg-pmatch__label">🖼️ Pictures</p>
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
          <p className="mg-pmatch__label">🏷️ {ROUNDS[round].id === 'name' ? 'Names' : ROUNDS[round].id === 'clue' ? 'Key features' : 'Names / key features'}</p>
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
