import { LinkedInIcon } from '@/components/ui/InlineIcons';
import { AUTHOR } from '@/lib/links';

const NOTES = [
  'All datasets synthetic and documented',
  'Not investment advice',
  'Built for education',
];

/** One slim row on every page. Deliberately minimal — see AboutAuthor for the rest. */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-wide flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span>© {AUTHOR.name}</span>
          {NOTES.map((note) => (
            <span key={note} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-border">
                ·
              </span>
              {note}
            </span>
          ))}
        </p>

        <a
          href={AUTHOR.linkedIn}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${AUTHOR.name} on LinkedIn`}
          className="-m-1.5 rounded-md p-1.5 text-muted transition-colors duration-fast ease-token hover:text-primary"
        >
          <LinkedInIcon size={16} />
        </a>
      </div>
    </footer>
  );
}
