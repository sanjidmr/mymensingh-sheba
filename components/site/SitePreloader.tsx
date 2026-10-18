'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SplashScreen from './SplashScreen';

/**
 * Site preloader — the first-paint splash for the public site.
 *
 * `SplashScreen` is server-rendered into the very first HTML byte with the
 * app's own bundle still downloading, so there is no white gap before it
 * appears. It then steps aside the moment the app is genuinely usable:
 *
 *   - the effect only runs *after* React has hydrated the tree, so its firing
 *     already means "the app is interactive";
 *   - `document.fonts.ready` holds it until the Bengali face has settled, so
 *     the tagline never swaps under the logo;
 *   - a short minimum keeps it from flickering on an instant load.
 *
 * It renders on full page loads only. Client-side navigations never remount
 * the root layout, so the splash never interrupts in-app routing — and it is
 * skipped entirely on the admin console, which has its own chrome.
 *
 * Styles live in `globals.css` (`.mms-splash*`) as plain CSS: no animation
 * library, no extra image assets beyond the existing logo, and a `prefers-
 * reduced-motion` path that shows the content without the choreography.
 */
export default function SitePreloader() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const [phase, setPhase] = useState<'visible' | 'leaving' | 'done'>('visible');

  useEffect(() => {
    if (isAdmin) return;

    let cancelled = false;
    const minimumVisibleMs = 300;
    const startedAt =
      typeof performance === 'undefined' ? Date.now() : performance.now();
    const elapsed = () =>
      (typeof performance === 'undefined' ? Date.now() : performance.now()) - startedAt;

    const leave = () => {
      if (cancelled) return;
      const wait = Math.max(0, minimumVisibleMs - elapsed());
      window.setTimeout(() => {
        if (cancelled) return;
        setPhase('leaving');
        window.setTimeout(() => {
          if (!cancelled) setPhase('done');
        }, 480);
      }, wait);
    };

    const fontSet = (document as Document & { fonts?: FontFaceSet }).fonts;
    const fontsReady = fontSet ? fontSet.ready : Promise.resolve();

    // Two frames guarantee the freshly restored page has painted at least once
    // before the splash begins to fade, so the hand-off is seamless.
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        void fontsReady.then(leave);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [isAdmin]);

  if (isAdmin || phase === 'done') return null;

  return <SplashScreen exiting={phase === 'leaving'} className="mms-splash-failsafe" />;
}
