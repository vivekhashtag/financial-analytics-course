'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/** A ready-to-paste AI prompt with a copy button. */
export function CopyPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-2 flex items-start gap-2">
      <p className="min-w-0 flex-1 rounded-sm bg-surface px-2.5 py-2 font-mono text-xs leading-relaxed text-ink">
        {prompt}
      </p>
      <button
        type="button"
        onClick={copy}
        className="btn-ghost shrink-0 px-2 py-1 text-xs"
        aria-label={copied ? 'Prompt copied' : 'Copy prompt'}
      >
        <Icon name={copied ? 'check' : 'copy'} size={13} />
      </button>
    </div>
  );
}
