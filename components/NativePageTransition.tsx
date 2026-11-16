'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isNative } from '@/lib/platform';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function NativePageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const previousPath = useRef(pathname);
  const touchStartY = useRef<number | null>(null);
  const touchDelta = useRef(0);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const refreshablePath =
    pathname === '/' ||
    pathname === '/services' ||
    pathname === '/profile/requests' ||
    pathname === '/dashboard';

  useEffect(() => {
    if (!isNative() || previousPath.current === pathname) return;
    previousPath.current = pathname;
    const root = rootRef.current;
    if (!root) return;
    root.classList.remove('native-page-enter');
    requestAnimationFrame(() => root.classList.add('native-page-enter'));
    const timer = window.setTimeout(() => root.classList.remove('native-page-enter'), 240);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!isNative() || !refreshablePath) return;
    const root = rootRef.current;
    if (!root) return;
    const onTouchStart = (event: TouchEvent) => {
      touchDelta.current = 0;
      if (window.scrollY <= 1) touchStartY.current = event.touches[0]?.clientY ?? null;
      else touchStartY.current = null;
    };
    const onTouchEnd = () => {
      if (touchStartY.current === null) return;
      touchStartY.current = null;
      if (touchDelta.current < 76 || !isOnline || refreshing) return;
      setRefreshing(true);
      void queryClient.invalidateQueries();
      router.refresh();
      window.dispatchEvent(new CustomEvent('mms:pull-to-refresh'));
      window.setTimeout(() => setRefreshing(false), 650);
    };
    const onTouchMove = (event: TouchEvent) => {
      const startY = touchStartY.current;
      if (startY === null) return;
      touchDelta.current = Math.max(0, (event.touches[0]?.clientY ?? startY) - startY);
    };
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: true });
    root.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOnline, queryClient, refreshablePath, refreshing, router]);

  return (
    <div ref={rootRef}>
      {refreshing && isNative() && (
        <div className="fixed inset-x-0 top-[calc(0.5rem+env(safe-area-inset-top))] z-[90] text-center text-xs font-semibold text-brand-700">
          রিফ্রেশ হচ্ছে…
        </div>
      )}
      {children}
    </div>
  );
}
