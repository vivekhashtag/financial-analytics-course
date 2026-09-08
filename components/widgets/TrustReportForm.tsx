import { findExercise, getDataset, getExercises } from '@/lib/content';
import { DatasetPreview } from './DatasetPreview';
import { TrustReportFormView } from './TrustReportFormView';
import { MissingWidget } from './MissingWidget';

/**
 * The guided Trust Report (`m1-e03`): answer every field, submit, then diff your
 * answers against the model answer stored in exercises.json.
 */
export function TrustReportForm({
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

  const fields = resolved?.exercise.fields ?? [];

  if (!resolved || fields.length === 0) {
    return (
      <MissingWidget
        name="TrustReportForm"
        detail={`Exercise "${exerciseId}" has no fields[] in exercises.json`}
      />
    );
  }

  const { exercise } = resolved;
  const dataset = exercise.dataset ? getDataset(exercise.dataset) : null;

  return (
    <div className="widget space-y-4">
      {dataset && <DatasetPreview id={dataset.id} rows={6} />}
      <TrustReportFormView
        moduleId={resolved.moduleId}
        exerciseId={exerciseId}
        title={exercise.title}
        brief={exercise.brief}
        points={exercise.points}
        fields={fields}
        datasetTitle={dataset?.title ?? null}
        datasetId={dataset?.id ?? null}
      />
    </div>
  );
}
