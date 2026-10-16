import { Link } from "react-router";
import { LESSONS, TOPICS, lessonsOfTopic } from "@/content/lessons";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { BookIcon } from "@/components/student/icons";

/**
 * /lessons — reading content grouped by big topics (Coastal Soft, lilac).
 * No step numbers: students can open any topic and any lesson in any order.
 */
export default function LessonsList() {
  useDocumentTitle("Lessons");

  return (
    <div className="coast-lessons coast-sans">
      <StudentPageHeader
        title="Lessons"
        subtitle={`Muscular tissues · ${TOPICS.length} topics · ${LESSONS.length} lessons — read any topic first`}
        phoneSubtitle={`${TOPICS.length} topics · ${LESSONS.length} lessons`}
        crumbs={[{ to: "/", label: "Home" }, { label: "Lessons" }]}
        back="/"
      />

      {/* Jump to a topic */}
      <nav aria-label="Topics" className="mt-3 flex flex-wrap gap-2 md:mt-6">
        {TOPICS.map((t) => (
          <a key={t.id} href={`#topic-${t.id}`} className="coast-chip px-3.5 py-1.5 text-[13px] font-bold ring-1 ring-[var(--c-edge)] hover:bg-surface">
            {t.title}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-9 md:mt-8 md:space-y-11">
        {TOPICS.map((t) => {
          const lessons = lessonsOfTopic(t.id);
          return (
            <section key={t.id} id={`topic-${t.id}`} aria-labelledby={`topic-${t.id}-title`} className="scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 id={`topic-${t.id}-title`} className="coast-serif text-[24px] leading-8 text-ink md:text-[28px] md:leading-9">
                  {t.title}
                </h2>
                <p className="coast-muted text-[13px] font-bold">
                  {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
                </p>
              </div>
              <p className="mt-1 text-[15px] leading-[1.5] text-muted">{t.summary}</p>

              <ul className="mt-4 grid gap-4 md:grid-cols-2 md:gap-5">
                {lessons.map((l) => (
                  <li key={l.slug}>
                    <Link to={`/lessons/${l.slug}`} className="coast-card flex h-full gap-4 p-3 pr-5 md:p-3.5 md:pr-6">
                      <span className="coast-panel grid w-[64px] shrink-0 place-items-center md:w-[76px]" aria-hidden="true">
                        <BookIcon size={26} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col py-1.5">
                        <span className="coast-serif text-[19px] leading-[26px] md:text-[21px] md:leading-7">{l.title}</span>
                        <span className="coast-muted mt-1 text-[14.5px] leading-[1.5]">{l.summary}</span>
                        <span className="coast-accent mt-auto pt-3 text-[13px] font-bold">
                          Read <span aria-hidden="true">→</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
