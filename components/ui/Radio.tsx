'use client';

import React, { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  label?: string;
  error?: string;
  className?: string;
}

export const RadioGroup = ({
  name,
  value,
  onChange,
  options,
  label,
  error,
  className,
}: RadioGroupProps) => {
  return (
    <div className={cn('w-full space-y-2 text-left', className)}>
      {label && (
        <span className="block text-xs sm:text-sm font-semibold text-slate-800">
          {label}
        </span>
      )}

      <div className="space-y-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer min-h-[44px]',
                isSelected
                  ? 'border-emerald-700 bg-emerald-50/40 ring-1 ring-emerald-700/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50',
                opt.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={isSelected}
                  disabled={opt.disabled}
                  onChange={() => onChange?.(opt.value)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border flex items-center justify-center transition-all',
                    isSelected
                      ? 'border-emerald-800'
                      : 'border-slate-300'
                  )}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-emerald-800" />
                  )}
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900 leading-tight">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="text-xs text-rose-700 mt-1">{error}</p>}
    </div>
  );
};
