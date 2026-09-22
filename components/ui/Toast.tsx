'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function Toast({
  variant = 'success',
  title,
  message,
  onDismiss,
  className,
}: ToastProps) {
  const configs: Record<
    ToastVariant,
    { bg: string; border: string; text: string; icon: React.ReactNode }
  > = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-950',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-950',
      icon: <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-950',
      icon: <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-950',
      icon: <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />,
    },
  };

  const c = configs[variant];

  return (
    <div
      role="alert"
      className={cn(
        'p-3.5 sm:p-4 rounded-2xl border shadow-sm flex items-start justify-between gap-3 text-left transition-all max-w-md w-full',
        c.bg,
        c.border,
        c.text,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {c.icon}
        <div>
          {title && <h4 className="font-bold text-xs sm:text-sm">{title}</h4>}
          <p className="text-xs sm:text-sm leading-relaxed opacity-90">
            {message}
          </p>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity shrink-0"
          aria-label="বন্ধ করুন"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
