'use client';

import React from 'react';
import { Search, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  selectedLocationName?: string;
  onLocationClick?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'আপনি কী খুঁজছেন? (যেমন: টু-লেট, বুয়া, ইলেক্ট্রিশিয়ান)',
  onClear,
  onSubmit,
  selectedLocationName,
  onLocationClick,
  className,
  autoFocus,
}: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <div
      className={cn(
        'w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-1.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 transition-all focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-700/20',
        className
      )}
    >
      {/* Search Input Field */}
      <div className="relative flex-1 flex items-center min-h-[44px]">
        <Search className="w-4 h-4 text-emerald-800 ml-3 mr-2 shrink-0 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full h-10 pr-8 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="absolute right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            aria-label="মুছে ফেলুন"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Location Picker pill or Search CTA */}
      <div className="flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-2">
        {onLocationClick && (
          <button
            type="button"
            onClick={onLocationClick}
            className="flex-1 sm:flex-initial h-10 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 border border-slate-200/80 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span className="truncate max-w-[130px]">
              {selectedLocationName || 'সব এলাকা'}
            </span>
          </button>
        )}

        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            className="h-10 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <span>খুঁজুন</span>
          </button>
        )}
      </div>
    </div>
  );
}
