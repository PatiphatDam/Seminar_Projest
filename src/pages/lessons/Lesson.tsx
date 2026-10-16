import { Link, useParams } from "react-router";
import { lessonBySlug, lessonsOfTopic, topicById } from "@/content/lessons";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/student/icons";
import { LessonBlockView } from "./rich";

/**
 * /lessons/:slug — one lesson to read (Coastal Soft, lilac). Headings get anchors for the "On this page" list.
 * Lessons have no fixed order, so the page ends with the other lessons of the same topic instead of next/previous.
 */
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

  const topic = topicById(lesson.topic);
  const more = lessonsOfTopic(lesson.topic).filter((l) => l.slug !== lesson.slug);
  const headings = lesson.blocks.flatMap((b, i) => (b.kind === "h" ? [{ id: `part-${i}`, text: b.text }] : []));

  return (
    <div className="coast-lessons coast-sans">
      <StudentPageHeader
        title={lesson.title}
        subtitle={topic.title}
        phoneTitle={lesson.title}
        phoneSubtitle={topic.title}
        crumbs={[{ to: "/", label: "Home" }, { to: "/lessons", label: "Lessons" }, { to: `/lessons#topic-${topic.id}`, label: topic.title }, { label: lesson.title }]}
        back="/lessons"
      />

      <div className="mt-2 md:mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <article className="coast-card min-w-0 px-5 pb-8 pt-6 text-ink md:px-10 md:pb-10 md:pt-8">
          <p className="coast-muted text-[12px] font-extrabold uppercase tracking-[0.1em]">{topic.title}</p>
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

      {/* Other lessons in this topic + back to all topics (any order is fine). */}
      <section aria-labelledby="more-title" className="mt-8">
        <h2 id="more-title" className="coast-serif text-[21px] leading-7 text-ink">
          {more.length > 0 ? `More in ${topic.title}` : "Keep reading"}
        </h2>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {more.map((l) => (
            <li key={l.slug}>
              <Link to={`/lessons/${l.slug}`} className="coast-card flex h-full items-center justify-between gap-3 px-5 py-4">
                <span className="coast-serif min-w-0 text-[17px] leading-6">{l.title}</span>
                <ArrowRightIcon size={18} className="coast-accent shrink-0" />
              </Link>
            </li>
          ))}
          <li>
            <Link to="/lessons" className="coast-btn flex h-full items-center gap-3 px-5 py-4">
              <ArrowLeftIcon size={18} className="shrink-0" />
              <span className="min-w-0">
                <span className="block text-[12px] font-bold uppercase tracking-[0.06em] opacity-80">All topics</span>
                <span className="block text-[17px] font-bold">Choose another topic</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
