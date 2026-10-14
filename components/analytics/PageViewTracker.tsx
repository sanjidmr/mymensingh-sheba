'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/site-analytics';

/**
 * Records a page view for the initial load and for every client-side
 * navigation in the App Router.
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
    if (lastTracked === pathname) return;
    lastTracked = pathname;
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
