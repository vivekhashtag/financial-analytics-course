import { getModule, getQuiz } from '@/lib/content';
import { QuizView } from './QuizView';
import { MissingWidget } from './MissingWidget';

/** Renders a module's quiz.json. `<Quiz moduleId="02-python-foundations" />` */
export function Quiz({ moduleId }: { moduleId: string }) {
  const mod = getModule(moduleId);
  const quiz = getQuiz(moduleId);

  if (!mod || !quiz) {
    return (
      <MissingWidget name="Quiz" detail={`No quiz.json found for module "${moduleId}"`} />
    );
  }

  return (
    <QuizView
      moduleId={moduleId}
      questions={quiz.questions}
      passMark={quiz.passMark}
      badge={mod.badge}
      moduleTitle={mod.title}
    />
  );
}
