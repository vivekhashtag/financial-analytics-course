import { MissingWidget } from './MissingWidget';

/**
 * Widgets the content references that are still deferred.
 *
 * The five Module 1 widgets that used to live here — SourceTable,
 * PriceDiscrepancy, DistributionCompare, MissingCalendar, CrisisChart — are now
 * built for real and registered from their own files.
 */

export function StreamlitCard(_props: { id?: string }) {
  void _props;
  return (
    <MissingWidget
      name="StreamlitCard"
      planned
      detail="Download-and-run card for a Streamlit app. Module 4 is the first module that needs it; module overviews already list the apps with their run command."
    />
  );
}
