import Link from 'next/link';
import type { Metadata } from 'next';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/motion/Reveal';
import { AppendixCardMeta } from '@/components/shell/AppendixCardMeta';
import { getAppendices } from '@/lib/appendices';
import { formatMinutes } from '@/lib/format';
import { partColor } from '@/lib/parts';

export const metadata: Metadata = {
  title: 'Appendices',
  description:
    'Four appendices beside the course: the Excel ↔ Python bridge, the career map, how to ship your capstone, and six finance jobs up close.',
};

export default function AppendicesIndex() {
  const appendices = getAppendices();
  const accent = partColor('appendix');

  return (
    <div
      className="mx-auto max-w-wide px-4 py-10"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <header>
        <h1 className="text-3xl font-bold text-ink">Appendices</h1>
        <p className="mt-2 max-w-content text-lg text-muted">
          Four documents that sit beside the sixteen modules rather than inside them. Nothing
          here is graded and nothing here gates anything — but Appendix C is the difference
          between a capstone on your laptop and a link you can send someone.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {appendices.map((a, i) => (
          <Reveal as="li" key={a.slug} delay={Math.min(i * 60, 240)}>
            <Link
              href={`/appendices/${a.slug}`}
              className="card lift group flex h-full flex-col gap-3 p-5 no-underline"
              style={{ borderTopWidth: 3, borderTopColor: accent }}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold"
                  style={{ backgroundColor: `${accent}18`, color: accent }}
                >
                  {a.letter}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  {a.estimatedMinutes !== null ? (
                    <>
                      <Icon name="clock" size={12} />
                      {formatMinutes(a.estimatedMinutes)}
                    </>
                  ) : (
                    <>
                      <Icon name="notebook" size={12} />
                      Notebook
                    </>
                  )}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink">{a.title}</h2>
                <p className="mt-1 text-sm text-muted">{a.blurb}</p>
              </div>

              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                <li className="inline-flex items-center gap-1">
                  <Icon name={a.kind === 'notebook' ? 'notebook' : 'file-text'} size={12} />
                  {a.kind === 'notebook' ? 'Download + Colab' : 'Reference reading'}
                </li>
                {a.notebook?.datasets?.length ? (
                  <li className="inline-flex items-center gap-1">
                    <Icon name="database" size={12} />
                    {a.notebook.datasets.length} dataset
                    {a.notebook.datasets.length > 1 ? 's' : ''}
                  </li>
                ) : null}
              </ul>

              <AppendixCardMeta slug={a.slug} notebookId={a.notebook?.id} />
            </Link>
          </Reveal>
        ))}
      </ul>

      <p className="mt-8 max-w-content text-sm text-muted">
        Appendix A is a notebook rather than a page, so it works the way every other notebook in
        the course does: download it, or open it straight in Colab.{' '}
        <Link href="/modules" className="font-medium accent-text">
          Back to the modules
        </Link>
        .
      </p>
    </div>
  );
}
