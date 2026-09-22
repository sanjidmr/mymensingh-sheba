'use client';

import React, { useEffect } from 'react';
import { SlidersHorizontal, X, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
  activeFilterCount?: number;
  title?: string;
  children: React.ReactNode;
}

export function FilterDrawer({
  isOpen,
  onClose,
  onApply,
  onReset,
  activeFilterCount = 0,
  title = 'ফিল্টার করুন',
  children,
}: FilterDrawerProps) {
  // Lock body scroll on mobile bottom sheet open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet / Drawer Container */}
      <div className="fixed inset-x-0 bottom-0 max-h-[90vh] sm:max-h-[85vh] md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:max-h-full bg-white shadow-2xl flex flex-col rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none transition-transform duration-200">
        {/* Mobile drag bar indicator */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {children}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onReset}
            className="flex-1"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            সব মুছুন
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              onApply();
              onClose();
            }}
            className="flex-1"
            leftIcon={<Check className="w-4 h-4" />}
          >
            ফিল্টার দেখুন
          </Button>
        </div>
      </div>
    </div>
  );
}
