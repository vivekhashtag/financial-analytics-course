import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllModules, getModule, getPage } from '@/lib/content';
import { ML_SIGNPOST_PAGE } from '@/lib/links';
import { ModuleShell } from '@/components/shell/ModuleShell';
import { PageReadMarker } from '@/components/shell/PageReadMarker';
import { ModuleNeeds } from '@/components/shell/ModuleNeeds';
import { MdxContent } from '@/components/mdx/MdxContent';
import { MlNextStepCard } from '@/components/widgets/MlNextStepCard';
import { ModuleChart } from '@/components/charts/ModuleChart';

interface Params {
  moduleId: string;
  pageSlug: string;
}

export function generateStaticParams(): Params[] {
  return getAllModules().flatMap((mod) =>
    mod.pages.map((page) => ({ moduleId: mod.id, pageSlug: page.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { moduleId, pageSlug } = await params;
  const mod = getModule(moduleId);
  const page = mod?.pages.find((p) => p.slug === pageSlug);
  if (!mod || !page) return {};
  return { title: `${page.title} · ${mod.number} ${mod.title}` };
}

export default async function ModulePageRoute({ params }: { params: Promise<Params> }) {
  const { moduleId, pageSlug } = await params;

  const mod = getModule(moduleId);
  const page = getPage(moduleId, pageSlug);
  if (!mod || !page) notFound();

  const isFirstPage = mod.pages[0]?.slug === pageSlug;

  // Lesson 6.7 is the one signpost the content promises — see lib/links.ts.
  const isMlSignpost =
    moduleId === ML_SIGNPOST_PAGE.moduleId && pageSlug === ML_SIGNPOST_PAGE.slug;

  return (
    <ModuleShell mod={mod} section={{ kind: 'page', slug: pageSlug }}>
      <PageReadMarker moduleId={moduleId} slug={pageSlug} />

      <article className="prose-course max-w-content">
        <h2 className="!mt-0 text-2xl !border-b-0 !pb-0">{page.title}</h2>

        {isFirstPage && <ModuleNeeds mod={mod} />}

        <MdxContent source={page.body} codeBlocks={page.codeBlocks} />

        {/* One signature interactive exhibit per module, on its content page. */}
        {isFirstPage && <ModuleChart moduleId={moduleId} />}

        {isMlSignpost && <MlNextStepCard />}
      </article>
    </ModuleShell>
  );
}
