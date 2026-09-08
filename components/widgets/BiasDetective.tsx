import { findExercise, getExercises } from '@/lib/content';
import { BiasDetectiveView } from './BiasDetectiveView';
import { MissingWidget } from './MissingWidget';

/**
 * Scenario cards with answer buttons and a streak counter (`m1-e02`).
 * The scenarios, the correct bias and the "why" all come from exercises.json.
 */
export function BiasDetective({
  exerciseId,
  moduleId,
}: {
  exerciseId: string;
  moduleId?: string;
}) {
  const resolved = moduleId
    ? (() => {
        const exercise = getExercises(moduleId).find((e) => e.id === exerciseId);
        return exercise ? { moduleId, exercise } : null;
      })()
    : findExercise(exerciseId);

  const scenarios = resolved?.exercise.scenarios ?? [];

  if (!resolved || scenarios.length === 0) {
    return (
      <MissingWidget
        name="BiasDetective"
        detail={`Exercise "${exerciseId}" has no scenarios[] in exercises.json`}
      />
    );
  }

  return (
    <BiasDetectiveView
      moduleId={resolved.moduleId}
      exerciseId={exerciseId}
      title={resolved.exercise.title}
      brief={resolved.exercise.brief}
      points={resolved.exercise.points}
      scenarios={scenarios}
    />
  );
}
