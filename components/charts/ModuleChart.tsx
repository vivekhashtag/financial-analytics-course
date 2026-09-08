'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { ChartSkeleton } from './ChartSkeleton';

/**
 * One signature chart per module, lazily loaded.
 *
 * Every entry is a `next/dynamic` import with `ssr: false`, so recharts and the
 * chart code land in their own chunk and a module page the learner never
 * interacts with pays nothing for them. The skeleton reserves the final height,
 * so the swap-in costs no layout shift.
 */

const loading = (height: number) => {
  const Loading = () => <ChartSkeleton height={height} />;
  return Loading;
};

const REGISTRY: Record<string, ComponentType> = {
  '04-descriptive-viz': dynamic(() => import('./M4ChartIntent'), {
    ssr: false,
    loading: loading(300),
  }),
  '05-diagnostic': dynamic(() => import('./M5VarianceWaterfall'), {
    ssr: false,
    loading: loading(280),
  }),
  '06-predictive': dynamic(() => import('./M6ForecastHarness'), {
    ssr: false,
    loading: loading(300),
  }),
  '07-prescriptive': dynamic(() => import('./M7BreakEven'), {
    ssr: false,
    loading: loading(300),
  }),
  '09-lab-time-series': dynamic(() => import('./M9Decomposition'), {
    ssr: false,
    loading: loading(300),
  }),
  '10-lab-monte-carlo': dynamic(() => import('./M10SimulationFan'), {
    ssr: false,
    loading: loading(300),
  }),
  '11-lab-algo-trading': dynamic(() => import('./M11OrderBook'), {
    ssr: false,
    loading: loading(280),
  }),
  '12-lab-portfolio': dynamic(() => import('./M12Frontier'), {
    ssr: false,
    loading: loading(300),
  }),
  // 08-finance-map is deliberately absent: it is the map module, and the
  // pipeline diagram it would otherwise host sits on Module 3's overview.
};

export function hasModuleChart(moduleId: string): boolean {
  return moduleId in REGISTRY;
}

export function ModuleChart({ moduleId }: { moduleId: string }) {
  const Chart = REGISTRY[moduleId];
  if (!Chart) return null;

  return (
    <section className="not-prose my-10" aria-label="Interactive exhibit">
      <h2 className="mb-3 text-xl font-semibold text-ink">Try it</h2>
      <Chart />
    </section>
  );
}
