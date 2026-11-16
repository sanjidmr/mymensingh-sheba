'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapPin, Search, X, Check, ChevronDown } from 'lucide-react';
import {
  MCC_AREA_SOURCE,
  type AreaSource,
  type MCCArea,
} from '@/lib/locations';
import { cn } from '@/lib/utils';

export interface LocationSelectorProps {
  selectedAreaId?: string;
  onSelectArea: (area: MCCArea | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  /**
   * Which area list to search. Defaults to the site-wide MCC list; To-Let
   * passes `TOLET_AREA_SOURCE` so its extra areas appear here and nowhere else.
   */
  source?: AreaSource;
}

export function LocationSelector({
  selectedAreaId,
  onSelectArea,
  label = 'এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)',
  placeholder = 'আপনার এলাকা নির্বাচন করুন',
  className,
  error,
  source = MCC_AREA_SOURCE,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen || !window.matchMedia('(max-width: 639px)').matches) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const popularAreas = useMemo(() => source.popular(), [source]);

  const selectedArea = useMemo(
    () => source.byId(selectedAreaId) ?? null,
    [source, selectedAreaId]
  );

  const filteredAreas = useMemo(
    () => source.search(searchQuery),
    [source, searchQuery]
  );

  const handleSelect = (area: MCCArea) => {
    onSelectArea(area);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectArea(null);
  };

  return (
    <div className={cn('relative w-full text-left', className)}>
      {label && (
        <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5 select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'w-full h-11 sm:h-12 px-3.5 rounded-xl bg-white border text-left flex items-center justify-between gap-2 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-700 select-none',
          error
            ? 'border-rose-300 bg-rose-50/20 text-rose-900'
            : isOpen
            ? 'border-emerald-700 ring-1 ring-emerald-700/20'
            : 'border-slate-300 hover:border-slate-400'
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          <MapPin
            className={cn(
              'w-4 h-4 shrink-0',
              selectedArea ? 'text-emerald-700' : 'text-slate-400'
            )}
          />
          {selectedArea ? (
            <span className="text-sm font-semibold text-slate-900 truncate">
              {selectedArea.nameBn}
            </span>
          ) : (
            <span className="text-sm text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedArea && (
            <span
              onClick={handleClear}
              className="-mr-2 -my-2 flex h-11 w-11 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="মুছুন"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform duration-150',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {error && <p className="text-xs text-rose-700 mt-1">{error}</p>}

      {/* Dropdown / Mobile Sheet Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-900/30 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[61] flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-xl sm:absolute sm:bottom-auto sm:left-0 sm:right-0 sm:top-full sm:mt-1.5 sm:max-h-[380px] sm:rounded-2xl sm:pb-0 sm:max-w-none',
              // On mobile: bottom sheet modal; on desktop: standard dropdown
            )}
          >
            {/* Header / Search */}
            <div className="p-3 sm:p-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="mb-2 flex items-center justify-between gap-2 sm:hidden">
                <span className="text-xs font-bold text-slate-700">
                  ময়মনসিংহ সিটি কর্পোরেশন এলাকা
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-400 hover:text-slate-600"
                  aria-label="এলাকা নির্বাচন বন্ধ করুন"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="এলাকা বা ল্যান্ডমার্ক খুঁজুন..."
                  autoFocus
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Quick Popular Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-xs">
                <span className="text-[11px] text-slate-400 shrink-0">জনপ্রিয়:</span>
                {popularAreas.slice(0, 8).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleSelect(a)}
                    className={cn(
                      'min-h-11 shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[11px] transition-colors',
                      selectedAreaId === a.id
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-600'
                    )}
                  >
                    {a.nameBn}
                  </button>
                ))}
              </div>
            </div>

            {/* Area List */}
            <div className="min-h-0 max-h-[min(300px,45dvh)] flex-1 divide-y divide-slate-100 overflow-y-auto overscroll-contain p-1">
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => {
                  const isSelected = selectedAreaId === area.id;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleSelect(area)}
                      className={cn(
                        'flex min-h-11 w-full items-start justify-between gap-3 rounded-xl p-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-800'
                      )}
                    >
                      <div>
                        <span className="text-sm font-medium">{area.nameBn}</span>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  সিটি কর্পোরেশন এলাকার মধ্যে এমন কোনো নাম পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
