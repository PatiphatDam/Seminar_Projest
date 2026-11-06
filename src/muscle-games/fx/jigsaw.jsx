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

