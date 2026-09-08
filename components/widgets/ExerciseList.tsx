import { findNotebook, getExercises, totalPoints } from '@/lib/content';
import type { Exercise } from '@/lib/types';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseTally } from './ExerciseTally';
import { MissingWidget } from './MissingWidget';
import { SortingGame } from './SortingGame';
import { BiasDetective } from './BiasDetective';
import { TrustReportForm } from './TrustReportForm';

/**
 * Renders a module's exercises.json. Code exercises get starter code, hints and
 * a gated solution; the interactive types hand off to their own widget so the
 * `/exercises` route shows the same thing the MDX page does.
 */
export function ExerciseList({
  moduleId,
  only,
}: {
  moduleId: string;
  /** optionally restrict to a subset of ids */
  only?: string[];
}) {
  const all = getExercises(moduleId);
  const exercises = only ? all.filter((e) => only.includes(e.id)) : all;

  if (exercises.length === 0) {
    return (
      <MissingWidget
        name="ExerciseList"
        detail={`No exercises.json entries for module "${moduleId}"`}
      />
    );
  }

  const points = totalPoints(exercises);

  return (
    <section className="widget not-prose" id="exercises">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-ink">Exercises</h3>
          <p className="mt-1 text-sm text-muted">
            {exercises.length} to work through
            {points > 0 && ` · ${points} points`}. Attempt first — solutions unlock after you
            say you&apos;ve tried.
          </p>
        </div>
        <ExerciseTally moduleId={moduleId} ids={exercises.map((e) => e.id)} points={points} />
      </header>

      <div className="space-y-4">
        {exercises.map((exercise, i) => (
          <ExerciseItem key={exercise.id} moduleId={moduleId} exercise={exercise} index={i} />
        ))}
      </div>
    </section>
  );
}

function ExerciseItem({
  moduleId,
  exercise,
  index,
}: {
  moduleId: string;
  exercise: Exercise;
  index: number;
}) {
  switch (exercise.type) {
    case 'sort':
      return <SortingGame exerciseId={exercise.id} moduleId={moduleId} />;
    case 'scenario':
      return <BiasDetective exerciseId={exercise.id} moduleId={moduleId} />;
    case 'form':
      return <TrustReportForm exerciseId={exercise.id} moduleId={moduleId} />;
    default: {
      const nb = exercise.notebook ? findNotebook(exercise.notebook) : null;
      return (
        <ExerciseCard
          moduleId={moduleId}
          index={index}
          exercise={exercise}
          notebookTitle={nb?.notebook.title ?? null}
        />
      );
    }
  }
}
