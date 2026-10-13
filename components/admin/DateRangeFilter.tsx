'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const change = (key: 'from' | 'to', value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const otherKey = key === 'from' ? 'to' : 'from';
    const otherValue = params.get(otherKey);
    params.delete('page');
    if (value) params.set(key, value);
    else params.delete(key);

    if (value && otherValue && (key === 'from' ? value > otherValue : value < otherValue)) {
      params.delete(otherKey);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="grid min-w-0 grid-cols-2 gap-2">
      <label className="min-w-0">
        <span className="mb-1 block text-[11px] font-semibold text-admin-muted">তারিখ থেকে</span>
        <input
          type="date"
          value={searchParams.get('from') ?? ''}
          onChange={(event) => change('from', event.target.value)}
          className="h-11 w-full min-w-0 rounded-md border border-admin-border bg-white px-2 text-xs text-admin-text"
        />
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-[11px] font-semibold text-admin-muted">তারিখ পর্যন্ত</span>
        <input
          type="date"
          value={searchParams.get('to') ?? ''}
          onChange={(event) => change('to', event.target.value)}
          className="h-11 w-full min-w-0 rounded-md border border-admin-border bg-white px-2 text-xs text-admin-text"
        />
      </label>
    </div>
  );
}
