import { useCallback, useRef, useState } from 'react';

// Drop targets are any element with data-drop="<id>".
export const dropTargetAt = (x, y) =>
  document.elementFromPoint(x, y)?.closest('[data-drop]')?.getAttribute('data-drop') ?? null;

// Pointer drag that works for mouse and touch. A short press without movement is left to onClick (tap mode).
export function useDragDrop(onDrop) {
  const [drag, setDrag] = useState(null);
  const [hot, setHot] = useState(null);
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;
  const swallowClick = useRef(false);

  const start = useCallback((e, id, opts = {}) => {
    if (e.button > 0) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    let moving = false;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer */
    }

    const move = (ev) => {
      if (!moving && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
        moving = true;
        opts.onStart?.();
      }
      if (moving) {
        setDrag({ id, x: ev.clientX - (sx - rect.left), y: ev.clientY - (sy - rect.top), w: rect.width, h: rect.height });
        setHot(dropTargetAt(ev.clientX, ev.clientY));
      }
    };
    const end = (ev) => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
      if (!moving) return;
      swallowClick.current = true;
      setTimeout(() => {
        swallowClick.current = false;
      }, 0);
      setDrag(null);
      setHot(null);
      const target = ev.type === 'pointerup' ? dropTargetAt(ev.clientX, ev.clientY) : null;
      if (target) dropRef.current(id, target, { x: ev.clientX, y: ev.clientY });
      else opts.onCancel?.();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }, []);

  const isTap = () => !swallowClick.current;
  return { drag, hot, start, isTap };
}

export function DragGhost({ drag, children, className = '' }) {
  if (!drag) return null;
  return (
    <div className={`mg-drag-ghost ${className}`} style={{ left: drag.x, top: drag.y, width: drag.w, height: drag.h }} aria-hidden="true">
      {children}
    </div>
  );
}
