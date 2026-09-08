import Link from 'next/link';
import type { Metadata } from 'next';
import { Icon } from '@/components/ui/Icon';
import { formatMinutes } from '@/components/shell/ModuleShell';
import { ModuleCardMeta } from '@/components/shell/ModuleCardMeta';
import { getAllModules, getExercises, getQuiz } from '@/lib/content';
import { PARTS, partAnchor } from '@/lib/parts';

export const metadata: Metadata = {
  title: 'All modules',
  description: 'Sixteen modules across four parts and a capstone.',
};

export default function ModulesIndex() {
  const modules = getAllModules();
  const parts = PARTS.filter((p) => modules.some((m) => m.part === p.id));

  const totalMinutes = modules.reduce((sum, m) => sum + m.estimatedMinutes, 0);

  return (
    <div className="mx-auto max-w-wide px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold text-ink">The course</h1>
        <p className="mt-2 max-w-content text-lg text-muted">
          {modules.length} modules, {parts.length} parts, about{' '}
          {Math.round(totalMinutes / 60)} hours of work. Prerequisites are suggested and never
          enforced — but skipping Module 2 will hurt in Module 3.
        </p>
      </header>

      <div className="mt-10 space-y-12">
        {parts.map((p) => {
          const inPart = modules.filter((m) => m.part === p.id);

          return (
            <section
              key={p.id}
              // Anchor target for /modules#part-a. scroll-mt clears the sticky header.
              id={partAnchor(p.id)}
              className="scroll-mt-20"
              style={{ '--accent': p.color } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-3">
                <h2 className="text-xl font-semibold accent-text">{p.label}</h2>
                <p className="text-sm text-muted">{p.tagline}</p>
              </div>

              <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {inPart.map((mod) => {
                  const quiz = getQuiz(mod.id);
                  const exercises = getExercises(mod.id);

                  return (
                    <li key={mod.id}>
                      <Link
                        href={`/modules/${mod.id}`}
                        className="card group flex h-full flex-col gap-3 p-5 no-underline transition-all duration-base ease-token hover:-translate-y-0.5 hover:shadow-lift"
                        style={{ borderTopWidth: 3, borderTopColor: p.color }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold"
                            style={{ backgroundColor: `${p.color}18`, color: p.color }}
                          >
                            {mod.number}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted">
                            <Icon name="clock" size={12} />
                            {formatMinutes(mod.estimatedMinutes)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-ink">{mod.title}</h3>
                          {mod.subtitle && (
                            <p className="mt-1 text-sm text-muted">{mod.subtitle}</p>
                          )}
                        </div>

                        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                          <li className="inline-flex items-center gap-1">
                            <Icon name="book" size={12} />
                            {mod.pages.length} pages
                          </li>
                          {mod.notebooks.length > 0 && (
                            <li className="inline-flex items-center gap-1">
                              <Icon name="notebook" size={12} />
                              {mod.notebooks.length} notebooks
                            </li>
                          )}
                          {exercises.length > 0 && (
                            <li className="inline-flex items-center gap-1">
                              <Icon name="pencil" size={12} />
                              {exercises.length} exercises
                            </li>
                          )}
                          {quiz && (
                            <li className="inline-flex items-center gap-1">
                              <Icon name="check-circle" size={12} />
                              {quiz.questions.length} q
                            </li>
                          )}
                        </ul>

                        <ModuleCardMeta
                          moduleId={mod.id}
                          badge={mod.badge}
                          totals={{
                            pages: mod.pages.length,
                            notebooks: mod.notebooks.length,
                            exercises: exercises.length,
                            hasQuiz: !!quiz,
                          }}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
