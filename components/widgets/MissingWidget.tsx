import { Icon } from '@/components/ui/Icon';

/**
 * A visible, labelled placeholder. Used two ways:
 *
 *  - a widget the brief defers to a later phase (`SourceTable`, `CrisisChart`, …)
 *  - a widget whose content reference does not resolve
 *
 * It renders rather than throws on purpose: one unbuilt widget must never take
 * a whole page of prose down with it.
 */
export function MissingWidget({
  name,
  detail,
  planned = false,
}: {
  name: string;
  detail?: string;
  planned?: boolean;
}) {
  return (
    <div
      className={`widget not-prose rounded-md border border-dashed p-4 ${
        planned ? 'border-border bg-surface' : 'border-warn/40 bg-warn/[0.05]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
            planned ? 'bg-surface-alt text-muted' : 'bg-warn/12 text-warn'
          }`}
        >
          <Icon name={planned ? 'layers' : 'alert-triangle'} size={16} />
        </span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-ink">
            <code className="font-mono text-[0.95em]">{`<${name} />`}</code>{' '}
            <span className="font-normal text-muted">
              {planned ? '— coming in a later phase' : '— could not render'}
            </span>
          </p>
          {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

/** Factory for the widgets the brief explicitly says to stub for now. */
export function plannedWidget(name: string, detail: string) {
  const Stub = () => <MissingWidget name={name} detail={detail} planned />;
  Stub.displayName = `Planned(${name})`;
  return Stub;
}
