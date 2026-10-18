'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The Mymensingh Sheba loading visual — logo, tagline, a thin brand spinner
 * and a soft landscape silhouette on a pure white field.
 *
 * It is purely presentational: it fills the viewport and never decides when to
 * leave. `SitePreloader` drives it for the first paint; the customer-area
 * layouts render it directly while a session is being restored, so the whole
 * site shares one loading screen instead of a bare "লোড হচ্ছে…" page.
 */
export default function SplashScreen({
  exiting = false,
  className,
}: {
  /** Play the fade-out (boot splash only). */
  exiting?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('mms-splash', exiting && 'mms-splash-exit', className)}
      role="status"
      aria-live="polite"
      aria-label="Mymensingh Sheba লোড হচ্ছে"
    >
      <div className="mms-splash-center">
        <span className="mms-splash-logo">
          <Image src="/logo.png" alt="Mymensingh Sheba" width={1536} height={1024} priority />
        </span>
        <p className="mms-splash-tagline">ঘরে বসেই নিন আপনার প্রয়োজনীয় সেবা</p>
        <span className="mms-splash-spinner" aria-hidden="true" />
      </div>

      {/* Soft, muted river-bank silhouette — a whisper of Mymensingh. */}
      <svg
        className="mms-splash-landscape"
        viewBox="0 0 1440 180"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M0 104C180 64 360 132 560 108 760 84 900 52 1100 84 1280 112 1360 124 1440 100V180H0Z"
          fill="#eff4ef"
        />
        <path
          d="M0 132C200 104 380 152 600 132 820 112 1000 148 1220 128 1320 119 1390 132 1440 124V180H0Z"
          fill="#e4ede6"
        />
        <path
          d="M0 156C240 138 460 168 720 152 980 136 1200 164 1440 146V180H0Z"
          fill="#d8e7db"
        />
      </svg>
    </div>
  );
}
