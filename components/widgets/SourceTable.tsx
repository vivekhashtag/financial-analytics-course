'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import tokens from '@/schema/tokens.json';

/**
 * The data-sources comparison, made playable.
 *
 * Every field below is lifted verbatim from the table that follows this widget
 * in `01-data-foundations/pages/03-sources.mdx` — the prose is authoritative and
 * the widget must never contradict it. `kind` is a classification of what that
 * prose already says about each row ("Official prices…" → exchange;
 * "Everything, curated, real-time" at $25k/seat → terminal), not new fact.
 *
 * Deliberately absent: per-source adjustment-convention and licensing detail.
 * The content package doesn't state it, so the panel says so rather than
 * inventing it.
 */

type Kind = 'exchange' | 'agency' | 'library' | 'filing' | 'terminal' | 'vendor';
type Tier = 'free' | 'paid';

interface Source {
  name: string;
  gives: string;
  cost: string;
  tier: Tier;
  usedIn: string;
  kind: Kind;
  /** the prose's own framing of where this sits in the chain */
  chain: string;
}

const KIND_LABEL: Record<Kind, string> = {
  exchange: 'Exchange (primary)',
  agency: 'Issuing agency (primary)',
  library: 'Python library (aggregator)',
  filing: 'Company filing (primary)',
  terminal: 'Commercial terminal',
  vendor: 'Alt-data vendor',
};

const SOURCES: Source[] = [
  {
    name: 'yfinance (Python)',
    gives: 'NSE/BSE prices via .NS / .BO tickers, indices ^NSEI ^BSESN, fundamentals',
    cost: 'Free',
    tier: 'free',
    usedIn: 'Our workhorse from Module 3',
    kind: 'library',
    chain: 'Re-serves exchange data. Convenient, and one step removed from the exchange.',
  },
  {
    name: 'NSE / BSE websites',
    gives: 'Official prices, indices, announcements, bhavcopy',
    cost: 'Free',
    tier: 'free',
    usedIn: 'Reference',
    kind: 'exchange',
    chain: 'The exchange itself. This is what everything else is reconciled against.',
  },
  {
    name: 'RBI DBIE',
    gives: 'Repo rate, money supply, credit growth, FX reserves',
    cost: 'Free',
    tier: 'free',
    usedIn: 'Modules 6, 9',
    kind: 'agency',
    chain: 'The central bank publishes these itself, so it is the primary source.',
  },
  {
    name: 'MOSPI / data.gov.in',
    gives: 'CPI, IIP, GDP',
    cost: 'Free',
    tier: 'free',
    usedIn: 'Module 6',
    kind: 'agency',
    chain: 'The statistics ministry. Note that these series get revised — see point-in-time bias.',
  },
  {
    name: 'Annual reports, exchange filings',
    gives: 'Statements and narrative',
    cost: 'Free',
    tier: 'free',
    usedIn: 'Module 8',
    kind: 'filing',
    chain: 'Straight from the company, as filed on a date. The narrative lives here too.',
  },
  {
    name: 'FRED (St. Louis Fed)',
    gives: 'Global macro, for comparison',
    cost: 'Free',
    tier: 'free',
    usedIn: 'Secondary',
    kind: 'agency',
    chain: 'Global series for comparison, not the India-first spine of this course.',
  },
  {
    name: 'Bloomberg / LSEG / FactSet / CapIQ',
    gives: 'Everything, curated, real-time',
    cost: '~$25k+/seat/year',
    tier: 'paid',
    usedIn: 'Concept only — but every employer uses one',
    kind: 'terminal',
    chain: 'Curation is the product: someone else has already reconciled the sources for you.',
  },
  {
    name: 'Alt-data vendors',
    gives: 'Card panels, satellite, sentiment',
    cost: '$$$$',
    tier: 'paid',
    usedIn: 'Awareness only',
    kind: 'vendor',
    chain: 'Bucket three from the previous page. Expensive, and rarely reconcilable to anything.',
  },
];

type SortKey = 'name' | 'tier' | 'kind';

export function SourceTable({ moduleId = '01-data-foundations' }: { moduleId?: string }) {
  const { hydrated, setWidget, getWidget } = useProgress();

  const [sort, setSort] = useState<SortKey>('name');
  const [freeOnly, setFreeOnly] = useState(false);
  const [primaryOnly, setPrimaryOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const isPrimary = (s: Source) =>
      s.kind === 'exchange' || s.kind === 'agency' || s.kind === 'filing';

    const filtered = SOURCES.filter(
      (s) => (!freeOnly || s.tier === 'free') && (!primaryOnly || isPrimary(s)),
    );

    const order: Record<SortKey, (a: Source, b: Source) => number> = {
      name: (a, b) => a.name.localeCompare(b.name),
      tier: (a, b) => a.tier.localeCompare(b.tier) || a.name.localeCompare(b.name),
      kind: (a, b) => KIND_LABEL[a.kind].localeCompare(KIND_LABEL[b.kind]),
    };
    return [...filtered].sort(order[sort]);
  }, [sort, freeOnly, primaryOnly]);

  const toggleOpen = (name: string) => {
    const next = open === name ? null : name;
    setOpen(next);
    // Remember which sources the learner actually opened.
    if (next && hydrated) {
      const seen = getWidget<string[]>(moduleId, 'sourceTable:opened', []);
      if (!seen.includes(next)) setWidget(moduleId, 'sourceTable:opened', [...seen, next]);
    }
  };

  const opened = hydrated ? getWidget<string[]>(moduleId, 'sourceTable:opened', []) : [];

  return (
    <section className="widget not-prose card overflow-hidden">
      <header className="border-b border-border bg-surface px-4 py-3">
        <h4 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Icon name="database" size={16} className="text-primary" />
          Which source for which job?
        </h4>
        <p className="mt-1 text-sm text-muted">
          Sort and filter, then open a row. The question to answer:{' '}
          <em>what&apos;s the price, according to which source, as of when?</em>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Sort</span>
          {(
            [
              ['name', 'Name'],
              ['tier', 'Cost'],
              ['kind', 'Type'],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              aria-pressed={sort === key}
              className={
                sort === key
                  ? 'btn rounded-full bg-primary px-3 py-1 text-xs text-white'
                  : 'btn rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface hover:text-ink'
              }
            >
              {label}
            </button>
          ))}

          <span className="ml-2 h-4 w-px bg-border" aria-hidden="true" />

          <button
            type="button"
            onClick={() => setFreeOnly((v) => !v)}
            aria-pressed={freeOnly}
            className={
              freeOnly
                ? 'btn rounded-full bg-success px-3 py-1 text-xs text-white'
                : 'btn rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface hover:text-ink'
            }
          >
            Free only
          </button>
          <button
            type="button"
            onClick={() => setPrimaryOnly((v) => !v)}
            aria-pressed={primaryOnly}
            className={
              primaryOnly
                ? 'btn rounded-full px-3 py-1 text-xs text-white'
                : 'btn rounded-full border border-border px-3 py-1 text-xs text-muted hover:bg-surface hover:text-ink'
            }
            style={primaryOnly ? { background: tokens.color.part.C } : undefined}
          >
            Primary sources only
          </button>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {rows.map((s) => {
          const isOpen = open === s.name;
          const isGolden = s.kind === 'exchange';

          return (
            <li key={s.name}>
              <button
                type="button"
                onClick={() => toggleOpen(s.name)}
                aria-expanded={isOpen}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-fast ease-token hover:bg-surface"
              >
                <Icon
                  name={isOpen ? 'chevron-down' : 'chevron-right'}
                  size={15}
                  className="mt-0.5 shrink-0 text-muted"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{s.name}</span>
                    {isGolden && (
                      <span
                        className="chip text-white"
                        style={{ background: tokens.color.part.C }}
                        title="The source everything else is reconciled against"
                      >
                        <Icon name="target" size={11} />
                        Golden source
                      </span>
                    )}
                    {opened.includes(s.name) && !isOpen && (
                      <Icon name="check" size={12} className="text-success" strokeWidth={3} />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">{KIND_LABEL[s.kind]}</span>
                </span>

                <span
                  className={`chip shrink-0 ${
                    s.tier === 'free' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  }`}
                >
                  {s.cost}
                </span>
              </button>

              {isOpen && (
                <dl className="grid gap-3 bg-surface/60 px-4 pb-4 pl-12 pt-1 text-sm animate-slide-open sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      What you get
                    </dt>
                    <dd className="mt-0.5 text-ink">{s.gives}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Used in this course
                    </dt>
                    <dd className="mt-0.5 text-ink">{s.usedIn}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Where it sits in the chain
                    </dt>
                    <dd className="mt-0.5 text-ink">{s.chain}</dd>
                  </div>
                </dl>
              )}
            </li>
          );
        })}

        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-muted">
            No source matches both filters — that combination is the point: primary and free do
            not always overlap.
          </li>
        )}
      </ul>

      <footer className="border-t border-border bg-surface/60 px-4 py-3">
        <p className="text-xs text-muted">
          {rows.length} of {SOURCES.length} sources shown · {opened.length} opened. Per-source
          adjustment conventions and licence terms are not documented in this course package —
          which is itself the lesson: if you can&apos;t cite them, you can&apos;t claim the number
          is reconciled.
        </p>
      </footer>
    </section>
  );
}
