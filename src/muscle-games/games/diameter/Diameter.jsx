import { useEffect, useRef, useState } from 'react';
import { useFx } from '../../fx/Fx.jsx';
import { scoreOutOf10 } from '../meta.js';
import { DECOYS, PREDICT_CHOICES, STEPS, TOTAL_ANSWERS, art } from './levels.js';

// Diameter: zoom into a skeletal muscle in five steps (whole muscle → fascicle → muscle fiber → myofibril →
// sarcomere). Each step is a shape-fit puzzle on a grey render of the site's 3D model: a clue gives a part's function,
// the student finds that piece among the real pieces and decoys in the tray and drags it (or taps it, then taps its
// place) onto the model, where it snaps in and takes its colour. Then a task on the finished picture: tap structures
// in order, answer a question, or predict a contraction. Out of 10 = answers right first time over all answers of
// all five steps; a wrong answer costs 5 s on the clock (shown, not scored) but never points already won.
const W = 900; // every render is 900 x 600
const H = 600;
// shapes are tested on a half-size copy: a quarter of the pixels to read when a step loads (a 1-px slip is 2 px)
const MW = W / 2;
const MH = H / 2;
const HINTS = 3;
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
  const st = useRef({ runId, right: 0, answered: 0, penalty: 0, streak: 0, mistakes: [], done: false, t0: performance.now() });
  const s = st.current;
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const [pieces, setPieces] = useState([]); // the tray, shuffled
  const [marks, setMarks] = useState({}); // part id -> { n, left, top }: the numbers on the picture
  const [ready, setReady] = useState(false);
  const [placed, setPlaced] = useState([]); // part ids in the picture
  const [partIdx, setPartIdx] = useState(0); // which clue
  const [taskIdx, setTaskIdx] = useState(-1); // -1 while building
  const [seqI, setSeqI] = useState(0);
  const [lit, setLit] = useState([]); // parts tapped right in a sequence
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [msg, setMsg] = useState('');
  const [hints, setHints] = useState(HINTS);
  const [flash, setFlash] = useState(null);
  const [taskDone, setTaskDone] = useState(false);
  const [choice, setChoice] = useState(null);
  const [predict, setPredict] = useState({});
  const [contracted, setContracted] = useState(false);
  const [pops, setPops] = useState([]);
  const [zooming, setZooming] = useState(false);
  const [clock, setClock] = useState(0);
  const firstTry = useRef(true);
  const stageRef = useRef(null);
  const clueRef = useRef(null);
  const endRef = useRef(null); // the Next / Stage cleared card
  const maskOf = useRef({});
  const task = taskIdx >= 0 ? step.tasks[taskIdx] : null;

  const score = () => scoreOutOf10(s.right, TOTAL_ANSWERS);
  const report = () => ({
    runId: s.runId,
    summary: `${s.right}/${TOTAL_ANSWERS} right first time · ${Math.min(stepIdx + 1, STEPS.length)}/${STEPS.length} steps`,
    mistakes: s.mistakes,
  });

  useEffect(() => {
    // Leaving after at least one answer still saves the run.
    setExitReport?.(() => (!s.done && s.answered > 0 ? { score: score(), info: report() } : null));
    const id = setInterval(() => setClock(Math.round((performance.now() - s.t0) / 1000) + s.penalty), 500);
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
    });
    return () => {
      live = false;
    };
  }, [step, fx]);

  // On a phone the tray vanishes when the last piece snaps in and the cards appear under the picture, out of view:
  // bring the mission into view when it starts, and the Next / Stage cleared card when a task is done.
  useEffect(() => {
    if (taskIdx >= 0) clueRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [taskIdx]);
  useEffect(() => {
    if (!taskDone) return undefined;
    const id = setTimeout(() => endRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 120);
    return () => clearTimeout(id);
  }, [taskDone]);

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

  // One answer per clue, tap of a sequence, question or prediction row: it is right only if right at the first try.
  // Every wrong try costs 5 s; only the first is listed for review.
  const answer = (ok, p, mistake) => {
    const first = firstTry.current;
    if (first) s.answered += 1;
    if (ok && first) {
      s.right += 1;
      s.streak += 1;
    } else s.streak = 0;
    if (!ok) {
      s.penalty += 5;
      firstTry.current = false;
      if (mistake && first) s.mistakes.push(mistake);
      fx.sound('bad');
      fx.vibrate(100);
      if (p) pop('+5s', p, true);
    } else {
      fx.sound('snap');
      if (p) {
        fx.burst(p.x, p.y, 14);
        pop(s.streak >= 2 ? `Combo ×${s.streak}!` : 'Nice!', p);
      }
    }
    onScore(score());
  };

  const tryPiece = (piece, p) => {
    const want = step.parts[partIdx];
    const ok = piece.id === want.id && onPart(maskOf.current[`${step.id}-${want.id}`], p.fx, p.fy);
    if (ok) {
      answer(true, p);
      setPlaced((pl) => [...pl, want.id]);
      setPicked(null);
      setMsg(`✓ ${want.name}`);
      firstTry.current = true;
      if (partIdx + 1 < step.parts.length) setPartIdx(partIdx + 1);
      else startTasks();
      return;
    }
    const d = piece.decoy && DECOYS[piece.decoy];
    answer(false, p, { prompt: want.clue, yours: d ? d.name : piece.id === want.id ? `${want.name}, in the wrong place` : step.parts.find((x) => x.id === piece.id)?.name, answer: want.name });
    setWrong(piece.id);
    setTimeout(() => setWrong(null), 400);
    setMsg(d ? `✗ That is the ${d.name} — ${d.why}.` : piece.id === want.id ? '✗ Right piece, wrong place — match its shape on the model.' : '✗ Not this piece — read the clue again.');
  };

  const dropPiece = (piece, clientX, clientY) => {
    if (taskIdx >= 0) return;
    const p = at(clientX, clientY);
    if (p) tryPiece(piece, p);
  };
  const pickPiece = (piece) => {
    if (taskIdx >= 0) return;
    setPicked(piece);
    setMsg('Now tap where it goes on the model');
  };

  const startTasks = () => {
    setTaskIdx(0);
    setSeqI(0);
    setLit([]);
    setTaskDone(false);
    setChoice(null);
    setMsg('');
  };
  const nextTask = () => {
    firstTry.current = true;
    if (taskIdx + 1 < step.tasks.length) {
      setTaskIdx(taskIdx + 1);
      setSeqI(0);
      setLit([]);
      setTaskDone(false);
      setChoice(null);
      setMsg('');
    } else goNext();
  };

  // tap on the picture: drop the picked piece, or answer a tap task
  const tapStage = (e) => {
    const p = at(e.clientX, e.clientY);
    if (!p) return;
    if (taskIdx < 0) {
      if (picked) tryPiece(picked, p);
      return;
    }
    if (task?.type !== 'tap' || taskDone) return;
    // Parts overlap and some are thin (T-tubules on a phone are a few pixels wide), so the part asked for wins if the
    // finger is on it or within a few pixels of it; otherwise the part right under the finger, then the nearest.
    const want = task.seq[seqI];
    const ids = step.parts.map((x) => x.id);
    const mask = (id) => maskOf.current[`${step.id}-${id}`];
    const hit = onPart(mask(want), p.fx, p.fy) ? want : ids.find((id) => onPart(mask(id), p.fx, p.fy, 0)) ?? ids.find((id) => onPart(mask(id), p.fx, p.fy));
    if (!hit) return;
    const name = (id) => step.parts.find((x) => x.id === id).name;
    if (hit === want) {
      answer(true, p);
      firstTry.current = true;
      setLit((l) => [...l, hit]);
      setMsg(`✓ ${seqI + 1}. ${name(hit)}`);
      if (seqI + 1 >= task.seq.length) {
        setTaskDone(true);
        fx.sound('win');
        if (task.calcium) calcium(task.calcium);
      } else setSeqI(seqI + 1);
    } else {
      answer(false, p, { prompt: task.text, yours: name(hit), answer: name(want) });
      setMsg('✗ Not that one yet — where does it go next?');
    }
  };

  const pickChoice = (k) => {
    if (taskDone) return;
    const ok = k === task.answer;
    answer(ok, null, ok ? null : { prompt: task.text, yours: task.options[k], answer: task.options[task.answer] });
    setChoice(k);
    setTaskDone(true);
  };

  const submitPredict = () => {
    task.rows.forEach(([row, want]) => {
      firstTry.current = true;
      const ok = predict[row] === want;
      answer(ok, null, ok ? null : { prompt: `${task.text} — ${row}`, yours: PREDICT_CHOICES.find((c) => c[0] === predict[row])?.[1] ?? 'No answer', answer: PREDICT_CHOICES.find((c) => c[0] === want)[1] });
      firstTry.current = true;
    });
    setTaskDone(true);
    setContracted(true);
    fx.sound('win');
  };

  const [calciumAt, setCalciumAt] = useState(null);
  const calcium = (id) => {
    const b = maskOf.current[`${step.id}-${id}`]?.box;
    if (b) setCalciumAt(b);
  };

  const hint = () => {
    if (taskIdx >= 0 || hints <= 0) return;
    const want = step.parts[partIdx];
    setHints(hints - 1);
    s.penalty += 5;
    firstTry.current = false;
    setPicked(pieces.find((x) => x.id === want.id));
    setFlash(want.id);
    setTimeout(() => setFlash(null), 1900);
    setMsg('💡 The right piece is picked up and its place is flashing (+5 s)');
  };

  function finish() {
    if (s.done) return;
    s.done = true;
    onFinish(score(), report());
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
      setTaskIdx(-1);
      setTaskDone(false);
      setChoice(null);
      setLit([]);
      setPicked(null);
      setCalciumAt(null);
      setContracted(false);
      setPredict({});
      setMsg('');
    }, 650);
  };

  const mid = maskOf.current['sarcomere-mline']?.box;
  const midPct = mid ? ((mid.x0 + mid.x1) / 2 / W) * 100 : 50;
  const sliding = new Set(['thin', 'zdisc', 'titin']);

  return (
    <section className="mg-zp">
      <div className="mg-zp__top">
        <span className="mg-zp__pill">⏱ {clock}s</span>
        <span className="mg-zp__pill">⭐ {s.right}</span>
        <button type="button" className="mg-zp__pill mg-zp__pill--btn" onClick={hint} disabled={taskIdx >= 0 || hints <= 0}>
          💡 Hint ({hints})
        </button>
      </div>
      <ol className="mg-zp__steps" aria-label="Zoom steps">
        {STEPS.map((x, k) => {
          const open = k === stepIdx + 1 && task && taskDone && taskIdx + 1 >= step.tasks.length;
          return (
            <li key={x.id} className={k === stepIdx ? 'mg-on' : k < stepIdx ? 'mg-done' : open ? 'mg-open' : undefined}>
              {open ? (
                <button type="button" onClick={nextTask}>
                  {k + 1} {x.title} ▶
                </button>
              ) : (
                `${k + 1} ${x.title}`
              )}
            </li>
          );
        })}
      </ol>

      <div ref={clueRef} className="mg-zp__clue" role="status" aria-live="polite">
        {taskIdx < 0 ? (
          <>
            <b>
              Clue {partIdx + 1} of {step.parts.length} · find the piece and put it in place
            </b>
            {step.parts[partIdx].clue}
          </>
        ) : (
          <>
            <b>
              {task.type === 'tap' ? 'Mission' : task.type === 'choice' ? 'Question' : 'Predict'} {taskIdx + 1} of {step.tasks.length}{' '}
              <span>· {taskIdx + 1 < step.tasks.length ? 'then one more' : stepIdx + 1 < STEPS.length ? `then Stage ${stepIdx + 2}` : 'then your score'}</span>
            </b>
            {taskDone ? task.done : task.text}
          </>
        )}
      </div>

      <div ref={stageRef} className={`mg-zp__stage${zooming ? ' mg-zp__stage--zoom' : ''}`} onClick={tapStage}>
        <img className="mg-zp__base" src={art(`${step.id}-grey`)} alt={`${step.title}, rendered from the 3D model`} draggable="false" style={contracted ? { opacity: 0 } : undefined} />
        {/* built: the whole model appears in colour, including the parts that were only context */}
        <img className={`mg-zp__full${taskIdx >= 0 && !contracted ? ' mg-on' : ''}`} src={art(`${step.id}-full`)} alt="" draggable="false" />
        {step.parts.map((p) => {
          const on = placed.includes(p.id);
          const cls = `mg-zp__part${on ? ' mg-on' : ''}${flash === p.id ? ' mg-zp__part--flash' : ''}${lit.includes(p.id) ? ' mg-zp__part--lit' : ''}`;
          if (contracted && sliding.has(p.id))
            return [-1, 1].map((side) => (
              <img
                key={`${p.id}${side}`}
                className={`${cls} mg-zp__part--slide`}
                src={art(`${step.id}-${p.id}`)}
                alt=""
                draggable="false"
                style={{ clipPath: side < 0 ? `inset(0 ${100 - midPct}% 0 0)` : `inset(0 0 0 ${midPct}%)`, '--slide': `${-side * 4.5}%` }}
              />
            ));
          return <img key={p.id} className={cls} src={art(`${step.id}-${p.id}`)} alt="" draggable="false" style={on && p.see ? { opacity: p.see } : undefined} />;
        })}
        {/* the empty spots: a faint tint in the shape of each part still to place */}
        {taskIdx < 0 &&
          step.parts
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
        {calciumAt &&
          Array.from({ length: 36 }, (_, k) => (
            <i
              key={k}
              className="mg-zp__ca"
              style={{
                left: `${((calciumAt.x0 + ((k * 37) % 100) / 100 * (calciumAt.x1 - calciumAt.x0)) / W) * 100}%`,
                top: `${((calciumAt.y0 + ((k * 53) % 100) / 100 * (calciumAt.y1 - calciumAt.y0)) / H) * 100}%`,
                animationDelay: `${k * 0.035}s`,
              }}
            />
          ))}
        {pops.map((q) => (
          <span key={q.id} className={`mg-zp__pop${q.bad ? ' mg-zp__pop--bad' : ''}`} style={{ left: q.x, top: q.y }}>
            {q.text}
          </span>
        ))}
        {!ready && <span className="mg-zp__loading">Loading the model…</span>}
      </div>

      <p className="mg-zp__msg">{msg}</p>

      {taskIdx < 0 && (
        <div className="mg-zp__tray">
          {pieces.map((p) => (
            <Piece key={p.id} piece={p} picked={picked?.id === p.id} done={placed.includes(p.id)} wrong={wrong === p.id} onPick={pickPiece} onDrop={dropPiece} />
          ))}
        </div>
      )}

      {task?.type === 'choice' && (
        <div className="mg-zp__choices">
          {task.options.map((o, k) => (
            <button
              key={o}
              type="button"
              className={`mg-zp__choice${taskDone && k === task.answer ? ' mg-zp__choice--right' : ''}${taskDone && k === choice && k !== task.answer ? ' mg-zp__choice--wrong' : ''}`}
              onClick={() => pickChoice(k)}
              disabled={taskDone}
            >
              {o}
            </button>
          ))}
        </div>
      )}

      {task?.type === 'predict' && (
        <div className="mg-zp__predict">
          {task.rows.map(([row, want]) => (
            <label key={row} className="mg-zp__row">
              <span>{row}</span>
              <select value={predict[row] ?? ''} onChange={(e) => setPredict({ ...predict, [row]: e.target.value })} disabled={taskDone}>
                <option value="">—</option>
                {PREDICT_CHOICES.map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
              {taskDone && <em className={predict[row] === want ? 'mg-zp__ok' : 'mg-zp__no'}>{predict[row] === want ? '✓' : `✗ ${PREDICT_CHOICES.find((c) => c[0] === want)[1]}`}</em>}
            </label>
          ))}
          {!taskDone && (
            <button type="button" className="mg-btn mg-btn--primary" onClick={submitPredict}>
              Contract! ▶
            </button>
          )}
        </div>
      )}

      {task && taskDone && taskIdx + 1 < step.tasks.length && (
        <div ref={endRef} className="mg-zp__next">
          <button type="button" className="mg-btn mg-btn--primary" onClick={nextTask} autoFocus>
            Next ▶
          </button>
        </div>
      )}
      {task && taskDone && taskIdx + 1 >= step.tasks.length && (
        <div ref={endRef} className="mg-zp__clear">
          <p className="mg-zp__clear-title">✅ Stage {stepIdx + 1} cleared: {step.title}</p>
          <p className="mg-zp__clear-stats">
            {s.right - s.stepRight} of {s.answered - s.stepAnswered} right first time in this stage
          </p>
          <button type="button" className="mg-btn mg-btn--primary mg-zp__go" onClick={nextTask} autoFocus>
            {stepIdx + 1 < STEPS.length ? `Next stage ▶ ${STEPS[stepIdx + 1].title}` : '🏁 See final score'}
          </button>
          {stepIdx + 1 < STEPS.length && <span className="mg-zp__clear-zoom">🔍 {step.zoom}</span>}
        </div>
      )}
      <p className="mg-zp__tip">Drag a piece onto the model, or tap a piece and then tap where it goes.</p>
    </section>
  );
}
