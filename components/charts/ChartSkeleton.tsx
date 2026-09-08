/**
 * Kept in its own module on purpose.
 *
 * ModuleChart needs only the skeleton for its dynamic-import fallback. If it
 * imported that from chartKit, the whole kit — controls, formatters,
 * tokens.json — would land in the eager route bundle for every module page,
 * including the eight that have no chart.
 */
export function ChartSkeleton({
  height = 260,
  label = 'Loading chart…',
}: {
  height?: number;
  label?: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-md border border-dashed border-border bg-surface/50 text-sm text-muted"
      style={{ height, minHeight: height }}
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
