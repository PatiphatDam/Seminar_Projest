/** Hand-made SVG/CSS charts for Results (no chart library, per the performance budget). */
import { cx } from "@/components/ui";

export interface BarSeries {
  id: string;
  label: string;
  /** Tailwind fill class for bars + legend swatch, e.g. "fill-zinc-400". */
  fillClass: string;
  swatchClass: string;
  /** count per score (index = score). */
  counts: number[];
}

/**
 * Figma score distribution: paired 14 px bars (pretest grey #C4C4CC · posttest blue), no axes or grid,
 * score labels under each pair; a zero count is drawn as a 1 px baseline tick.
 */
export function PairedBars({ series, maxX, height = 156 }: { series: BarSeries[]; maxX: number; height?: number }) {
  const buckets = Math.max(1, maxX + 1);
  const maxY = Math.max(1, ...series.flatMap((s) => s.counts));
  const summary = series
    .map((s) => `${s.label}: ${s.counts.map((c, i) => (c ? `${c} at ${i}` : null)).filter(Boolean).join(", ") || "no data"}`)
    .join(". ");
  return (
    <figure role="img" aria-label={`Score distribution. ${summary}`}>
      <div className="flex items-end justify-between px-1" style={{ height }}>
        {Array.from({ length: buckets }, (_, score) => (
          <div key={score} className="flex items-end gap-[3px]">
            {series.map((s) => {
              const c = s.counts[score] ?? 0;
              return (
                <span
                  key={s.id}
                  title={`${s.label} · score ${score}: ${c} student${c === 1 ? "" : "s"}`}
                  className={cx("block w-[14px]", s.swatchClass, c > 0 ? "rounded-[4px]" : "")}
                  style={{ height: c > 0 ? Math.max(4, (c / maxY) * height) : 1 }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-[18px] flex justify-between px-1 text-[12px] text-muted" aria-hidden="true">
        {Array.from({ length: buckets }, (_, score) => (
          <span key={score} className="text-center" style={{ width: series.length * 14 + (series.length - 1) * 3 }}>
            {score}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Horizontal percentage bars (item analysis, Figma: 10 px track, Q label + % in 12 px). Bars under `warnBelow` % turn red. */
export function PercentBars({ items, warnBelow = 60 }: { items: { key: string | number; label: string; title?: string; percent: number; n: number }[]; warnBelow?: number }) {
  return (
    <ul className="space-y-[11px]">
      {items.map((it) => {
        const pct = Math.max(0, Math.min(100, it.percent));
        const warn = pct < warnBelow;
        return (
          <li key={it.key} className="grid grid-cols-[24px_minmax(0,1fr)_32px] items-center gap-3 text-[12px] leading-4" title={it.title}>
            <span className={cx(warn ? "font-semibold text-red-700" : "text-muted")}>{it.label}</span>
            <span
              className="h-2.5 overflow-hidden rounded-full bg-[#f0f0f2]"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(pct)}
              aria-label={`${it.label}: ${Math.round(pct)}% correct (n = ${it.n})${it.title ? ` — ${it.title}` : ""}`}
            >
              <span className={cx("block h-full rounded-full", warn ? "bg-red-700" : "bg-tests")} style={{ width: `${pct}%` }} />
            </span>
            <span className="text-right font-semibold tabular-nums text-ink">{Math.round(pct)}%</span>
          </li>
        );
      })}
    </ul>
  );
}
