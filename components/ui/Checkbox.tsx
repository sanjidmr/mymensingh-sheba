'use client';

import React, { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      id,
      checked,
      disabled,
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="w-full text-left">
        <label
          htmlFor={checkboxId}
          className={cn(
            'inline-flex items-start gap-3 py-1 cursor-pointer select-none group min-h-[44px]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              ref={ref}
              id={checkboxId}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={onChange}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                'w-5 h-5 rounded-md border transition-all duration-150 flex items-center justify-center bg-white',
                'border-slate-300 group-hover:border-emerald-600',
                'peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600 peer-focus-visible:ring-offset-1',
                'peer-checked:bg-emerald-800 peer-checked:border-emerald-800 text-white',
                error ? 'border-rose-400' : ''
              )}
            >
              <Check className="w-3.5 h-3.5 stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-950 transition-colors">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {description}
              </span>
            )}
            {error && <span className="text-xs text-rose-700 mt-0.5">{error}</span>}
          </div>
        </label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
