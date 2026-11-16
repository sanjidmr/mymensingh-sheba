'use client';

/**
 * DonorCard — the entire blood-donor surface.
 *
 * There is deliberately no donor detail page. `/blood-donor/[id]` redirects back
 * here. A donor record is a handful of facts and one action; a second page would
 * spread them over two screens with a scroll in between, and in an emergency
 * nobody scrolls.
 *
 * What the card has to answer, in the order a reader asks:
 *   1. Is this the right blood group?               → the group token, top-left
 *   2. Where are they?                              → the area line
 *   3. How do I reach them?                         → the call action, bottom
 *   4. Are they currently available?                → the donor's saved status
 *
 * Calling
 * -------
 * A visitor calls an approved donor DIRECTLY. No blood request, no admin in the
 * middle. The কল করুন action is a single `tel:` link, so tapping it opens the
 * device dialer with that donor's number.
 *
 * The number is NEVER printed as text. It reaches the browser only through the
 * `fn_public_donor_directory` RPC (approved rows only) so that the `tel:` href
 * can carry it; the raw `private_phone` column stays REVOKEd from the public key.
 */

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { BadgeCheck, MapPin, Phone } from 'lucide-react';
import { resolveDonorPhotoUrl } from '@/lib/blood-donor-service';
import { formatLastDonation } from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodDonorProfile } from '@/lib/supabase/types';
import { useAuth } from '@/lib/auth-context';
import { trackCtaClick, trackProfileView } from '@/lib/site-analytics';

export interface DonorCardProps {
  donor: BloodDonorProfile;
}

/**
 * Round avatar, kept because the admin console and the donor's own profile page
 * both render it in a list. The card itself does not use it — a face is not one
 * of the facts that matter in an emergency.
 *
 * Falls back to the first letter, so a donor who never uploaded a photo still
 * renders as a person rather than a broken image.
 */
export function DonorAvatar({
  donor,
  className = 'h-14 w-14 text-lg',
}: {
  donor: BloodDonorProfile;
  className?: string;
}) {
  const photo = resolveDonorPhotoUrl(donor.profilePhotoUrl);
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-black text-brand-700 ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={donor.fullName} className="h-full w-full object-cover" />
      ) : (
        <span>{donor.fullName.charAt(0) || '?'}</span>
      )}
    </div>
  );
}

/** Builds a `tel:` href, keeping only digits and a leading +. */
function telHref(phone?: string): string | undefined {
  const digits = (phone || '').replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : undefined;
}

export default function DonorCard({ donor }: DonorCardProps) {
  const { user, isLoading } = useAuth();
  const cardRef = useRef<HTMLElement | null>(null);
  const area = getAreaById(donor.areaId);
  const href = user ? telHref(donor.contactPhone) : undefined;
  const donationDetails = [
    `${donor.donationCount} বার রক্তদান`,
    formatLastDonation(donor.lastDonationDate),
  ].filter(Boolean);

  useEffect(() => {
    if (donor.isDemo) return;
    const card = cardRef.current;
    if (!card) return;
    if (!('IntersectionObserver' in window)) {
      trackProfileView(donor.id, 'blood-donor');
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        trackProfileView(donor.id, 'blood-donor');
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(card);
    return () => observer.disconnect();
  }, [donor.id, donor.isDemo]);
  // The readiness panel is opt-in and opens on demand. It is a separate control
  // from the call action below, which is why it sits OUTSIDE the card's `tel:`
  // link: a button nested inside an anchor is invalid, and a tap meant for the
  // detail must not place a call.

  const body = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="line-clamp-2 break-words text-[14px] font-bold leading-[1.5] text-red-700 sm:text-[15px]">
              {donor.fullName}
          </h3>
          <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-red-700 sm:text-sm">
            {donor.bloodGroup} রক্তের গ্রুপ
          </p>
        </div>
        <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
          donor.isAvailable
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-mist-200 bg-mist-100 text-ink-600'
        }`}>
          {donor.isAvailable ? 'প্রস্তুত' : 'প্রস্তুত নন'}
        </span>
      </div>

      <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-red-700 sm:text-sm">
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="truncate">{area?.nameBn || 'এলাকা জানা নেই'}</span>
      </p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {donationDetails.map((detail) => (
          <span
            key={detail}
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800"
          >
            {detail}
          </span>
        ))}
        {donor.isVerified && (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            যাচাইকৃত
          </span>
        )}
        {donor.isDemo && (
          <span className="rounded-md border border-accent-200 bg-accent-100/70 px-2 py-1 text-[11px] font-bold text-accent-700">
            নমুনা
          </span>
        )}
      </div>

      {donor.intro && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-600">{donor.intro}</p>
      )}
      {donor.publicId && (
        <p className="mt-1 font-mono text-[10px] font-bold tracking-wide text-brand-700">
          আইডি: {donor.publicId}
        </p>
      )}
    </div>
  );

  const callAction = isLoading ? (
    <span aria-hidden="true" className="mt-2.5 h-11 animate-pulse rounded-xl bg-mist-100" />
  ) : !donor.isAvailable ? (
    <span className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-mist-200 bg-mist-50 px-4 text-sm font-bold text-ink-500">
      বর্তমানে কলের জন্য প্রস্তুত নন
    </span>
  ) : !user ? (
    <Link
      href={`/login?next=${encodeURIComponent('/blood-donor')}`}
      className="mt-2.5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800"
    >
      <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
      লগইন করে নম্বর দেখুন
    </Link>
  ) : href ? (
    <a
      href={href}
      aria-label={`${donor.fullName} (${donor.bloodGroup}) — কল করুন`}
      onClick={() => {
        if (!donor.isDemo) {
          trackCtaClick({
            ctaType: 'call',
            category: 'blood-donor',
            contentId: donor.id,
            routeKind: 'directory',
          });
        }
      }}
      className="mt-2.5 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
    >
      <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span>📞 কল করুন</span>
    </a>
  ) : (
    <span className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-mist-200 bg-mist-100 px-4 text-sm font-extrabold text-ink-400">
      <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span>নম্বর শীঘ্রই যুক্ত হবে</span>
    </span>
  );

  return (
    <article
      ref={cardRef}
      className="flex h-full flex-col overflow-hidden rounded-lg border border-brand-100/90 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/8 sm:rounded-xl sm:p-3"
    >
      {body}
      {callAction}
    </article>
  );
}
