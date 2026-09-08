import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { getDataset, getDatasets } from '@/lib/content';
import { MissingWidget } from './MissingWidget';

/**
 * "Meet the cast" — the dataset registry as a compact table.
 * `<DatasetTable ids={[…]} />`; with no ids it lists every dataset.
 */
export function DatasetTable({ ids }: { ids?: string[] }) {
  const datasets = ids
    ? ids.map((id) => getDataset(id)).filter((d): d is NonNullable<typeof d> => !!d)
    : getDatasets();

  if (datasets.length === 0) {
    return <MissingWidget name="DatasetTable" detail="No matching datasets in datasets.json" />;
  }

  const missing = (ids ?? []).filter((id) => !getDataset(id));

  return (
    <div className="widget not-prose space-y-3">
      <div className="card overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface">
            <tr>
              {['Dataset', 'Shape', 'Grain', 'Quirks', ''].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datasets.map((ds) => (
              <tr key={ds.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-3 align-top">
                  <Link
                    href={`/data/${ds.id}`}
                    className="font-semibold text-ink no-underline hover:underline"
                  >
                    {ds.title}
                  </Link>
                  <p className="mt-0.5 font-mono text-xs text-muted">{ds.id}</p>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-xs tabular-nums text-muted">
                  {ds.rows.toLocaleString('en-IN')} × {ds.cols}
                </td>
                <td className="px-3 py-3 align-top text-xs text-muted">{ds.grain}</td>
                <td className="px-3 py-3 align-top">
                  <span
                    className={`chip ${
                      ds.quirks.length > 3
                        ? 'bg-danger/10 text-danger'
                        : 'bg-warn/12 text-warn'
                    }`}
                  >
                    {ds.quirks.length} planted
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 align-top text-right">
                  <a href={ds.rawUrl} download className="btn-ghost px-2 py-1 text-xs">
                    <Icon name="download" size={13} /> CSV
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {missing.length > 0 && (
        <p className="text-xs text-warn">
          Not in the registry: <code className="font-mono">{missing.join(', ')}</code>
        </p>
      )}
    </div>
  );
}
