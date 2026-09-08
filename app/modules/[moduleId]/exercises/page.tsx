import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllModules, getExercises, getModule } from '@/lib/content';
import { ModuleShell } from '@/components/shell/ModuleShell';
import { ExerciseList } from '@/components/widgets/ExerciseList';
import { Callout } from '@/components/widgets/Callout';

interface Params {
  moduleId: string;
}

export function generateStaticParams(): Params[] {
  return getAllModules()
    .filter((mod) => getExercises(mod.id).length > 0)
    .map((mod) => ({ moduleId: mod.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  return mod ? { title: `Exercises · ${mod.number} ${mod.title}` } : {};
}

export default async function ExercisesRoute({ params }: { params: Promise<Params> }) {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  const exercises = getExercises(moduleId);
  if (!mod || exercises.length === 0) notFound();

  const hasCode = exercises.some((e) => e.type === 'code' || !e.type);

  return (
    <ModuleShell mod={mod} section={{ kind: 'exercises' }}>
      <div className="max-w-content space-y-6">
        {hasCode && (
          <Callout type="info" title="Where these run">
            <p>
              Code exercises run in <strong>your notebook</strong>, not in this page — there is no
              in-browser Python. Copy the starter code into the notebook, write your answer, then
              paste the check cell to see whether it passes.
            </p>
          </Callout>
        )}
        <ExerciseList moduleId={moduleId} />
      </div>
    </ModuleShell>
  );
}
