import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllModules, getModule, getQuiz } from '@/lib/content';
import { ModuleShell } from '@/components/shell/ModuleShell';
import { Quiz } from '@/components/widgets/Quiz';

interface Params {
  moduleId: string;
}

export function generateStaticParams(): Params[] {
  return getAllModules()
    .filter((mod) => !!getQuiz(mod.id))
    .map((mod) => ({ moduleId: mod.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  return mod ? { title: `Quiz · ${mod.number} ${mod.title}` } : {};
}

export default async function QuizRoute({ params }: { params: Promise<Params> }) {
  const { moduleId } = await params;
  const mod = getModule(moduleId);
  const quiz = getQuiz(moduleId);
  if (!mod || !quiz) notFound();

  return (
    <ModuleShell mod={mod} section={{ kind: 'quiz' }}>
      <div className="max-w-content">
        <Quiz moduleId={moduleId} />
      </div>
    </ModuleShell>
  );
}
