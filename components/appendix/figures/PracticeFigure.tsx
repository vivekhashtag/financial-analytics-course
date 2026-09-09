import { DealTimeline } from './DealTimeline';
import { EstimateToTarget } from './EstimateToTarget';
import { MaturityLadder } from './MaturityLadder';
import { PayoffExplorer } from './PayoffExplorer';
import { QoEBridge } from './QoEBridge';
import { ThesisEvidence } from './ThesisEvidence';

/**
 * One figure per practice, chosen by code.
 *
 * Injected by the page rather than referenced from the markdown — the same way
 * `ModuleChart` is placed by the module route — because `content/` is not
 * editable and a figure is a presentation decision anyway.
 *
 * A practice with no figure renders nothing, so adding a D.7 later costs a
 * blank space rather than a crash.
 */
const FIGURE_FOR: Record<string, () => React.JSX.Element> = {
  'D.1': EstimateToTarget,
  'D.2': DealTimeline,
  'D.3': QoEBridge,
  'D.4': ThesisEvidence,
  'D.5': PayoffExplorer,
  'D.6': MaturityLadder,
};

export function PracticeFigure({ practice }: { practice: string }) {
  const Figure = FIGURE_FOR[practice];
  return Figure ? <Figure /> : null;
}
