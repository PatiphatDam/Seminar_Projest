// Jigsaw edge shapes. t: 1 = tab sticks out, -1 = blank cut in, 0 = flat. k = tab size.
function edge(p0, p1, t, k) {
  if (!t) return `L${p1[0]} ${p1[1]}`;
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  const u = [dx / len, dy / len];
  const n = [u[1], -u[0]];
  const P = (a, b) => {
    const x = p0[0] + u[0] * (len / 2 + a * k) + n[0] * b * k * t;
    const y = p0[1] + u[1] * (len / 2 + a * k) + n[1] * b * k * t;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  return `L${P(-0.45, 0)} C${P(-0.2, 0)} ${P(-0.8, 1)} ${P(0, 1)} C${P(0.8, 1)} ${P(0.2, 0)} ${P(0.45, 0)} L${p1[0]} ${p1[1]}`;
}

export function jigsawPath(x, y, w, h, { top = 0, right = 0, bottom = 0, left = 0 }, k) {
  const a = [x, y];
  const b = [x + w, y];
  const c = [x + w, y + h];
  const d = [x, y + h];
  return `M${x} ${y} ${edge(a, b, top, k)} ${edge(b, c, right, k)} ${edge(c, d, bottom, k)} ${edge(d, a, left, k)} Z`;
}

const LABEL_EDGES = { top: 1, right: 1, bottom: -1, left: -1 };

// A jigsaw-shaped label piece; children sit inside the body.
export function JigsawPiece({ w, h, children, tone = 'violet', k = 10, edges = LABEL_EDGES }) {
  const top = edges.top > 0 ? k : 0;
  const right = edges.right > 0 ? k : 0;
  const bottom = edges.bottom > 0 ? k : 0;
  const left = edges.left > 0 ? k : 0;
  const bw = w - left - right;
  const bh = h - top - bottom;
  return (
    <span className={`mg-jig mg-jig--${tone}`} style={{ width: w, height: h }}>
      <svg className="mg-jig__shape" width={w + 4} height={h + 4} viewBox={`-2 -2 ${w + 4} ${h + 4}`} aria-hidden="true">
        <path d={jigsawPath(left, top, bw, bh, edges, k)} />
      </svg>
      <span className="mg-jig__body" style={{ left, top, width: bw, height: bh }}>
        {children}
      </span>
    </span>
  );
}
