import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { cn } from '@/lib/utils';

/**
 * Small presentation pieces shared by the customer dashboard and the service
 * profile manager. No data fetching and no hooks, so they stay easy to reuse.
 */

export type StatusTone = 'approved' | 'pending' | 'rejected' | 'neutral';

const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string }> = {
  approved: {
    badge: 'bg-emerald-50 text-emerald-800 ring-emerald-600/15',
    dot: 'bg-emerald-500',
  },
  pending: {
    badge: 'bg-amber-50 text-amber-800 ring-amber-600/15',
    dot: 'bg-amber-500',
  },
  rejected: {
    badge: 'bg-rose-50 text-rose-800 ring-rose-600/15',
    dot: 'bg-rose-500',
  },
  neutral: {
    badge: 'bg-slate-50 text-slate-700 ring-slate-500/15',
    dot: 'bg-slate-400',
  },
};

/** Map the database status vocabulary onto four visual tones. */
export function statusTone(status?: string | null): StatusTone {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'pending':
    case 'pending_approval':
    case 'reviewing':
      return 'pending';
    case 'rejected':
      return 'rejected';
    default:
      return 'neutral';
  }
}

export function StatusBadge({
  label,
  tone = 'neutral',
  className,
}: {
  label: string;
  tone?: StatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        TONE_CLASSES[tone].badge,
        className
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_CLASSES[tone].dot)} />
      <span className="break-words">{label}</span>
    </span>
  );
}

export function SectionCard({
  children,
  className,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-labelledby={labelledBy}
      className={cn(
        'rounded-xl border border-ink-900/[0.08] bg-white shadow-[0_1px_2px_rgba(16,24,20,0.03)]',
        className
      )}
    >
      {children}
    </section>
  );
}

export function SectionHeader({
  id,
  title,
  description,
  action,
}: {
  id?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4 sm:px-5 sm:pt-5">
      <div className="min-w-0">
        <h2 id={id} className="text-[13.5px] font-bold text-ink-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-center px-4 text-center', compact ? 'py-6' : 'py-8')}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-900/[0.06] bg-mist-50 text-ink-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-[13px] font-semibold text-ink-900">{title}</p>
      <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-ink-500">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Dark primary action — monochrome, so the green stays meaningful. */
export const PRIMARY_BUTTON = cn(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 text-[12.5px] font-semibold text-white transition-colors hover:bg-ink-800 disabled:pointer-events-none disabled:opacity-60',
  LIGHT_FOCUS
);

export const SECONDARY_BUTTON = cn(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink-900/10 bg-white px-4 text-[12.5px] font-semibold text-ink-800 transition-colors hover:border-ink-900/20 hover:bg-mist-50',
  LIGHT_FOCUS
);

export const TEXT_LINK = cn(
  'rounded text-[12px] font-semibold text-ink-500 underline-offset-4 transition-colors hover:text-ink-900 hover:underline',
  LIGHT_FOCUS
);
