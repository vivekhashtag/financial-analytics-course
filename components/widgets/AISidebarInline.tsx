import { getModule } from '@/lib/content';
import { Icon } from '@/components/ui/Icon';
import { CopyPrompt } from './CopyPrompt';
import { MissingWidget } from './MissingWidget';

/**
 * The green/red AI sidebar from a module's `aiSidebar` field.
 * MDX calls it `<AISidebarInline module="02-python-foundations" />`.
 */
export function AISidebarInline({
  module: moduleProp,
  moduleId,
}: {
  module?: string;
  moduleId?: string;
}) {
  const id = moduleProp ?? moduleId ?? '';
  const mod = getModule(id);
  const sidebar = mod?.aiSidebar;

  if (!sidebar || (!sidebar.green?.length && !sidebar.red?.length)) {
    return (
      <MissingWidget
        name="AISidebarInline"
        detail={`Module "${id}" has no aiSidebar entries in module.json`}
      />
    );
  }

  return (
    <section className="widget not-prose grid gap-4 lg:grid-cols-2">
      {sidebar.green && sidebar.green.length > 0 && (
        <div className="rounded-lg border border-success/30 bg-success/[0.04] p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-success">
            <Icon name="check-circle" size={16} />
            Green list — ask AI for this
          </h4>
          <ul className="mt-3 space-y-3">
            {sidebar.green.map((item, i) => (
              <li key={i} className="rounded-md border border-success/20 bg-bg p-3">
                <p className="text-sm font-semibold text-ink">{item.situation}</p>
                <CopyPrompt prompt={item.prompt} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {sidebar.red && sidebar.red.length > 0 && (
        <div className="rounded-lg border border-danger/30 bg-danger/[0.04] p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-danger">
            <Icon name="alert" size={16} />
            Red list — never trust AI with this
          </h4>
          <ul className="mt-3 space-y-3">
            {sidebar.red.map((item, i) => (
              <li key={i} className="rounded-md border border-danger/20 bg-bg p-3">
                <p className="text-sm font-semibold text-ink">{item.danger}</p>
                <p className="mt-1 text-sm text-muted">{item.why}</p>
                <p className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger">
                  <Icon name="shield" size={14} className="mt-0.5 shrink-0" />
                  {item.rule}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
