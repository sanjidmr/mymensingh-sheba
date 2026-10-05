import React from 'react';
import { AlertCircle, Inbox, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The three states every async screen needs.
 *
 * The previous admin pages each hand-rolled these, and three of them declared
 * an `error` state that was never rendered — a failed fetch looked exactly
 * like an empty queue. Having one implementation means an error always shows.
 */

export function AdminLoading({
  label = 'তথ্য লোড হচ্ছে…',
  className,
  rows = 4,
}: {
  label?: string;
  className?: string;
  /** Number of skeleton rows; keeps the layout from jumping when data lands. */
  rows?: number;
}) {
  return (
    <div className={cn('rounded-xl border border-mist-200 bg-white p-4', className)}>
      <div className="mb-4 flex items-center gap-2 text-sm text-ink-500">
        <Loader2 className="h-4 w-4 animate-spin text-brand-700" aria-hidden="true" />
        <span role="status">{label}</span>
      </div>
      <div className="space-y-2" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-mist-100" />
            <div className="flex-1 space-y-1.5 py-1">
              <div className="h-3 w-1/3 animate-pulse rounded bg-mist-100" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-mist-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminEmpty({
  title = 'কিছু পাওয়া যায়নি',
  description,
  icon,
  action,
  className,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-mist-200 bg-white px-5 py-10 text-center',
        className
      )}
    >
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-mist-100 text-ink-300">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden="true" />}
      </span>
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-500">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * An error the admin can actually act on: what failed, and a retry that
 * re-runs the server render. Never a silent empty list.
 */
export function AdminError({
  title = 'তথ্য লোড করা যায়নি',
  message,
  className,
}: {
  title?: string;
  message?: string | null;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border border-rose-200 bg-rose-50 p-4',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rose-900">{title}</p>
          {message && (
            <p className="mt-1 text-xs leading-relaxed text-rose-800 break-words">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Retry control. A plain link back to the same URL re-runs the Server
 * Component render, which is the correct "try again" for a server-rendered
 * screen — no client cache is involved.
 */
export function RetryLink({ label = 'আবার চেষ্টা করুন', className }: { label?: string; className?: string }) {
  return (
    <a
      href=""
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50',
        className
      )}
    >
      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </a>
  );
}

/** Inline banner for a non-fatal problem inside an otherwise working screen. */
export function AdminNotice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: 'border-sky-200 bg-sky-50 text-sky-900',
    warning: 'border-accent-300 bg-accent-100 text-accent-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-900',
    success: 'border-brand-200 bg-brand-50 text-brand-800',
  } as const;

  return (
    <div className={cn('rounded-xl border p-3 text-xs leading-relaxed', tones[tone], className)}>
      {title && <p className="font-bold">{title}</p>}
      <div className={cn(title && 'mt-1')}>{children}</div>
    </div>
  );
}