'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';

export interface NotebookCardData {
  id: string;
  moduleId: string;
  title: string;
  downloadHref: string;
  downloadAvailable: boolean;
  colabHref: string | null;
  packages: string[];
  datasets: { id: string; title: string; exists: boolean }[];
  solution: { href: string; colabHref: string | null; available: boolean } | null;
}

export function NotebookCardView({ data }: { data: NotebookCardData }) {
  const { hydrated, has, add, toggle } = useProgress();

  const downloaded = hydrated && has(data.moduleId, 'notebooksDownloaded', data.id);
  const attempted = hydrated && has(data.moduleId, 'notebooksAttempted', data.id);

  // Both actions count as "the learner has the notebook".
  const markTaken = () => add(data.moduleId, 'notebooksDownloaded', data.id);

  return (
    <section className="widget not-prose card overflow-hidden">
      <header className="flex items-start gap-3 border-b border-border bg-surface px-4 py-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md accent-bg-soft accent-text">
          <Icon name="notebook" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-ink">{data.title}</h4>
          <p className="mt-0.5 font-mono text-xs text-muted">{data.id}.ipynb</p>
        </div>
        {downloaded && (
          <span className="chip shrink-0 bg-success/10 text-success">
            <Icon name="check" size={12} strokeWidth={3} /> Taken
          </span>
        )}
      </header>

      <div className="space-y-3 px-4 py-3">
        {(data.packages.length > 0 || data.datasets.length > 0) && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {data.packages.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Packages
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {data.packages.map((p) => (
                    <code key={p} className="chip bg-surface-alt font-mono text-ink">
                      {p}
                    </code>
                  ))}
                </dd>
              </div>
            )}
            {data.datasets.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Datasets
                </dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {data.datasets.map((ds) =>
                    ds.exists ? (
                      <Link
                        key={ds.id}
                        href={`/data/${ds.id}`}
                        className="chip bg-info/10 text-info no-underline hover:bg-info/20"
                      >
                        <Icon name="database" size={12} />
                        {ds.title}
                      </Link>
                    ) : (
                      <span key={ds.id} className="chip bg-surface-alt text-muted">
                        {ds.id}
                      </span>
                    ),
                  )}
                </dd>
              </div>
            )}
          </dl>
        )}

        {data.packages.length === 0 && data.datasets.length === 0 && (
          <p className="text-sm text-muted">
            No extra packages, no data files — pure Python, runs anywhere.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {data.downloadAvailable ? (
            <a
              href={data.downloadHref}
              download
              onClick={markTaken}
              className="btn-primary no-underline"
            >
              <Icon name="download" size={15} />
              Download
            </a>
          ) : (
            <span className="btn-secondary cursor-not-allowed opacity-60">
              <Icon name="download" size={15} />
              File missing
            </span>
          )}

          {data.colabHref ? (
            <a
              href={data.colabHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={markTaken}
              className="btn-secondary no-underline"
            >
              <Icon name="external-link" size={15} />
              Open in Colab
            </a>
          ) : (
            <span
              className="btn-secondary cursor-help opacity-60"
              title="Set NEXT_PUBLIC_COLAB_REPO (or NEXT_PUBLIC_SITE_URL) to enable Colab links"
            >
              <Icon name="external-link" size={15} />
              Colab link not configured
            </span>
          )}
        </div>

        <p className="text-xs text-muted">
          In Colab, do <strong className="font-semibold text-ink">File → Save a copy in Drive</strong>{' '}
          first, or your edits vanish when the session ends.
        </p>
      </div>

      {/* Attempt-first gate: solutions unlock only after the learner says they tried. */}
      {data.solution && (
        <footer className="border-t border-border bg-surface/60 px-4 py-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={attempted}
              onChange={() => toggle(data.moduleId, 'notebooksAttempted', data.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border transition-all duration-fast ease-token ${
                attempted ? 'border-transparent bg-success text-white' : 'border-border bg-bg'
              }`}
            >
              {attempted && <Icon name="check" size={12} strokeWidth={3} />}
            </span>
            <span className="text-ink">
              I&apos;ve attempted this notebook
              <span className="block text-xs text-muted">
                Reading a solution feels like learning; producing one is learning.
              </span>
            </span>
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!attempted ? (
              <span className="btn-secondary cursor-not-allowed opacity-60">
                <Icon name="lock" size={15} />
                Solution locked
              </span>
            ) : data.solution.available ? (
              <>
                <a href={data.solution.href} download className="btn-secondary no-underline">
                  <Icon name="unlock" size={15} />
                  Download solution
                </a>
                {data.solution.colabHref && (
                  <a
                    href={data.solution.colabHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost no-underline"
                  >
                    <Icon name="external-link" size={14} />
                    Solution in Colab
                  </a>
                )}
              </>
            ) : (
              <span className="btn-secondary cursor-not-allowed opacity-60">
                Solution file missing
              </span>
            )}
          </div>
        </footer>
      )}
    </section>
  );
}
