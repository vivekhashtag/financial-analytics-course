import { Icon } from '@/components/ui/Icon';
import tokens from '@/schema/tokens.json';

export interface IconRowItem {
  icon: string;
  label: string;
  note?: string;
}

/**
 * The "how each module works" strip on Module 0's course map. Nine steps, so it
 * scrolls horizontally on narrow screens rather than wrapping into a wall.
 */
export function IconRow({ items }: { items: IconRowItem[] }) {
  const palette = tokens.color.chart;

  return (
    <div className="widget not-prose -mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-3 sm:grid sm:min-w-0 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const color = palette[i % palette.length];
          return (
            <li
              key={i}
              className="card flex w-[190px] items-start gap-3 p-3 sm:w-auto"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${color}18`, color }}
              >
                <Icon name={item.icon} size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                {item.note && <p className="mt-0.5 text-xs text-muted">{item.note}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
