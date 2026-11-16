'use client';

import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function NativeOfflineBanner() {
  const { isOnline, isReady } = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const resetDismissal = () => setDismissed(false);
    window.addEventListener('online', resetDismissal);
    return () => window.removeEventListener('online', resetDismissal);
  }, []);

  useEffect(() => {
    if (!isOnline) return;
    const timer = window.setTimeout(() => setDismissed(false), 0);
    return () => window.clearTimeout(timer);
  }, [isOnline]);

  if (!isReady || isOnline || dismissed) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[100] mx-auto flex max-w-lg items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950 shadow-sm"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-800" aria-hidden="true" />
      <span className="min-w-0 flex-1">No internet connection · ইন্টারনেট সংযোগ নেই</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-amber-900 hover:bg-amber-100"
        aria-label="বার্তা বন্ধ করুন"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
