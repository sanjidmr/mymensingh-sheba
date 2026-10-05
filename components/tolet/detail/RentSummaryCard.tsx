'use client';

import React, { useId } from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';
import { calculateToletFee } from '@/lib/tolet-fees';
import { toBengaliDigits } from '@/lib/bengali-numerals';

/**
 * RentSummaryCard — the money box.
 *
 * The product decision this component encodes
 * --------------------------------------------
 * The platform fee IS calculated (`calculateToletFee`, the same single source of
 * truth the owner was quoted and the admin configures) and IS included in the
 * total the tenant will hand over — but it is NEVER itemised for the tenant.
 *
 * The visitor sees exactly two lines:
 *
 *     মাসিক ভাড়া: ৳১২,০০০
 *     সর্বমোট:     ৳১২,২০০
 *
 * followed by a plain sentence saying the total includes the platform fee and
 * is what goes to the owner. No "প্ল্যাটফর্ম ফি: ৳২০০" line, no tooltip, no
 * "details" disclosure.
 *
 * Why: a marketplace that itemises its own cut in the tenant's face is asking
 * the tenant to fund it visibly, and the most likely response is to leave the
 * site and text the owner directly — losing the platform fee AND the tenant's
 * trust. One honest total with a clear sentence about what it covers is both
 * more trustworthy and more profitable. The owner-facing and admin-facing
 * surfaces still see the itemised fee; only the tenant view hides it.
 *
 * Typography carries the hierarchy: the monthly rent is the number people came
 * for, the total is the number they must pay, and the total is deliberately the
 * larger of the two because it is the number that has to leave their pocket.
 */
export function RentSummaryCard({ listing }: { listing: ToletListing }) {
  const headingId = useId();
  const monthlyRent = listing.rentPrice;
  // Calculated, never displayed. Kept as a named const so the intent survives
  // review: the fee is applied, it is simply not itemised for the tenant.
  const platformFee = calculateToletFee(monthlyRent, listing.propertyType);
  const total = monthlyRent + platformFee;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5"
    >
      <h2
        id={headingId}
        className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-900"
      >
        <span aria-hidden="true" className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent-400" />
        ভাড়া ও মোট পরিমাণ
      </h2>

      <dl className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-[12.5px] text-ink-500">মাসিক ভাড়া</dt>
          <dd className="text-[17px] font-bold leading-none tracking-tight text-ink-900">
            ৳{toBengaliDigits(monthlyRent)}
            <span className="ml-1 text-[11px] font-medium text-ink-400">/মাস</span>
          </dd>
        </div>

        <div className="border-t border-dashed border-brand-100 pt-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[12.5px] font-bold text-ink-900">সর্বমোট</dt>
            <dd className="text-[26px] font-black leading-none tracking-tight text-brand-800 sm:text-[28px]">
              ৳{toBengaliDigits(total)}
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-mist-50 px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-500">
        <Info className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span>Platform fee-সহ এই মোট পরিমাণটি বাসার মালিককে প্রদান করতে হবে।</span>
      </p>

      <p className="mt-2 flex items-start gap-1.5 px-0.5 text-[11px] leading-relaxed text-ink-400">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span>
          ভাড়া দেওয়ার আগে ঘর, পানি ও বিদ্যুৎ সরাসরি দেখে নিন, এবং চুক্তিপত্রে
          মালিক ও ভাড়াটিয়ার দুই পক্ষের স্বাক্ষর নিন।
        </span>
      </p>
    </section>
  );
}