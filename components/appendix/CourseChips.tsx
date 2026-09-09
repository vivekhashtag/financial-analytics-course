import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import type { Miniature } from '@/lib/appendix-d';

/**
 * "Your course, in miniature" as chips that go somewhere.
 *
 * The whole point of this block in the source is *this job's artefact = that
 * course notebook*, which is a link the prose could not be. A chip links only
 * when its mapping resolves to exactly one module; "3C+5B" and "Modules 3+5+6"
 * name several, so those render as plain chips rather than sending a learner to
 * whichever one happened to be matched first (see findModuleRefs).
 */
export function CourseChips({ miniature }: { miniature: Miniature }) {
  return (
    <div className="not-prose mt-4">
      <ul className="flex flex-wrap gap-2">
        {miniature.chips.map((chip, i) => {
          const inner = (
            <>
              {chip.code && (
                <span className="font-mono text-[0.7rem] font-medium tabular-nums accent-text">
                  {chip.code}
                </span>
              )}
              {chip.code && <span className="text-border">·</span>}
              <span>{chip.label}</span>
              {chip.href && (
                <Icon name="arrow-right" size={11} className="shrink-0 opacity-60" />
              )}
            </>
          );

          const shared =
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium';

          return (
            <li key={`${chip.label}-${i}`}>
              {chip.href ? (
                <Link
                  href={chip.href}
                  title={chip.moduleTitle ? `Go to ${chip.moduleTitle}` : undefined}
                  className={`${shared} border-border bg-bg text-ink no-underline transition-colors duration-fast ease-token hover:bg-surface`}
                >
                  {inner}
                </Link>
              ) : (
                // Unlinked on purpose: names more than one module, or none.
                <span className={`${shared} border-dashed border-border bg-surface text-muted`}>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {miniature.note && <p className="mt-3 text-sm text-muted">{miniature.note}</p>}
    </div>
  );
}
