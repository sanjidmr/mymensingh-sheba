'use client';

import { useRouter } from 'next/navigation';
import { FilterSelect } from './PageSizeSelect';

/**
 * FilterSelect wired to the URL.
 *
 * Server Components cannot pass event handlers to client components, so the
 * admin list pages render this wrapper instead of FilterSelect directly. It
 * rebuilds the current query string with the chosen filter and navigates with
 * a full GET (which re-runs the Server Component render). `page` is dropped
 * because page 5 of an old result set is meaningless against a new filter.
 */
export function FilterNav({
  id,
  label,
  value,
  options,
  placeholder,
  param,
  searchParams,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  /** Query-string key this filter writes. */
  param: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  return (
    <FilterSelect
      id={id}
      label={label}
      value={value}
      options={options}
      placeholder={placeholder}
      onChange={(next) => {
        const params = new URLSearchParams();
        for (const [key, raw] of Object.entries(searchParams)) {
          if (key === 'page') continue;
          const v = Array.isArray(raw) ? raw[0] : raw;
          if (v) params.set(key, v);
        }
        if (next) params.set(param, next);
        else params.delete(param);
        router.push(`?${params.toString()}`);
      }}
    />
  );
}
