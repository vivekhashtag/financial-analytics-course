import type { Metadata } from 'next';
import { getAllModules, getExercises, getQuiz } from '@/lib/content';
import { partColor } from '@/lib/parts';
import { ProgressDashboard, type ModuleRow } from '@/components/shell/ProgressDashboard';

export const metadata: Metadata = {
  title: 'My progress',
  description: 'Pages read, notebooks taken, exercises done, quizzes passed and badges earned.',
};

export default function ProgressPage() {
  const rows: ModuleRow[] = getAllModules().map((mod) => {
    const quiz = getQuiz(mod.id);
    return {
      id: mod.id,
      number: mod.number,
      title: mod.title,
      part: mod.part,
      color: partColor(mod.part),
      badge: mod.badge,
      totals: {
        pages: mod.pages.length,
        notebooks: mod.notebooks.length,
        exercises: getExercises(mod.id).length,
        hasQuiz: !!quiz,
      },
      quizTotal: quiz?.questions.length ?? null,
      passMark: quiz?.passMark ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-wide px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold text-ink">My progress</h1>
        <p className="mt-2 max-w-content text-lg text-muted">
          Everything below is stored in this browser only — there is no account and no server. Clear
          your site data and it goes with it.
        </p>
      </header>

      <ProgressDashboard rows={rows} />
    </div>
  );
}
