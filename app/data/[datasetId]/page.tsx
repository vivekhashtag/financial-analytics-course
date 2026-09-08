import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Icon } from '@/components/ui/Icon';
import { CodePeek } from '@/components/widgets/CodePeek';
import { datasetModules, getCsvPreview, getDataset, getDatasets } from '@/lib/content';

interface Params {
  datasetId: string;
}

export function generateStaticParams(): Params[] {
  return getDatasets().map((ds) => ({ datasetId: ds.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { datasetId } = await params;
  const ds = getDataset(datasetId);
  return ds ? { title: ds.title, description: ds.grain } : {};
}

export default async function DatasetPage({ params }: { params: Promise<Params> }) {
  const { datasetId } = await params;
  const ds = getDataset(datasetId);
  if (!ds) notFound();

  const preview = getCsvPreview(ds.id, 12);
  const modules = datasetModules(ds);
  const columns = ds.columns ?? preview?.columns ?? [];

  const loadSnippet = `import pandas as pd

BASE = "${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://<course-domain>'}/data/"
df = pd.read_csv(BASE + "${ds.id}.csv")
df.info()`;

  return (
    <div className="mx-auto max-w-wide px-4 py-10">
      <nav className="mb-4 text-sm">
        <Link href="/data" className="text-muted no-underline hover:text-ink">
          ← Dataset registry
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-ink">{ds.title}</h1>
          <p className="mt-1.5 font-mono text-sm text-muted">{ds.file}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ds.synthetic && <span className="chip bg-surface-alt text-muted">synthetic</span>}
          <a href={ds.rawUrl} download className="btn-primary no-underline">
            <Icon name="download" size={15} />
            Download CSV
          </a>
        </div>
      </header>

      {/* facts */}
      <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Shape', value: `${ds.rows.toLocaleString('en-IN')} rows × ${ds.cols} cols` },
          { label: 'Grain', value: ds.grain },
          { label: 'Units', value: ds.units },
          { label: 'Defects', value: `${ds.quirks.length} documented` },
        ].map((f) => (
          <div key={f.label} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{f.label}</dt>
            <dd className="mt-1 text-sm text-ink">{f.value}</dd>
          </div>
        ))}
      </dl>

      {ds.structure && (
        <p className="mt-6 max-w-content rounded-md border-l-4 border-info bg-info/[0.06] px-4 py-3 text-sm text-ink">
          <span className="font-semibold">Structure: </span>
          {ds.structure}
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-10">
          {/* quirks — the headline of this page */}
          <section>
            <h2 className="text-xl font-semibold text-ink">Known quirks</h2>
            <p className="mt-1.5 max-w-content text-sm text-muted">
              Every defect is deliberate and documented. Knowing the answer key doesn&apos;t spoil
              the exercise — finding these <em>with code</em>, and knowing what to do about each
              one, is the exercise.
            </p>

            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-surface">
                  <tr>
                    {['#', 'Quirk', 'What it teaches'].map((h) => (
                      <th
                        key={h}
                        className="border-b border-border px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ds.quirks.map((q) => (
                    <tr key={q.code} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-3 align-top">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warn/12 font-mono text-xs font-semibold uppercase text-warn">
                          {q.code}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top text-ink">{q.quirk}</td>
                      <td className="px-3 py-3 align-top text-muted">{q.teaches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* preview */}
          {preview && (
            <section>
              <h2 className="text-xl font-semibold text-ink">Preview</h2>
              <p className="mt-1.5 text-sm text-muted">
                First {preview.rows.length} of {ds.rows.toLocaleString('en-IN')} rows. Blank cells
                are highlighted — some of them are quirk (a).
              </p>
              <div className="mt-4 overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-surface">
                    <tr>
                      {preview.columns.map((col) => (
                        <th
                          key={col}
                          className="whitespace-nowrap border-b border-border px-3 py-2 text-left font-mono font-semibold text-ink"
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
                          const blank = cell.trim() === '';
                          return (
                            <td
                              key={j}
                              className={`whitespace-nowrap border-b border-border px-3 py-1.5 font-mono ${
                                blank ? 'bg-warn/[0.09] text-warn' : 'text-ink'
                              }`}
                            >
                              {blank ? 'blank' : cell}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* load it */}
          <section>
            <h2 className="text-xl font-semibold text-ink">Load it</h2>
            <p className="mt-1.5 max-w-content text-sm text-muted">
              Notebooks load data <strong className="text-ink">by URL, not local path</strong>, so
              they behave identically in Colab and locally.
            </p>
            <div className="mt-4">
              <CodePeek code={loadSnippet} lang="python" />
            </div>
          </section>
        </div>

        {/* side rail */}
        <aside className="space-y-6">
          {columns.length > 0 && (
            <section className="card p-4">
              <h2 className="text-sm font-semibold text-ink">Columns ({columns.length})</h2>
              <ul className="mt-2.5 space-y-1">
                {columns.map((col) => (
                  <li key={col} className="font-mono text-xs text-muted">
                    {col}
                  </li>
                ))}
              </ul>
              {ds.columns === undefined && (
                <p className="mt-2 text-xs text-muted">
                  Read from the CSV header — datasets.json doesn&apos;t list them for this file.
                </p>
              )}
            </section>
          )}

          {ds.joinsTo && ds.joinsTo.length > 0 && (
            <section className="card p-4">
              <h2 className="text-sm font-semibold text-ink">Joins to</h2>
              <ul className="mt-2.5 space-y-2">
                {ds.joinsTo.map((j) => (
                  <li key={j.dataset} className="text-sm">
                    <Link href={`/data/${j.dataset}`} className="font-medium text-ink no-underline hover:underline">
                      {j.dataset}
                    </Link>
                    <span className="block font-mono text-xs text-muted">on {j.on}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {modules.length > 0 && (
            <section className="card p-4">
              <h2 className="text-sm font-semibold text-ink">Used in</h2>
              <ul className="mt-2.5 space-y-1.5">
                {modules.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/modules/${m.id}`}
                      className="text-sm text-ink no-underline hover:underline"
                    >
                      <span className="font-semibold">{m.number}</span> · {m.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {ds.usedIn.length !== modules.length && (
                <p className="mt-2 text-xs text-muted">
                  datasets.json also lists{' '}
                  <code className="font-mono">{ds.usedIn.length - modules.length}</code> id(s) that
                  predate the final module folder names.
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
