import { ML_INTRO_TITLE, ML_INTRO_URL } from '@/lib/links';
import { CourseIcon } from '@/components/ui/InlineIcons';

/**
 * The signpost at the ML border, made clickable.
 *
 * This course stops short of machine learning and says so in Module 6's
 * Lesson 6.7 — "the promised signpost". That prose cannot link anywhere
 * (content files are never edited by the app), so the app supplies the
 * destination here.
 *
 * Rendered in exactly one place: after Module 6's content page. The hand-off
 * is to an *introductory* ML course, not a sequel — a deeper Machine Learning
 * & Deep Learning course is a separate, later thing, so the copy promises
 * only what exists.
 */
export function MlNextStepCard() {
  return (
    <aside className="not-prose my-10 rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted">
          <CourseIcon name="network" size={18} />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            At the signpost
          </p>

          <a
            href={ML_INTRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-1 inline-flex items-baseline gap-1.5 text-base font-semibold text-ink no-underline"
          >
            <span className="underline decoration-transparent decoration-2 underline-offset-2 transition-colors duration-fast ease-token group-hover:decoration-current">
              Next step: {ML_INTRO_TITLE}
            </span>
            <span aria-hidden="true" className="text-muted transition-transform duration-fast ease-token group-hover:translate-x-0.5">
              →
            </span>
          </a>

          <p className="mt-1.5 max-w-content text-sm text-muted">
            This course stops at the ML border by design. The introductory ML course picks up
            exactly there.
          </p>
        </div>
      </div>
    </aside>
  );
}
