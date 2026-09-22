'use client';

import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'কিছু সমস্যা হয়েছে',
  message = 'তথ্য লোড করার সময় অপ্রত্যাশিত বিভ্রাট ঘটেছে। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'w-full py-10 px-6 rounded-3xl bg-rose-50/40 border border-rose-200 text-center flex flex-col items-center justify-center max-w-md mx-auto my-4',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mb-4">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
        >
          আবার চেষ্টা করুন
        </Button>
      )}
    </div>
  );
}
