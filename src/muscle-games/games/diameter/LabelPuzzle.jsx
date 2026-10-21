import { useEffect, useMemo, useState } from 'react';

// Step pieces stretch with the screen; the others are fixed so two fit side by side on a phone.
function useStepWidth() {
  const calc = () => Math.max(220, Math.min(420, window.innerWidth - 104));
  const [w, setW] = useState(calc);
  useEffect(() => {
    const onResize = () => setW(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}
import { useFx } from '../../fx/Fx.jsx';
import { DragGhost, useDragDrop } from '../../fx/drag.jsx';
import { JigsawPiece } from '../../fx/jigsaw.jsx';
import { shuffle } from '../util.js';

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
const SIZES = {
  diagram: { w: 146, h: 56 },
  boards: { w: 146, h: 70 },
};

// Generic "put each jigsaw label where it belongs" puzzle: diagram pins, ordered steps, or diagnosis boards.
export default function LabelPuzzle({ level, onPlaced, onMissed, onDone }) {
  const fx = useFx();
  const stepWidth = useStepWidth();
  const size = level.layout === 'steps' ? { w: stepWidth, h: 64 } : SIZES[level.layout];
  const byId = useMemo(() => Object.fromEntries(level.pieces.map((p) => [p.id, p])), [level]);
  const [placed, setPlaced] = useState(() => Object.fromEntries(level.given.map((id) => [id, true])));
  const [tray] = useState(() => shuffle(level.pieces.filter((p) => !level.given.includes(p.id)).map((p) => p.id)));
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(null);
  const [snap, setSnap] = useState(null);

  const inSlot = (slotId) => level.pieces.filter((p) => placed[p.id] && p.answer === slotId);
  const isFull = (slot) => inSlot(slot.id).length >= (slot.capacity ?? 1);
  const done = level.pieces.every((p) => placed[p.id]);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(onDone, 600);
    return () => clearTimeout(t);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = (pieceId, slotId, point) => {
    const slot = level.slots.find((s) => s.id === slotId);
    if (!slot || isFull(slot) || placed[pieceId]) return;
    setSelected(null);
    const piece = byId[pieceId];
    const pt = point ?? fx.centerOf(`[data-drop="${slotId}"]`);
    if (piece.answer === slotId) {
      setPlaced((p) => ({ ...p, [pieceId]: true }));
      setSnap(pieceId);
      onPlaced(pt);
    } else {
      setShake(slotId);
      setTimeout(() => setShake(null), 450);
      const mistake =
        level.layout === 'boards'
          ? { prompt: piece.label, yours: slot.title, answer: level.slots.find((s) => s.id === piece.answer).title }
          : {
              prompt: `${level.title}: ${level.ask} ${slot.n}`,
              yours: piece.label,
              answer: level.pieces.find((p) => p.answer === slotId).label,
            };
      onMissed(pt, mistake);
    }
  };

  const { drag, hot, start, isTap } = useDragDrop((id, target, pt) => place(id, target, pt));

  const tapSlot = (slotId) => {
    if (selected) place(selected, slotId);
  };

  const piece = (id, tone = 'violet') => (
    <JigsawPiece w={size.w} h={size.h} tone={tone}>
      {byId[id].label}
    </JigsawPiece>
  );

  const slotClass = (slot, base) =>
    [
      base,
      isFull(slot) && `${base}--filled`,
      !isFull(slot) && (hot === slot.id || selected) && `${base}--hot`,
      shake === slot.id && 'mg-shake',
    ]
      .filter(Boolean)
      .join(' ');

  const placedPiece = (p) => (
    <span key={p.id} className={snap === p.id ? 'mg-snap-in' : undefined}>
      {piece(p.id, level.given.includes(p.id) ? 'given' : 'ok')}
    </span>
  );

  let board;
  if (level.layout === 'diagram') {
    const filled = Object.fromEntries(level.slots.flatMap((s) => inSlot(s.id).map((p) => [s.id, p.label])));
    board = (
      <div className="mg-diagram-wrap">
        <level.Diagram slots={level.slots} filled={filled} hot={hot} />
        <ol className="mg-label-slots">
          {level.slots.map((s) => (
            <li key={s.id}>
              <button type="button" data-drop={s.id} className={slotClass(s, 'mg-row')} onClick={() => tapSlot(s.id)}>
                <span className="mg-row__n">{CIRCLED[s.n - 1]}</span>
                {inSlot(s.id).map(placedPiece)}
                {!isFull(s) && <span className="mg-row__drop">Drop label here</span>}
              </button>
            </li>
          ))}
        </ol>
      </div>
    );
  } else if (level.layout === 'steps') {
    board = (
      <ol className="mg-step-slots">
        {level.slots.map((s) => (
          <li key={s.id}>
            <span className="mg-step-slots__n">{s.n}</span>
            <button type="button" data-drop={s.id} className={slotClass(s, 'mg-row')} onClick={() => tapSlot(s.id)}>
              {inSlot(s.id).map(placedPiece)}
              {!isFull(s) && <span className="mg-row__drop">Step {s.n}?</span>}
            </button>
          </li>
        ))}
      </ol>
    );
  } else {
    board = (
      <div className="mg-boards">
        {level.slots.map((s) => (
          <div
            key={s.id}
            role="button"
            tabIndex={0}
            data-drop={s.id}
            className={slotClass(s, 'mg-board')}
            onClick={() => tapSlot(s.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && tapSlot(s.id)}
          >
            <div className="mg-board__head">
              <span className="mg-board__icon" aria-hidden="true">
                {s.icon}
              </span>
              <span>
                <strong>{s.title}</strong>
                <small>{s.sub}</small>
              </span>
              <span className="mg-board__count">
                {inSlot(s.id).length}/{s.capacity}
              </span>
            </div>
            <div className="mg-board__chips">{inSlot(s.id).map(placedPiece)}</div>
          </div>
        ))}
      </div>
    );
  }

  const remaining = tray.filter((id) => !placed[id]);

  return (
    <div className={`mg-puzzle mg-puzzle--${level.layout}`}>
      {board}
      {remaining.length > 0 && (
        <div className="mg-tray">
          <p className="mg-tray__title">🧩 Drag a piece onto its spot, or tap a piece then tap the spot</p>
          <div className="mg-tray__pieces">
            {remaining.map((id) => (
              <button
                key={id}
                type="button"
                className={`mg-piece${selected === id ? ' mg-piece--selected' : ''}${drag?.id === id ? ' mg-piece--dragging' : ''}`}
                aria-pressed={selected === id}
                onPointerDown={(e) => start(e, id)}
                onClick={() => isTap() && setSelected((s) => (s === id ? null : id))}
              >
                {piece(id)}
              </button>
            ))}
          </div>
        </div>
      )}
      <DragGhost drag={drag} className="mg-piece mg-piece--ghost">
        {drag && piece(drag.id)}
      </DragGhost>
    </div>
  );
}
