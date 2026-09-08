import { Icon } from '@/components/ui/Icon';
import { formatMinutes } from './ModuleShell';
import { getExercises, usesDatabase } from '@/lib/content';
import type { CourseModule } from '@/lib/types';

/**
 * "What you'll need" — a compact strip on each module's first page, generated
 * entirely from module.json so it can never drift from the content.
 */
export function ModuleNeeds({ mod }: { mod: CourseModule }) {
  const exercises = getExercises(mod.id);
  const notebooks = mod.notebooks.length;
  const streamlit = mod.streamlitApps.length;
  const database = usesDatabase(mod);

  const items: { icon: string; label: string; value: string }[] = [
    { icon: 'clock', label: 'Time', value: formatMinutes(mod.estimatedMinutes) },
    {
      icon: 'notebook',
      label: 'Notebooks',
      value: notebooks === 0 ? 'None — reading only' : `${notebooks} in Colab`,
    },
  ];

  if (exercises.length > 0) {
    items.push({ icon: 'pencil', label: 'Exercises', value: String(exercises.length) });
  }

  if (streamlit > 0) {
    items.push({
      icon: 'layers',
      label: 'Streamlit app',
      value: `${streamlit} to run locally`,
    });
  }

  if (database) {
    items.push({ icon: 'database', label: 'Database', value: 'PostgreSQL (or offline fallback)' });
  }

  if (mod.badge) {
    items.push({ icon: mod.badge.icon ?? 'award', label: 'Earns', value: mod.badge.label });
  }

  return (
    <aside
      className="not-prose my-6 rounded-md border border-border bg-surface px-4 py-3"
      aria-label="What you'll need for this module"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        What you&apos;ll need
      </p>

      <dl className="mt-2.5 flex flex-wrap gap-x-6 gap-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2">
            <span className="mt-0.5 accent-text">
              <Icon name={item.icon} size={15} />
            </span>
            <div>
              <dt className="text-[0.7rem] font-medium uppercase tracking-wide text-muted">
                {item.label}
              </dt>
              <dd className="text-sm font-medium text-ink">{item.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {(streamlit > 0 || database) && (
        <p className="mt-3 border-t border-border pt-2.5 text-xs text-muted">
          {streamlit > 0 &&
            'Streamlit apps are downloaded and run on your own machine — never embedded here. '}
          {database &&
            'No setup required: the notebooks build an identical local database from the course CSVs if no connection string is set.'}
        </p>
      )}
    </aside>
  );
}
