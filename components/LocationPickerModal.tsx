'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X, Check, Sparkles, ShieldCheck } from 'lucide-react';
import { MCC_AREA_SOURCE, type AreaSource, type MCCArea } from '@/lib/locations';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAreaId?: string | null;
  onSelectArea: (area: MCCArea | null) => void;
  title?: string;
  allowClear?: boolean;
  /**
   * Which area list to search. Defaults to the site-wide MCC list; To-Let
   * passes `TOLET_AREA_SOURCE` so its extra areas appear here and nowhere else.
   */
  source?: AreaSource;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  selectedAreaId,
  onSelectArea,
  title = 'আপনার এলাকা নির্বাচন করুন',
  allowClear = true,
  source = MCC_AREA_SOURCE,
}: LocationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset the query and focus the search field whenever the sheet opens.
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset on every close path so the next open starts clean.
  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  // Close on Escape.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const popularAreas = useMemo(() => source.popular(), [source]);
  const displayAreas = useMemo(
    () => searchQuery.trim() ? source.search(searchQuery) : source.all(),
    [source, searchQuery]
  );

  if (!isOpen) return null;

  const handleSelect = (area: MCCArea | null) => {
    onSelectArea(area);
    handleClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 id="location-picker-title" className="font-bold text-slate-900 text-base sm:text-lg">
                  {title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>ময়মনসিংহ সিটি কর্পোরেশনের এলাকা</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search — Bangla or English */}
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="এলাকার নাম লিখুন (যেমন: চরপাড়া বা Charpara)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
              aria-label="এলাকা খুঁজুন"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                aria-label="সার্চ মুছুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            বাংলা বা ইংরেজি — যেকোনোভাবে লিখুন (যেমন charpara, চরপাড়া, maskanda)।
          </p>
        </div>

        {/* Popular quick chips */}
        {!searchQuery && (
          <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100/60 shrink-0">
            <p className="text-[11px] font-semibold text-emerald-900 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>দ্রুত নির্বাচনের জন্য জনপ্রিয় এলাকা:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popularAreas.map((popArea) => {
                const isSelected = selectedAreaId === popArea.id;
                return (
                  <button
                    key={popArea.id}
                    type="button"
                    onClick={() => handleSelect(popArea)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white border border-emerald-200/80 text-emerald-900 hover:bg-emerald-100/60'
                    }`}
                  >
                    {popArea.nameBn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 sm:p-3">
          {allowClear && !searchQuery && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                !selectedAreaId ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">সব এলাকা</div>
                  <div className="text-xs text-slate-500">সিটি কর্পোরেশনের সব এলাকার সেবা দেখাবে</div>
                </div>
              </div>
              {!selectedAreaId && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
            </button>
          )}

          {displayAreas.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Search className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">কোনো এলাকা খুঁজে পাওয়া যায়নি</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                বানান একটু ভিন্ন হলেও চলবে — আবার চেষ্টা করুন (যেমন: চরপাড়া, Charpara, Kachijhuli)।
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                সব এলাকা দেখুন
              </button>
            </div>
          ) : (
            <div className="space-y-1 p-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400">
                {searchQuery ? `খুঁজে পাওয়া গেছে ${displayAreas.length}টি এলাকা` : 'সব এলাকা'}
              </div>
              {displayAreas.map((area) => {
                const isSelected = selectedAreaId === area.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => handleSelect(area)}
                    className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <MapPin
                        className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold">{area.nameBn}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>ময়মনসিংহ সিটি কর্পোরেশন এলাকা</span>
          <button
            type="button"
            onClick={handleClose}
            className="font-bold text-slate-700 hover:text-slate-900 px-2 py-1"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
