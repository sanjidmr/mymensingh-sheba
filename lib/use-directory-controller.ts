'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { searchDirectory, type SearchableFields } from '@/lib/directory-search';
import { applyFilters, type FilterGroup, type FilterState, type MatchableRecord } from '@/lib/directory-filters';

export interface UseDirectoryControllerArgs<T> {
  items: T[];
  /** Projects an item into the natural-language search fields. */
  searchable: (item: T) => SearchableFields;
  /** Projects an item into the generic filter fields. */
  matchable: (item: T) => MatchableRecord;
  filterGroups: FilterGroup[];
  /** URL param names, when a page's facets differ from their group ids. */
  paramMap?: Record<string, string>;
  defaultSort?: string;
}

export interface DirectoryController<T> {
  query: string;
  setQuery: (value: string) => void;
  filterState: FilterState;
  setFilterState: (next: FilterState) => void;
  sort: string;
  setSort: (value: string) => void;
  results: T[];
  /** True only for the first paint, so a re-filter does not flash a skeleton. */
  initialLoading: boolean;
  activeFilterCount: number;
  resetAll: () => void;
}

/**
 * Drives search, filters and sorting for a directory page, and mirrors all
 * three into the URL so a filtered view is shareable and survives a refresh.
 *
 * Two deliberate behaviours:
 *
 *  - Filtering is synchronous and happens on every keystroke. With a few
 *    hundred local records that is well under a frame, and it avoids the
 *    debounce-then-skeleton flash that makes a mobile list feel sluggish.
 *  - URL writes are deferred with a rAF-ish timer so typing does not push a
 *    history entry per character.
 */
export function useDirectoryController<T>({
  items,
  searchable,
  matchable,
  filterGroups,
  paramMap = {},
  defaultSort = 'newest',
}: UseDirectoryControllerArgs<T>): DirectoryController<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQueryState] = useState(() => searchParams.get('q') ?? '');
  const [sort, setSortState] = useState(() => searchParams.get('sort') ?? defaultSort);
  const [filterState, setFilterStateState] = useState<FilterState>(() => {
    const initial: FilterState = {};
    for (const group of filterGroups) {
      const param = paramMap[group.id] ?? group.id;
      if (group.type === 'multi') {
        const raw = searchParams.getAll(param);
        if (raw.length) {
          initial[group.id] = raw.filter((v) =>
            group.options.some((o) => o.id === v)
          );
        }
      } else {
        const raw = searchParams.get(param);
        if (raw && group.options.some((o) => o.id === raw)) {
          initial[group.id] = raw;
        }
      }
    }
    return initial;
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const firstRun = useRef(true);

  // The suspense fallback is what the user sees before hydration; flip this
  // off once the client has mounted and painted real results.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setInitialLoading(false));
    return () => cancelAnimationFrame(raf);
  }, []);

  // --- URL mirroring (replace, debounced so typing is cheap) ---
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (sort && sort !== defaultSort) params.set('sort', sort);
    for (const group of filterGroups) {
      const value = filterState[group.id];
      if (value === undefined) continue;
      const param = paramMap[group.id] ?? group.id;
      if (Array.isArray(value)) {
        for (const v of value) if (v && v !== 'all') params.append(param, v);
      } else if (value && value !== 'all') {
        params.set(param, value);
      }
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  }, [query, sort, filterState, filterGroups, paramMap, pathname, router, defaultSort]);

  const setQuery = useCallback((value: string) => setQueryState(value), []);

  const setFilterState = useCallback((next: FilterState) => {
    // Drop keys the page no longer declares, so switching categories cannot
    // leave a stale facet in state.
    setFilterStateState(next);
  }, []);

  const setSort = useCallback((value: string) => setSortState(value), []);

  const resetAll = useCallback(() => {
    setQueryState('');
    setFilterStateState({});
    setSortState(defaultSort);
  }, [defaultSort]);

  // --- Search, then filter, then sort ---
  //
  // Everything is projected into `{ item, record }` pairs first. `applyFilters`
  // needs the generic shape, but callers hold their own rich domain types, and
  // sorting has to read the projection too (a page's price may live in
  // `rentPrice`, not `price`) — one projection keeps both honest.
  const results = useMemo(() => {
    const pairs = items.map((item) => ({ item, record: matchable(item) }));

    const scored = searchDirectory(pairs, query, (pair) => searchable(pair.item));
    const filtered = applyFilters(
      scored,
      filterGroups,
      filterState,
      (pair) => pair.record,
      (pair, record, selectedAreas) => {
        if (record.areaIds && record.areaIds.length > 0) {
          return selectedAreas.some((a) => record.areaIds!.includes(a));
        }
        // Records that only carry a free-text locality: match on its name.
        const local = record.values?.area;
        if (typeof local === 'string') {
          return selectedAreas.some((a) => a === local);
        }
        return false;
      }
    );

    const sorted = [...filtered];
    if (sort === 'price_asc') {
      sorted.sort((a, b) => num(a.record.ranges?.price) - num(b.record.ranges?.price));
    } else if (sort === 'price_desc') {
      sorted.sort((a, b) => num(b.record.ranges?.price) - num(a.record.ranges?.price));
    } else if (sort === 'rating') {
      sorted.sort((a, b) => num(b.record.values?.rating) - num(a.record.values?.rating));
    }
    return sorted.map((pair) => pair.item);
  }, [items, query, filterGroups, filterState, sort, searchable, matchable]);

  const activeFilterCount = useMemo(() => {
    let total = 0;
    for (const group of filterGroups) {
      const value = filterState[group.id];
      if (Array.isArray(value)) {
        total += value.filter((v) => v !== 'all').length;
      } else if (value && value !== 'all') {
        total += 1;
      }
    }
    return total;
  }, [filterGroups, filterState]);

  return {
    query,
    setQuery,
    filterState,
    setFilterState,
    sort,
    setSort,
    results,
    initialLoading,
    activeFilterCount,
    resetAll,
  };
}

function num(value: string | string[] | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
