import { Link, useParams } from "react-router";
import { LESSONS, lessonBySlug } from "@/content/lessons";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/student/icons";
import { LessonBlockView } from "./rich";

/** /lessons/:slug — one lesson to read (Coastal Soft, lilac). Headings get anchors for the "On this page" list. */
export default function Lesson() {
  const { slug } = useParams();
  const lesson = lessonBySlug(slug);
  useDocumentTitle(lesson?.title ?? "Lesson not found");

  if (!lesson) {
    return (
      <div className="coast-lessons coast-sans">
        <StudentPageHeader title="Lesson not found" crumbs={[{ to: "/", label: "Home" }, { to: "/lessons", label: "Lessons" }, { label: "Not found" }]} back="/lessons" />
        <p className="mt-6 text-muted">
          This lesson doesn’t exist anymore.{" "}
          <Link to="/lessons" className="font-semibold text-ink underline">
            See all lessons
          </Link>
        </p>
      </div>
    );
  }

  const index = LESSONS.indexOf(lesson);
  const prev = LESSONS[index - 1];
  const next = LESSONS[index + 1];
  const headings = lesson.blocks.flatMap((b, i) => (b.kind === "h" ? [{ id: `part-${i}`, text: b.text }] : []));

  return (
    <div className="coast-lessons coast-sans">
      <StudentPageHeader
        title={lesson.title}
        subtitle={`${lesson.step} · ${lesson.lo} · ${lesson.minutes} min read`}
        phoneTitle={lesson.title}
        phoneSubtitle={`Lesson ${index + 1} of ${LESSONS.length} · ${lesson.minutes} min`}
        crumbs={[{ to: "/", label: "Home" }, { to: "/lessons", label: "Lessons" }, { label: lesson.title }]}
        back="/lessons"
      />

      <div className="mt-2 md:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <article className="coast-card min-w-0 px-5 pb-8 pt-6 text-ink md:px-10 md:pb-10 md:pt-8">
          <p className="coast-muted text-[12px] font-extrabold uppercase tracking-[0.1em]">
            Lesson {index + 1} of {LESSONS.length}
          </p>
          <p className="coast-serif mt-2 text-[28px] leading-9 text-[var(--c-text)] md:hidden">{lesson.title}</p>
          <p className="coast-muted mt-3 max-w-[62ch] text-[17px] leading-[1.6]">{lesson.summary}</p>
          <div className="max-w-[68ch]">
            {lesson.blocks.map((b, i) => (
              <LessonBlockView key={i} block={b} id={b.kind === "h" ? `part-${i}` : undefined} />
            ))}
          </div>
        </article>

        {headings.length > 0 && (
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="coast-card sticky top-24 p-5">
              <p className="coast-muted text-[12px] font-extrabold uppercase tracking-[0.1em]">On this page</p>
              <ul className="mt-3 space-y-2 text-[14.5px]">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="coast-accent rounded font-semibold hover:underline">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}
      </div>

      {/* Previous / next lesson; after the last one, continue with the Games (learning order). */}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {prev ? (
          <Link to={`/lessons/${prev.slug}`} className="coast-card flex items-center gap-3 px-5 py-4">
            <ArrowLeftIcon size={18} className="coast-accent shrink-0" />
            <span className="min-w-0">
              <span className="coast-muted block text-[12px] font-bold uppercase tracking-[0.06em]">Previous</span>
              <span className="coast-serif block truncate text-[17px]">{prev.title}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden md:block" />
        )}
        <Link
          to={next ? `/lessons/${next.slug}` : "/games"}
          className="coast-btn flex items-center justify-between gap-3 px-5 py-4 md:justify-end md:text-right"
        >
          <span className="min-w-0">
            <span className="block text-[12px] font-bold uppercase tracking-[0.06em] opacity-80">{next ? "Next lesson" : "Done reading"}</span>
            <span className="block truncate text-[17px] font-bold">{next ? next.title : "Practice with Games"}</span>
          </span>
          <ArrowRightIcon size={18} className="shrink-0" />
        </Link>
      </div>
    </div>
  );
}
