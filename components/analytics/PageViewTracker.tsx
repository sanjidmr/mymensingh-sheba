'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { shouldTrackPath, trackActiveVisitor, trackPageView } from '@/lib/site-analytics';

const ACTIVE_VISITOR_TIMEOUT_MS = 5 * 60_000;

/**
 * Records page views on App Router navigation and anonymous active-visitor
 * heartbeats while the visible page has recent user activity.
 *
 * Why the module-level `lastTracked` and not just an effect that depends on
 * `pathname`:
 *
 *   * React Strict Mode mounts a component, runs its effects, unmounts it and
 *     mounts it again with the same props. A naive effect therefore records two
 *     page views for one visit. The module variable survives that remount, so
 *     the second identical call is skipped.
 *   * A browser reload resets module state, so a genuine reload is still one
 *     view — which is correct.
 *   * Navigating A → B → A tracks all three, because the value changes on each
 *     real navigation.
 *
 * `pathname` intentionally excludes the query string: a search box changing
 * `?q=` is the same page, not a new one.
 */
let lastTracked: string | null = null;

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (lastTracked !== pathname) {
      lastTracked = pathname;
      trackPageView(pathname);
    }
    if (!shouldTrackPath(pathname)) return;

    let lastActivityAt = Date.now();
    const markActivity = () => {
      lastActivityAt = Date.now();
    };
    const heartbeat = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastActivityAt < ACTIVE_VISITOR_TIMEOUT_MS
      ) {
        trackActiveVisitor(pathname);
      }
    };
    heartbeat();
    const interval = window.setInterval(heartbeat, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') markActivity();
      heartbeat();
    };
    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'input'] as const;
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);

  return null;
}
