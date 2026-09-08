import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Icon } from '@/components/ui/Icon';
import { ModuleShell, formatMinutes } from '@/components/shell/ModuleShell';
import { NotebookCard } from '@/components/widgets/NotebookCard';
import { AISidebarInline } from '@/components/widgets/AISidebarInline';
import { BadgeCard } from '@/components/shell/BadgeCard';
import { getAllModules, getExercises, getModule, getQuiz, totalPoints } from '@/lib/content';
import { part } from '@/lib/parts';

interface Params {
  moduleId: string;
}

const STREAM_LABELS: Record<string, string> = {
  corporateFinance: 'Corporate finance',
  assetManagement: 'Asset management',
  banking: 'Banking',
  markets: 'Markets',
};

export function generateStaticParams(): Params[] {
  return getAllModules().map((mod) => ({ moduleId: mod.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  if (!mod) return {};
  return {
    title: `${mod.number} · ${mod.title}`,
    description: mod.subtitle ?? mod.learningOutcomes[0],
  };
}

export default async function ModuleOverview({ params }: { params: Promise<Params> }) {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  if (!mod) notFound();

  const quiz = getQuiz(mod.id);
  const exercises = getExercises(mod.id);
  const points = totalPoints(exercises);
  const firstPage = mod.pages[0];

  const prereqs = mod.prerequisites
    .map((id) => getModule(id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  return (
    <ModuleShell mod={mod} section={{ kind: 'overview' }}>
      <div className="max-w-content space-y-10">
        {/* Soft prerequisite nudge — suggested, never enforced. */}
        {prereqs.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-muted">
            <Icon name="info" size={14} className="shrink-0" />
            Best after{' '}
            {prereqs.map((p, i) => (
              <span key={p.id}>
                <Link href={`/modules/${p.id}`} className="font-medium accent-text no-underline">
                  {p.number} · {p.title}
                </Link>
                {i < prereqs.length - 1 && ', '}
              </span>
            ))}
            — but nothing is locked.
          </p>
        )}

        {/* What you'll be able to do */}
        <section>
          <h2 className="text-xl font-semibold text-ink">What you&apos;ll be able to do</h2>
          <ul className="mt-3 space-y-2">
            {mod.learningOutcomes.map((outcome, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <Icon
                  name="check-circle"
                  size={16}
                  className="mt-0.5 shrink-0 accent-text"
                />
                <span className="text-ink">{outcome}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pages */}
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-ink">The pages</h2>
            {firstPage && (
              <Link href={`/modules/${mod.id}/${firstPage.slug}`} className="btn-primary no-underline">
                Start reading
                <Icon name="arrow-right" size={15} />
              </Link>
            )}
          </div>
          <ol className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {mod.pages.map((page, i) => (
              <li key={page.slug}>
                <Link
                  href={`/modules/${mod.id}/${page.slug}`}
                  className="flex items-center gap-3 bg-bg px-4 py-3 no-underline transition-colors duration-fast ease-token hover:bg-surface"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt text-xs font-bold text-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">{page.title}</span>
                  <Icon name="chevron-right" size={15} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ol>
        </section>

        {/* Notebooks */}
        {mod.notebooks.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-ink">
              Notebooks{' '}
              <span className="text-sm font-normal text-muted">
                — where the learning actually happens
              </span>
            </h2>
            <div className="mt-3 space-y-4">
              {mod.notebooks.map((nb) => (
                <NotebookCard key={nb.id} moduleId={mod.id} notebook={nb} />
              ))}
            </div>
          </section>
        )}

        {/* Streamlit apps — download and run locally, never embedded. */}
        {mod.streamlitApps.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-ink">Streamlit apps</h2>
            <p className="mt-1 text-sm text-muted">
              Download and run these on your own machine in VS Code — they are never embedded here.
            </p>
            <div className="mt-3 space-y-3">
              {mod.streamlitApps.map((app) => (
                <div key={app.id} className="card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-ink">{app.title}</h3>
                      <p className="mt-0.5 font-mono text-xs text-muted">{app.file}</p>
                    </div>
                    <a href={`/${app.file}`} download className="btn-secondary no-underline">
                      <Icon name="download" size={15} />
                      Download .py
                    </a>
                  </div>
                  <pre className="mt-3 overflow-x-auto rounded-md bg-surface px-3 py-2 font-mono text-xs text-ink">
                    {app.runInstructions}
                  </pre>
                  {app.datasets && app.datasets.length > 0 && (
                    <p className="mt-2 text-xs text-muted">
                      Needs: <code className="font-mono">{app.datasets.join(', ')}</code>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exercises + quiz */}
        <section className="grid gap-4 sm:grid-cols-2">
          {exercises.length > 0 && (
            <Link
              href={`/modules/${mod.id}/exercises`}
              className="card flex flex-col gap-2 p-4 no-underline transition-shadow duration-base ease-token hover:shadow-lift"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md accent-bg-soft accent-text">
                <Icon name="pencil" size={18} />
              </span>
              <span className="text-base font-semibold text-ink">
                {exercises.length} exercises
              </span>
              <span className="text-sm text-muted">
                {points > 0 ? `${points} points · ` : ''}Hints on tap, solutions after you attempt.
              </span>
            </Link>
          )}

          {quiz && (
            <Link
              href={`/modules/${mod.id}/quiz`}
              className="card flex flex-col gap-2 p-4 no-underline transition-shadow duration-base ease-token hover:shadow-lift"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md accent-bg-soft accent-text">
                <Icon name="check-circle" size={18} />
              </span>
              <span className="text-base font-semibold text-ink">
                Quiz · {quiz.questions.length} questions
              </span>
              <span className="text-sm text-muted">
                Pass mark {quiz.passMark}/{quiz.questions.length}
                {mod.badge && ` · earns ${mod.badge.label}`}
              </span>
            </Link>
          )}
        </section>

        {/* Case study */}
        {mod.caseStudy && (
          <section className="card overflow-hidden">
            <div className="border-b border-border bg-surface px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                Case study
              </p>
            </div>
            <div className="px-4 py-4">
              <h3 className="text-base font-semibold text-ink">{mod.caseStudy.title}</h3>
              {mod.caseStudy.hook && (
                <p className="mt-1.5 text-sm text-ink">{mod.caseStudy.hook}</p>
              )}
              {mod.caseStudy.lesson && (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-semibold text-ink">The lesson: </span>
                  {mod.caseStudy.lesson}
                </p>
              )}
            </div>
          </section>
        )}

        {/* AI sidebar */}
        {mod.aiSidebar && (
          <section>
            <h2 className="text-xl font-semibold text-ink">Using AI on this module</h2>
            <div className="mt-3">
              <AISidebarInline module={mod.id} />
            </div>
          </section>
        )}

        {/* Stream connector */}
        {mod.streamConnector && (
          <section>
            <h2 className="text-xl font-semibold text-ink">Where this shows up at work</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {Object.entries(mod.streamConnector).map(([key, value]) => (
                <div key={key} className="card p-4">
                  <dt className="text-sm font-semibold accent-text">
                    {STREAM_LABELS[key] ?? key}
                  </dt>
                  <dd className="mt-1 text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Bias check ritual */}
        {mod.biasCheck?.enabled && mod.biasCheck.prompt && (
          <section className="rounded-lg border-l-4 border-warn bg-warn/[0.06] p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
              <Icon name="shield" size={16} className="text-warn" />
              The bias check
            </h2>
            <p className="mt-1.5 text-sm text-ink">{mod.biasCheck.prompt}</p>
            <p className="mt-2 text-xs text-muted">
              This ritual repeats in every lab from Module 9 on. By Module 12 it should be reflex.
            </p>
          </section>
        )}

        {/* Badge + time */}
        <section className="grid gap-4 sm:grid-cols-2">
          {mod.badge && <BadgeCard badge={mod.badge} moduleId={mod.id} />}
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-muted">
              <Icon name="clock" size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Estimated time
              </p>
              <p className="text-base font-semibold text-ink">
                {formatMinutes(mod.estimatedMinutes)}
              </p>
              <p className="text-xs text-muted">{part(mod.part).label}</p>
            </div>
          </div>
        </section>
      </div>
    </ModuleShell>
  );
}
