import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getAllModules, getModuleMdx } from '@/lib/content';
import { MDX_OPTIONS } from '@/components/mdx/mdx-options';
import { CaseStudyScrollView } from './CaseStudyScrollView';
import { MissingWidget } from './MissingWidget';

/**
 * The scroll-driven case-study opener (`<CaseStudyScroll id="knight-capital-2012" />`).
 *
 * The beats come from the module's `caseStudy` block. The prose file it also
 * points at (`pages/case-knight-capital.mdx`) is now present, and is rendered
 * *collapsed* rather than inline: the page that hosts this widget already tells
 * the story in four short paragraphs directly below it, so expanding it by
 * default would say the same thing twice. The file is the blueprint's
 * three-beat version — what happened, why it matters, the one lesson — which is
 * the format the other three case studies in the thread will follow.
 *
 * When the file is absent the disclosure simply does not render, and the link
 * to the module's full text stands on its own, as before.
 *
 * It renders through `MDXRemote` with only the shared `MDX_OPTIONS`, not
 * through `MdxContent`: this component is itself in `MdxContent`'s widget
 * registry, so importing that back would close an import cycle. The case-study
 * prose is plain markdown and needs no widgets, and its typography comes from
 * the surrounding `prose-course`.
 */
export function CaseStudyScroll({ id, moduleId }: { id: string; moduleId?: string }) {
  const owner = getAllModules().find(
    (m) => (moduleId ? m.id === moduleId : true) && m.caseStudy?.id === id,
  );

  if (!owner?.caseStudy) {
    return (
      <MissingWidget
        name="CaseStudyScroll"
        detail={`No module declares a caseStudy with id "${id}"`}
      />
    );
  }

  const cs = owner.caseStudy;
  const fullText = owner.pages.find((p) => p.slug === 'full-content');
  const prose = cs.file ? getModuleMdx(owner.id, cs.file) : null;

  return (
    <div className="widget space-y-2">
      <CaseStudyScrollView
        title={cs.title}
        hook={cs.hook ?? null}
        lesson={cs.lesson ?? null}
        part={owner.part}
      />

      {prose && (
        <details className="not-prose group rounded-md border border-border bg-surface">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-ink marker:content-none">
            <span className="accent-text">
              Read the full story
              <span className="ml-1.5 inline-block transition-transform duration-fast ease-token group-open:rotate-90">
                ›
              </span>
            </span>
            <span className="ml-2 text-xs font-normal text-muted">
              what happened · why it matters · the one lesson
            </span>
          </summary>
          <div className="prose-course border-t border-border px-4 py-4 text-prose [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0">
            <MDXRemote source={prose.body} options={MDX_OPTIONS} />
          </div>
        </details>
      )}

      {fullText && (
        <p className="text-xs text-muted">
          The same account sits in{' '}
          <Link href={`/modules/${owner.id}/${fullText.slug}`} className="accent-text font-medium">
            {fullText.title}
          </Link>
          , Lesson 1.1.
        </p>
      )}
    </div>
  );
}
