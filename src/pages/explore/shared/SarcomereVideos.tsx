import { useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { formatTime, VIDEOS, type VideoId } from "@/content/explore";

const IDS = Object.keys(VIDEOS) as VideoId[];

/**
 * The two videos on the sarcomere page (3D-9): tabs to switch, and a chapter list that jumps to the moment each step is
 * explained. The chosen video and time live in the URL (?video=…&t=…), so "▶ 1:38" links in the info panels — on this
 * page or on 3D Explore — open the right spot.
 */
export function SarcomereVideos() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const card = useRef<HTMLElement>(null);
  const raw = params.get("video");
  const current: VideoId = IDS.includes(raw as VideoId) ? (raw as VideoId) : "crossbridge";
  const start = Number(params.get("t")) || 0;
  const v = VIDEOS[current];
  // only autoplay after the student picked a moment (a link or a chapter), never on page load without one
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?rel=0${params.has("t") ? `&start=${start}&autoplay=1` : ""}`;

  // a "▶ time" link brings the video into view — a frame later, after the layout's scroll-to-top on a page change
  useEffect(() => {
    if (location.hash !== "#video") return;
    const raf = requestAnimationFrame(() => card.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    return () => cancelAnimationFrame(raf);
  }, [location.hash, location.search]);

  const go = (video: VideoId, t?: number) =>
    navigate({ search: t === undefined ? `?video=${video}` : `?video=${video}&t=${t}` }, { replace: true, state: location.state, preventScrollReset: true });

  return (
    <section ref={card} id="video" className="coast-card scroll-mt-24 p-5" aria-labelledby="video-title">
      <h2 id="video-title" className="text-[18px] font-extrabold text-[var(--c-text)]">
        Motion videos
      </h2>
      <div role="tablist" aria-label="Videos" className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-[var(--c-bg)] p-1">
        {IDS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === current}
            onClick={() => go(id)}
            className={
              "rounded-full px-3 py-1.5 text-[13.5px] font-bold transition-colors " +
              (id === current ? "bg-[var(--c-accent)] text-[var(--c-on)]" : "text-[var(--c-text)] hover:bg-[var(--c-panel)]")
            }
          >
            {VIDEOS[id].tab}
          </button>
        ))}
      </div>
      <p className="coast-muted mt-3 text-[14px]">{v.about}</p>
      <div className="mt-3 aspect-video overflow-hidden rounded-[14px] bg-black">
        <iframe
          key={src}
          src={src}
          title={v.title}
          loading="lazy"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full"
        />
      </div>
      <p className="coast-muted mt-2 text-[12px]">
        {v.title} · {v.channel} · {v.length} (YouTube)
      </p>
      <h3 className="coast-muted mt-4 text-[12px] font-extrabold uppercase tracking-[0.1em]">In this video</h3>
      <ol className="mt-2 space-y-1">
        {v.chapters.map((c) => (
          <li key={c.at}>
            <button
              type="button"
              onClick={() => go(current, c.at)}
              aria-current={params.has("t") && start === c.at ? "true" : undefined}
              className="flex w-full gap-3 rounded-lg px-2 py-1.5 text-left text-[14px] leading-5 text-[var(--c-text)] hover:bg-[var(--c-bg)] aria-[current]:bg-[var(--c-panel)]"
            >
              <span className="w-10 shrink-0 font-bold tabular-nums text-[var(--c-accent)]">{formatTime(c.at)}</span>
              <span>{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
