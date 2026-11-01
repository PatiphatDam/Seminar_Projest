import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { CanvasTexture, PerspectiveCamera, Sprite, SRGBColorSpace, Vector2, type Intersection, type Raycaster, type Vector3 } from "three";

/**
 * Numbered hotspot marker drawn as a callout: a small dot sits ON the part, a leader line runs out to a numbered badge,
 * and the selected marker also shows the part's name next to its badge. One sprite with a constant on-screen size,
 * always drawn on top; `center` pins the dot to `pos`, so the badge and line keep the same screen offset at any zoom.
 * The leader points left for parts left of the model's centre and right otherwise, away from the middle of the model.
 */

// layout in CSS pixels — the same size on every screen (the texture is drawn at 2× for sharp text)
const K = 1.25; // overall size (badge diameter ≈ 23 px)
const R = 9 * K; // badge radius
const DOT = 3 * K; // dot on the part
const RING = 9 * K; // ring round the pointed spot while the marker is selected
/** Extra tap tolerance around the badge on touch screens (fingers are less precise than a mouse). */
const TOUCH_SLOP = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches ? 9 : 3;
const PAD = Math.max(TOUCH_SLOP, RING - DOT + 3); // transparent margin: the badge tap area and the ring stay inside the sprite
const RUN_X = 40 * K; // leader line, horizontal run
const RUN_Y = 26 * K; // leader line, vertical rise
const LABEL_GAP = 5 * K;
const LABEL_H = 20 * K;
const FONT_BADGE = `bold ${11 * K}px system-ui, sans-serif`;
const FONT_LABEL = `600 ${12.5 * K}px system-ui, sans-serif`;
const SS = 2; // supersampling

const BROWN = "#8c6117";
const WHITE = "#ffffff";
const INK = "rgba(20, 16, 10, 0.85)";

type Layout = { w: number; h: number; dot: [number, number]; badge: [number, number]; label?: { x: number; y: number; w: number } };

function measure(text: string): number {
  const g = document.createElement("canvas").getContext("2d")!;
  g.font = FONT_LABEL;
  return Math.ceil(g.measureText(text).width);
}

/** Positions of the dot, badge and label inside the sprite. Pure. */
export function calloutLayout(side: "left" | "right", labelWidth: number | null): Layout {
  const labelW = labelWidth === null ? 0 : labelWidth + 16 * K; // text + pill padding
  const extra = labelWidth === null ? 0 : LABEL_GAP + labelW;
  const w = PAD + DOT + RUN_X + R + extra + PAD;
  const h = PAD + R + RUN_Y + DOT + PAD;
  const dotY = h - PAD - DOT;
  const badgeY = PAD + R;
  if (side === "right") {
    const dotX = PAD + DOT;
    const badgeX = dotX + RUN_X;
    return { w, h, dot: [dotX, dotY], badge: [badgeX, badgeY], label: labelWidth === null ? undefined : { x: badgeX + R + LABEL_GAP, y: badgeY - LABEL_H / 2, w: labelW } };
  }
  const dotX = w - PAD - DOT;
  const badgeX = dotX - RUN_X;
  return { w, h, dot: [dotX, dotY], badge: [badgeX, badgeY], label: labelWidth === null ? undefined : { x: badgeX - R - LABEL_GAP - labelW, y: badgeY - LABEL_H / 2, w: labelW } };
}

function draw(n: number, active: boolean, layout: Layout, label: string | null): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = Math.ceil(layout.w * SS);
  c.height = Math.ceil(layout.h * SS);
  const g = c.getContext("2d")!;
  g.scale(SS, SS);
  const [dx, dy] = layout.dot;
  const [bx, by] = layout.badge;

  // leader line: dark under-stroke so it reads on light and dark parts alike; bolder while selected
  g.lineCap = "round";
  for (const [width, colour] of [
    [active ? 5 : 3.5, INK],
    [active ? 2.6 : 1.6, WHITE],
  ] as const) {
    g.beginPath();
    g.moveTo(dx, dy);
    g.lineTo(bx, by);
    g.lineWidth = width;
    g.strokeStyle = colour;
    g.stroke();
  }

  if (active) {
    // selected: a ring round the spot and an arrowhead pointing into it
    g.beginPath();
    g.arc(dx, dy, RING, 0, Math.PI * 2);
    g.lineWidth = 4.5;
    g.strokeStyle = INK;
    g.stroke();
    g.lineWidth = 2.2;
    g.strokeStyle = WHITE;
    g.stroke();

    const a = Math.atan2(dy - by, dx - bx); // direction badge → spot
    const tip = DOT + 1; // the tip stops just short of the dot
    const len = 11 * K;
    const half = 6 * K;
    const tx = dx - Math.cos(a) * tip;
    const ty = dy - Math.sin(a) * tip;
    const ox = tx - Math.cos(a) * len;
    const oy = ty - Math.sin(a) * len;
    g.beginPath();
    g.moveTo(tx, ty);
    g.lineTo(ox - Math.sin(a) * half, oy + Math.cos(a) * half);
    g.lineTo(ox + Math.sin(a) * half, oy - Math.cos(a) * half);
    g.closePath();
    g.lineJoin = "round";
    g.lineWidth = 2.5;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = WHITE;
    g.fill();
  }

  // dot on the part
  g.beginPath();
  g.arc(dx, dy, DOT, 0, Math.PI * 2);
  g.fillStyle = active ? WHITE : BROWN;
  g.fill();
  g.lineWidth = 1.5;
  g.strokeStyle = active ? INK : WHITE;
  g.stroke();

  // numbered badge
  g.beginPath();
  g.arc(bx, by, R - 1, 0, Math.PI * 2);
  g.fillStyle = active ? WHITE : BROWN;
  g.fill();
  g.lineWidth = 2;
  g.strokeStyle = active ? BROWN : WHITE;
  g.stroke();
  g.fillStyle = active ? BROWN : WHITE;
  g.font = FONT_BADGE;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(String(n), bx, by + 1);

  // name of the selected part
  if (label && layout.label) {
    const { x, y, w } = layout.label;
    g.beginPath();
    g.roundRect(x, y, w, LABEL_H, LABEL_H / 2);
    g.fillStyle = INK;
    g.fill();
    g.fillStyle = WHITE;
    g.font = FONT_LABEL;
    g.textAlign = "left";
    g.fillText(label, x + 8 * K, y + LABEL_H / 2 + 1);
  }

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function Marker({
  id,
  n,
  pos,
  active,
  onClick,
  label,
}: {
  id: string;
  n: number;
  pos: Vector3;
  active: boolean;
  onClick: () => void;
  /** Part name, shown next to the badge while this marker is selected. */
  label?: string;
}) {
  const side: "left" | "right" = pos.x < 0 ? "left" : "right";
  const text = active && label ? label : null;
  const layout = useMemo(() => calloutLayout(side, text === null ? null : measure(text)), [side, text]);
  const tex = useMemo(() => draw(n, active, layout, text), [n, active, layout, text]);
  useEffect(() => () => tex.dispose(), [tex]);

  // Sprite scale per CSS pixel: with sizeAttenuation off, on-screen size = scale × viewerHeight / (2·tan(fov/2)).
  const fov = useThree((st) => (st.camera instanceof PerspectiveCamera ? st.camera.fov : 38));
  const viewerHeight = useThree((st) => st.size.height);
  const unit = (2 * Math.tan(((fov / 2) * Math.PI) / 180)) / Math.max(1, viewerHeight);

  const center = useMemo(() => new Vector2(layout.dot[0] / layout.w, 1 - layout.dot[1] / layout.h), [layout]);

  // Only the badge (and the name pill) are clickable — the empty corners of the sprite must not block taps on the
  // model underneath. Sprite intersections carry the uv of the hit, which maps back to the layout.
  const raycast = useMemo(
    () =>
      function (this: Sprite, raycaster: Raycaster, hits: Intersection[]) {
        const local: Intersection[] = [];
        Sprite.prototype.raycast.call(this, raycaster, local);
        for (const hit of local) {
          if (!hit.uv) continue;
          const x = hit.uv.x * layout.w;
          const y = (1 - hit.uv.y) * layout.h;
          const onBadge = Math.hypot(x - layout.badge[0], y - layout.badge[1]) <= R + TOUCH_SLOP;
          const l = layout.label;
          const onLabel = !!l && x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + LABEL_H;
          if (onBadge || onLabel) hits.push(hit);
        }
      },
    [layout],
  );

  return (
    <sprite
      position={pos}
      center={center}
      scale={[layout.w * unit, layout.h * unit, 1]}
      renderOrder={active ? 11 : 10}
      userData={{ hotspot: id }}
      raycast={raycast}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <spriteMaterial map={tex} sizeAttenuation={false} depthTest={false} transparent />
    </sprite>
  );
}
