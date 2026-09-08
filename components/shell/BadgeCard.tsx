'use client';

import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import type { Badge } from '@/lib/types';

/** The module's badge, lit once it has been earned. */
export function BadgeCard({ badge, moduleId }: { badge: Badge; moduleId: string }) {
  const { hydrated, hasBadge, moduleProgress } = useProgress();
  const earned = hydrated && hasBadge(badge.id);
  const score = hydrated ? moduleProgress(moduleId).quizScore : null;

  return (
    <div
      className={`card flex items-center gap-3 p-4 ${earned ? 'border-success/40 bg-success/[0.05]' : ''}`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          earned ? 'bg-success text-white animate-spring-pop' : 'bg-surface-alt text-muted'
        }`}
      >
        <Icon name={badge.icon ?? 'award'} size={19} />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {earned ? 'Badge earned' : 'Badge on offer'}
        </p>
        <p className="text-base font-semibold text-ink">{badge.label}</p>
        <p className="text-xs text-muted">
          {earned
            ? score !== null
              ? `Quiz passed with ${score}.`
              : 'Quiz passed.'
            : 'Pass the module quiz to earn it.'}
        </p>
      </div>
    </div>
  );
}
