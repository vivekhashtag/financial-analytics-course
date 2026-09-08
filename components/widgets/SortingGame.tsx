import { findExercise, getExercises } from '@/lib/content';
import { SortingGameView } from './SortingGameView';
import { MissingWidget } from './MissingWidget';

/**
 * Drag-and-drop bucket classification (`m1-e01`). Resolves the exercise from
 * exercises.json — the item list and correct buckets are content, not code.
 */
export function SortingGame({
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

  const items = resolved?.exercise.items ?? [];

  if (!resolved || items.length === 0) {
    return (
      <MissingWidget
        name="SortingGame"
        detail={`Exercise "${exerciseId}" has no items[] in exercises.json`}
      />
    );
  }

  return (
    <SortingGameView
      moduleId={resolved.moduleId}
      exerciseId={exerciseId}
      title={resolved.exercise.title}
      brief={resolved.exercise.brief}
      points={resolved.exercise.points}
      items={items}
    />
  );
}
