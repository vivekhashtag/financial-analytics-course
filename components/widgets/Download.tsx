import { Icon } from '@/components/ui/Icon';
import { publicFileExists } from '@/lib/content';

interface DownloadProps {
  file: string;
  label?: string;
  note?: string;
}

/**
 * A download link that knows whether the file actually shipped. Module 1 and
 * Module 0 reference two poster PDFs that are not in the content package yet;
 * rather than hand a learner a 404, the button says so and stays inert.
 */
export function Download({ file, label, note }: DownloadProps) {
  const href = file.startsWith('/') ? file : `/${file}`;
  const available = publicFileExists(href);
  const name = href.split('/').pop() ?? href;
  const text = label ?? `Download ${name}`;

  if (!available) {
    return (
      <div className="widget not-prose flex items-start gap-3 rounded-md border border-dashed border-border bg-surface p-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted">
          <Icon name="download" size={16} />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-medium text-ink">{text}</p>
          <p className="mt-0.5 text-xs text-muted">
            Not in the content package yet —{' '}
            <code className="font-mono text-[0.95em]">public{href}</code> is missing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="widget not-prose">
      <a href={href} download className="btn-secondary no-underline">
        <Icon name="download" size={15} />
        {text}
      </a>
      {note && <p className="mt-1.5 text-xs text-muted">{note}</p>}
    </div>
  );
}
