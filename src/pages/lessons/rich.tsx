import { Fragment, type ReactNode } from "react";
import type { LessonBlock } from "@/content/lessons";

/** `**bold**` → <strong>. The only inline formatting lesson text supports. */
export function rich(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-bold text-[var(--c-text)]">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}

/** One block of a lesson, in the Coastal Soft reading style (inside a .coast-lessons scope). */
export function LessonBlockView({ block, id }: { block: LessonBlock; id?: string }) {
  switch (block.kind) {
    case "h":
      return (
        <h2 id={id} className="coast-serif mt-10 scroll-mt-24 text-[24px] leading-8 text-[var(--c-text)] md:text-[27px] md:leading-9">
          {block.text}
        </h2>
      );
    case "p":
      return <p className="mt-4 text-[17px] leading-[1.7]">{rich(block.text)}</p>;
    case "list":
      return (
        <ul className="mt-4 space-y-2.5 text-[17px] leading-[1.65]">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-3">
              <span aria-hidden="true" className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[var(--c-accent)]" />
              <span className="min-w-0">{rich(it)}</span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--c-edge)] bg-surface">
          <table className="w-full min-w-[520px] border-collapse text-left text-[15px] leading-[1.5]">
            <caption className="sr-only">{block.caption}</caption>
            <thead>
              <tr className="bg-[var(--c-panel)] text-[var(--c-text)]">
                {block.head.map((h, i) => (
                  <th key={i} scope="col" className="px-4 py-3 text-[13px] font-extrabold uppercase tracking-[0.04em]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-[var(--c-hair)] align-top">
                  {row.map((cell, c) =>
                    c === 0 ? (
                      <th key={c} scope="row" className="px-4 py-3 font-bold text-[var(--c-text)]">
                        {rich(cell)}
                      </th>
                    ) : (
                      <td key={c} className="px-4 py-3 text-ink">
                        {rich(cell)}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "keypoints":
      return (
        <aside className="coast-panel mt-8 p-5 text-[var(--c-text)] md:p-6" aria-label="Key points">
          <p className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--c-accent)]">Key points</p>
          <ul className="mt-3 space-y-2 text-[16px] leading-[1.6]">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden="true" className="font-extrabold text-[var(--c-accent)]">
                  {i + 1}
                </span>
                <span className="min-w-0">{rich(it)}</span>
              </li>
            ))}
          </ul>
        </aside>
      );
    case "figure":
      return (
        <figure className="mt-6">
          <img src={block.src} alt={block.alt} loading="lazy" className="mx-auto max-h-[420px] w-auto max-w-full rounded-2xl border border-[var(--c-edge)]" />
          <figcaption className="coast-muted mt-2 text-center text-[14px]">{block.caption}</figcaption>
        </figure>
      );
  }
}
