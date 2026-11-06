import { useEffect, useRef, useState } from 'react';
import { useFx } from '../../fx/Fx.jsx';
import { scoreOutOf10 } from '../meta.js';
import { DECOYS, STEPS, TOTAL_ANSWERS, art } from './levels.js';

// Diameter: zoom into a skeletal muscle in five steps (whole muscle → fascicle → muscle fiber → myofibril →
// sarcomere). Each step is a shape-fit puzzle on a grey render of the site's 3D model: a clue gives a part's function,
// the student finds that piece among the real pieces and decoys in the tray and drags it (or taps it, then taps its
// place) onto the model, where it snaps in and takes its colour. When the last piece is in, "Stage cleared" shows and
// the game zooms into the next step by itself, like Group Sort. Out of 10 = pieces placed right at the first try over
// all pieces of the five steps. A wrong answer is just wrong: try again, no point lost, no time added, no hints. The
// clock counts down from 6 minutes; when it runs out the game ends and pieces not placed count as not right.
const W = 900; // every render is 900 x 600
const H = 600;
// shapes are tested on a half-size copy: a quarter of the pixels to read when a step loads (a 1-px slip is 2 px)
const MW = W / 2;
const MH = H / 2;
const TIME = 360; // seconds
const CLEARED_MS = 2200; // how long "Stage cleared" shows before the zoom
const mmss = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((v) => v[1]);

// The alpha of a piece's render (where it is opaque, it is that part) and its bounding box.
const masks = new Map();
function loadMask(name) {
  if (masks.has(name)) return masks.get(name);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = MW;
      c.height = MH;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, MW, MH);
      const d = x.getImageData(0, 0, MW, MH).data;
      const a = new Uint8Array(MW * MH);
      let x0 = MW;
      let y0 = MH;
      let x1 = 0;
      let y1 = 0;
      for (let i = 0; i < MW * MH; i++) {
        a[i] = d[i * 4 + 3];
        if (a[i] > 30) {
          const px = i % MW;
          const py = (i / MW) | 0;
          if (px < x0) x0 = px;
          if (px > x1) x1 = px;
          if (py < y0) y0 = py;
          if (py > y1) y1 = py;
        }
      }
      const t = document.createElement('canvas');
      t.width = x1 - x0 + 3;
      t.height = y1 - y0 + 3;
      t.getContext('2d').drawImage(c, x0 - 1, y0 - 1, t.width, t.height, 0, 0, t.width, t.height);
      // the box in full-size pixels
      resolve({ a, box: { x0: x0 * 2, y0: y0 * 2, x1: x1 * 2 + 1, y1: y1 * 2 + 1 }, thumb: t.toDataURL() });
    };
    img.onerror = () => resolve(null);
    img.src = art(name);
  });
  masks.set(name, p);
  return p;
}
// Where each part's number sits on the picture: on a solid bit of the part near its middle, and at least 76 px of the
// render from the numbers already placed (wrapping layers share their middle with what they wrap), so two numbers
// never overlap even on a phone. In %.
function markerSpots(list) {
  const placed = [];
  return list.map((mask) => {
    if (!mask) return null;
    const { a, box } = mask;
    const solid = (x, y) => a[y * MW + x] > 120 && a[y * MW + x - 3] > 120 && a[y * MW + x + 3] > 120 && a[(y - 3) * MW + x] > 120 && a[(y + 3) * MW + x] > 120;
    const cx = (box.x0 + box.x1) / 4;
    const cy = (box.y0 + box.y1) / 4;
    const spots = [];
    const collect = (ok) => {
      for (let y = 14; y < MH - 14; y += 2) for (let x = 14; x < MW - 14; x += 2) if (ok(x, y)) spots.push([x, y, (x - cx) ** 2 + (y - cy) ** 2]);
    };
    collect(solid);
    if (!spots.length) collect((x, y) => a[y * MW + x] > 60); // thin parts (titin) have no solid bit
    spots.sort((p, q) => p[2] - q[2]);
    const free = spots.find(([x, y]) => placed.every(([px, py]) => (x - px) ** 2 + (y - py) ** 2 >= 38 ** 2)) ?? spots[0];
    if (!free) return null;
    placed.push(free);
    return { left: `${(free[0] / MW) * 100}%`, top: `${(free[1] / MH) * 100}%` };
  });
}
// Is the point (fractions of the picture) on the part — within `reach` mask px (7 = 14 px of the render), so a finger
// need not be pixel-perfect?
function onPart(mask, fx, fy, reach = 7) {
  if (!mask) return false;
  const cx = Math.round(fx * MW);
  const cy = Math.round(fy * MH);
  for (let dy = -reach; dy <= reach; dy += 3.5)
    for (let dx = -reach; dx <= reach; dx += 3.5) {
      const x = Math.round(cx + dx);
      const y = Math.round(cy + dy);
      if (x >= 0 && y >= 0 && x < MW && y < MH && mask.a[y * MW + x] > 30) return true;
    }
  return false;
}

// A piece in the tray: drag it onto the picture, or tap it to pick it up.
function Piece({ piece, picked, done, wrong, onPick, onDrop }) {
  const drag = useRef(null);
  const down = (e) => {
    if (done) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ghost: null };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    if (!d.ghost && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) {
      d.ghost = document.createElement('img');
      d.ghost.className = 'mg-zp__ghost';
      d.ghost.src = piece.thumb;
      d.ghost.alt = '';
      document.body.appendChild(d.ghost);
    }
    if (d.ghost) {
      d.ghost.style.left = `${e.clientX}px`;
      d.ghost.style.top = `${e.clientY}px`;
    }
  };
  const up = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.ghost) {
      d.ghost.remove();
      onDrop(piece, e.clientX, e.clientY);
    } else onPick(piece);
  };
  const cancel = () => {
    drag.current?.ghost?.remove();
    drag.current = null;
  };
  return (
    <button
      type="button"
      className={`mg-zp__piece${picked ? ' mg-zp__piece--picked' : ''}${done ? ' mg-zp__piece--done' : ''}${wrong ? ' mg-zp__piece--wrong' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      disabled={done}
      aria-label={`Piece ${piece.n}`}
      data-piece={piece.id}
      aria-pressed={picked}
    >
      <img className="mg-zp__thumb" src={piece.thumb} alt="" draggable="false" />
    </button>
  );
}

export default function Diameter({ onScore, onFinish, runId, setExitReport }) {
  const fx = useFx();
  const st = useRef({ runId, right: 0, answered: 0, mistakes: [], done: false, t0: null }); // t0: when the first model is on screen
  const s = st.current;
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const [pieces, setPieces] = useState([]); // the tray, shuffled
  const [marks, setMarks] = useState({}); // part id -> { n, left, top }: the numbers on the picture
  const [ready, setReady] = useState(false);
  const [placed, setPlaced] = useState([]); // part ids in the picture
  const [partIdx, setPartIdx] = useState(0); // which clue
  const [cleared, setCleared] = useState(false); // every piece of this stage is in place
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [msg, setMsg] = useState('');
  const [pops, setPops] = useState([]);
  const [zooming, setZooming] = useState(false);
  const [left, setLeft] = useState(TIME); // seconds left
  const stepNow = useRef(0); // stepIdx for the clock's interval, which keeps its first render's closure
  const firstTry = useRef(true);
  const stageRef = useRef(null);
  const endRef = useRef(null); // the Stage cleared card
  const maskOf = useRef({});

  const score = () => scoreOutOf10(s.right, TOTAL_ANSWERS);
  stepNow.current = stepIdx;
  const report = (timeUp) => ({
    runId: s.runId,
    summary: `${s.right}/${TOTAL_ANSWERS} right first time · ${Math.min(stepNow.current + 1, STEPS.length)}/${STEPS.length} steps${timeUp ? " · time's up" : ''}`,
    mistakes: s.mistakes,
  });

  useEffect(() => {
    // Leaving after at least one answer still saves the run.
    setExitReport?.(() => (!s.done && s.answered > 0 ? { score: score(), info: report() } : null));
    const id = setInterval(() => {
      if (s.t0 == null) return;
      const t = Math.max(0, TIME - Math.floor((performance.now() - s.t0) / 1000));
      setLeft(t);
      if (t === 0) {
        clearInterval(id);
        finish(true);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a new step: load the masks of its parts and decoys, then deal the tray
  useEffect(() => {
    let live = true;
    setReady(false);
    fx.say(step.say, 'happy');
    const list = [
      ...step.parts.map((p) => ({ id: p.id, art: `${step.id}-${p.id}` })),
      ...step.decoys.map((d) => ({ id: `decoy:${d}`, art: DECOYS[d].art, decoy: d })),
    ];
    Promise.all(list.map((p) => loadMask(p.art))).then((ms) => {
      if (!live) return;
      maskOf.current = Object.fromEntries(list.map((p, k) => [p.art, ms[k]]));
      // numbered spots in a shuffled order, so a number never tells which clue comes next
      const order = shuffle(step.parts.map((p) => p.id));
      const spots = markerSpots(order.map((id) => maskOf.current[`${step.id}-${id}`]));
      setMarks(Object.fromEntries(order.map((id, k) => [id, { n: k + 1, ...spots[k] }])));
      s.stepRight = s.right;
      s.stepAnswered = s.answered;
      setPieces(shuffle(list).map((p, k) => ({ ...p, n: k + 1, thumb: maskOf.current[p.art]?.thumb ?? art(p.art) })));
      setReady(true);
      if (s.t0 == null) s.t0 = performance.now();
    });
    return () => {
      live = false;
    };
  }, [step, fx]);

  // Like Group Sort: when the last piece snaps in, "Stage cleared" shows and the game zooms into the next stage by
  // itself (or ends after the last). No button, nothing else to tap.
  const advance = useRef(null);
  useEffect(() => {
    if (!cleared) return undefined;
    const show = setTimeout(() => endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 120);
    const go = setTimeout(() => advance.current?.(), CLEARED_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(go);
    };
  }, [cleared]);

  const at = (clientX, clientY) => {
    const r = stageRef.current.getBoundingClientRect();
    if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) return null;
    return { fx: (clientX - r.left) / r.width, fy: (clientY - r.top) / r.height, px: clientX - r.left, py: clientY - r.top, x: clientX, y: clientY };
  };
  const pop = (text, p, bad) => {
    const id = Math.random();
    setPops((ps) => [...ps, { id, text, x: p.px, y: p.py, bad }]);
    setTimeout(() => setPops((ps) => ps.filter((q) => q.id !== id)), 1000);
  };

  // One answer per clue: it is right only if right at the first try. A wrong try is just wrong: no point lost, no time
  // added; only the first is listed for review.
  const answer = (ok, p, mistake) => {
    const first = firstTry.current;
    if (first) s.answered += 1;
    if (ok && first) s.right += 1;
    if (!ok) {
      firstTry.current = false;
      if (mistake && first) s.mistakes.push(mistake);
      fx.sound('bad');
      fx.vibrate(100);
      pop('✗ Wrong', p, true);
    } else {
      fx.sound('snap');
      fx.burst(p.x, p.y, 14);
      pop(first ? '✓ Right' : '✓', p);
    }
    onScore(score());
  };

  const tryPiece = (piece, p) => {
    if (cleared) return;
    const want = step.parts[partIdx];
    const ok = piece.id === want.id && onPart(maskOf.current[`${step.id}-${want.id}`], p.fx, p.fy);
    if (ok) {
      answer(true, p);
      setPlaced((pl) => [...pl, want.id]);
      setPicked(null);
      setMsg(`✓ ${want.name}`);
      firstTry.current = true;
      if (partIdx + 1 < step.parts.length) setPartIdx(partIdx + 1);
      else {
        setCleared(true);
        fx.sound('win');
      }
      return;
    }
    const d = piece.decoy && DECOYS[piece.decoy];
    answer(false, p, { prompt: want.clue, yours: d ? d.name : piece.id === want.id ? `${want.name}, in the wrong place` : step.parts.find((x) => x.id === piece.id)?.name, answer: want.name });
    setWrong(piece.id);
    setTimeout(() => setWrong(null), 400);
    setMsg(d ? `✗ That is the ${d.name} — ${d.why}.` : piece.id === want.id ? '✗ Right piece, wrong place — match its shape on the model.' : '✗ Not this piece — read the clue again.');
  };

  const dropPiece = (piece, clientX, clientY) => {
    const p = at(clientX, clientY);
    if (p) tryPiece(piece, p);
  };
  const pickPiece = (piece) => {
    if (cleared) return;
    setPicked(piece);
    setMsg('Now tap where it goes on the model');
  };
  // tap on the picture: drop the picked piece there
  const tapStage = (e) => {
    const p = at(e.clientX, e.clientY);
    if (p && picked) tryPiece(picked, p);
  };

  function finish(timeUp) {
    if (s.done) return;
    s.done = true;
    onFinish(score(), report(timeUp));
  }
  const goNext = () => {
    if (stepIdx + 1 >= STEPS.length) {
      finish();
      return;
    }
    setZooming(true);
    fx.sound('whoosh');
    setTimeout(() => {
      setZooming(false);
      setStepIdx(stepIdx + 1);
      setPlaced([]);
      setPartIdx(0);
      setCleared(false);
      setPicked(null);
      setMsg('');
    }, 650);
  };
  advance.current = goNext;

  return (
    <section className="mg-zp">
      <div className="mg-zp__top">
        <span className={`mg-zp__pill${left <= 30 ? ' mg-zp__pill--low' : ''}`} role="timer" aria-label={`${mmss(left)} left`}>
          ⏱ {mmss(left)}
        </span>
        <span className="mg-zp__pill">
          ✓ {s.right}/{TOTAL_ANSWERS}
        </span>
      </div>
      <ol className="mg-zp__steps" aria-label="Zoom steps">
        {STEPS.map((x, k) => (
          <li key={x.id} className={k === stepIdx ? 'mg-on' : k < stepIdx || (k === stepIdx && cleared) ? 'mg-done' : undefined}>
            {k + 1} {x.title}
          </li>
        ))}
      </ol>

      <div className="mg-zp__clue" role="status" aria-live="polite">
        {cleared ? (
          <>
            <b>Stage {stepIdx + 1} built</b>
            {step.title}: every part is in place.
          </>
        ) : (
          <>
            <b>
              Clue {partIdx + 1} of {step.parts.length} · find the piece and put it in place
            </b>
            {step.parts[partIdx].clue}
          </>
        )}
      </div>

      <div ref={stageRef} className={`mg-zp__stage${zooming ? ' mg-zp__stage--zoom' : ''}`} onClick={tapStage}>
        <img className="mg-zp__base" src={art(`${step.id}-grey`)} alt={`${step.title}, rendered from the 3D model`} draggable="false" />
        {/* built: the whole model appears in colour, including the parts that were only context */}
        <img className={`mg-zp__full${cleared ? ' mg-on' : ''}`} src={art(`${step.id}-full`)} alt="" draggable="false" />
        {step.parts.map((p) => {
          const on = placed.includes(p.id);
          return <img key={p.id} className={`mg-zp__part${on ? ' mg-on' : ''}`} src={art(`${step.id}-${p.id}`)} alt="" draggable="false" style={on && p.see ? { opacity: p.see } : undefined} />;
        })}
        {/* the empty spots: a faint tint in the shape of each part still to place */}
        {step.parts
          .filter((p) => !placed.includes(p.id))
          .map((p) => {
            const url = `url("${art(`${step.id}-${p.id}`)}")`;
            return <span key={`slot-${p.id}`} className="mg-zp__slot" style={{ maskImage: url, WebkitMaskImage: url }} />;
          })}
        {step.parts.map((p) =>
          marks[p.id]?.left ? (
            <span key={`n-${p.id}`} className={`mg-zp__num${placed.includes(p.id) ? ' mg-on' : ''}`} style={{ left: marks[p.id].left, top: marks[p.id].top }} aria-hidden="true">
              {placed.includes(p.id) ? '✓' : marks[p.id].n}
            </span>
          ) : null
        )}
        {pops.map((q) => (
          <span key={q.id} className={`mg-zp__pop${q.bad ? ' mg-zp__pop--bad' : ''}`} style={{ left: q.x, top: q.y }}>
            {q.text}
          </span>
        ))}
        {!ready && <span className="mg-zp__loading">Loading the model…</span>}
      </div>

      <p className="mg-zp__msg">{msg}</p>

      {cleared ? (
        <div ref={endRef} className="mg-zp__clear">
          <p className="mg-zp__clear-title">✅ Stage {stepIdx + 1} cleared: {step.title}</p>
          <p className="mg-zp__clear-stats">
            {s.right - s.stepRight} of {s.answered - s.stepAnswered} right first time in this stage
          </p>
          <p className="mg-zp__auto">{stepIdx + 1 < STEPS.length ? `🔍 ${step.zoom}…` : '🏁 Your final score is coming up…'}</p>
          <i className="mg-zp__bar" style={{ animationDuration: `${CLEARED_MS}ms` }} aria-hidden="true" />
        </div>
      ) : (
        <>
          <div className="mg-zp__tray">
            {pieces.map((p) => (
              <Piece key={p.id} piece={p} picked={picked?.id === p.id} done={placed.includes(p.id)} wrong={wrong === p.id} onPick={pickPiece} onDrop={dropPiece} />
            ))}
          </div>
          <p className="mg-zp__tip">Drag a piece onto the model, or tap a piece and then tap where it goes.</p>
        </>
      )}
    </section>
  );
}
