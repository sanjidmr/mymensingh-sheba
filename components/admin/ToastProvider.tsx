'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastContextValue {
  notify: (tone: ToastTone, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Success / failure feedback for every admin action.
 *
 * The old pages showed feedback as a coloured banner that stayed on screen
 * until the next render, so a successful approve and a failed approve could look
 * identical once the banner was dismissed. Toasts are transient, tone-coded,
 * and stack — and they are the only place a mutation reports its outcome.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (tone: ToastTone, title: string, message?: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current.slice(-3), { id, tone, title, message }]);
      // Auto-dismiss. Errors linger longer: a failure the admin did not see is
      // worse than a toast that outlived its usefulness.
      const ttl = tone === 'error' ? 7000 : 4000;
      window.setTimeout(() => dismiss(id), ttl);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-3 sm:items-end sm:p-4"
      >
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-brand-200 bg-brand-50 text-brand-900' },
  error: { icon: XCircle, className: 'border-rose-200 bg-rose-50 text-rose-900' },
  warning: { icon: AlertTriangle, className: 'border-accent-300 bg-accent-100 text-accent-700' },
  info: { icon: Info, className: 'border-sky-200 bg-sky-50 text-sky-900' },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const { icon: Icon, className } = TONE_STYLES[toast.tone];
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border p-3 shadow-lg',
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs leading-relaxed opacity-90 break-words">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 opacity-60 hover:opacity-100"
        aria-label="বন্ধ করুন"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}