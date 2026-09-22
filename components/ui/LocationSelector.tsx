'use client';

import React, { useState, useMemo } from 'react';
import { MapPin, Search, X, Check, ChevronDown } from 'lucide-react';
import { getAllMCCAreas, MCCArea } from '@/lib/locations';
import { cn } from '@/lib/utils';

export interface LocationSelectorProps {
  selectedAreaId?: string;
  onSelectArea: (area: MCCArea | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function LocationSelector({
  selectedAreaId,
  onSelectArea,
  label = 'এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)',
  placeholder = 'এলাকা নির্বাচন করুন',
  className,
  error,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allAreas = useMemo(() => getAllMCCAreas(), []);

  const selectedArea = useMemo(
    () => allAreas.find((a) => a.id === selectedAreaId) || null,
    [allAreas, selectedAreaId]
  );

  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return allAreas;
    const q = searchQuery.toLowerCase().trim();
    return allAreas.filter(
      (a) =>
        a.nameBn.toLowerCase().includes(q) ||
        a.nameEn.toLowerCase().includes(q) ||
        (a.wardNo && String(a.wardNo).includes(q)) ||
        a.prominentLandmarks?.some((l) => l.toLowerCase().includes(q))
    );
  }, [allAreas, searchQuery]);

  const popularAreas = useMemo(
    () => ['charpara', 'ganginarpar', 'sankipara', 'kachijhuli', 'akua', 'natun-bazar'],
    []
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
              {selectedArea.nameBn}{' '}
              {selectedArea.wardNo && (
                <span className="text-xs font-normal text-slate-500">
                  (ওয়ার্ড {selectedArea.wardNo})
                </span>
              )}
            </span>
          ) : (
            <span className="text-sm text-slate-400 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedArea && (
            <span
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
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
            className="fixed inset-0 z-40 bg-slate-900/30 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={cn(
              'z-50 bg-white border border-slate-200 shadow-xl overflow-hidden',
              // On mobile: bottom sheet modal; on desktop: standard dropdown
              'fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl sm:rounded-2xl sm:absolute sm:bottom-auto sm:top-full sm:left-0 sm:right-0 sm:mt-1.5 sm:max-h-[380px]'
            )}
          >
            {/* Header / Search */}
            <div className="p-3 sm:p-3.5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between sm:hidden mb-2">
                <span className="text-xs font-bold text-slate-700">
                  ময়মনসিংহ সিটি কর্পোরেশন এলাকা
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
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
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {/* Quick Popular Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-xs">
                <span className="text-[11px] text-slate-400 shrink-0">জনপ্রিয়:</span>
                {popularAreas.map((id) => {
                  const a = allAreas.find((item) => item.id === id);
                  if (!a) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(a)}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap shrink-0 border transition-colors',
                        selectedAreaId === id
                          ? 'bg-emerald-800 text-white border-emerald-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-600'
                      )}
                    >
                      {a.nameBn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area List */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 p-1">
              {filteredAreas.length > 0 ? (
                filteredAreas.map((area) => {
                  const isSelected = selectedAreaId === area.id;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleSelect(area)}
                      className={cn(
                        'w-full p-2.5 rounded-xl text-left flex items-start justify-between gap-3 transition-colors',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-800'
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{area.nameBn}</span>
                          {area.wardNo && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                              ওয়ার্ড {area.wardNo}
                            </span>
                          )}
                        </div>
                        {area.popularFor && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {area.popularFor}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  সিটি কর্পোরেশন এলাকার মধ্যে এমন কোনো নাম পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
