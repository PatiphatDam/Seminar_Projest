// Group Sort's timers: an hourglass like Balloon Pop's, dressed for each mode. Picture Match (the detective board): the
// hourglass seen through a magnifying glass, a ruler whose gold strip shrinks, the seconds on a dark wooden tag.
// Conveyor Sort (the robot factory): the hourglass in a gear that turns a notch a second, and a crate riding a mini
// conveyor belt to the hazard post as time runs out. The sand, the gear and the crate move once a second (nothing
// loops), so they stay cheap to draw. In the last 10 s everything turns red, the number pulses and the clock ticks.
import { useEffect, useId } from 'react';
import { useFx } from '../fx/Fx.jsx';

function useClock(left, total) {
  const fx = useFx();
  const secs = Math.max(0, Math.ceil(left));
  const low = left > 0 && left <= Math.min(10, total * 0.25);
  useEffect(() => {
    if (low && secs <= 5) fx.sound('tick');
  }, [secs, low, fx]);
  return { secs, low, sand: Math.max(0, Math.min(1, secs / total)), f: Math.max(0, Math.min(1, left / total)) };
}

// kind: 'brass' (gold caps, gold sand) or 'steel' (hazard-stripe caps, blue sand)
function Hourglass({ sand, kind }) {
  const id = useId().replace(/:/g, '');
  const steel = kind === 'steel';
  const edge = steel ? '#1d2a30' : '#5c3b10';
  return (
    <svg className="mg-hglass" viewBox="0 0 26 34" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset=".45" stopColor="#d4a537" />
          <stop offset="1" stopColor="#6b4410" />
        </linearGradient>
        <pattern id={`${id}h`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="5" fill="#facc15" />
          <rect width="2.5" height="5" fill="#1d2a30" />
        </pattern>
        <clipPath id={`${id}t`}>
          <path d="M7 5c0 6 5 8.5 6 12 1-3.5 6-6 6-12z" />
        </clipPath>
        <clipPath id={`${id}b`}>
          <path d="M7 29c0-6 5-8.5 6-12 1 3.5 6 6 6 12z" />
        </clipPath>
      </defs>
      {[1, 29].map((y) => (
        <rect key={y} x="2" y={y} width="22" height="4" rx="1.5" fill={`url(#${id}${steel ? 'h' : 'c'})`} stroke={edge} strokeWidth="0.7" />
      ))}
      <path d="M4.5 5v24M21.5 5v24" stroke={steel ? '#2b3d45' : '#8a5a12'} strokeWidth="2" />
      <path d="M7 5c0 6 5 8.5 6 12-1 3.5-6 6-6 12h12c0-6-5-8.5-6-12 1-3.5 6-6 6-12z" fill={steel ? 'rgb(224 242 254 / 0.55)' : 'rgb(219 234 254 / 0.35)'} stroke={edge} strokeWidth="0.8" />
      <g clipPath={`url(#${id}t)`}>
        <rect className="mg-hglass__sand" x="6" y={5 + 12 * (1 - sand)} width="14" height={12 * sand} />
      </g>
      <g clipPath={`url(#${id}b)`}>
        <rect className="mg-hglass__sand" x="6" y={29 - 12 * (1 - sand)} width="14" height={12 * (1 - sand)} />
      </g>
      {sand > 0 && <path className="mg-hglass__stream" d="M13 17v12" />}
      <path d="M9 7.5c.5 3 2 4.5 3 5.5" stroke="#fff" strokeWidth="0.8" fill="none" opacity="0.6" />
    </svg>
  );
}

export function MagnifierTimer({ left, total }) {
  const { secs, low, sand, f } = useClock(left, total);
  return (
    <div className={`mg-ptimer${low ? ' mg-ptimer--low' : ''}`} role="timer" aria-label={`${secs} seconds left`}>
      <span className="mg-ptimer__lens" aria-hidden="true">
        <Hourglass sand={sand} kind="brass" />
      </span>
      <span className="mg-ptimer__ruler" aria-hidden="true">
        <span className="mg-ptimer__strip" style={{ transform: `scaleX(${f})` }} />
      </span>
      <span className="mg-ptimer__num">{secs}</span>
    </div>
  );
}

export function GearTimer({ left, total }) {
  const { secs, low, sand } = useClock(left, total);
  const gone = 1 - sand;
  return (
    <div className={`mg-gtimer${low ? ' mg-gtimer--low' : ''}`} role="timer" aria-label={`${secs} seconds left`}>
      <span className="mg-gtimer__gear" aria-hidden="true">
        <i className="mg-gtimer__teeth" style={{ transform: `rotate(${(total - secs) * 15}deg)` }} />
        <Hourglass sand={sand} kind="steel" />
      </span>
      <span className="mg-gtimer__line" aria-hidden="true">
        <span className="mg-gtimer__belt" />
        <span className="mg-gtimer__crate" style={{ left: `calc(${gone} * (100% - 26px))` }} />
        <span className="mg-gtimer__post" />
      </span>
      <span className="mg-gtimer__num">{secs}</span>
    </div>
  );
}
