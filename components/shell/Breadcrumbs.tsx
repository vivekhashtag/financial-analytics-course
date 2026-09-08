import Link from 'next/link';
import { part, partAnchor } from '@/lib/parts';
import type { CourseModule } from '@/lib/types';

/**
 * Part → Module → Page, at the top of every module route. Small and quiet: the
 * Part crumb carries the accent, the rest is muted, and the current location
 * is plain text rather than a link.
 */
export function Breadcrumbs({
  mod,
  leaf,
}: {
  mod: CourseModule;
  /** the page/section name, omitted on the module overview */
  leaf?: string;
}) {
  const meta = part(mod.part);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
        <li>
          <Link
            href={`/modules#${partAnchor(mod.part)}`}
            className="font-semibold no-underline accent-text hover:underline"
          >
            {meta.label}
          </Link>
        </li>

        <li aria-hidden="true" className="text-border">
          /
        </li>

        <li>
          {leaf ? (
            <Link
              href={`/modules/${mod.id}`}
              className="text-muted no-underline hover:text-ink hover:underline"
            >
              {mod.number} · {mod.title}
            </Link>
          ) : (
            <span className="text-muted" aria-current="page">
              {mod.number} · {mod.title}
            </span>
          )}
        </li>

        {leaf && (
          <>
            <li aria-hidden="true" className="text-border">
              /
            </li>
            <li className="min-w-0">
              <span className="text-muted" aria-current="page">
                {leaf}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}
