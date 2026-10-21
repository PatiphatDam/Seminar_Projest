import { useEffect, useState } from 'react';
import { SarcomereDiagram } from '../../art.jsx';

const SLOTS = ['z', 'm', 'i', 'h', 'a'].map((id, k) => ({ id, n: k + 1 }));
const LABELS = { z: 'Z disc', m: 'M line', i: 'I band', h: 'H zone', a: 'A band' };
const PERIOD = 3600;

// Reward animation: the sliding filament mechanism in a loop.
export default function Contraction() {
  const [c, setC] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    const t0 = performance.now() - Math.acos(1 - 2 * c) * (PERIOD / (2 * Math.PI));
    const tick = (t) => {
      const phase = ((t - t0) % PERIOD) / PERIOD;
      setC((1 - Math.cos(phase * 2 * Math.PI)) / 2);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mg-contraction">
      <div className="mg-contraction__head">
        <strong>{c > 0.5 ? '💪 Contracted' : '😌 Relaxed'}</strong>
        <button type="button" className="mg-btn mg-btn--ghost" onClick={() => setPlaying((p) => !p)}>
          {playing ? '❚❚ Pause' : '▶ Play'}
        </button>
      </div>
      <SarcomereDiagram slots={SLOTS} filled={LABELS} contract={c} />
      <ul className="mg-contraction__legend">
        <li>I band ↓ shorter</li>
        <li>H zone ↓ smaller</li>
        <li>A band = same length</li>
        <li>Z discs move closer</li>
      </ul>
    </div>
  );
}
