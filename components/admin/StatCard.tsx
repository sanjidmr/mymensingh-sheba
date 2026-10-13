import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { StatusTone } from '@/lib/admin/format';

const TONE_PILL: Record<StatusTone, string> = {
  success: 'bg-status-approved-bg text-status-approved border-status-success/20',
  warning: 'bg-status-pending-bg text-status-pending border-status-warning/20',
  danger: 'bg-status-rejected-bg text-status-rejected border-status-danger/20',
  info: 'bg-status-info-bg text-status-info border-status-info/20',
  neutral: 'bg-status-disabled-bg text-status-disabled border-admin-border',
  accent: 'bg-admin-navy text-white border-admin-navy',
};

/**
 * A status pill.
 *
 * The tone is always supplied from a known vocabulary (`lookupStatus`) rather
 * than guessed from the raw string, so "approved" is never rendered in the
 * colour of "pending" because the CSS happened to match.
 */
export function StatusPill({
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
        'inline-flex max-w-full items-center truncate rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight',
        TONE_PILL[tone],
        className
      )}
    >
      {label}
    </span>
  );
}

/** Small neutral tag for slugs, kinds and other non-status metadata. */
export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-md bg-mist-100 px-2 py-0.5 text-[11px] font-medium text-ink-600',
        className
      )}
    >
      {children}
    </span>
  );
}

export function FeaturedPill() {
  return (
    <span className="inline-flex items-center rounded-md border border-accent-300 bg-accent-100 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
      ফিচার্ড
    </span>
  );
}

/**
 * A dashboard counter.
 *
 * Deliberately restrained: a flat surface, a bronze hairline, one accent for
 * the number. No gradients, no glow, no oversized rounded cards — a control
 * room reads faster when the only thing competing for attention is the figure.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: 'neutral' | 'attention' | 'alert' | 'good';
}) {
  const valueTone = {
    neutral: 'text-ink-900',
    attention: 'text-accent-600',
    alert: 'text-rose-600',
    good: 'text-status-success',
  }[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />}
      </div>
      <p className={cn('mt-2 text-2xl font-bold leading-none tabular-nums', valueTone)}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs leading-snug text-ink-500">{hint}</p>}
    </>
  );

  const className =
    'block rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card transition-colors';

  if (href) {
    return (
      <Link
        href={href}
        className={cn(className, 'hover:border-admin-navy/30 hover:bg-admin-page')}
      >
        {body}
        <span className="sr-only">— খুলুন</span>
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

/** Responsive stat grid. Two columns on the narrowest phones, never one. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}