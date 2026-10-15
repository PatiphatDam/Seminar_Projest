import { Link } from "react-router";
import { LESSONS } from "@/content/lessons";
import { StudentPageHeader } from "@/components/student/StudentPageHeader";
import { useDocumentTitle } from "@/components/student/useDocumentTitle";
import { BookIcon } from "@/components/student/icons";

/** /lessons — reading content, in book order (Coastal Soft, lilac). */
export default function LessonsList() {
  useDocumentTitle("Lessons");
  const total = LESSONS.reduce((m, l) => m + l.minutes, 0);

  return (
    <div className="coast-lessons coast-sans">
      <StudentPageHeader
        title="Lessons"
        subtitle={`Read these after the pretest · ${LESSONS.length} lessons · about ${total} minutes`}
        phoneSubtitle={`${LESSONS.length} lessons · about ${total} min`}
        crumbs={[{ to: "/", label: "Home" }, { label: "Lessons" }]}
        back="/"
      />

      <ol className="mt-2 grid gap-4 md:mt-8 md:grid-cols-2 md:gap-5">
        {LESSONS.map((l, i) => (
          <li key={l.slug}>
            <Link to={`/lessons/${l.slug}`} className="coast-card flex h-full gap-4 p-3 pr-5 md:p-3.5 md:pr-6">
              <span className="coast-panel grid w-[72px] shrink-0 place-items-center md:w-[88px]" aria-hidden="true">
                <span className="flex flex-col items-center gap-1">
                  <BookIcon size={26} />
                  <span className="text-[12px] font-extrabold">{i + 1}</span>
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col py-1.5">
                <span className="coast-muted text-[11.5px] font-extrabold uppercase tracking-[0.08em]">
                  {l.step} · {l.lo}
                </span>
                <span className="coast-serif mt-1 text-[20px] leading-7 md:text-[22px]">{l.title}</span>
                <span className="coast-muted mt-1 text-[14.5px] leading-[1.5]">{l.summary}</span>
                <span className="coast-accent mt-auto pt-3 text-[13px] font-bold">
                  {l.minutes} min read <span aria-hidden="true">→</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
