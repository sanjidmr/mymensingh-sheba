import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * URL-driven pagination.
 *
 * The current query string is preserved so that searching, filtering and
 * sorting survive a page change — the single most common way a control-room
 * pagination control loses the admin's place.
 *
 * This is a Server Component on purpose: plain links are prefetched, work
 * without JavaScript, and can be opened in a new tab.
 */
export function TablePager({
  page,
  pageSize,
  total,
  searchParams,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  /** The page's current searchParams, so links can rebuild the query. */
  searchParams?: Record<string, string | string[] | undefined>;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const hrefFor = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (key === 'page') continue;
      const v = Array.isArray(value) ? value[0] : value;
      if (v) params.set(key, v);
    }
    if (targetPage > 1) params.set('page', String(targetPage));
    else params.delete('page');
    const qs = params.toString();
    return qs ? `?${qs}` : '?';
  };

  // A short window around the current page keeps the control from turning into
  // 40 links on a large queue.
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, Math.max(page + 2, 5));
  const pages: number[] = [];
  for (let p = windowStart; p <= windowEnd; p += 1) pages.push(p);

  const linkBase =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-semibold transition-colors';

  return (
    <nav
      aria-label="পেজিনেশন"
      className={cn('mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <p className="text-xs text-ink-500">
        <span className="tabular-nums">{first}</span>–<span className="tabular-nums">{last}</span> এর মধ্যে{' '}
        <span className="font-semibold tabular-nums">{total}</span> টি রেকর্ড
      </p>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={cn(linkBase, 'border-mist-200 bg-white text-ink-700 hover:bg-mist-50')}>
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="ml-1">আগের</span>
            </Link>
          ) : (
            <span className={cn(linkBase, 'cursor-not-allowed border-mist-100 bg-mist-50 text-ink-300')} aria-disabled="true">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="ml-1">আগের</span>
            </span>
          )}

          {windowStart > 1 && (
            <>
              <Link href={hrefFor(1)} className={cn(linkBase, 'border-mist-200 bg-white text-ink-700 hover:bg-mist-50')}>১</Link>
              <span className="px-0.5 text-xs text-ink-300">…</span>
            </>
          )}

          {pages.map((p) => (
            <Link
              key={p}
              href={hrefFor(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                linkBase,
                p === page
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-mist-200 bg-white text-ink-700 hover:bg-mist-50'
              )}
            >
              {p}
            </Link>
          ))}

          {windowEnd < totalPages && (
            <>
              <span className="px-0.5 text-xs text-ink-300">…</span>
              <Link href={hrefFor(totalPages)} className={cn(linkBase, 'border-mist-200 bg-white text-ink-700 hover:bg-mist-50')}>
                {totalPages}
              </Link>
            </>
          )}

          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} className={cn(linkBase, 'border-mist-200 bg-white text-ink-700 hover:bg-mist-50')}>
              <span className="mr-1">পরের</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          ) : (
            <span className={cn(linkBase, 'cursor-not-allowed border-mist-100 bg-mist-50 text-ink-300')} aria-disabled="true">
              <span className="mr-1">পরের</span>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
        </div>
      )}
    </nav>
  );
}