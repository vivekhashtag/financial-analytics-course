'use client';

import { useInView } from '@/components/motion/Reveal';
import { partColor } from '@/lib/parts';

/**
 * The four analytics questions, building rung by rung as it scrolls into view.
 *
 * MDX-embeddable: `<FourQuestionLadder />`. Also used on the home page under
 * the Parts section, which is where the four questions first get named.
 *
 * The rungs are the content — Part B's four modules — so the labels come from
 * the course's own vocabulary rather than generic analytics-speak.
 */

const RUNGS = [
  { n: '4', q: 'What happened?', name: 'Descriptive', note: 'The past, shown clearly' },
  { n: '5', q: 'Why did it happen?', name: 'Diagnostic', note: 'Attribution and drivers' },
  { n: '6', q: 'What is likely next?', name: 'Predictive', note: 'Forecast, with intervals' },
  { n: '7', q: 'What should we do?', name: 'Prescriptive', note: 'Decide under uncertainty' },
];

export function FourQuestionLadder({ title }: { title?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });
  const accent = partColor('B');

  return (
    <figure ref={ref} className="widget not-prose card overflow-hidden">
      <figcaption className="border-b border-border bg-surface px-4 py-2.5">
        <h4 className="text-sm font-semibold text-ink">
          {title ?? 'The analytics ladder'}
        </h4>
        <p className="mt-0.5 text-xs text-muted">
          Each rung stands on the one below it. Skip a rung and the one above it
          carries the error.
        </p>
      </figcaption>

      <ol className="flex flex-col-reverse gap-2 p-4">
        {RUNGS.map((rung, i) => {
          // Bottom rung first, so the ladder assembles upward.
          const step = RUNGS.length - 1 - i;
          return (
            <li
              key={rung.n}
              className="flex items-center gap-3 rounded-md border p-3"
              style={{
                borderColor: `${accent}33`,
                background: `color-mix(in srgb, ${accent} ${4 + step * 2}%, white)`,
                // The rung grows from its left edge as it lands.
                opacity: inView ? 1 : 0,
                transform: inView ? 'none' : 'translate3d(-10px, 0, 0)',
                transition: `opacity 300ms cubic-bezier(.16,.84,.44,1) ${step * 110}ms, transform 300ms cubic-bezier(.16,.84,.44,1) ${step * 110}ms`,
              }}
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold tabular-nums"
                style={{ backgroundColor: `${accent}1f`, color: accent }}
              >
                {rung.n}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{rung.q}</span>
                <span className="block text-xs text-muted">
                  <span style={{ color: accent }}>{rung.name}</span> · {rung.note}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
