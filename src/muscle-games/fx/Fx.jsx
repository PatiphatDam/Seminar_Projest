import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { isMuted, play, setMuted, vibrate } from './sound.js';

// Game juice shared by every game: confetti, floating points, sound, vibration and Myo's speech.
const ApiContext = createContext(null);
const StateContext = createContext(null);

export const CONFETTI = ['#8b5cf6', '#f472b6', '#fbbf24', '#34d399', '#60a5fa', '#fb7185'];
export const GOLD = ['#fbbf24', '#f59e0b', '#fde68a', '#fff7cc'];
export const ICE = ['#7dd3fc', '#bae6fd', '#e0f2fe', '#a5b4fc'];

export function FxProvider({ children }) {
  const [items, setItems] = useState([]);
  const [speech, setSpeech] = useState({ text: '', mood: 'idle', id: 0 });
  const [muted, setMutedState] = useState(isMuted);
  const seq = useRef(0);

  const api = useMemo(() => {
    const add = (item, life) => {
      const id = ++seq.current;
      setItems((list) => [...list, { ...item, id }]);
      setTimeout(() => setItems((list) => list.filter((i) => i.id !== id)), life);
    };
    return {
      burst(x, y, count = 16, palette = CONFETTI) {
        const bits = Array.from({ length: count }, (_, k) => ({
          dx: (Math.random() - 0.5) * 260,
          dy: -40 - Math.random() * 180,
          rot: Math.random() * 720 - 360,
          color: palette[k % palette.length],
          round: Math.random() < 0.4,
        }));
        add({ kind: 'burst', x, y, bits }, 1100);
      },
      float(x, y, text, tone = 'good') {
        add({ kind: 'float', x, y, text, tone }, 1000);
      },
      centerOf(target) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      },
      say(text, mood = 'happy') {
        setSpeech((s) => ({ text, mood, id: s.id + 1 }));
      },
      sound: play,
      vibrate,
      setMuted(value) {
        setMuted(value);
        setMutedState(value);
      },
    };
  }, []);

  return (
    <ApiContext.Provider value={api}>
      <StateContext.Provider value={{ speech, muted }}>
        {children}
        <div className="mg-fx-layer" aria-hidden="true">
          {items.map((it) =>
            it.kind === 'float' ? (
              <span key={it.id} className={`mg-fx-float mg-fx-float--${it.tone}`} style={{ left: it.x, top: it.y }}>
                {it.text}
              </span>
            ) : (
              <span key={it.id} className="mg-fx-burst" style={{ left: it.x, top: it.y }}>
                {it.bits.map((b, k) => (
                  <i
                    key={k}
                    style={{
                      '--dx': `${b.dx}px`,
                      '--dy': `${b.dy}px`,
                      '--rot': `${b.rot}deg`,
                      background: b.color,
                      borderRadius: b.round ? '50%' : '2px',
                    }}
                  />
                ))}
              </span>
            )
          )}
        </div>
      </StateContext.Provider>
    </ApiContext.Provider>
  );
}

export const useFx = () => useContext(ApiContext);
export const useFxState = () => useContext(StateContext);
export const pick = (list) => list[Math.floor(Math.random() * list.length)];

/* ---------- Myo, the muscle-fiber mascot ---------- */

const MOUTHS = {
  idle: 'M26 41 Q32 45 38 41',
  happy: 'M24 39 Q32 48 40 39',
  sad: 'M26 45 Q32 39 38 45',
};

export function Myo({ mood = 'idle', className = '', ...svgProps }) {
  return (
    <svg viewBox="0 0 64 64" className={`mg-myo mg-myo--${mood} ${className}`} aria-hidden="true" {...svgProps}>
      <ellipse cx="32" cy="60" rx="15" ry="3" fill="#1e1240" opacity=".14" />
      <g className="mg-myo__body">
        <g className="mg-myo__arm mg-myo__arm--l">
          <path d="M14 36 q-9 -1 -8 -12" stroke="#f472b6" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="6" cy="22" r="4.5" fill="#f9a8d4" stroke="#be185d" strokeWidth="1.5" />
        </g>
        <g className="mg-myo__arm mg-myo__arm--r">
          <path d="M50 36 q9 -1 8 -12" stroke="#f472b6" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="58" cy="22" r="4.5" fill="#f9a8d4" stroke="#be185d" strokeWidth="1.5" />
        </g>
        <path d="M14 30 C14 10 50 10 50 30 L50 44 C50 58 14 58 14 44 Z" fill="#f472b6" stroke="#be185d" strokeWidth="2" />
        {[21, 27, 37, 43].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="52" stroke="#be185d" strokeWidth="2" opacity=".16" />
        ))}
        <ellipse cx="25" cy="30" rx="4.6" ry="5.6" fill="#fff" />
        <ellipse cx="39" cy="30" rx="4.6" ry="5.6" fill="#fff" />
        <circle cx="26" cy="31" r="2.6" fill="#1e1240" />
        <circle cx="40" cy="31" r="2.6" fill="#1e1240" />
        <circle cx="19" cy="39" r="3" fill="#fb7185" opacity=".55" />
        <circle cx="45" cy="39" r="3" fill="#fb7185" opacity=".55" />
        {mood === 'wow' ? (
          <ellipse cx="32" cy="43" rx="3.4" ry="4" fill="#7f1d1d" />
        ) : (
          <path d={MOUTHS[mood] ?? MOUTHS.idle} stroke="#7f1d1d" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        )}
      </g>
    </svg>
  );
}

export function MascotBar({ fallback }) {
  const { speech } = useFxState();
  return (
    <div className="mg-mascot-bar">
      <Myo key={`m${speech.id}`} mood={speech.mood} className="mg-mascot-bar__myo" />
      <p key={`b${speech.id}`} className="mg-mascot-bar__bubble" role="status" aria-live="polite">
        {speech.text || fallback}
      </p>
    </div>
  );
}
