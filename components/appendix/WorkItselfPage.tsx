import { MdxContent } from '@/components/mdx/MdxContent';
import { MissingWidget } from '@/components/widgets/MissingWidget';
import { Icon } from '@/components/ui/Icon';
import { readPreparedMdx } from '@/lib/content';
import { getWorkItself, type Practice } from '@/lib/appendix-d';
import { getSamplesPack, samplePage, templateForPractice } from '@/lib/templates';
import { GUIDED } from '@/lib/practice-figures';
import { CourseChips } from './CourseChips';
import { GuidedExercise } from './GuidedExercise';
import { PracticeFigure } from './figures/PracticeFigure';
import { DayTimeline } from './DayTimeline';
import { PracticeIcon } from './PracticeIcon';
import { PracticeNav } from './PracticeNav';
import { StationList, StationStep } from './StationStep';
import { TemplateBox } from './TemplateBox';

/**
 * Appendix D, rendered as the flagship appendix.
 *
 * Everything on this page is derived from `content/appendices/APPENDIX-D-…md`
 * at build time by lib/appendix-d.ts. The markdown is never edited; where the
 * parser cannot recover a structure the block falls back to the ordinary prose
 * path, so a change to the source can cost this page its stepper but never its
 * content.
 */
export function WorkItselfPage() {
  const doc = getWorkItself();

  if (!doc || !doc.practices.length) {
    return (
      <MissingWidget
        name="Appendix D"
        detail="Could not read the six practices from content/appendices/APPENDIX-D-THE-WORK-ITSELF.md"
      />
    );
  }

  return (
    <div>
      {doc.preamble && (
        <div className="prose-course max-w-content">
          <Prose body={doc.preamble} />
        </div>
      )}

      <div className="max-w-content">
        <TemplateBox />
      </div>

      {/* Rail from lg up, pill bar above the content below that. */}
      <div className="mt-8 lg:flex lg:items-start lg:gap-10">
        <div className="lg:order-2 lg:w-56 lg:shrink-0">
          <PracticeNav
            practices={doc.practices.map((p) => ({
              id: p.id,
              code: p.code,
              navLabel: p.navLabel,
            }))}
          />
        </div>

        <div className="mt-6 min-w-0 lg:order-1 lg:mt-0 lg:flex-1">
          {doc.practices.map((practice) => (
            <PracticeSection key={practice.id} practice={practice} />
          ))}

          {doc.closing && (
            <section className="prose-course mt-14 max-w-content border-t border-border pt-8">
              <h2 className="!mt-0">{doc.closing.heading}</h2>
              <Prose body={doc.closing.body} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function PracticeSection({ practice }: { practice: Practice }) {
  const template = templateForPractice(practice.code);
  const samples = getSamplesPack();
  const page = samplePage(practice.code);
  const guided = GUIDED[practice.code];

  return (
    // scroll-mt clears the sticky site header when the nav jumps here.
    <section id={practice.id} className="scroll-mt-20 pt-10 first:pt-0">
      <header className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide accent-text">
          <PracticeIcon practice={practice.code} size={15} />
          {practice.code} · {practice.navLabel}
        </div>
        <h2 className="mt-2 max-w-content text-2xl font-bold text-ink">{practice.title}</h2>
      </header>

      <div className="prose-course max-w-content">
        {/* The picture first: it carries the section's one idea before the
            prose spends four hundred words earning it. */}
        <PracticeFigure practice={practice.code} />

        {practice.intro && <Prose body={practice.intro} />}

        {/* The stepper, or the whole section as prose if it could not be built. */}
        {practice.parsed ? (
          <>
            {practice.processHeading && <h3>{practice.processHeading}</h3>}
            <StationList>
              {practice.stations.map((station, i) => (
                <StationStep
                  key={station.n}
                  n={station.n}
                  title={station.title}
                  index={i}
                  isLast={i === practice.stations.length - 1}
                >
                  <div className="prose-course text-prose">
                    <Prose body={station.body} />
                  </div>
                </StationStep>
              ))}
            </StationList>
          </>
        ) : (
          <Prose body={practice.raw} />
        )}

        {practice.day && <DayTimeline heading={practice.day.heading} entries={practice.day.entries} />}
        {practice.dayFallback && (
          <>
            <h3>{practice.dayFallback.heading}</h3>
            <Prose body={practice.dayFallback.body} />
          </>
        )}

        {practice.subsections.map((sub) => (
          <div key={sub.heading}>
            <h3>{sub.heading}</h3>
            <Prose body={sub.body} />
          </div>
        ))}

        {practice.miniature && (
          <>
            <h3>Your course, in miniature</h3>
            <CourseChips miniature={practice.miniature} />
          </>
        )}

        {/* The "Try this" paragraph, wrapped in the guided card. Its text is
            rendered here and passed through as children, so the card adds a
            hint, a model answer and a tick without restating a word of it. */}
        {practice.tryThis && guided && page !== null ? (
          <GuidedExercise
            practice={practice.code}
            hint={guided.hint}
            modelAnswer={guided.modelAnswer}
            samplePage={page}
          >
            <Prose body={practice.tryThis} />
          </GuidedExercise>
        ) : (
          practice.tryThis && <Prose body={practice.tryThis} />
        )}

        {/* The blank and the filled-in version, side by side, where the reader
            has just been told what the document is for. */}
        {(template?.available || (samples.available && page !== null)) && (
          <p className="not-prose mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
            {template?.available && (
              <a
                href={template.href}
                download
                className="inline-flex items-center gap-1.5 font-semibold accent-text no-underline hover:underline"
              >
                <Icon name="file-text" size={14} />
                Template ↓
                <span className="font-normal text-muted">{template.name} · .docx</span>
              </a>
            )}

            {samples.available && page !== null && (
              <a
                href={samples.href}
                download
                className="inline-flex items-center gap-1.5 font-semibold accent-text no-underline hover:underline"
              >
                <Icon name="eye" size={14} />
                Worked sample ↓
                <span className="font-normal text-muted">page {page} of the pack</span>
              </a>
            )}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * A markdown fragment through the course MDX pipeline.
 *
 * Every fragment goes through `readPreparedMdx` for the same reason whole pages
 * do: the stray-`<` escaping and the `code={…}` lifting are what make this
 * content compile at all.
 */
function Prose({ body }: { body: string }) {
  if (!body.trim()) return null;
  const prepared = readPreparedMdx(body);
  return <MdxContent source={prepared.body} codeBlocks={prepared.codeBlocks} />;
}
