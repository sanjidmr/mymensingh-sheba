'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Page-size selector.
 *
 * A client component because it submits on change. It rebuilds the current
 * query string minus `page` (so changing the size never leaves the admin
 * stranded on page 12 of a 3-page result) and navigates with a full GET, which
 * re-runs the Server Component render.
 */
export function PageSizeSelect({
  pageSize,
  searchParams,
}: {
  pageSize: number;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const router = useRouter();
  const options = [10, 25, 50, 100];
  const [value, setValue] = useState(String(pageSize));
  const firstRender = useRef(true);

  // Keep the control in sync if the URL changes from elsewhere (e.g. a link
  // that sets ?pageSize=50).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setValue(String(pageSize));
  }, [pageSize]);

  const handleChange = (next: string) => {
    setValue(next);
    const params = new URLSearchParams();
    for (const [key, raw] of Object.entries(searchParams ?? {})) {
      if (key === 'page' || key === 'pageSize') continue;
      const v = Array.isArray(raw) ? raw[0] : raw;
      if (v) params.set(key, v);
    }
    params.set('pageSize', next);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor="admin-page-size" className="text-xs text-ink-500">
        প্রতি পাতায়
      </label>
      <div className="relative">
        <select
          id="admin-page-size"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="h-9 appearance-none rounded-lg border border-mist-200 bg-white pl-2 pr-7 text-xs font-semibold text-ink-700"
        >
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/**
 * A single filter chip row for the top of a list screen.
 *
 * Rendered as a labelled `<select>` rather than a row of buttons: the admin
 * queues have 4–9 possible statuses, and a select keeps the whole filter set
 * visible without wrapping into three lines on a phone.
 */
export function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-none">
      <label htmlFor={id} className="shrink-0 text-xs text-ink-500">
        {label}
      </label>
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-9 w-full appearance-none rounded-lg border bg-white pl-2 pr-7 text-xs font-semibold sm:w-auto',
            value ? 'border-brand-300 text-brand-800' : 'border-mist-200 text-ink-700'
          )}
        >
          {placeholder && (
            <option value="">
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}