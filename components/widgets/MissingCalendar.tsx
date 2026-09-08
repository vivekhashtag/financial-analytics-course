import { getTradingCalendar } from '@/lib/series';
import { getDataset } from '@/lib/content';
import { MissingCalendarView } from './MissingCalendarView';
import { MissingWidget } from './MissingWidget';

/**
 * Calendar heatmap of the price series: which days traded, which are missing,
 * and which category each gap belongs to.
 *
 * The calendar is built from the actual dates in the CSV. The two "problem"
 * gaps are read out of the dataset registry's own quirk text rather than
 * hardcoded, and the weekend session it finds (2023-11-12) is the Diwali
 * Muhurat trap the prose warns about — detected, not asserted.
 */
export function MissingCalendar({ dataset = 'nifty50_prices' }: { dataset?: string }) {
  const calendar = getTradingCalendar(dataset);
  const ds = getDataset(dataset);

  if (!calendar || !ds) {
    return (
      <MissingWidget
        name="MissingCalendar"
        detail={`Could not build a calendar from dataset "${dataset}"`}
      />
    );
  }

  return <MissingCalendarView calendar={calendar} datasetTitle={ds.title} datasetId={ds.id} />;
}
