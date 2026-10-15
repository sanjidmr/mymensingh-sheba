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
 *   2. Are they fit to give right now?               → the availability panel
 *   3. Where are they?                              → the area line
 *   4. How do I reach them?                         → the call action, bottom
 *
 * Calling
 * -------
 * A visitor calls an approved donor DIRECTLY. No blood request, no admin in the
 * middle. Both the card itself and the কল করুন action are a single `tel:` link,
 * so tapping anywhere on the card opens the device dialer with that donor's
 * number.
 *
 * The number is NEVER printed as text. It reaches the browser only through the
 * `fn_public_donor_directory` RPC (approved rows only) so that the `tel:` href
 * can carry it; the raw `private_phone` column stays REVOKEd from the public key.
 */

import React from 'react';
import { BadgeCheck, Droplets, MapPin, Phone } from 'lucide-react';
import { resolveDonorPhotoUrl } from '@/lib/blood-donor-service';
import { donorRecovery } from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodDonorProfile } from '@/lib/supabase/types';

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
  const area = getAreaById(donor.areaId);
  const recovery = donorRecovery(donor);
  const href = telHref(donor.contactPhone);

  const body = (
    <>
      {/* Identity row: group token + name + area */}
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-brand-200 bg-brand-50 leading-none"
          aria-label={`রক্তের গ্রুপ ${donor.bloodGroup}`}
        >
          <Droplets className="mb-0.5 h-3.5 w-3.5 text-brand-600" strokeWidth={2.25} aria-hidden="true" />
          <span className="text-[15px] font-black text-brand-700">{donor.bloodGroup}</span>
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[15px] font-extrabold leading-tight text-ink-900 sm:text-base">
              {donor.fullName}
            </h3>
            {donor.isVerified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-label="অ্যাডমিন যাচাই করা" />
            )}
            {donor.isDemo && (
              <span className="shrink-0 rounded-full border border-accent-200 bg-accent-100/70 px-1.5 py-0.5 text-[11px] font-bold text-accent-700 sm:text-[10px]">
                নমুনা
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1 truncate text-[12.5px] text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{area?.nameBn || 'এলাকা জানা নেই'}</span>
            {donor.weightKg ? (
              <span className="shrink-0 text-ink-400">· {donor.weightKg} কেজি</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Availability — whether the donor is likely fit to give right now */}
      <div className="mt-3 flex items-start gap-2 rounded-xl border border-mist-200 bg-mist-50 p-2.5">
        <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${recovery.chipClassName}`}>
          {recovery.labelBn}
        </span>
        <p className="text-[12px] leading-relaxed text-ink-600">{recovery.detailBn}</p>
      </div>

      {donor.intro ? (
        <p className="mt-2.5 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600">{donor.intro}</p>
      ) : null}
    </>
  );

  // No dialable number yet → non-interactive card that says so, rather than a
  // link that leads nowhere.
  if (!href) {
    return (
      <article className="flex flex-col rounded-2xl border border-mist-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,39,31,0.04)] sm:p-4">
        {body}
        <div className="mt-3.5 pt-3.5">
          <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-mist-200 bg-mist-100 px-4 text-sm font-extrabold text-ink-400">
            <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <span>নম্বর শীঘ্রই যুক্ত হবে</span>
          </span>
        </div>
      </article>
    );
  }

  // The whole card is the call action, so tapping anywhere opens the dialer.
  return (
    <a
      href={href}
      aria-label={`${donor.fullName} (${donor.bloodGroup}) — কল করুন`}
      className="group flex flex-col rounded-2xl border border-mist-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(7,39,31,0.04)] transition-colors hover:border-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 sm:p-4"
    >
      {body}
      <div className="mt-3.5 pt-3.5">
        <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-extrabold text-white transition-colors group-hover:bg-rose-800">
          <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          <span>📞 কল করুন</span>
        </span>
      </div>
    </a>
  );
}
