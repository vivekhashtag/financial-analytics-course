import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { CourseMetroMap } from '@/components/widgets/CourseMetroMap';
import { ContinueCard, type ResumeModule } from '@/components/shell/ContinueCard';
import { AboutAuthor } from '@/components/shell/AboutAuthor';
import { MoreCourses } from '@/components/shell/MoreCourses';
import { getAllModules, getDatasets, getExercises, getQuiz } from '@/lib/content';
import { PARTS, partAnchor, partColor } from '@/lib/parts';

const PROMISES = [
  {
    icon: 'database',
    title: 'Clean the mess',
    text: 'Take any dirty financial dataset and clean, explore and summarise it in Python.',
  },
  {
    icon: 'trending-up',
    title: 'Answer the four questions',
    text: 'What happened, why, what next, and what should we do about it.',
  },
  {
    icon: 'map',
    title: 'Read the finance map',
    text: 'Place any problem in corporate finance, asset management, banking or markets.',
  },
  {
    icon: 'target',
    title: 'Run four real labs',
    text: 'Forecast a series, simulate 10,000 futures, backtest a strategy, optimise a portfolio.',
  },
];

export default function Landing() {
  const modules = getAllModules();
  const datasets = getDatasets();
  const totalHours = Math.round(modules.reduce((s, m) => s + m.estimatedMinutes, 0) / 60);
  const notebooks = modules.reduce((s, m) => s + m.notebooks.length, 0);

  const resumable: ResumeModule[] = modules.map((mod, i) => ({
    id: mod.id,
    order: i,
    number: mod.number,
    title: mod.title,
    part: mod.part,
    color: partColor(mod.part),
    pages: mod.pages.map((p) => ({ slug: p.slug, title: p.title })),
    totals: {
      pages: mod.pages.length,
      notebooks: mod.notebooks.length,
      exercises: getExercises(mod.id).length,
      hasQuiz: !!getQuiz(mod.id),
    },
  }));

  return (
    <div>
      {/* hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/[0.07] via-transparent to-part-B/[0.05]">
        <div className="mx-auto max-w-wide px-4 py-16 sm:py-24">
          <p className="chip accent-bg-soft accent-text">
            <Icon name="compass" size={13} />
            India-first · Colab-first · deliberately no machine learning
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.1] text-ink">
            Financial data doesn&apos;t lie.
            <span className="block text-primary">But it does keep secrets.</span>
          </h1>

          <p className="mt-5 max-w-content text-lg text-muted">
            Markets produce more than a billion records a day. Learn to read them — clean it,
            question it, chart it, model it — with{' '}
            <strong className="font-semibold text-ink">Python for the hands</strong>,{' '}
            <strong className="font-semibold text-ink">finance for the head</strong>, and{' '}
            <strong className="font-semibold text-ink">analytics for the judgement in between</strong>.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/modules/00-orientation" className="btn-primary px-5 py-2.5 text-base no-underline">
              Start Module 0
              <Icon name="arrow-right" size={17} />
            </Link>
            <Link href="/modules" className="btn-ghost no-underline">
              See all {modules.length} modules
            </Link>
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { k: `${modules.length}`, v: 'modules' },
              { k: `${notebooks}`, v: 'notebooks, all execution-tested' },
              { k: `${datasets.length}`, v: 'synthetic datasets with documented defects' },
              { k: `~${totalHours} h`, v: 'of work, start to capstone' },
            ].map((s) => (
              <div key={s.v}>
                <dt className="text-2xl font-bold text-ink">{s.k}</dt>
                <dd className="text-sm text-muted">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ContinueCard modules={resumable} />

      {/* the metro map */}
      <section className="mx-auto max-w-wide px-4 py-14">
        <h2 className="text-2xl font-bold text-ink">The journey</h2>
        <p className="mt-2 max-w-content text-muted">
          Four parts converging on one capstone. Every station is clickable, and the map fills in
          as you go.
        </p>
        <div className="mt-6">
          <CourseMetroMap />
        </div>
      </section>

      {/* promises */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-wide px-4 py-14">
          <h2 className="text-2xl font-bold text-ink">What you&apos;ll be able to do</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((p) => (
              <li key={p.title} className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name={p.icon} size={19} />
                </span>
                <h3 className="mt-3 text-base font-semibold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* the parts */}
      <section className="mx-auto max-w-wide px-4 py-14">
        <h2 className="text-2xl font-bold text-ink">The four parts</h2>
        <p className="mt-1.5 text-sm text-muted">Pick a part to jump to its modules.</p>

        <ol className="mt-5 space-y-3">
          {PARTS.filter((p) => modules.some((m) => m.part === p.id)).map((p) => {
            const inPart = modules.filter((m) => m.part === p.id);
            return (
              <li key={p.id} style={{ '--accent': p.color } as React.CSSProperties}>
                <Link
                  href={`/modules#${partAnchor(p.id)}`}
                  className="card flex flex-wrap items-center gap-x-5 gap-y-2 p-4 no-underline transition-all duration-base ease-token hover:-translate-y-0.5 hover:shadow-lift"
                  style={{ borderLeftWidth: 4, borderLeftColor: p.color }}
                >
                  <span className="text-sm font-semibold" style={{ color: p.color }}>
                    {p.label}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-muted">{p.tagline}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    Modules {inPart[0].number}
                    {inPart.length > 1 && `–${inPart[inPart.length - 1].number}`}
                    <Icon name="arrow-right" size={14} className="accent-text" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* honesty block */}
      <section className="mx-auto max-w-wide px-4 pb-14">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-ink">What this course is not</h2>
          {/* The ML hand-off lives in exactly one place — Module 6's Lesson 6.7
              signpost — plus the "More courses" grid below. Not here. */}
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              [
                'Not a machine learning course',
                'We stop at the ML border and put up a signpost.',
              ],
              ['Not investment advice', 'Every strategy built here is educational simulation.'],
              ['Not maths-heavy', 'Intuition first; formulas only where they earn their place.'],
            ].map(([title, text]) => (
              <li key={title}>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AboutAuthor />
      <MoreCourses />
    </div>
  );
}
