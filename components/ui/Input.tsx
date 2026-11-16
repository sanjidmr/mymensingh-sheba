'use client';

import React, { forwardRef, useId } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  isSuccess?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      helperText,
      error,
      isSuccess,
      leftIcon,
      rightIcon,
      required,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold text-slate-800 select-none"
          >
            {label}
            {required && <span className="text-rose-600 ml-1 font-bold">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${inputId}-error`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            className={cn(
              'w-full h-11 sm:h-12 px-3.5 rounded-xl bg-white border text-sm text-slate-900 placeholder:text-slate-400 transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-700',
              'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
              leftIcon ? 'pl-10' : '',
              rightIcon || hasError || isSuccess ? 'pr-10' : '',
              hasError
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20 text-rose-950'
                : isSuccess
                ? 'border-emerald-400 focus:border-emerald-600 focus:ring-emerald-600'
                : 'border-slate-300 hover:border-slate-400',
              className
            )}
            {...props}
          />

          {/* Right Icon / Error / Success indicator */}
          <div className="absolute right-3.5 flex items-center pointer-events-none">
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : isSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              rightIcon && <span className="text-slate-400">{rightIcon}</span>
            )}
          </div>
        </div>

        {hasError && (
          <p
            id={`${inputId}-error`}
            className="text-xs text-rose-700 font-medium flex items-center gap-1 mt-1"
          >
            {error}
          </p>
        )}

        {!hasError && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-slate-500 leading-relaxed mt-1"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
