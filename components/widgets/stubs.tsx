import { MissingWidget } from './MissingWidget';

/**
 * Widgets Module 1's MDX references that the brief defers to a later phase.
 * They render a labelled placeholder so the surrounding prose still reads —
 * the pages explain each point in text immediately after the widget.
 */

export function SourceTable() {
  return (
    <MissingWidget
      name="SourceTable"
      planned
      detail="An interactive version of the source comparison. The table below carries the same information."
    />
  );
}

export function PriceDiscrepancy(_props: { exerciseId?: string }) {
  void _props;
  return (
    <MissingWidget
      name="PriceDiscrepancy"
      planned
      detail="Three sources, three closing prices, one dividend adjustment — walked through in the paragraph below."
    />
  );
}

export function DistributionCompare(_props: { dataset?: string }) {
  void _props;
  return (
    <MissingWidget
      name="DistributionCompare"
      planned
      detail="Daily return distribution against a normal curve. The fat-tail chart arrives with Module 4's charting components."
    />
  );
}

export function MissingCalendar(_props: { dataset?: string }) {
  void _props;
  return (
    <MissingWidget
      name="MissingCalendar"
      planned
      detail="A trading-calendar heatmap marking expected gaps against problem gaps. The two problem dates are named below."
    />
  );
}

export function CrisisChart(_props: { dataset?: string }) {
  void _props;
  return (
    <MissingWidget
      name="CrisisChart"
      planned
      detail="A crisis-window price chart showing why those observations must stay in the sample."
    />
  );
}

export function StreamlitCard(_props: { id?: string }) {
  void _props;
  return (
    <MissingWidget
      name="StreamlitCard"
      planned
      detail="Download-and-run card for a Streamlit app. Module 4 is the first module that needs it; module overviews already list the apps."
    />
  );
}
