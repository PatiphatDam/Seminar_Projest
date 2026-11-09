import { Link, useLocation } from "react-router";
import { formatTime, VIDEOS, videoHref, type VideoNote } from "@/content/explore";
import { backState } from "./backLink";

/**
 * Supplementary points taken from the sarcomere-page videos — kept apart from the lecture points, each with a link that
 * opens the video at the moment it is explained.
 */
export function VideoNotes({ notes }: { notes?: VideoNote[] }) {
  const location = useLocation();
  if (!notes?.length) return null;
  // keep the "Back to 3D Explore" target when jumping from the 3D Explore page to the sarcomere page
  const here = location.pathname === "/explore/sarcomere";
  const state = here ? location.state : backState(location);
  return (
    <div className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--c-video)_11%,transparent)] p-3 ring-1 ring-[color-mix(in_srgb,var(--c-video)_40%,transparent)]">
      <p className="text-[11.5px] font-extrabold uppercase tracking-[0.1em] text-[var(--c-video)]">From the video</p>
      <ul className="mt-1.5 space-y-2 text-[14px] leading-5 text-[var(--c-text)]">
        {notes.map((n) => (
          <li key={n.text}>
            {n.text}{" "}
            <Link
              to={videoHref(n)}
              state={state}
              replace={here}
              preventScrollReset
              className="whitespace-nowrap text-[12.5px] font-bold text-[var(--c-video)] hover:underline"
              title={`${VIDEOS[n.video].title} — ${VIDEOS[n.video].channel}`}
            >
              ▶ {formatTime(n.at)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
