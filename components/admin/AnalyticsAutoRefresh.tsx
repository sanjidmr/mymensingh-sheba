'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REFRESH_INTERVAL_MS = 60_000;

export default function AnalyticsAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [router]);

  return (
    <span className="text-[11px] text-admin-muted" aria-live="polite">
      প্রতি ৬০ সেকেন্ডে আপডেট
    </span>
  );
}
