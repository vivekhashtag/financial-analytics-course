import Link from 'next/link';
import { getAllModules } from '@/lib/content';
import { CaseStudyScrollView } from './CaseStudyScrollView';
import { MissingWidget } from './MissingWidget';

/**
 * The scroll-driven case-study opener (`<CaseStudyScroll id="knight-capital-2012" />`).
 *
 * The beats are drawn from the module's `caseStudy` block. The schema also
 * points at a prose file — `pages/case-knight-capital.mdx` — which is **not in
 * the content package**; until it lands, the component links to the module's
 * full text, where the same story is told in Lesson 1.1.
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

  return (
    <div className="widget space-y-2">
      <CaseStudyScrollView
        title={cs.title}
        hook={cs.hook ?? null}
        lesson={cs.lesson ?? null}
        part={owner.part}
      />
      {fullText && (
        <p className="text-xs text-muted">
          The full account is in{' '}
          <Link href={`/modules/${owner.id}/${fullText.slug}`} className="accent-text font-medium">
            {fullText.title}
          </Link>
          , Lesson 1.1.
        </p>
      )}
    </div>
  );
}
