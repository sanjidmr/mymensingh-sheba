'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RotateCcw, Search, ChevronDown } from 'lucide-react';
import { LIGHT_FOCUS, DARK_FOCUS } from '@/components/about/AboutSectionBits';
import type { FilterGroup, FilterOption, FilterState } from '@/lib/directory-filters';
import { countActiveFilters, getSelected, optionLabel } from '@/lib/directory-filters';

export interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  /** Working copy — edits here are not applied until the user confirms. */
  draft: FilterState;
  onDraftChange: (next: FilterState) => void;
  onApply: (next: FilterState) => void;
  onReset: () => void;
  resultCount: number;
  resultNoun: string;
  applyLabel: string;
}

/**
 * FilterSheet — the single filter surface used by every directory page.
 *
 * Rendered into `document.body` via a portal so it is never clipped by a
 * page's `overflow-x-clip` container, and it owns body scroll lock plus
 * Escape-to-close, matching the behaviour of the other modal surfaces on the
 * site.
 *
 * Every facet is ONE button rather than a printed list of its options. A page
 * with 48 areas (or a provider list that grows with the database) would
 * otherwise bury the rest of the filters under names, and on a phone a wall of
 * chips is unusable. Tapping the button expands a search field over that
 * facet's options in place — a "এলাকা নির্বাচন করুন" / "সুবিধা নির্বাচন করুন"
 * control that only then shows what it can offer.
 *
 * The picker expands inline rather than as a nested modal on purpose: this
 * panel animates with a `transform`, and a transformed ancestor becomes the
 * containing block for a `position: fixed` overlay, so a nested modal would be
 * anchored to the sheet instead of the viewport.
 */
export default function FilterSheet({
  open,
  onClose,
  groups,
  draft,
  onDraftChange,
  onApply,
  onReset,
  resultCount,
  resultNoun,
  applyLabel,
}: FilterSheetProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  /** Which facet's picker is expanded, and the search text inside it. */
  const [openFacet, setOpenFacet] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const closeSheet = useCallback(() => {
    setOpenFacet(null);
    setQuery('');
    onClose();
  }, [onClose]);

  // A portal can only be created in the browser, but that is not enough on its
  // own: a `typeof document === 'undefined'` guard makes the *server* render
  // null while the first *client* render emits the portal, so React sees a
  // mismatch and throws away the tree. `mounted` keeps the very first client
  // render identical to the server's null, and the portal appears on the
  // following paint.
  //
  // `useSyncExternalStore` expresses this directly instead of parking a
  // `setMounted(true)` in an effect: the server snapshot is `false` and the
  // client snapshot is `true`, which is precisely "have we hydrated". The
  // subscription never fires — hydration itself is the change — so there is no
  // state to synchronously set and no cascading render before first paint.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (openFacet) {
        setOpenFacet(null);
        return;
      }
      closeSheet();
    };
    document.addEventListener('keydown', onKey);
    const raf = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
    };
  }, [open, closeSheet, openFacet]);

  if (!mounted) return null;

  const draftCount = countActiveFilters(groups, draft);

  const toggle = (group: FilterGroup, optionId: string) => {
    if (group.type === 'multi') {
      const current = getSelected(group, draft);
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      onDraftChange({ ...draft, [group.id]: next });
      return;
    }
    // Single-select: tapping the active option clears it.
    const current = getSelected(group, draft);
    onDraftChange({ ...draft, [group.id]: current[0] === optionId ? undefined : optionId });
  };

  const clearGroup = (group: FilterGroup) => {
    onDraftChange({
      ...draft,
      [group.id]: group.type === 'multi' ? [] : undefined,
    });
  };

  const openPicker = (group: FilterGroup) => {
    setOpenFacet(group.id);
    setQuery('');
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] flex items-end justify-center sm:items-center ${
        open ? '' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        onClick={closeSheet}
        className={`absolute inset-0 bg-brand-950/45 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="ফিল্টার"
        tabIndex={-1}
        className={`relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 sm:max-w-lg sm:rounded-2xl ${
          open ? 'translate-y-0' : 'translate-y-full sm:translate-y-0 sm:scale-95 sm:opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-100 px-4 py-3">
          <h2 className="text-base font-extrabold text-ink-900">ফিল্টার</h2>
          <button
            type="button"
            onClick={closeSheet}
            aria-label="ফিল্টার বন্ধ করুন"
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-mist-50 hover:text-ink-900 ${LIGHT_FOCUS}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Facets */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {groups.map((group) => {
            const selected = getSelected(group, draft).filter((id) => id !== 'all');
            const isPickerOpen = openFacet === group.id;
            const buttonLabel = selected.length > 0
              ? 'পরিবর্তন করুন'
              : (group.pickerLabelBn ?? `${group.labelBn} নির্বাচন করুন`);

            return (
              <fieldset key={group.id} className="border-b border-brand-100/80 py-3 first:pt-0 last:border-0">
                <legend className="mb-1.5 text-[13px] font-extrabold text-ink-800">
                  {group.labelBn}
                </legend>

                {/* What is already chosen stays visible and removable, so the
                    sheet never hides a filter the reader set a moment ago. */}
                {selected.length > 0 && (
                  <div className="mb-1.5 flex flex-wrap gap-1.5">
                    {selected.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(group, id)}
                        className={`inline-flex max-w-full items-center gap-1 rounded-md border border-brand-300 bg-brand-50 py-1 pl-2 pr-1 text-[11px] font-semibold text-brand-800 transition-colors hover:border-brand-400 hover:bg-brand-100 ${LIGHT_FOCUS}`}
                      >
                        <span className="max-w-[170px] truncate">{optionLabel(group, id)}</span>
                        <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="sr-only">— {group.labelBn} ফিল্টার সরান</span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => openPicker(group)}
                  aria-expanded={isPickerOpen}
                  className={`inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-[13px] font-semibold transition-colors ${LIGHT_FOCUS} ${
                    isPickerOpen
                      ? 'border-brand-600 bg-brand-50 text-brand-800'
                      : selected.length > 0
                      ? 'border-brand-200 bg-brand-50/60 text-brand-800 hover:bg-brand-50'
                      : 'border-brand-200 bg-white text-ink-600 hover:border-brand-300 hover:bg-mist-50'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{buttonLabel}</span>
                  {selected.length > 0 && (
                    <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-400 px-1 text-[11px] font-extrabold text-brand-950">
                      {selected.length}
                    </span>
                  )}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-ink-400 transition-transform duration-150 ${
                      isPickerOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isPickerOpen && (
                  <FacetPickerList
                    group={group}
                    selected={getSelected(group, draft)}
                    query={query}
                    onQueryChange={setQuery}
                    onToggle={(optionId) => toggle(group, optionId)}
                    onClear={() => clearGroup(group)}
                  />
                )}
              </fieldset>
            );
          })}
        </div>

        {/* Sticky actions */}
        <div className="flex shrink-0 items-center gap-2 border-t border-brand-100 bg-mist-50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onDraftChange({})}
            disabled={draftCount === 0}
            className={`inline-flex min-h-[46px] shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3.5 text-[13px] font-bold text-ink-700 transition-colors hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-40 ${LIGHT_FOCUS}`}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            মুছুন
          </button>

          <button
            type="button"
            onClick={() => onApply(draft)}
            className={`inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${DARK_FOCUS}`}
          >
            {applyLabel}
            {draftCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1 text-[11px] font-extrabold text-brand-950">
                {draftCount}
              </span>
            )}
            <span className="text-[11px] font-semibold text-brand-100/80">
              {resultCount} {resultNoun}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * The expanded half of one facet: a search field over that facet's options.
 *
 * Search runs over the visible label, the option id and any `searchTerms` the
 * facet declared (an area's English name and transliterations, for example),
 * so typing "charpara" finds "চরপাড়া" without the caller duplicating a search
 * index here.
 */
function FacetPickerList({
  group,
  selected,
  query,
  onQueryChange,
  onToggle,
  onClear,
}: {
  group: FilterGroup;
  selected: string[];
  query: string;
  onQueryChange: (value: string) => void;
  onToggle: (optionId: string) => void;
  onClear: () => void;
}) {
  const matches = useMemo(
    () => group.options.filter((option) => optionMatches(option, query)),
    [group, query]
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="নাম লিখে খুঁজুন…"
          aria-label={`${group.labelBn} নির্বাচন করুন`}
          className={`min-h-[44px] w-full rounded-lg border border-brand-200 bg-white pl-9 pr-8 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none ${LIGHT_FOCUS}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="খুঁজা মুছুন"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 hover:bg-mist-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-brand-100">
        {group.type === 'multi' && selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="w-full px-3 py-2.5 text-left text-[12.5px] font-bold text-ink-400 transition-colors hover:bg-mist-50 hover:text-ink-700"
          >
            সব মুছুন
          </button>
        )}

        {matches.length === 0 ? (
          <p className="px-3 py-3 text-[12px] text-ink-500">
            কোনো {group.labelBn} পাওয়া যায়নি। নাম একটু ভিন্ন লিখে দেখুন।
          </p>
        ) : (
          matches.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role={group.type === 'multi' ? 'checkbox' : 'radio'}
                aria-checked={isSelected}
                onClick={() => onToggle(option.id)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] font-semibold transition-colors ${
                  isSelected ? 'bg-brand-50 text-brand-800' : 'text-ink-700 hover:bg-mist-50'
                }`}
              >
                <span className="truncate">{option.labelBn}</span>
                {isSelected && (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-brand-600"
                    strokeWidth={3}
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/**
 * Whether an option matches the picker's search text. An empty query matches
 * everything, which is what shows the full facet before the reader types.
 */
function optionMatches(option: FilterOption, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [option.labelBn, option.id, ...(option.searchTerms ?? [])].map((term) =>
    term.toLowerCase()
  );
  return haystacks.some((term) => term.includes(q));
}

/** Re-exported so pages can show a chip label without importing two modules. */
export { optionLabel };
