import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { MDXComponents } from 'mdx/types';

import { AICharterCards } from '@/components/widgets/AICharterCards';
import { AISidebarInline } from '@/components/widgets/AISidebarInline';
import { BiasDetective } from '@/components/widgets/BiasDetective';
import { Callout } from '@/components/widgets/Callout';
import { CaseStudyScroll } from '@/components/widgets/CaseStudyScroll';
import { Checklist } from '@/components/widgets/Checklist';
import { CodePeek, MdxPre } from '@/components/widgets/CodePeek';
import { CourseMetroMap } from '@/components/widgets/CourseMetroMap';
import { DatasetPreview } from '@/components/widgets/DatasetPreview';
import { DatasetTable } from '@/components/widgets/DatasetTable';
import { DecisionTree } from '@/components/widgets/DecisionTree';
import { Download } from '@/components/widgets/Download';
import { ExerciseList } from '@/components/widgets/ExerciseList';
import { FlipCards } from '@/components/widgets/FlipCards';
import { IconRow } from '@/components/widgets/IconRow';
import { MissingWidget } from '@/components/widgets/MissingWidget';
import { NotebookCard } from '@/components/widgets/NotebookCard';
import { Quiz } from '@/components/widgets/Quiz';
import { SortingGame } from '@/components/widgets/SortingGame';
import { StatCounter } from '@/components/widgets/StatCounter';
import { TrustReportForm } from '@/components/widgets/TrustReportForm';
import {
  CrisisChart,
  DistributionCompare,
  MissingCalendar,
  PriceDiscrepancy,
  SourceTable,
  StreamlitCard,
} from '@/components/widgets/stubs';

/**
 * The widget registry from CONTENT_SCHEMA.md. Content references these by name;
 * anything MDX asks for that is not here renders as a labelled placeholder
 * instead of throwing, so one unknown widget cannot take down a page.
 */
const widgets = {
  AICharterCards,
  AISidebarInline,
  BiasDetective,
  Callout,
  CaseStudyScroll,
  Checklist,
  CodePeek,
  CourseMetroMap,
  CrisisChart,
  DatasetPreview,
  DatasetTable,
  DecisionTree,
  DistributionCompare,
  Download,
  ExerciseList,
  FlipCards,
  IconRow,
  MissingCalendar,
  NotebookCard,
  PriceDiscrepancy,
  Quiz,
  SortingGame,
  SourceTable,
  StatCounter,
  StreamlitCard,
  TrustReportForm,
} as const;

/**
 * `code={`…`}` props are lifted out of the MDX source before compilation (see
 * lib/mdx-source.ts) and arrive as `codeIndex`, so Python indentation survives
 * byte for byte. This wrapper puts the string back.
 */
function makeCodePeek(codeBlocks: string[]) {
  function CodePeekFromMdx({
    codeIndex,
    code,
    ...rest
  }: Parameters<typeof CodePeek>[0] & { codeIndex?: number; code?: string }) {
    const resolved = typeof codeIndex === 'number' ? codeBlocks[codeIndex] : code;
    if (resolved === undefined) {
      return <MissingWidget name="CodePeek" detail="No code was passed to this snippet." />;
    }
    return <CodePeek code={resolved} {...rest} />;
  }
  return CodePeekFromMdx;
}

function baseComponents(codeBlocks: string[]): MDXComponents {
  return {
  ...widgets,
  CodePeek: makeCodePeek(codeBlocks),
  pre: MdxPre,
  // Markdown tables carry a lot of this course's content; keep them scrollable.
  table: (props) => (
    <div className="my-6 overflow-x-auto">
      <table {...props} />
    </div>
  ),
  a: ({ href, children, ...rest }) => {
    const external = typeof href === 'string' && /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  },
  };
}

export function MdxContent({
  source,
  codeBlocks = [],
}: {
  source: string;
  codeBlocks?: string[];
}) {
  return (
    <MDXRemote
      source={source}
      components={baseComponents(codeBlocks)}
      options={{
        parseFrontmatter: false,
        mdxOptions: { remarkPlugins: [remarkGfm] },
      }}
    />
  );
}

/** Names the content is allowed to use — surfaced on the module overview. */
export const KNOWN_WIDGETS = Object.keys(widgets);

export { MissingWidget };
