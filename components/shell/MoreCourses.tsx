import { CourseIcon } from '@/components/ui/InlineIcons';
import { AUTHOR, MORE_COURSES } from '@/lib/links';

/**
 * Home page only, directly below AboutAuthor.
 *
 * Styled quietly on purpose — neutral surface, no Part accent — so these never
 * compete with the course's own module cards on /modules.
 */
export function MoreCourses() {
  return (
    <section className="mx-auto max-w-wide px-4 pb-16" aria-labelledby="more-courses">
      <h2 id="more-courses" className="text-xl font-semibold text-ink">
        More courses by {AUTHOR.name.split(' ')[0]}
      </h2>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MORE_COURSES.map((course) => (
          <li key={course.href}>
            <a
              href={course.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full items-start gap-3 rounded-md border border-border bg-surface p-4 no-underline transition-all duration-base ease-token hover:-translate-y-0.5 hover:border-border hover:bg-bg hover:shadow-card"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted">
                <CourseIcon name={course.icon} size={17} />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  {course.title}
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                    className="shrink-0 text-muted"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
                <span className="mt-0.5 block text-xs text-muted">{course.description}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
