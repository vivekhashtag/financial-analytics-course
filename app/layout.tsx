import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Sora } from 'next/font/google';
import './globals.css';
import { ProgressProvider } from '@/components/progress/ProgressProvider';
import { SiteHeader } from '@/components/shell/SiteHeader';
import { SiteFooter } from '@/components/shell/SiteFooter';
import type { MenuGroup } from '@/components/shell/ModuleMenu';
import { firstPageHref, getAllModules, getExercises, getQuiz } from '@/lib/content';
import { PARTS } from '@/lib/parts';
import { siteUrlObject } from '@/lib/env';

/**
 * Fonts are self-hosted by next/font: the files are emitted into
 * .next/static/media and served from our own origin, so there is no request to
 * fonts.gstatic.com and no third-party connection to wait on.
 *
 * `display: 'swap'` plus next/font's automatic size-adjusted fallback metrics
 * is what keeps CLS at zero — text paints immediately in a fallback whose
 * metrics are scaled to match the real face, so the swap doesn't reflow.
 *
 * Weights are pinned to the ones the design actually uses. Anything outside
 * these would be synthesised by the browser, so the codebase avoids them:
 * Sora at 600/700 (headings), Inter at 400/500/600 (everything else — note no
 * 700, so UI chrome uses font-semibold not font-bold), JetBrains Mono 400/500.
 */
const sora = Sora({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-heading',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

const fontVariables = `${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`;

export const metadata: Metadata = {
  title: {
    default: 'Financial Analytics — India-first, Python-first, no ML',
    template: '%s · Financial Analytics',
  },
  description:
    'A hands-on financial analytics course: data literacy, Python, pandas and SQL, the four analytics questions, the finance map, and four labs — all on Indian market data.',
  // Never construct a URL from the raw env var here: an unparseable value
  // throws at build time and takes the whole deployment down. siteUrlObject()
  // returns null instead, which Next treats as "no metadataBase".
  metadataBase: siteUrlObject() ?? undefined,
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
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-bg font-body text-ink">
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
