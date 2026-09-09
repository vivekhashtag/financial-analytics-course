import { Icon } from '@/components/ui/Icon';
import { PracticeIcon } from './PracticeIcon';
import { getCheatsheet, getWorkTemplates } from '@/lib/templates';
import { PRACTICE_LABELS } from '@/lib/appendix-d';

/**
 * The work templates, at the top of Appendix D.
 *
 * `download` is set on every anchor, so a browser saves the file instead of
 * navigating to it — without it, a .docx becomes an unhelpful tab and a PDF
 * opens in the viewer rather than landing in Downloads. The attribute also
 * carries the filename, which is why the saved file is named after the document
 * rather than after the route.
 *
 * A template whose file is genuinely absent renders greyed and unclickable,
 * naming what is missing. That state is a fallback, not the design: all seven
 * ship with the course.
 */
export function TemplateBox() {
  const templates = getWorkTemplates();
  const cheatsheet = getCheatsheet();
  const missing = templates.filter((t) => !t.available).length + (cheatsheet.available ? 0 : 1);

  return (
    <section
      className="not-prose my-8 overflow-hidden rounded-lg border border-border"
      style={{
        background:
          'linear-gradient(160deg, color-mix(in srgb, var(--accent) 7%, transparent), transparent 65%)',
      }}
      aria-labelledby="work-templates"
    >
      <header className="flex flex-wrap items-start gap-3 border-b border-border px-5 py-4">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md accent-bg-soft accent-text">
          <Icon name="file-text" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="work-templates" className="!mt-0 !mb-0 !border-b-0 !pb-0 text-lg font-semibold text-ink">
            Work templates
          </h2>
          <p className="mt-1 text-sm text-muted">
            The blank version of every document these six jobs produce. Fill one in with course
            data and you have the artefact an interview asks for.
          </p>
        </div>
      </header>

      <div className="px-5 py-4">
        {/* the printable, visually separated from the six */}
        {cheatsheet.available ? (
          <a
            href={cheatsheet.href}
            download
            className="group flex items-center gap-3 rounded-md px-4 py-3 text-sm font-semibold no-underline transition-transform duration-base ease-token hover:-translate-y-px"
            style={{ backgroundColor: 'var(--accent)', color: '#FFFFFF' }}
          >
            <Icon name="download" size={17} className="shrink-0" />
            <span className="min-w-0 flex-1">
              {cheatsheet.name}
              <span className="mt-0.5 block text-xs font-normal opacity-85">
                {cheatsheet.description}
              </span>
            </span>
            <Icon name="arrow-right" size={15} className="shrink-0 opacity-70" />
          </a>
        ) : (
          <Unavailable name={cheatsheet.name} file={cheatsheet.file} />
        )}

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
          One document per practice
        </p>

        <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
          {templates.map((t) =>
            t.available ? (
              <li key={t.file}>
                <a
                  href={t.href}
                  download
                  className="card group flex h-full items-start gap-3 p-3.5 no-underline transition-shadow duration-base ease-token hover:shadow-lift"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted transition-colors duration-fast group-hover:accent-text">
                    <PracticeIcon practice={t.practice} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[0.7rem] tabular-nums text-muted">
                        {t.practice}
                      </span>
                      <span className="text-sm font-semibold text-ink">{t.name}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      {t.description}
                    </span>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium accent-text">
                      <Icon name="download" size={11} />
                      .docx
                    </span>
                  </span>
                </a>
              </li>
            ) : (
              <li key={t.file}>
                <Unavailable name={`${t.practice} · ${t.name}`} file={t.file} />
              </li>
            ),
          )}
        </ul>

        <p className="mt-4 text-xs text-muted">
          {missing === 0 ? (
            <>
              Word format, so they open in Word, Google Docs or LibreOffice. Each one names the
              practice it belongs to: {Object.entries(PRACTICE_LABELS)
                .map(([code, label]) => `${code} ${label}`)
                .join(' · ')}
              .
            </>
          ) : (
            <>
              {missing} of the seven templates {missing === 1 ? 'is' : 'are'} not in{' '}
              <code className="font-mono">public/templates/</code> yet, and {missing === 1 ? 'is' : 'are'}{' '}
              shown greyed out above.
            </>
          )}
        </p>
      </div>
    </section>
  );
}

/** Greyed fallback for a template file that is not on disk. */
function Unavailable({ name, file }: { name: string; file: string }) {
  return (
    <div
      className="flex h-full items-start gap-3 rounded-md border border-dashed border-border bg-surface p-3.5 opacity-70"
      aria-disabled="true"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted">
        <Icon name="lock" size={15} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-muted">{name}</span>
        <span className="mt-1 block text-xs text-muted">
          Coming soon — <code className="font-mono">{file}</code> is not in the build.
        </span>
      </span>
    </div>
  );
}
