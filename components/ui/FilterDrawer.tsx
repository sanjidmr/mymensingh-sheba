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
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet / Drawer Container */}
      <div className="fixed inset-x-0 bottom-0 flex max-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-200 sm:max-h-[85vh] md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:max-h-full md:rounded-l-3xl md:rounded-tr-none md:pb-0">
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
            className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Filters Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5">
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
