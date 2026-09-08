import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getCsvPreview, getDataset } from '@/lib/content';
import { MissingWidget } from './MissingWidget';

/**
 * A CSV slice rendered as a table, with the registry's documented quirks
 * annotated underneath — knowing the answer key is deliberate in this course.
 */
export function DatasetPreview({
  id,
  rows = 8,
  showQuirks = true,
}: {
  id: string;
  rows?: number;
  showQuirks?: boolean;
}) {
  const ds = getDataset(id);
  const preview = ds ? getCsvPreview(id, rows) : null;

  if (!ds || !preview) {
    return (
      <MissingWidget
        name="DatasetPreview"
        detail={`No dataset "${id}" in data/datasets.json, or its CSV is missing`}
      />
    );
  }

  return (
    <figure className="widget not-prose card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-surface px-4 py-3">
        <div className="min-w-0">
          <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
            <Icon name="table" size={16} className="text-primary" />
            <Link href={`/data/${ds.id}`} className="no-underline hover:underline">
              {ds.title}
            </Link>
          </h4>
          <p className="mt-1 text-xs text-muted">
            {ds.rows.toLocaleString('en-IN')} rows × {ds.cols} cols · {ds.grain}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {ds.synthetic && <span className="chip bg-surface-alt text-muted">synthetic</span>}
          <a href={ds.rawUrl} download className="btn-ghost px-2 py-1 text-xs">
            <Icon name="download" size={13} /> CSV
          </a>
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface/60">
            <tr>
              {preview.columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b border-border px-3 py-2 text-left font-mono text-xs font-semibold text-ink"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-surface/40' : undefined}>
                {preview.columns.map((_, j) => {
                  const cell = row[j] ?? '';
                  return (
                    <td
                      key={j}
                      className={`whitespace-nowrap border-b border-border px-3 py-1.5 font-mono text-xs ${
                        cell.trim() === '' ? 'bg-warn/[0.08] text-warn' : 'text-ink'
                      }`}
                    >
                      {cell.trim() === '' ? 'blank' : cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted">
          First {preview.rows.length} of {ds.rows.toLocaleString('en-IN')} rows.{' '}
          <Link href={`/data/${ds.id}`} className="accent-text font-medium">
            Full registry entry →
          </Link>
        </p>

        {showQuirks && ds.quirks.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Documented quirks ({ds.quirks.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {ds.quirks.map((q) => (
                <li key={q.code} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warn/12 text-[11px] font-bold uppercase text-warn">
                    {q.code}
                  </span>
                  <span className="text-ink">
                    {q.quirk}
                    <span className="ml-1.5 text-muted">— teaches {q.teaches.toLowerCase()}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </figcaption>
    </figure>
  );
}
