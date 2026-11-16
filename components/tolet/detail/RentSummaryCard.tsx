'use client';

import React, { useId } from 'react';
import type { ToletListing } from '@/lib/tolet-types';
import { toBengaliDigits } from '@/lib/bengali-numerals';

export function RentSummaryCard({ listing }: { listing: ToletListing }) {
  const headingId = useId();
  const monthlyRent = listing.rentPrice;

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
        মাসিক ভাড়া
      </h2>

      <p className="mt-3 text-[30px] font-black leading-none tracking-tight text-ink-900 sm:text-[36px]">
        ৳{toBengaliDigits(monthlyRent)}
        <span className="ml-1.5 text-sm font-semibold text-ink-600">/মাস</span>
      </p>

    </section>
  );
}