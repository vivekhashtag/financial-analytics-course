'use client';

import { useProgress } from '@/components/progress/ProgressProvider';
import { Meter } from '@/components/motion/Meter';
import tokens from '@/schema/tokens.json';

/** Live points / completion tally for an ExerciseList header. */
export function ExerciseTally({
  moduleId,
  ids,
  points,
}: {
  moduleId: string;
  ids: string[];
  points: number;
}) {
  const { hydrated, moduleProgress } = useProgress();
  if (!hydrated) return <span className="chip bg-surface-alt text-muted">0/{ids.length} done</span>;

  const done = moduleProgress(moduleId).exercisesComplete.filter((id) => ids.includes(id));
  const pct = ids.length ? Math.round((done.length / ids.length) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <Meter value={pct} className="h-1.5 w-24" color={tokens.color.semantic.success} />
      <span className="chip bg-surface-alt tabular-nums text-muted">
        {done.length}/{ids.length} done
        {points > 0 && ` · ${pct}%`}
      </span>
    </div>
  );
}
