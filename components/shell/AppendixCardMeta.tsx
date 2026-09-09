'use client';

import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import { APPENDIX_PROGRESS_KEY } from '@/lib/progress-keys';

/**
 * Read / not-read footer for an appendix card.
 *
 * Not a percentage: appendix progress is deliberately excluded from the
 * completion arithmetic (see APPENDIX_PROGRESS_KEY), so a meter here would
 * promise a number that nothing else in the app agrees with. A single read
 * marker is the honest readout, and it is the one place the tracking becomes
 * visible on the index.
 */
export function AppendixCardMeta({
  slug,
  /** notebook appendices only — the id NotebookCard records downloads against */
  notebookId,
}: {
  slug: string;
  notebookId?: string;
}) {
  const { hydrated, has } = useProgress();

  if (!hydrated) {
    return <div className="mt-1 h-6 border-t border-border" aria-hidden="true" />;
  }

  const read = has(APPENDIX_PROGRESS_KEY, 'pagesRead', slug);
  const taken = !!notebookId && has(APPENDIX_PROGRESS_KEY, 'notebooksDownloaded', notebookId);

  return (
    <div className="mt-1 flex items-center gap-2 border-t border-border pt-3">
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
          read ? 'text-success' : 'text-muted/70'
        }`}
      >
        <Icon name={read ? 'check-circle' : 'dot'} size={read ? 13 : 16} />
        {read ? 'Read' : 'Not read yet'}
      </span>
      {taken && (
        <span className="chip ml-auto bg-success/10 text-success" title="Notebook taken">
          <Icon name="notebook" size={12} />
        </span>
      )}
    </div>
  );
}
