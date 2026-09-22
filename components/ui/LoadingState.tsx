'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  label?: string;
  variant?: 'spinner' | 'skeleton-cards' | 'skeleton-list';
  count?: number;
  className?: string;
}

export function LoadingState({
  label = 'লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...',
  variant = 'spinner',
  count = 3,
  className,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div
        className={cn(
          'w-full py-12 sm:py-16 flex flex-col items-center justify-center text-center gap-3',
          className
        )}
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-600 animate-pulse">
          {label}
        </p>
      </div>
    );
  }

  if (variant === 'skeleton-cards') {
    return (
      <div
        className={cn(
          'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full',
          className
        )}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse"
          >
            <div className="w-full aspect-16/10 bg-slate-100 rounded-xl" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              <div className="h-8 bg-slate-100 rounded-xl w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 w-full', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-2xl bg-slate-100 animate-pulse w-full"
        />
      ))}
    </div>
  );
}
