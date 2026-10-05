'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Debounced search box that writes to the URL.
 *
 * Debounced rather than submitted on Enter because the admin queues are
 * server-rendered: a keystroke-by-keystroke request would fire a database query
 * on every character. The URL is the source of truth, so a search survives a
 * refresh, is shareable, and composes with the filters and pagination.
 */
export function AdminSearch({
  placeholder = 'খুঁজুন…',
  param = 'q',
  className,
  autoFocus = false,
}: {
  placeholder?: string;
  /** Query-string key. */
  param?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get(param) ?? '';
  const [value, setValue] = useState(initial);
  const timer = useRef<number | null>(null);

  // If the URL changes from elsewhere (a filter reset, a back navigation), the
  // box has to follow or it will show a query that is no longer applied.
  useEffect(() => {
    setValue(searchParams.get(param) ?? '');
  }, [searchParams, param]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    []
  );

  const commit = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = next.trim();
    if (trimmed) params.set(param, trimmed);
    else params.delete(param);
    // A new search starts from the first page: page 5 of the old result set is
    // meaningless against a different query.
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={cn('relative min-w-0 flex-1 sm:max-w-xs', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          setValue(e.target.value);
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => commit(e.target.value), 350);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (timer.current) window.clearTimeout(timer.current);
            commit(value);
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 w-full rounded-lg border border-mist-200 bg-white pl-9 pr-9 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue('');
            commit('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-400 hover:bg-mist-100 hover:text-ink-700"
          aria-label="অনুসন্ধান মুছুন"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/**
 * "Clear all filters" — visible only when a filter is actually applied, so it
 * never appears as a dead control on an unfiltered screen.
 */
export function ClearFilters({ searchParams }: { searchParams: URLSearchParams }) {
  const router = useRouter();
  const FILTER_KEYS = ['q', 'status', 'kind', 'category', 'service', 'area', 'from', 'to', 'sort'];
  const hasFilter = FILTER_KEYS.some((k) => searchParams.get(k));
  if (!hasFilter) return null;

  return (
    <button
      type="button"
      onClick={() => router.push('?')}
      className="h-11 shrink-0 rounded-lg border border-mist-200 bg-white px-3 text-xs font-semibold text-ink-600 hover:bg-mist-50"
    >
      ফিল্টার মুছুন
    </button>
  );
}