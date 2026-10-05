'use client';

/**
 * TutorCtaBar — the mobile action bar, and the spacer that keeps it off the
 * bottom navigation.
 *
 * Same construction as `components/tolet/detail/StickyContactBar`, for the same
 * reason. The global `MobileBottomNav` is `fixed` at `bottom-0` and
 * `--mms-bottom-nav-h` (3.5rem) tall; this bar does not fight it for that slot,
 * it floats directly on top of it with a bottom margin expressed in the SAME
 * token, so the two cannot drift apart if either is resized.
 *
 * The previous tutor page had `fixed bottom-0` with no offset at all, which put
 * its "Tutor Request করুন" button underneath the nav on every phone.
 */

import React from 'react';
import { Send } from 'lucide-react';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import { TUTOR_AVAILABILITY_LABELS } from '@/lib/home-tutor-types';

/**
 * A phone floating bar with one job: scroll to the request form.
 *
 * It is a scroll, not a form, on purpose. The request needs a class level, a
 * subject, days, a budget and a phone number — opening that sheet from a
 * fixed bar the reader cannot see the contents of, halfway down the page, is
 * how forms get abandoned. Scrolling puts the real form in view first.
 */
export function TutorCtaBar({ tutor }: { tutor: HomeTutorProfile }) {
  const availability = TUTOR_AVAILABILITY_LABELS[tutor.availability];
  const open = tutor.availability !== 'busy';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom) + var(--mms-bottom-nav-h))',
      }}
    >
      <div className="pointer-events-auto mx-auto w-full max-w-lg">
        <a
          href="#tutor-request"
          aria-disabled={!open}
          onClick={(e) => {
            if (!open) e.preventDefault();
          }}
          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-extrabold shadow-[0_4px_16px_rgba(7,39,31,0.14)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
            open
              ? 'bg-brand-700 text-white hover:bg-brand-800'
              : 'cursor-not-allowed border border-mist-200 bg-mist-100 text-ink-400'
          }`}
        >
          <Send className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          <span>{open ? 'এই শিক্ষককে নিতে চাই' : `${availability.labelBn} — এখন নিতে পারছেন না`}</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Reserve the space the floating bar occupies so the report link at the very
 * bottom of the page is never trapped under it.
 */
export function TutorCtaBarSpacer() {
  return <div aria-hidden="true" className="h-[4.25rem] lg:hidden" />;
}