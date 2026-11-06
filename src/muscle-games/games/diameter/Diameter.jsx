import { useEffect, useRef, useState } from 'react';
import { useFx } from '../../fx/Fx.jsx';
import { scoreOutOf10 } from '../meta.js';
import { DECOYS, STEPS, TOTAL_ANSWERS, art } from './levels.js';

// Diameter: zoom into a skeletal muscle in five steps (whole muscle → fascicle → muscle fiber → myofibril →
// sarcomere). Each step is a shape-fit puzzle on a grey render of the site's 3D model: a clue gives a part's function,
// the student finds that piece among the real pieces and decoys in the tray and drags it (or taps it, then taps its
// place) onto the model, where it snaps into its place and takes its colour. When the last piece is in, the full model shows a moment and
// the game moves on to the next step by itself, like Group Sort. Each part's place is numbered from the biggest part to
// the smallest, with a line from the number out to its name. Out of 10 = pieces placed over all 25 pieces of the
// five steps. A wrong answer is just wrong: it takes no point away and adds no time; try again (it is listed for
// review). No hints. The clock counts down from 6 minutes; when it runs out the game ends and pieces not placed score 0.
const W = 900; // every render is 900 x 600
const H = 600;
// shapes are tested on a half-size copy: a quarter of the pixels to read when a step loads (a 1-px slip is 2 px)
const MW = W / 2;
const MH = H / 2;
const TIME = 360; // seconds
const CLEARED_MS = 1400; // how long the finished model shows before the next stage
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
// The places a part's number could sit: solid bits of the part (thin parts like titin have none, so any bit of it),
// nearest its middle first, at least 40 px of the render apart. d = how far from the middle. In 0-1.
function spotOptions(mask) {
  if (!mask) return [];
  const { a, box } = mask;
  const solid = (x, y) => a[y * MW + x] > 120 && a[y * MW + x - 3] > 120 && a[y * MW + x + 3] > 120 && a[(y - 3) * MW + x] > 120 && a[(y + 3) * MW + x] > 120;
  const cx = (box.x0 + box.x1) / 4;
  const cy = (box.y0 + box.y1) / 4;
  const spots = [];
  const collect = (ok) => {
    for (let y = 14; y < MH - 14; y += 2) for (let x = 14; x < MW - 14; x += 2) if (ok(x, y)) spots.push([x, y, (x - cx) ** 2 + (y - cy) ** 2]);
  };
  collect(solid);
  if (!spots.length) collect((x, y) => a[y * MW + x] > 60);
  spots.sort((p, q) => p[2] - q[2]);
  const out = [];
  for (const sp of spots) {
    if (out.length >= 16) break;
    if (out.every(([x, y]) => (sp[0] - x) ** 2 + (sp[1] - y) ** 2 >= 20 ** 2)) out.push(sp);
  }
  return out.map(([x, y, d]) => ({ x: x / MW, y: y / MH, d: Math.sqrt(d) / MW }));
}
// How big a part is on the picture: its bounding box, so a wrapping layer counts as big as what it wraps.
const sizeOf = (m) => (m ? (m.box.x1 - m.box.x0) * (m.box.y1 - m.box.y0) : 0);
// Where each number and its name label go. The label sits in the clear space of the picture, close to its number; the
// number sits on its part, near the part's middle. Together they are picked so that no two lines cross, no line runs
// through a label or a number, and no two labels or numbers touch: a search that tries the best places first and steps
// back when it gets stuck. items are in number order, each with its spot options; base = the alpha of the whole model;
// w, h = the picture's size on screen, to know how big a label is. In 0-1.
function layout(items, base, w, h) {
  const small = w < 520;
  // .mg-zp__name: bold 10 px on phones (6 px padding), 12 px elsewhere (8 px padding)
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `700 ${small ? 10 : 12}px "Nunito Sans Variable", "Inter Variable", system-ui, sans-serif`;
  const pad = small ? 18 : 22;
  const lh = (small ? 18 : 22) / h;
  const box = (x, y, bw, bh) => ({ x0: x - bw / 2, x1: x + bw / 2, y0: y - bh / 2, y1: y + bh / 2 });
  const hit = (r, q) => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0;
  const grow = (r, m) => ({ x0: r.x0 - m / w, x1: r.x1 + m / w, y0: r.y0 - m / h, y1: r.y1 + m / h });
  // how much of a box is on the model: a summed-area table of the model's pixels, so each test is four reads
  const sum = new Uint32Array((MW + 1) * (MH + 1));
  if (base)
    for (let y = 0; y < MH; y++)
      for (let x = 0, row = 0; x < MW; x++) {
        row += base.a[y * MW + x] > 40 ? 1 : 0;
        sum[(y + 1) * (MW + 1) + x + 1] = sum[y * (MW + 1) + x + 1] + row;
      }
  const onModel = (r) => {
    if (!base) return 0;
    const x0 = Math.round(r.x0 * MW);
    const x1 = Math.round(r.x1 * MW);
    const y0 = Math.round(r.y0 * MH);
    const y1 = Math.round(r.y1 * MH);
    const n = sum[y1 * (MW + 1) + x1] - sum[y0 * (MW + 1) + x1] - sum[y1 * (MW + 1) + x0] + sum[y0 * (MW + 1) + x0];
    return n / Math.max(1, (x1 - x0) * (y1 - y0));
  };
  const options = items.map((p) => {
    const lw = (ctx.measureText(p.text).width + pad) / w;
    const labels = [];
    for (let y = lh / 2 + 0.015; y <= 1 - lh / 2 - 0.015; y += 0.025)
      for (let x = lw / 2 + 0.012; x <= 1 - lw / 2 - 0.012; x += 0.02) {
        const r = box(x, y, lw, lh);
        labels.push({ x, y, r, model: onModel(r) });
      }
    const list = [];
    for (const sp of p.spots) {
      const n = box(sp.x, sp.y, 30 / w, 30 / h);
      const mine = [];
      for (const L of labels) {
        if (hit(L.r, n)) continue;
        // short line (the picture is 3:2), label off the model, number near the part's middle
        mine.push({ cost: Math.hypot((L.x - sp.x) * 1.5, L.y - sp.y) + L.model * 3 + sp.d * 1.5, sp, n, x: L.x, y: L.y, r: L.r });
      }
      list.push(...mine.sort((u, v) => u.cost - v.cost).slice(0, 40));
    }
    return list.sort((u, v) => u.cost - v.cost).map((c) => ({ ...c, a: [c.sp.x, c.sp.y], b: edge([c.sp.x, c.sp.y], [c.x, c.y], c.r) }));
  });
  const apart = (c, d) => ((c.sp.x - d.sp.x) * w) ** 2 + ((c.sp.y - d.sp.y) * h) ** 2 >= (small ? 26 : 32) ** 2; // numbers
  const loose = (c, d) => apart(c, d) && !hit(grow(c.r, 3), d.r) && !hit(c.r, d.n) && !hit(d.r, c.n);
  const fits = (c, d) =>
    loose(c, d) &&
    !crosses(c.a, c.b, d.a, d.b) &&
    !segBox(c.a, c.b, grow(d.r, 2)) &&
    !segBox(d.a, d.b, grow(c.r, 2)) &&
    !segBox(c.a, c.b, grow(d.n, -3)) &&
    !segBox(d.a, d.b, grow(c.n, -3));
  // The search: take the label with the fewest places left, try its places best first, and after each try strike out
  // every place of the other labels that no longer fits; step back as soon as one has no place left.
  let budget = 1500000; // fit tests, about 60 ms on a laptop
  const solve = (doms, chosen) => {
    let i = -1;
    doms.forEach((d, j) => {
      if (!chosen[j] && (i < 0 || d.length < doms[i].length)) i = j;
    });
    if (i < 0) return chosen;
    for (const c of doms[i]) {
      if (budget < 0) return null;
      let dead = false;
      const next = doms.map((d, j) => {
        if (dead || j === i || chosen[j]) return d;
        budget -= d.length;
        const kept = d.filter((e) => fits(c, e));
        if (!kept.length) dead = true;
        return kept;
      });
      if (dead) continue;
      const got = solve(next, chosen.map((x, j) => (j === i ? c : x)));
      if (got) return got;
    }
    return null;
  };
  const chosen = solve(options, options.map(() => null)) ?? [];
  const found = chosen.length > 0;
  if (!found) {
    if (import.meta.env?.DEV) {
      console.warn('Diameter: no clean label layout', items.map((p) => p.id));
    }
    // no clean layout (very crowded): place one at a time, as clean as it can be
    items.forEach((p, i) => chosen.push(options[i].find((c) => chosen.every((d) => fits(c, d))) ?? options[i].find((c) => chosen.every((d) => loose(c, d))) ?? options[i][0]));
  }
  const out = {};
  items.forEach((p, i) => {
    const c = chosen[i];
    if (c) out[p.id] = { x: c.sp.x, y: c.sp.y, left: `${c.sp.x * 100}%`, top: `${c.sp.y * 100}%`, lx: c.x, ly: c.y, ex: c.b[0], ey: c.b[1] };
  });
  return out;
}
// Where the line from a (the number) to c (the middle of a label) meets the label's box r.
function edge(a, c, r) {
  const dx = c[0] - a[0];
  const dy = c[1] - a[1];
  let t = 0;
  if (dx) t = Math.max(t, ((dx > 0 ? r.x0 : r.x1) - a[0]) / dx);
  if (dy) t = Math.max(t, ((dy > 0 ? r.y0 : r.y1) - a[1]) / dy);
  t = Math.min(1, t);
  return [a[0] + dx * t, a[1] + dy * t];
}
const turn = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
// do segments ab and cd cross?
const crosses = (a, b, c, d) => turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0;
// does segment ab touch box r?
function segBox(a, b, r) {
  const inside = (p) => p[0] > r.x0 && p[0] < r.x1 && p[1] > r.y0 && p[1] < r.y1;
  if (inside(a) || inside(b)) return true;
  const c = [
    [r.x0, r.y0],
    [r.x1, r.y0],
    [r.x1, r.y1],
    [r.x0, r.y1],
  ];
  return c.some((p, k) => crosses(a, b, p, c[(k + 1) % 4]));
}

// The picture under the finger while a piece is dragged. Only one can exist: it lives on <body>, so anything that
// ends a drag without a pointerup on the piece (released outside the window, a second finger, the stage changing,
// leaving the game) must still remove it, or it stays stuck on the screen.
function clearGhosts() {
  document.querySelectorAll('.mg-zp__ghost').forEach((g) => g.remove());
}

// A piece in the tray: drag it onto the picture, or tap it to pick it up. The move and release are followed on the
// window, so the drag always ends wherever the finger or mouse is let go.
function Piece({ piece, picked, done, wrong, onPick, onDrop }) {
  const end = useRef(null); // stops the drag in progress, if any
  const latest = useRef({});
  latest.current = { piece, onPick, onDrop };
  useEffect(() => () => end.current?.(), []);

  const down = (e) => {
    if (done || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    end.current?.();
    clearGhosts();
    const start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    let ghost = null;
    const move = (ev) => {
      if (ev.pointerId !== start.id) return;
      if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8) {
        ghost = document.createElement('img');
        ghost.className = 'mg-zp__ghost';
        ghost.src = latest.current.piece.thumb;
        ghost.alt = '';
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
      }
    };
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
      ghost?.remove();
      end.current = null;
    };
    const up = (ev) => {
      if (ev.pointerId !== start.id) return;
      const dragged = !!ghost;
      stop();
      const { piece: pc, onPick: pick, onDrop: drop } = latest.current;
      if (dragged) drop(pc, ev.clientX, ev.clientY);
      else pick(pc);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
    end.current = stop;
  };
  return (
    <button
      type="button"
      className={`mg-zp__piece${picked ? ' mg-zp__piece--picked' : ''}${done ? ' mg-zp__piece--done' : ''}${wrong ? ' mg-zp__piece--wrong' : ''}`}
      onPointerDown={down}
      onDragStart={(e) => e.preventDefault()}
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
  const [left, setLeft] = useState(TIME); // seconds left
  const stepNow = useRef(0); // stepIdx for the clock's interval, which keeps its first render's closure
  const firstTry = useRef(true);
  const stageRef = useRef(null);
  const maskOf = useRef({});

  const score = () => scoreOutOf10(s.right, TOTAL_ANSWERS);
  stepNow.current = stepIdx;
  const report = (timeUp) => ({
    runId: s.runId,
    summary: `${s.right}/${TOTAL_ANSWERS} pieces placed · ${Math.min(stepNow.current + 1, STEPS.length)}/${STEPS.length} steps${timeUp ? " · time's up" : ''}`,
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
    return () => {
      clearInterval(id);
      clearGhosts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a new step: load the masks of its parts and decoys, then deal the tray
  useEffect(() => {
    let live = true;
    clearGhosts();
    setReady(false);
    setMarks({});
    setPieces([]);
    fx.say(step.say, 'happy');
    const list = [
      ...step.parts.map((p) => ({ id: p.id, art: `${step.id}-${p.id}` })),
      ...step.decoys.map((d) => ({ id: `decoy:${d}`, art: DECOYS[d].art, decoy: d })),
    ];
    Promise.all([...list.map((p) => loadMask(p.art)), loadMask(`${step.id}-grey`)]).then((ms) => {
      if (!live) return;
      const base = ms.pop();
      maskOf.current = Object.fromEntries(list.map((p, k) => [p.art, ms[k]]));
      // numbered from the biggest part to the smallest (the clues keep their own order), each with its name
      const mask = (id) => maskOf.current[`${step.id}-${id}`];
      const order = step.parts.map((p) => p.id).sort((a, b) => sizeOf(mask(b)) - sizeOf(mask(a)));
      const r = stageRef.current?.getBoundingClientRect();
      const named = order.map((id, k) => ({ id, text: `${k + 1} ${step.parts.find((x) => x.id === id).name}`, spots: spotOptions(mask(id)) }));
      const lay = layout(named.filter((p) => p.spots.length), base, r?.width || 600, r?.height || 400);
      setMarks(Object.fromEntries(order.map((id, k) => [id, { n: k + 1, ...lay[id] }])));
      setPieces(shuffle(list).map((p, k) => ({ ...p, n: k + 1, thumb: maskOf.current[p.art]?.thumb ?? art(p.art) })));
      setReady(true);
      if (s.t0 == null) s.t0 = performance.now();
      // load the next stage while this one is played, one picture at a time, so it shows at once and play stays smooth
      const next = STEPS[STEPS.indexOf(step) + 1];
      const todo = next ? [...next.parts.map((x) => `${next.id}-${x.id}`), ...next.decoys.map((d) => DECOYS[d].art), `${next.id}-grey`, `${next.id}-full`] : [];
      const more = () => {
        if (live && todo.length) loadMask(todo.shift()).then(() => setTimeout(more, 80));
      };
      setTimeout(more, 1000);
    });
    return () => {
      live = false;
    };
  }, [step, fx]);

  // Like Group Sort: when the last piece snaps in, the model shows in full colour for a moment and the game moves on to
  // the next stage by itself (or ends after the last). No card, no button, nothing else to tap.
  const advance = useRef(null);
  useEffect(() => {
    if (!cleared) return undefined;
    const go = setTimeout(() => advance.current?.(), CLEARED_MS);
    return () => clearTimeout(go);
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

  // One point per piece placed (the user's rule, as in Balloon Pop: a wrong try first never takes the point away).
  // A wrong try is just wrong: no point lost, no time added; the first per clue is listed for review.
  const answer = (ok, p, mistake) => {
    const first = firstTry.current;
    if (first) s.answered += 1;
    if (ok) s.right += 1;
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
    // The question is which piece fits the clue: the right piece let go anywhere on the picture snaps into its place
    // and counts as right (thin parts are hard to hit exactly with a finger). Only a wrong piece or a decoy is wrong.
    const ok = piece.id === want.id;
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
    answer(false, p, { prompt: want.clue, yours: d ? d.name : step.parts.find((x) => x.id === piece.id)?.name, answer: want.name });
    setWrong(piece.id);
    setTimeout(() => setWrong(null), 400);
    setMsg(d ? `✗ That is the ${d.name} — ${d.why}.` : '✗ Not this piece — read the clue again.');
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
    // no zoom: the next stage simply takes the place of this one
    setStepIdx(stepIdx + 1);
    setPlaced([]);
    setPartIdx(0);
    setCleared(false);
    setPicked(null);
    setMsg('');
  };
  advance.current = goNext;

  return (
    <section className="mg-zp">
      <div className="mg-zp__top">
        <span className={`mg-zp__pill${left <= 30 ? ' mg-zp__pill--low' : ''}`} role="timer" aria-label={`${mmss(left)} left`}>
          ⏱ {mmss(left)}
        </span>
        <span className="mg-zp__pill">
          Stage {stepIdx + 1}/{STEPS.length}
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
            <b>✓ Stage {stepIdx + 1} built: {step.title}</b>
            {step.zoom ? `Next: ${step.zoom}…` : 'Every part is in place.'}
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

      <div key={step.id} ref={stageRef} className="mg-zp__stage" onClick={tapStage}>
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
        {/* a line from each number out to its name at the edge */}
        <svg className="mg-zp__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {step.parts.map((p) => {
            const m = marks[p.id];
            return m?.lx != null ? <line key={p.id} x1={m.x * 100} y1={m.y * 100} x2={m.ex * 100} y2={m.ey * 100} vectorEffect="non-scaling-stroke" /> : null;
          })}
        </svg>
        {step.parts.map((p) => {
          const m = marks[p.id];
          if (!m?.left) return null;
          const on = placed.includes(p.id) ? ' mg-on' : '';
          return (
            <span key={`n-${p.id}`}>
              <span className={`mg-zp__num${on}`} style={{ left: m.left, top: m.top }} aria-hidden="true">
                {m.n}
              </span>
              {m.lx != null && (
                <span className={`mg-zp__name${on}`} style={{ left: `${m.lx * 100}%`, top: `${m.ly * 100}%` }}>
                  <b>{m.n}</b> {p.name}
                </span>
              )}
            </span>
          );
        })}
        {pops.map((q) => (
          <span key={q.id} className={`mg-zp__pop${q.bad ? ' mg-zp__pop--bad' : ''}`} style={{ left: q.x, top: q.y }}>
            {q.text}
          </span>
        ))}
        {!ready && <span className="mg-zp__loading">Loading the model…</span>}
      </div>

      <p className="mg-zp__msg">{msg}</p>

      <div className="mg-zp__tray">
        {pieces.map((p) => (
          <Piece key={p.id} piece={p} picked={picked?.id === p.id} done={placed.includes(p.id)} wrong={wrong === p.id} onPick={pickPiece} onDrop={dropPiece} />
        ))}
      </div>
      <p className="mg-zp__tip">Drag a piece onto the model, or tap a piece and then tap where it goes.</p>
    </section>
  );
}
