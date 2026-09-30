'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RotateCcw } from 'lucide-react';
import { LIGHT_FOCUS, DARK_FOCUS } from '@/components/about/AboutSectionBits';
import type { FilterGroup, FilterState } from '@/lib/directory-filters';
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
 * site. Groups render as stacked rows on a phone and as a two-column grid from
 * `sm`, with a hard cap on group height so a long facet list scrolls inside
 * the sheet rather than pushing the apply button off-screen.
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

  // A portal can only be created in the browser, but that is not enough on its
  // own: a `typeof document === 'undefined'` guard makes the *server* render
  // null while the first *client* render emits the portal, so React sees a
  // mismatch and throws away the tree. `mounted` keeps the very first client
  // render identical to the server's null, and the portal appears on the
  // following paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes, and focus moves into the panel so keyboard users are not
  // left behind on the trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const raf = requestAnimationFrame(() => panelRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      cancelAnimationFrame(raf);
    };
  }, [open, onClose]);

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

  return createPortal(
    <div
      className={`fixed inset-0 z-[90] flex items-end justify-center sm:items-center ${
        open ? '' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
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
            onClick={onClose}
            aria-label="ফিল্টার বন্ধ করুন"
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-mist-50 hover:text-ink-900 ${LIGHT_FOCUS}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Facets */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          {groups.map((group) => {
            const selected = getSelected(group, draft);
            return (
              <fieldset key={group.id} className="border-b border-brand-100/80 py-3 first:pt-0 last:border-0">
                <legend className="mb-2 text-[13px] font-extrabold text-ink-800">
                  {group.labelBn}
                </legend>

                <div
                  className={
                    group.compact
                      ? 'flex flex-wrap gap-1.5'
                      : 'grid gap-1.5 sm:grid-cols-2 sm:gap-x-3'
                  }
                >
                  {group.options.map((option) => {
                    const isSelected = selected.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role={group.type === 'multi' ? 'checkbox' : 'radio'}
                        aria-checked={isSelected}
                        onClick={() => toggle(group, option.id)}
                        className={`flex min-h-[40px] w-full items-center gap-2 rounded-lg border px-2.5 text-left text-[13px] font-medium transition-colors ${
                          group.compact ? 'w-auto' : ''
                        } ${
                          isSelected
                            ? 'border-brand-600 bg-brand-50 text-brand-800 font-bold'
                            : 'border-brand-100 bg-white text-ink-600 hover:border-brand-200 hover:bg-mist-50'
                        } ${LIGHT_FOCUS}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
                            group.type === 'multi' ? 'rounded-[4px]' : 'rounded-full'
                          } ${
                            isSelected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-brand-200 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className="truncate">{option.labelBn}</span>
                      </button>
                    );
                  })}
                </div>
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

/** Re-exported so pages can show a chip label without importing two modules. */
export { optionLabel };
