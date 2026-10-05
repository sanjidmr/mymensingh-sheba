'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import FilterSheet from './FilterSheet';
import type { FilterGroup, FilterState } from '@/lib/directory-filters';
import { countActiveFilters, labelFor } from '@/lib/directory-filters';

/**
 * Which wording to use for the filter control. Bangla users read "বেছে নিন"
 * as the neutral act of choosing; "বাছাই করুন" is an imperative that reads
 * heavier. Marketplace pages that filter down an inventory (To-Let, jobs) use
 * "বাছাই করুন" to match the sense of narrowing, and directory pages use the
 * softer "বেছে নিন". Both are deliberate; neither is an oversight.
 */
export type FilterLabelTone = 'choose' | 'narrow';

const FILTER_LABEL: Record<FilterLabelTone, string> = {
  choose: 'বেছে নিন',
  narrow: 'বাছাই করুন',
};

export interface DirectorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  filterGroups: FilterGroup[];
  filterState: FilterState;
  onFilterStateChange: (next: FilterState) => void;
  /** Total after search + filters. */
  resultCount: number;
  /** Noun for the count, e.g. "বিজ্ঞাপন", "প্রোফাইল", "বাস". */
  resultNoun?: string;
  tone?: FilterLabelTone;
  sortOptions?: { id: string; labelBn: string }[];
  currentSort?: string;
  onSortChange?: (id: string) => void;
}

/**
 * The search + filter control shared by every directory page.
 *
 * On a phone the search input is full width and the filter button sits below
 * it at the same width, so both are comfortably tappable one-handed. From
 * `sm` they share a single row. The result count and sort live on the same
 * card, which keeps the whole control area to one block of vertical space
 * between the page header and the results.
 */
export default function DirectorySearchBar({
  value,
  onChange,
  placeholder,
  filterGroups,
  filterState,
  onFilterStateChange,
  resultCount,
  resultNoun = 'ফলাফল',
  tone = 'choose',
  sortOptions,
  currentSort = 'newest',
  onSortChange,
}: DirectorySearchBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<FilterState>(filterState);

  const activeCount = countActiveFilters(filterGroups, filterState);
  const filterLabel = FILTER_LABEL[tone];

  // Chips for the facets the user has actually chosen, so the current state
  // is always visible without reopening the sheet.
  const chips = filterGroups
    .map((group) => ({ group, label: labelFor(filterGroups, filterState, group.id) }))
    .filter((entry): entry is { group: FilterGroup; label: string } => Boolean(entry.label));

  const openSheet = () => {
    setDraft(filterState);
    setSheetOpen(true);
  };

  const removeChip = (group: FilterGroup) => {
    const next = { ...filterState, [group.id]: group.type === 'multi' ? [] : undefined };
    onFilterStateChange(next);
  };

  return (
    <div className="rounded-xl border border-brand-100 bg-white p-2.5 shadow-xs sm:p-3">
      {/* Search row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500"
            aria-hidden="true"
          />
          <input
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="min-h-[46px] w-full rounded-lg border border-brand-100 bg-mist-50 pl-9 pr-9 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="খুঁজে দেখা মুছুন"
              className={`absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-700 ${LIGHT_FOCUS}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={openSheet}
          aria-haspopup="dialog"
          className={`inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
          {filterLabel}
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1 text-[11px] font-extrabold text-brand-950">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Count + sort */}
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-brand-100/80 pt-2">
        <p className="text-xs text-ink-500">
          মোট <strong className="text-ink-800">{resultCount}</strong> {resultNoun}
        </p>

        {sortOptions && sortOptions.length > 0 && onSortChange && (
          <label className="flex items-center gap-1.5 text-xs text-ink-500">
            <span className="sr-only sm:not-sr-only">সাজান</span>
            <select
              value={currentSort}
              onChange={(e) => onSortChange(e.target.value)}
              className={`min-h-10 rounded-md border border-brand-100 bg-mist-50 px-2 text-xs font-medium text-ink-800 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-500 ${LIGHT_FOCUS}`}
            >
              {sortOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.labelBn}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {chips.map(({ group, label }) => (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => removeChip(group)}
                className={`inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-800 transition-colors hover:border-brand-300 ${LIGHT_FOCUS}`}
              >
                <span className="max-w-[180px] truncate">{label}</span>
                <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="sr-only">— {group.labelBn} ফিল্টার সরান</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => onFilterStateChange({})}
              className={`px-1.5 py-1 text-[11px] font-bold text-ink-500 underline underline-offset-2 transition-colors hover:text-brand-800 ${LIGHT_FOCUS}`}
            >
              সব মুছুন
            </button>
          </li>
        </ul>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        groups={filterGroups}
        draft={draft}
        onDraftChange={setDraft}
        onApply={(next) => {
          onFilterStateChange(next);
          setSheetOpen(false);
        }}
        onReset={() => {
          onFilterStateChange({});
          setSheetOpen(false);
        }}
        resultCount={resultCount}
        resultNoun={resultNoun}
        applyLabel={filterLabel}
      />
    </div>
  );
}
