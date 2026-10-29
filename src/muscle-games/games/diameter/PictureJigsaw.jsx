import { useEffect, useId, useMemo, useState } from 'react';
import { MusclePoster } from '../../art.jsx';
import { useFx } from '../../fx/Fx.jsx';
import { DragGhost, useDragDrop } from '../../fx/drag.jsx';
import { jigsawPath } from '../../fx/jigsaw.jsx';
import { sample, shuffle } from '../util.js';

const N = 3;
const CELL = 100;
const K = 22;
const GIVEN = 2;
const flip = () => (Math.random() < 0.5 ? 1 : -1);

// Random but consistent tabs: a tab on one piece is a blank on its neighbour.
function makeEdges() {
  const h = Array.from({ length: N }, () => Array.from({ length: N - 1 }, flip));
  const v = Array.from({ length: N - 1 }, () => Array.from({ length: N }, flip));
  const out = {};
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      out[`${r}-${c}`] = {
        top: r > 0 ? -v[r - 1][c] : 0,
        right: c < N - 1 ? h[r][c] : 0,
        bottom: r < N - 1 ? v[r][c] : 0,
        left: c > 0 ? -h[r][c - 1] : 0,
      };
    }
  }
  return out;
}

const IDS = Array.from({ length: N * N }, (_, i) => `${Math.floor(i / N)}-${i % N}`);
export const JIGSAW_PLACEMENTS = IDS.length - GIVEN;
const pos = (id) => id.split('-').map(Number);

export default function PictureJigsaw({ onPlaced, onMissed, onDone }) {
  const fx = useFx();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const edges = useMemo(makeEdges, []);
  const paths = useMemo(
    () =>
      Object.fromEntries(
        IDS.map((id) => {
          const [r, c] = pos(id);
          return [id, jigsawPath(c * CELL, r * CELL, CELL, CELL, edges[id], K)];
        })
      ),
    [edges]
  );
  const [given] = useState(() => sample(IDS, GIVEN));
  const [placed, setPlaced] = useState(() => Object.fromEntries(given.map((id) => [id, true])));
  const [tray] = useState(() => shuffle(IDS.filter((id) => !given.includes(id))));
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(null);
  const [snap, setSnap] = useState(null);
  const done = IDS.every((id) => placed[id]);

  useEffect(() => {
    if (!done) return undefined;
    fx.say('Picture complete! Beautiful 🖼️', 'wow');
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = (pieceId, cell, point) => {
    if (!cell || placed[cell] || !IDS.includes(cell)) return;
    setSelected(null);
    const pt = point ?? fx.centerOf(`[data-drop="${cell}"]`);
    if (pieceId === cell) {
      setPlaced((p) => ({ ...p, [cell]: true }));
      setSnap(cell);
      onPlaced(pt);
    } else {
      setShake(cell);
      setTimeout(() => setShake(null), 450);
      onMissed(pt, null);
    }
  };

  const { drag, hot, start, isTap } = useDragDrop((id, cell, pt) => place(id, cell, pt));

  const posterId = `${uid}-poster`;
  const clip = (id) => `${uid}-clip-${id}`;

  const pieceSvg = (id, width) => {
    const [r, c] = pos(id);
    return (
      <svg width={width} viewBox={`${c * CELL - K} ${r * CELL - K} ${CELL + 2 * K} ${CELL + 2 * K}`} aria-hidden="true">
        <g clipPath={`url(#${clip(id)})`}>
          <use href={`#${posterId}`} />
        </g>
        <path d={paths[id]} className="mg-jp-edge" />
      </svg>
    );
  };

  return (
    <div className="mg-jigsaw">
      <svg width="0" height="0" className="mg-jigsaw__defs" aria-hidden="true">
        <defs>
          <g id={posterId}>
            <MusclePoster />
          </g>
          {IDS.map((id) => (
            <clipPath key={id} id={clip(id)}>
              <path d={paths[id]} />
            </clipPath>
          ))}
        </defs>
      </svg>

      <svg viewBox={`${-K} ${-K} ${N * CELL + 2 * K} ${N * CELL + 2 * K}`} className={`mg-jigsaw__board${done ? ' mg-jigsaw__board--done' : ''}`} role="img" aria-label="Jigsaw board">
        <use href={`#${posterId}`} className="mg-jp-ghost" />
        {IDS.filter((id) => !placed[id]).map((id) => (
          <path
            key={id}
            d={paths[id]}
            data-drop={id}
            className={`mg-jp-cell${hot === id || selected ? ' mg-jp-cell--hot' : ''}${shake === id ? ' mg-jp-cell--bad' : ''}`}
            onClick={() => selected && place(selected, id)}
          />
        ))}
        {IDS.filter((id) => placed[id]).map((id) => (
          <g key={id} className={`mg-jp-placed${snap === id ? ' mg-jp-placed--snap' : ''}`}>
            <g clipPath={`url(#${clip(id)})`}>
              <use href={`#${posterId}`} />
            </g>
            <path d={paths[id]} className="mg-jp-edge" />
          </g>
        ))}
      </svg>

      {!done && (
        <div className="mg-tray">
          <p className="mg-tray__title">🖼️ Match each piece to the faded picture — drag it or tap then tap a gap</p>
          <div className="mg-tray__pieces mg-tray__pieces--jig">
            {tray
              .filter((id) => !placed[id])
              .map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`mg-piece mg-piece--img${selected === id ? ' mg-piece--selected' : ''}${drag?.id === id ? ' mg-piece--dragging' : ''}`}
                  aria-pressed={selected === id}
                  aria-label={`Puzzle piece row ${pos(id)[0] + 1}, column ${pos(id)[1] + 1}`}
                  onPointerDown={(e) => start(e, id)}
                  onClick={() => isTap() && setSelected((s) => (s === id ? null : id))}
                >
                  {pieceSvg(id, 96)}
                </button>
              ))}
          </div>
        </div>
      )}
      <DragGhost drag={drag} className="mg-piece mg-piece--img mg-piece--ghost">
        {drag && pieceSvg(drag.id, 96)}
      </DragGhost>
    </div>
  );
}
