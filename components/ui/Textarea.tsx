'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      error,
      required,
      id,
      rows = 4,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs sm:text-sm font-semibold text-slate-800 select-none"
          >
            {label}
            {required && <span className="text-rose-600 ml-1 font-bold">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${textareaId}-error`
                : helperText
                ? `${textareaId}-helper`
                : undefined
            }
            className={cn(
              'w-full p-3.5 rounded-xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150 resize-y min-h-[100px]',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-700',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20 text-rose-950'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          />
        </div>

        {hasError && (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-rose-700 font-medium flex items-center gap-1 mt-1"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-slate-500 leading-relaxed mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
