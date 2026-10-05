'use client';

import React from 'react';
import { BadgeCheck, UserRound, CalendarDays } from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';

/**
 * OwnerProfileCard — who you are about to deal with.
 *
 * Privacy, and what is deliberately absent
 * ----------------------------------------
 * This card shows the owner's ROLE ("বিল্ডিং মালিক", "মেস ম্যানেজার"), their
 * initials, and how long they have been on the platform. It does NOT show a
 * phone number, an email, or a person's photograph:
 *
 *  - A number on this card would defeat the entire contact flow, which routes
 *    contact through a tracked request instead of a cold call.
 *  - Faces and names scraped from a listing turn a rental enquiry into an
 *    unsolicited call, and for tenants that is a safety concern, not a
 *    convenience.
 *  - Demo listings have no real person behind them at all, and a card that
 *    fabricated one would be dishonest data in a product whose whole pitch is
 *    trustworthiness.
 *
 * Verification state is shown only when the platform has actually verified it,
 * so the card degrades honestly instead of displaying a badge it did not earn.
 */
export function OwnerProfileCard({ listing }: { listing: ToletListing }) {
  const meta = listing.ownerMeta;
  const initials = meta?.initials ?? listing.ownerName?.slice(0, 2) ?? 'উ';
  const roleLabel = meta?.roleLabelBn ?? 'বিজ্ঞাপনদাতা';
  const verified = Boolean(listing.ownerVerified || listing.isVerified);

  return (
    <section
      aria-labelledby="tolet-owner-heading"
      className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5"
    >
      <h2
        id="tolet-owner-heading"
        className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink-900"
      >
        <span aria-hidden="true" className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent-400" />
        বাসার মালিক
      </h2>

      <div className="mt-3 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[15px] font-black text-brand-700 ring-1 ring-brand-100"
        >
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="truncate text-[13.5px] font-bold text-ink-900">
              {roleLabel}
            </span>
            {verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-brand-600"
                aria-label="যাচাইকৃত বিজ্ঞাপনদাতা"
              />
            )}
          </p>

          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-400">
            {meta?.memberSinceBn && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3 shrink-0" aria-hidden="true" />
                {meta.memberSinceBn}
              </span>
            )}
            <span>সরাসরি মালিকের সাথে যোগাযোগ</span>
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-mist-50 px-2.5 py-2 text-[11px] leading-relaxed text-ink-500">
        স্প্যাম ও হয়রানি রোধে মালিকের নম্বর সরাসরি প্রকাশ করা হয় না। আপনার
        যোগাযোগের অনুরোধটি প্ল্যাটফর্মের মাধ্যমে মালিকের কাছে পৌঁছাবে।
      </p>
    </section>
  );
}