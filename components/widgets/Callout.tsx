import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';

export type CalloutType = 'info' | 'warn' | 'danger' | 'success' | 'note';

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children?: ReactNode;
}

const VARIANTS: Record<
  CalloutType,
  { icon: IconName; label: string; wrap: string; iconWrap: string }
> = {
  info: {
    icon: 'info',
    label: 'Note',
    wrap: 'border-info/30 bg-info/[0.06]',
    iconWrap: 'bg-info/12 text-info',
  },
  note: {
    icon: 'info',
    label: 'Note',
    wrap: 'border-border bg-surface',
    iconWrap: 'bg-surface-alt text-muted',
  },
  success: {
    icon: 'check-circle',
    label: 'Good',
    wrap: 'border-success/30 bg-success/[0.06]',
    iconWrap: 'bg-success/12 text-success',
  },
  warn: {
    icon: 'alert-triangle',
    label: 'Watch out',
    wrap: 'border-warn/35 bg-warn/[0.07]',
    iconWrap: 'bg-warn/12 text-warn',
  },
  danger: {
    icon: 'alert',
    label: 'Danger',
    wrap: 'border-danger/35 bg-danger/[0.06]',
    iconWrap: 'bg-danger/12 text-danger',
  },
};

export function Callout({ type = 'info', title, children }: CalloutProps) {
  const v = VARIANTS[type] ?? VARIANTS.info;

  return (
    <aside className={`widget flex gap-3 rounded-md border-l-4 p-4 ${v.wrap}`} role="note">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${v.iconWrap}`}
      >
        <Icon name={v.icon} size={16} />
      </span>
      <div className="min-w-0 flex-1 text-sm [&>*+*]:mt-2 [&_p]:m-0">
        {title && <p className="!mb-1 font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </aside>
  );
}
