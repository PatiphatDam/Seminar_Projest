import { useEffect, useState } from 'react';
import { HierarchyArt } from '../../art.jsx';
import { useFx } from '../../fx/Fx.jsx';
import { DragGhost, useDragDrop } from '../../fx/drag.jsx';
import { JigsawPiece } from '../../fx/jigsaw.jsx';
import { shuffle } from '../util.js';

const CHAIN = ['muscle', 'fascicle', 'fiber', 'myofibril', 'sarcomere', 'filaments'];
const INFO = {
  muscle: { label: 'Whole muscle', size: 'cm' },
  fascicle: { label: 'Fascicle', size: '~1 mm' },
  fiber: { label: 'Muscle fiber', size: '10–100 µm' },
  myofibril: { label: 'Myofibril', size: '1–2 µm' },
  sarcomere: { label: 'Sarcomere', size: '~2.5 µm long' },
  filaments: { label: 'Myofilaments', size: 'nm' },
};
// Lens position [x, y, r] in each picture's 120×64 viewBox.
const LENS = {
  muscle: [60, 32, 11],
  fascicle: [60, 32, 9],
  fiber: [54, 32, 9],
  myofibril: [70, 32, 10],
  sarcomere: [60, 32, 11],
};

export default function ZoomDive({ onPlaced, onMissed, onDone }) {
  const fx = useFx();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('in');
  const [tray] = useState(() => shuffle(CHAIN.slice(1)));
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(false);

  const kind = CHAIN[step];
  const target = CHAIN[step + 1];
  const lens = LENS[kind];
  const finished = !target;

  useEffect(() => {
    if (!finished) return undefined;
    fx.say('You reached the bottom! These are actin (thin) and myosin (thick) 🔬', 'wow');
    const t = setTimeout(onDone, 1600);
    return () => clearTimeout(t);
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = (pieceId, dropId, point) => {
    if (dropId !== 'lens' || finished || phase === 'out') return;
    setSelected(null);
    const pt = point ?? fx.centerOf('[data-drop="lens"]');
    if (pieceId === target) {
      onPlaced(pt);
      setPhase('out');
      setTimeout(() => {
        setStep((s) => s + 1);
        setPhase('in');
      }, 650);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      onMissed(pt, {
        prompt: `Zoom into the ${INFO[kind].label.toLowerCase()}: what's inside?`,
        yours: INFO[pieceId].label,
        answer: INFO[target].label,
      });
    }
  };

  const { drag, hot, start, isTap } = useDragDrop((id, dropId, pt) => place(id, dropId, pt));

  const piece = (id) => (
    <JigsawPiece w={128} h={104} k={10}>
      <HierarchyArt kind={id} />
      <span>{INFO[id].label}</span>
    </JigsawPiece>
  );

  return (
    <div className="mg-zoom">
      <ol className="mg-zoom__trail" aria-label="Levels found so far">
        {CHAIN.map((c, k) => (
          <li key={c} className={k < step ? 'mg-done' : k === step ? 'mg-now' : undefined}>
            <strong>{k <= step ? INFO[c].label : '?'}</strong>
            <small>{k <= step ? INFO[c].size : ''}</small>
          </li>
        ))}
      </ol>

      <div className={`mg-zoom__stage${shake ? ' mg-shake' : ''}`}>
        <div
          key={step}
          className={`mg-zoom__view mg-zoom__view--${phase}`}
          style={lens ? { transformOrigin: `${(lens[0] / 120) * 100}% ${(lens[1] / 64) * 100}%` } : undefined}
        >
          <svg viewBox="0 0 120 64" role="img" aria-label={`${INFO[kind].label} under the microscope`}>
            <HierarchyArt kind={kind} />
            {lens && (
              <g
                data-drop="lens"
                className={`mg-lens${hot === 'mg-lens' || selected ? ' mg-lens--hot' : ''}`}
                onClick={() => selected && place(selected, 'lens')}
              >
                <circle cx={lens[0]} cy={lens[1]} r={lens[2] + 5} className="mg-lens__hit" />
                <circle cx={lens[0]} cy={lens[1]} r={lens[2]} className="mg-lens__ring" />
                <text x={lens[0]} y={lens[1] + 3} textAnchor="middle" className="mg-lens__q">
                  ?
                </text>
              </g>
            )}
          </svg>
          <p className="mg-zoom__caption">
            {finished ? 'Actin (thin) + myosin (thick): the smallest level!' : `${INFO[kind].label} — what's inside the lens?`}
          </p>
        </div>
      </div>

      {!finished && (
        <div className="mg-tray">
          <p className="mg-tray__title">🔍 Drag the next-smaller level into the glowing lens</p>
          <div className="mg-tray__pieces">
            {tray
              .filter((id) => CHAIN.indexOf(id) > step)
              .map((id) => (
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
