'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Check,
  Building2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  MCCArea,
  searchMCCAreas,
  getPopularMCCAreas,
  getAllMCCWards,
  getAreasByWard,
} from '@/lib/locations';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAreaId?: string | null;
  onSelectArea: (area: MCCArea | null) => void;
  title?: string;
  allowClear?: boolean;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  selectedAreaId,
  onSelectArea,
  title = 'আপনার এলাকা বেছে নিন',
  allowClear = true,
}: LocationPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'wards'>('all');
  const [selectedWardNo, setSelectedWardNo] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const popularAreas = getPopularMCCAreas();
  const allWards = getAllMCCWards();

  // Filtered areas based on search query or ward selection
  let displayAreas: MCCArea[] = [];
  if (searchQuery.trim()) {
    displayAreas = searchMCCAreas(searchQuery);
  } else if (activeTab === 'popular') {
    displayAreas = popularAreas;
  } else if (activeTab === 'wards' && selectedWardNo !== null) {
    displayAreas = getAreasByWard(selectedWardNo);
  } else {
    displayAreas = searchMCCAreas('');
  }

  const handleSelect = (area: MCCArea | null) => {
    onSelectArea(area);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3
                  id="location-picker-title"
                  className="font-bold text-slate-900 text-base sm:text-lg"
                >
                  {title}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন (৩৩টি ওয়ার্ড)</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700"
              aria-label="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Field */}
          <div className="relative mt-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab === 'wards') setActiveTab('all');
              }}
              placeholder="এলাকার নাম লিখুন (যেমন: চরপাড়া বা Maskanda)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
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

          {/* Quick Filter Tabs (when not searching) */}
          {!searchQuery && (
            <div className="flex items-center gap-1.5 mt-3 pt-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedWardNo(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === 'all'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                সকল এলাকা ({displayAreas.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('popular');
                  setSelectedWardNo(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeTab === 'popular'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>জনপ্রিয় এলাকা</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('wards');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-colors ${
                  activeTab === 'wards'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>ওয়ার্ড অনুযায়ী (৩৩টি)</span>
              </button>
            </div>
          )}
        </div>

        {/* Popular Quick Chips (when on 'all' tab & no search) */}
        {!searchQuery && activeTab === 'all' && (
          <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100/60 shrink-0">
            <p className="text-[11px] font-semibold text-emerald-900 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>দ্রুত নির্বাচনের জন্য জনপ্রিয় এলাকা:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popularAreas.slice(0, 7).map((popArea) => {
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

        {/* Content Body */}
        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-2 sm:p-3">
          {/* Allow Clear Option */}
          {allowClear && !searchQuery && activeTab === 'all' && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                !selectedAreaId
                  ? 'bg-emerald-50 text-emerald-900 font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">সকল এলাকা (সম্পূর্ণ ময়মনসিংহ সিটি)</div>
                  <div className="text-xs text-slate-500">৩৩টি ওয়ার্ডের সব সার্ভিস প্রদর্শন করবে</div>
                </div>
              </div>
              {!selectedAreaId && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
            </button>
          )}

          {/* Wards View */}
          {activeTab === 'wards' && !searchQuery && selectedWardNo === null ? (
            <div className="p-2 space-y-2">
              <p className="text-xs text-slate-500 mb-2 px-1">
                নির্দিষ্ট ওয়ার্ড নির্বাচন করে তার অন্তর্ভুক্ত এলাকাগুলো দেখুন:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allWards.map((w) => {
                  const areas = getAreasByWard(w.wardNo);
                  return (
                    <button
                      key={w.wardNo}
                      type="button"
                      onClick={() => setSelectedWardNo(w.wardNo)}
                      className="text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-900">
                          {w.nameBn}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1">
                          {w.headquarterBn}
                        </div>
                        <div className="text-[10px] text-emerald-700 mt-1 font-medium">
                          {areas.length}টি প্রধান এলাকা অন্তর্ভুক্ত
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'wards' && !searchQuery && selectedWardNo !== null ? (
            <div className="p-1">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl mb-2">
                <span className="text-xs font-semibold text-slate-800">
                  ওয়ার্ড {selectedWardNo} এর এলাকাগুলো
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedWardNo(null)}
                  className="text-xs font-semibold text-emerald-800 hover:underline"
                >
                  সব ওয়ার্ডে ফিরুন
                </button>
              </div>

              {displayAreas.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  এই ওয়ার্ডের প্রধান এলাকাগুলো তালিকাভুক্ত করা হচ্ছে।
                </div>
              ) : (
                <div className="space-y-1">
                  {displayAreas.map((area) => {
                    const isSelected = selectedAreaId === area.id;
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => handleSelect(area)}
                        className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-semibold'
                            : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isSelected ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          />
                          <div>
                            <div className="text-sm font-bold flex items-center gap-2">
                              <span>{area.nameBn}</span>
                              <span className="text-xs text-slate-400 font-normal">
                                ({area.nameEn})
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {area.popularFor}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Standard Area List & Search Results */
            <div className="space-y-1 p-1">
              {displayAreas.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <Search className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">
                    কোনো এলাকা খুঁজে পাওয়া যায়নি
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                    ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি সাধারণ ওয়ার্ডের মধ্যে সঠিক এলাকার নাম দিয়ে
                    আবার সার্চ করুন (যেমন: চরপাড়া, সানকিপাড়া, কাঁচিঝুলি)।
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-semibold text-emerald-800 hover:underline"
                  >
                    সকল এলাকা দেখুন
                  </button>
                </div>
              ) : (
                displayAreas.map((area) => {
                  const isSelected = selectedAreaId === area.id;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleSelect(area)}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-950 font-semibold'
                          : 'text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isSelected ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        />
                        <div>
                          <div className="text-sm font-bold flex items-center gap-1.5 flex-wrap">
                            <span>{area.nameBn}</span>
                            <span className="text-xs text-slate-400 font-normal">
                              ({area.nameEn})
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-medium">
                              {area.wardLabelBn}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {area.popularFor}
                          </div>
                          {area.prominentLandmarks.length > 0 && (
                            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                              উল্লেখযোগ্য: {area.prominentLandmarks.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>ময়মনসিংহ সিটি কর্পোরেশন এলাকা</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-slate-700 hover:text-slate-900 px-2 py-1"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
