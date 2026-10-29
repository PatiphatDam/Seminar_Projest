import { useEffect, useRef, useState } from 'react';
import { useFx } from '../fx/Fx.jsx';

export const comboMult = (streak, cap = 5) => Math.min(cap, streak >= 8 ? 5 : streak >= 5 ? 3 : streak >= 3 ? 2 : 1);

// Countdown in seconds. Returns [left, addSeconds, leftRef].
export function useCountdown(total, { running = true, onExpire } = {}) {
  const [left, setLeft] = useState(total);
  const leftRef = useRef(total);
  const expire = useRef(onExpire);
  expire.current = onExpire;

  useEffect(() => {
    if (!running || leftRef.current <= 0) return undefined;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      leftRef.current = Math.max(0, leftRef.current - (now - last) / 1000);
      last = now;
      setLeft(leftRef.current);
      if (leftRef.current <= 0) {
        clearInterval(id);
        expire.current?.();
      }
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  const add = (sec) => {
    leftRef.current = Math.max(0, leftRef.current + sec);
    setLeft(leftRef.current);
  };
  return [left, add, leftRef];
}

export function TimerBar({ left, total }) {
  const fx = useFx();
  const secs = Math.ceil(left);
  const low = left > 0 && left <= Math.min(10, total * 0.25);
  useEffect(() => {
    if (low && secs <= 5) fx.sound('tick');
  }, [secs, low, fx]);
  return (
    <div className={`mg-timer${low ? ' mg-timer--low' : ''}${left <= 0 ? ' mg-timer--out' : ''}`} role="timer" aria-label={`${secs} seconds left`}>
      <span aria-hidden="true">⏱</span>
      <div className="mg-timer__track">
        <div className="mg-timer__fill" style={{ width: `${Math.max(0, (left / total) * 100)}%` }} />
      </div>
      <span className="mg-timer__num">{left <= 0 ? 'Time’s up' : `${secs}s`}</span>
    </div>
  );
}

export function ComboMeter({ streak, cap = 5 }) {
  const m = comboMult(streak, cap);
  return (
    <div className={`mg-combo mg-combo--x${m}`} aria-label={`Combo ×${m}, streak ${streak}`}>
      <span className="mg-combo__x" key={m}>
        ×{m}
      </span>
      <span className="mg-combo__label">
        COMBO
        <small>🔥 {streak}</small>
      </span>
    </div>
  );
}

export function Lives({ lives, max }) {
  return (
    <span className="mg-lives" aria-label={`${lives} lives left`}>
      {Array.from({ length: max }, (_, k) => (
        <span key={k} className={k < lives ? 'mg-heart' : 'mg-heart mg-heart--lost'}>
          ♥
        </span>
      ))}
    </span>
  );
}

export function Stars({ n, size = 'md', animate = false }) {
  return (
    <span className={`mg-stars mg-stars--${size}`} aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          className={`mg-star${k < n ? ' mg-star--on' : ''}${animate ? ' mg-star--pop' : ''}`}
          style={animate ? { animationDelay: `${0.25 + k * 0.3}s` } : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
