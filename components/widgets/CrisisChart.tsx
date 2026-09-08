import { getCrisisEpisode } from '@/lib/series';
import { getDataset } from '@/lib/content';
import { CrisisChartView } from './CrisisChartView';
import { MissingWidget } from './MissingWidget';

/**
 * The drawdown episode, walked event by event.
 *
 * The prose around this widget names 2008 and March 2020 as the instinct-test.
 * This dataset starts in 2021, so charting either would mean fabricating
 * history. Instead the widget plots the deepest drawdown *this* series actually
 * contains — the −29.8% the dataset registry documents — and says so plainly.
 * Same lesson, real numbers.
 */
export function CrisisChart({ dataset = 'nifty50_prices' }: { dataset?: string }) {
  const episode = getCrisisEpisode(dataset);
  const ds = getDataset(dataset);

  if (!episode || !ds) {
    return (
      <MissingWidget
        name="CrisisChart"
        detail={`Could not find a drawdown episode in dataset "${dataset}"`}
      />
    );
  }

  return <CrisisChartView episode={episode} datasetTitle={ds.title} datasetId={ds.id} />;
}
