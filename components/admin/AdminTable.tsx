import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminEmpty } from './States';

export interface AdminColumn<T> {
  /** Stable identity for React keys and mobile label lookup. */
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /**
   * The column a mobile card uses as its heading. Exactly one column per
   * table should set this — the title of the thing being managed.
   */
  mobilePrimary?: boolean;
  /** Extra class on the desktop `<th>`/`<td>`. Use for right-alignment. */
  className?: string;
  headerClassName?: string;
  /** Hide entirely below `sm`. Good for numeric/id columns a phone can't act on. */
  hideOnMobile?: boolean;
}

export interface AdminTableProps<T> {
  columns: AdminColumn<T>[];
  rows: T[];
  getKey: (row: T) => string;
  /** Where a row click navigates. Omit for non-navigable rows. */
  getHref?: (row: T) => string | undefined;
  caption?: string;
  empty?: React.ReactNode;
  /** Row highlight, e.g. unread messages. */
  isHighlighted?: (row: T) => boolean;
}

/**
 * The admin list primitive.
 *
 * One markup for two layouts rather than two components to keep in sync:
 *
 *  * `sm` and up — a real `<table>`. Semantics matter here: screen readers
 *    announce row/column position, which a pile of divs does not.
 *  * below `sm` — the same data as stacked cards. Each card leads with the
 *    primary column and then lists every other column as a label/value pair.
 *    This is the deliberate mobile design, not the desktop table squeezed:
 *    no horizontal scrolling, no tiny text, no controls below a 44px target.
 *
 * The only horizontal scroll in the whole console is inside an explicit
 * `AdminTableScroll` wrapper, for the rare wide numeric grid.
 */
export function AdminTable<T>({
  columns,
  rows,
  getKey,
  getHref,
  caption,
  empty,
  isHighlighted,
}: AdminTableProps<T>) {
  if (rows.length === 0) {
    return <>{empty ?? <AdminEmpty />}</>;
  }

  const primaryIndex = Math.max(
    columns.findIndex((c) => c.mobilePrimary),
    0
  );
  const secondary = columns.filter(
    (c, i) => i !== primaryIndex && !c.hideOnMobile
  );

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-mist-200 bg-white sm:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-mist-200 bg-mist-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-ink-400',
                    col.headerClassName,
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const href = getHref?.(row);
              const highlighted = isHighlighted?.(row);
              return (
                <tr
                  key={getKey(row)}
                  className={cn(
                    'border-b border-mist-100 last:border-0',
                    highlighted ? 'bg-accent-100/40' : 'bg-white'
                  )}
                >
                  {columns.map((col, i) => {
                    const isPrimary = i === primaryIndex;
                    // The primary cell is the row's link. Doing it here rather
                    // than with an `onClick` on <tr> keeps the whole component
                    // usable from a Server Component and keeps the target
                    // reachable by keyboard and screen reader.
                    const content = isPrimary && href ? (
                      <Link href={href} className="hover:underline">
                        {col.render(row)}
                      </Link>
                    ) : (
                      col.render(row)
                    );
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 align-middle text-ink-800',
                          col.className
                        )}
                      >
                        <span className={cn(isPrimary && 'font-semibold text-ink-900')}>
                          {content}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile cards ---------- */}
      <ul className="space-y-2 sm:hidden">
        {rows.map((row) => {
          const href = getHref?.(row);
          const highlighted = isHighlighted?.(row);
          return (
            <li key={getKey(row)}>
              <div
                className={cn(
                  'rounded-xl border bg-white',
                  highlighted ? 'border-accent-300' : 'border-mist-200'
                )}
              >
                <div className="flex items-start gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-snug text-ink-900">
                      {href ? (
                        <Link href={href}>{columns[primaryIndex].render(row)}</Link>
                      ) : (
                        columns[primaryIndex].render(row)
                      )}
                    </div>
                    {secondary.length > 0 && (
                      <dl className="mt-2 grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
                        {secondary.map((col) => {
                          const value = col.render(row);
                          if (value === null || value === undefined || value === false) return null;
                          return (
                            <div
                              key={col.key}
                              className="flex min-w-0 items-baseline justify-between gap-2"
                            >
                              <dt className="shrink-0 text-[11px] font-semibold text-ink-400">
                                {col.header}
                              </dt>
                              <dd className="min-w-0 truncate text-right text-xs text-ink-700">
                                {value}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}
                  </div>
                  {href && (
                    <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-ink-300" aria-hidden="true" />
                  )}
                </div>
                {href && (
                  <a
                    href={href}
                    className="flex min-h-11 items-center justify-center border-t border-mist-100 text-xs font-semibold text-brand-700 hover:bg-brand-50/50"
                  >
                    বিস্তারিত দেখুন
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * Opt-in horizontal scroll for genuinely wide grids (the analytics matrix).
 * Wrapped in its own component so "no horizontal page overflow" stays a rule
 * with exactly one, visible exception.
 */
export function AdminTableScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-mist-200 bg-white">
      {children}
    </div>
  );
}