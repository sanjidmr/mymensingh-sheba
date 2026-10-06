'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Confirmation dialog for every destructive or hard-to-undo action.
 *
 * The previous admin pages used the browser's `confirm()`, which is
 * unstyleable, untranslatable, and — on mobile — easy to dismiss by accident.
 * This one is explicit about what will happen, and can require the admin to
 * type the record's name before the confirm button enables, for the cases
 * where a wrong click destroys something that cannot be restored.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'নিশ্চিত করুন',
  cancelLabel = 'বাতিল',
  tone = 'danger',
  isLoading = false,
  /** When set, the admin must type this exact string to proceed. */
  requireText,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState('');

  // Reset the typed confirmation each time the dialog opens, so a half-finished
  // entry from a previous attempt cannot silently authorise this one. Adjust
  // state during render (React's recommended pattern) rather than in an effect.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setTyped('');
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const typedMatches = !requireText || typed.trim() === requireText.trim();
  const canConfirm = !isLoading && typedMatches;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-4"
    >
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={onCancel}
        disabled={isLoading}
        className="absolute inset-0 h-full w-full bg-ink-900/50"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-mist-200 bg-white shadow-2xl">
        <div className="flex items-start gap-3 px-5 pt-5">
          <span
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-700'
            )}
          >
            {tone === 'danger' ? (
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <div className="min-w-0">
            <h3 id="confirm-title" className="text-base font-bold text-ink-900">
              {title}
            </h3>
            {description && (
              <div id="confirm-desc" className="mt-1 text-sm leading-relaxed text-ink-600">
                {description}
              </div>
            )}
          </div>
        </div>

        {requireText && (
          <div className="px-5 pt-4">
            <label htmlFor="confirm-typed" className="text-xs font-semibold text-ink-700">
              নিশ্চিত করতে <span className="font-bold text-rose-700">“{requireText}”</span> লিখুন
            </label>
            <input
              id="confirm-typed"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="mt-1.5 h-11 w-full rounded-lg border border-mist-200 bg-white px-3 text-sm text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 border-t border-mist-100 bg-mist-50/60 px-5 py-3.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="h-11 rounded-lg border border-mist-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:bg-mist-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50',
              tone === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-700 hover:bg-brand-800'
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? 'প্রসেস হচ্ছে…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}