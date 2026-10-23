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
 * The platform fee is calculated by the same source of truth used by the
 * owner-facing and admin-facing flows, then shown separately from the rent.
 *
 * The visitor sees an explicit three-line breakdown:
 *
 *     মাসিক ভাড়া: ৳১২,০০০
 *     প্ল্যাটফর্ম ফি: ৳২০০
 *     সর্বমোট:       ৳১২,২০০
 *
 * The total is the monthly rent plus the platform fee.
 */
export function RentSummaryCard({ listing }: { listing: ToletListing }) {
  const headingId = useId();
  const monthlyRent = listing.rentPrice;
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
        সর্বমোট ভাড়া
      </h2>

      <dl className="mt-3 space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-700">মাসিক ভাড়া</dt>
          <dd className="text-[17px] font-bold leading-none tracking-tight text-ink-900">
            ৳{toBengaliDigits(monthlyRent)}
            <span className="ml-1 text-xs font-medium text-ink-600">/মাস</span>
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-700">প্ল্যাটফর্ম ফি</dt>
          <dd className="text-[15px] font-semibold leading-none text-ink-800">
            ৳{toBengaliDigits(platformFee)}
          </dd>
        </div>

        <div className="border-t border-dashed border-brand-100 pt-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm font-bold text-ink-900">সর্বমোট ভাড়া</dt>
            <dd className="text-[26px] font-black leading-none tracking-tight text-brand-800 sm:text-[28px]">
              ৳{toBengaliDigits(total)}
            </dd>
          </div>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-mist-50 px-3 py-2.5 text-[13px] leading-relaxed text-ink-700">
        <Info className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span>মাসিক ভাড়া + প্ল্যাটফর্ম ফি একসাথে মিলিয়ে মালিকের কাছে জমা দিন।</span>
      </p>

      <p className="mt-2 flex items-start gap-1.5 px-0.5 text-xs leading-relaxed text-ink-600">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span>
          ভাড়া দেওয়ার আগে ঘর, পানি ও বিদ্যুৎ সরাসরি দেখে নিন, এবং চুক্তিপত্রে
          মালিক ও ভাড়াটিয়ার দুই পক্ষের স্বাক্ষর নিন।
        </span>
      </p>
    </section>
  );
}