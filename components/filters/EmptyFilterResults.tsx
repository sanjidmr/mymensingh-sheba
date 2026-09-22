'use client';

import React from 'react';
import { FilterX, RotateCcw, MapPin } from 'lucide-react';

interface EmptyFilterResultsProps {
  onResetFilters: () => void;
  areaName?: string;
  customMessage?: string;
}

export default function EmptyFilterResults({
  onResetFilters,
  areaName,
  customMessage,
}: EmptyFilterResultsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs my-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-200/60">
        <FilterX className="w-7 h-7" />
      </div>

      <h3 className="font-bold text-slate-900 text-lg sm:text-xl mb-2">
        এই শর্তে এখন কোনো ফল পাওয়া যায়নি
      </h3>

      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        {customMessage || (
          <>
            {areaName && (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                {areaName} এলাকাতে{' '}
              </span>
            )}
            আপনার দেওয়া নির্দিষ্ট ফিল্টার অনুযায়ী কোনো তালিকা পাওয়া যায়নি। ফিল্টার একটু কমিয়ে দেখলে
            কাছাকাছি অন্যান্য অপশন পেতে পারেন।
          </>
        )}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-all text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>ফিল্টার একটু কমিয়ে দেখুন (সব মুছুন)</span>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
        টিপস: বাজেট সীমা বাড়ানো বা নির্দিষ্ট এলাকা পরিবর্তন করলে আরও ফলাফল পেতে পারেন।
      </div>
    </div>
  );
}
