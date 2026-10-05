import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Screen title block.
 *
 * Every admin screen answers the same three questions an owner asks in that
 * order — what am I looking at, what can I do here, what am I looking at *now*
 * — so the structure is fixed rather than re-invented per page.
 */
export function PageHeader({
  title,
  description,
  count,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  /** Optional live total, e.g. "মোট ১২৪". */
  count?: number | string;
  actions?: React.ReactNode;
  breadcrumb?: { href: string; label: string };
}) {
  return (
    <div className="mb-5">
      {breadcrumb && (
        <a
          href={breadcrumb.href}
          className="mb-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
        >
          ← {breadcrumb.label}
        </a>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-tight text-ink-900 sm:text-2xl">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">{description}</p>
          )}
          {count !== undefined && (
            <p className="mt-1.5 text-xs font-medium text-ink-400">{count}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** A titled block, used to group fields or sections inside a screen. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn('rounded-xl border border-mist-200 bg-white', className)}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-mist-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-ink-900">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn('px-4 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Read-only label/value pair used across the detail screens. */
export function DetailField({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink-800">{children}</dd>
    </div>
  );
}