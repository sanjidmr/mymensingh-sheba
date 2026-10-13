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
    <header className="mb-6 sm:mb-7">
      {breadcrumb && (
        <a
          href={breadcrumb.href}
          className="mb-2 inline-flex min-h-8 items-center text-xs font-semibold text-admin-muted hover:text-admin-navy hover:underline"
        >
          ← {breadcrumb.label}
        </a>
      )}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-xl font-bold leading-tight tracking-tight text-admin-text sm:text-2xl">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl break-words text-sm leading-relaxed text-admin-muted">{description}</p>
          )}
          {count !== undefined && (
            <p className="mt-1.5 text-xs font-medium text-admin-muted">{count}</p>
          )}
        </div>
        {actions && <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
      </div>
    </header>
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
      className={cn('rounded-admin-card border border-admin-border bg-white shadow-admin-card', className)}
    >
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-admin-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-admin-text">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-admin-muted">{description}</p>
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
      <dt className="text-[11px] font-bold uppercase tracking-wide text-admin-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-admin-text">{children}</dd>
    </div>
  );
}