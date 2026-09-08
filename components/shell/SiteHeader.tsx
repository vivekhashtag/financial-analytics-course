'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { useProgress } from '@/components/progress/ProgressProvider';
import { ModuleMenu, type MenuGroup } from './ModuleMenu';

const NAV = [
  { href: '/modules', label: 'Modules' },
  { href: '/data', label: 'Datasets' },
  { href: '/progress', label: 'My progress' },
];

/**
 * `groups` is built server-side in app/layout.tsx from module.json, so the
 * menu has the full course structure without shipping a content loader to the
 * browser.
 */
export function SiteHeader({ groups }: { groups: MenuGroup[] }) {
  const pathname = usePathname() ?? '/';
  const { hydrated, state } = useProgress();

  const badges = hydrated ? state.badges.length : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-wide items-center gap-2 px-4">
        <ModuleMenu groups={groups} />

        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <Icon name="trending-up" size={17} />
          </span>
          <span className="hidden text-sm font-semibold text-ink sm:block">
            Financial Analytics
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors duration-fast ease-token ${
                  active ? 'bg-surface text-ink' : 'text-muted hover:bg-surface hover:text-ink'
                }`}
              >
                {item.label}
                {item.href === '/progress' && badges > 0 && (
                  <span className="ml-1.5 rounded-full bg-success/12 px-1.5 py-0.5 text-xs font-bold text-success">
                    {badges}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/modules/00-orientation"
          className="btn-primary ml-auto shrink-0 md:ml-2"
        >
          <span className="hidden sm:inline">Start Module 0</span>
          <span className="sm:hidden">Start</span>
        </Link>
      </div>
    </header>
  );
}
