import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { AppendixShell } from '@/components/shell/AppendixShell';
import { MdxContent } from '@/components/mdx/MdxContent';
import { MissingWidget } from '@/components/widgets/MissingWidget';
import { NotebookCard } from '@/components/widgets/NotebookCard';
import { WorkItselfPage } from '@/components/appendix/WorkItselfPage';
import {
  getAppendices,
  getAppendix,
  getAppendixPage,
  type Appendix,
} from '@/lib/appendices';
import { APPENDIX_PROGRESS_KEY } from '@/lib/progress-keys';

interface Params {
  appendixSlug: string;
}

export function generateStaticParams(): Params[] {
  return getAppendices().map((a) => ({ appendixSlug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { appendixSlug } = await params;
  const appendix = getAppendix(appendixSlug);
  if (!appendix) return {};
  return {
    title: `Appendix ${appendix.letter} · ${appendix.title}`,
    description: appendix.blurb,
  };
}

export default async function AppendixRoute({ params }: { params: Promise<Params> }) {
  const { appendixSlug } = await params;

  const appendix = getAppendix(appendixSlug);
  if (!appendix) notFound();

  // Appendix D is the flagship: its markdown has a regular six-part structure
  // that renders as steppers, timelines and chips rather than as prose. Every
  // other appendix takes the plain path.
  if (appendix.slug === 'the-work-itself') {
    return (
      <AppendixShell appendix={appendix} wide>
        <WorkItselfPage />
      </AppendixShell>
    );
  }

  return (
    <AppendixShell appendix={appendix}>
      <article className="prose-course max-w-content">
        {appendix.kind === 'notebook' ? (
          <NotebookAppendix appendix={appendix} />
        ) : (
          <ProseAppendix slug={appendix.slug} />
        )}
      </article>
    </AppendixShell>
  );
}

/**
 * Appendix A. The notebook shipped in the content package from the start, but
 * no `module.json` referenced it, so nothing in the UI ever linked to it — it
 * was reachable only by guessing its URL. This page is what resolves that: one
 * paragraph of framing, then the same `NotebookCard` the modules use, fed the
 * notebook record from the appendix registry.
 */
function NotebookAppendix({ appendix }: { appendix: Appendix }) {
  if (!appendix.notebook) {
    return (
      <MissingWidget
        name="NotebookCard"
        detail={`The appendix registry has no notebook for Appendix ${appendix.letter}`}
      />
    );
  }

  return (
    <>
      <p>
        Finance runs on Excel and you now run on Python. This notebook is the peace treaty:
        reading the messy kind of workbook into pandas, then writing formatted,
        stakeholder-ready Excel back out of it. There is no page to read here, the work is in
        the cells.
      </p>
      <NotebookCard moduleId={APPENDIX_PROGRESS_KEY} notebook={appendix.notebook} />
    </>
  );
}

/** Appendices B, C and D: the file's prose, through the module MDX pipeline. */
function ProseAppendix({ slug }: { slug: string }) {
  const page = getAppendixPage(slug);

  if (!page) {
    return (
      <MissingWidget
        name="Appendix"
        detail={`No prose file on disk for appendix "${slug}" — see lib/appendices.ts`}
      />
    );
  }

  return <MdxContent source={page.body} codeBlocks={page.codeBlocks} />;
}
