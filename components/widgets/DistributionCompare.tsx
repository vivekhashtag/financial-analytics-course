import { getReturnDistribution } from '@/lib/series';
import { getDataset } from '@/lib/content';
import { DistributionCompareView } from './DistributionCompareView';
import { MissingWidget } from './MissingWidget';

/**
 * Actual return distribution against the normal bell — the fat-tails idea.
 *
 * Every number is computed from `data/nifty50_prices.csv` at build time
 * (see lib/series.ts), so the tails the learner counts are the real tails of
 * the series they will analyse in Module 3.
 */
export function DistributionCompare({ dataset = 'nifty50_prices' }: { dataset?: string }) {
  const dist = getReturnDistribution(dataset);
  const ds = getDataset(dataset);

  if (!dist || !ds) {
    return (
      <MissingWidget
        name="DistributionCompare"
        detail={`Could not compute returns from dataset "${dataset}"`}
      />
    );
  }

  return <DistributionCompareView dist={dist} datasetTitle={ds.title} datasetId={ds.id} />;
}
