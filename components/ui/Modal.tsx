'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key and lock scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-3 py-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        ref={modalRef}
        className={cn(
          'relative my-auto flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl transition-all duration-200 sm:max-h-[90vh]',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div>
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="min-h-0 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-700 sm:px-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
