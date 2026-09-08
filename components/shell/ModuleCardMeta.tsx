'use client';

import { Icon } from '@/components/ui/Icon';
import { moduleCompletion, useProgress } from '@/components/progress/ProgressProvider';
import { Meter } from '@/components/motion/Meter';
import type { Badge } from '@/lib/types';

/** Progress footer for a module card on /modules. */
export function ModuleCardMeta({
  moduleId,
  badge,
  totals,
}: {
  moduleId: string;
  badge: Badge | null;
  totals: { pages: number; notebooks: number; exercises: number; hasQuiz: boolean };
}) {
  const { hydrated, moduleProgress, hasBadge } = useProgress();

  if (!hydrated) {
    return <div className="mt-1 h-6 border-t border-border" aria-hidden="true" />;
  }

  const pct = moduleCompletion(moduleProgress(moduleId), totals);
  const earned = badge ? hasBadge(badge.id) : false;

  return (
    <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
      <Meter value={pct} className="h-1.5 flex-1" />
      <span className="text-xs font-semibold tabular-nums text-muted">{pct}%</span>
      {earned && badge && (
        <span className="chip bg-success/10 text-success" title={`${badge.label} earned`}>
          <Icon name={badge.icon ?? 'award'} size={12} />
        </span>
      )}
    </div>
  );
}
