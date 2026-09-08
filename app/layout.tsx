import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ProgressProvider } from '@/components/progress/ProgressProvider';
import { SiteHeader } from '@/components/shell/SiteHeader';
import { SiteFooter } from '@/components/shell/SiteFooter';
import type { MenuGroup } from '@/components/shell/ModuleMenu';
import { firstPageHref, getAllModules, getExercises, getQuiz } from '@/lib/content';
import { PARTS } from '@/lib/parts';

export const metadata: Metadata = {
  title: {
    default: 'Financial Analytics — India-first, Python-first, no ML',
    template: '%s · Financial Analytics',
  },
  description:
    'A hands-on financial analytics course: data literacy, Python, pandas and SQL, the four analytics questions, the finance map, and four labs — all on Indian market data.',
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
};

/** Course structure for the global menu — read once, on the server. */
function menuGroups(): MenuGroup[] {
  const modules = getAllModules();

  return PARTS.filter((p) => modules.some((m) => m.part === p.id)).map((p) => ({
    partId: p.id,
    label: p.label,
    color: p.color,
    modules: modules
      .filter((m) => m.part === p.id)
      .map((m) => ({
        id: m.id,
        number: m.number,
        title: m.title,
        href: firstPageHref(m),
        totals: {
          pages: m.pages.length,
          notebooks: m.notebooks.length,
          exercises: getExercises(m.id).length,
          hasQuiz: !!getQuiz(m.id),
        },
      })),
  }));
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const groups = menuGroups();

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink">
        <ProgressProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to content
          </a>
          <SiteHeader groups={groups} />
          <main id="main">{children}</main>
          <SiteFooter />
        </ProgressProvider>
      </body>
    </html>
  );
}
