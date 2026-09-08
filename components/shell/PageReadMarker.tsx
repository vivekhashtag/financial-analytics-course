'use client';

import { useEffect } from 'react';
import { useProgress } from '@/components/progress/ProgressProvider';

/**
 * Marks a page read. Fires once the learner has been on the page a few seconds
 * *and* has scrolled, so opening a page and bouncing straight off does not
 * count as reading it.
 */
export function PageReadMarker({ moduleId, slug }: { moduleId: string; slug: string }) {
  const { hydrated, add, has } = useProgress();

  useEffect(() => {
    if (!hydrated || has(moduleId, 'pagesRead', slug)) return;

    let scrolled = false;
    let elapsed = false;

    const commit = () => {
      if (scrolled && elapsed) {
        add(moduleId, 'pagesRead', slug);
        cleanup();
      }
    };

    const onScroll = () => {
      scrolled = true;
      commit();
    };

    // A page short enough not to scroll still counts once the timer fires.
    const shortPage = () =>
      document.documentElement.scrollHeight <= window.innerHeight + 80;

    const timer = window.setTimeout(() => {
      elapsed = true;
      if (shortPage()) scrolled = true;
      commit();
    }, 4000);

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return cleanup;
  }, [hydrated, moduleId, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
