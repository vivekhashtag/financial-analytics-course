import { getModule } from '@/lib/content';
import { AICharterCardsView } from './AICharterCardsView';
import { MissingWidget } from './MissingWidget';

/**
 * Module 0's AI Learning Charter as green/red flip cards, read from the
 * module's `aiSidebar` field so the charter has exactly one source of truth.
 */
export function AICharterCards({ moduleId = '00-orientation' }: { moduleId?: string }) {
  const mod = getModule(moduleId);
  const sidebar = mod?.aiSidebar;

  if (!sidebar?.green?.length && !sidebar?.red?.length) {
    return (
      <MissingWidget
        name="AICharterCards"
        detail={`Module "${moduleId}" has no aiSidebar entries in module.json`}
      />
    );
  }

  return <AICharterCardsView green={sidebar.green ?? []} red={sidebar.red ?? []} />;
}
