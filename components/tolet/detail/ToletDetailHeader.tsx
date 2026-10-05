'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, MapPin, ShieldCheck, Share2 } from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { TOLET_LISTING_STATUS_INFO } from '@/lib/tolet-types';
import { getAreaById } from '@/lib/locations';
import { ListingStatusBadge } from '@/components/tolet/ListingStatusBadge';
import { ShareButton } from '@/components/tolet/detail/ContactActions';
import { cn } from '@/lib/utils';

/**
 * ToletDetailHeader — breadcrumb, title, location line and page actions.
 *
 * Why this replaces the old `RoutePlaceholderShell` header for this page
 * --------------------------------------------------------------------
 * `RoutePlaceholderShell` is a large boxed hero: a full-width white card with
 * an `rounded-2xl` border, a 4xl title and its own generous padding. On a
 * details page that competes with the photo gallery for the top of the screen
 * and pushes the rent figure — the actual reason to open the page — below the
 * fold on a phone.
 *
 * This header follows the same rules as `DirectoryShell` instead, which is the
 * directory design language the rest of the site uses: breadcrumb as the first
 * thing after the navbar, a compact type block, no box around the title. The
 * gallery is then the first visual element, which is correct for a property.
 *
 * The share button lives in the header on desktop and sm-and-up because that is
 * where the utility row has space; on a phone the sticky bar already owns the
 * bottom of the screen and the header keeps only the essentials.
 */
export function ToletDetailHeader({
  listing,
  userId,
  isLoggedIn,
}: {
  listing: ToletListing;
  userId?: string | null;
  isLoggedIn: boolean;
}) {
  const area = getAreaById(listing.areaId);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
  const statusInfo = TOLET_LISTING_STATUS_INFO[listing.status];
  const isLive = listing.status === 'approved';

  return (
    <header className="mb-3 sm:mb-4">
      {/* Breadcrumb — first element after the navbar, one line, never wraps.

          The links carry negative vertical padding (`-my-1.5 py-1.5`) so their
          hit area reaches ~40px tall without changing the 16px visual size or
          the row's height — a bare 11px text link is effectively untappable on
          a phone. */}
      <nav
        aria-label="ব্রেডক্রাম্ব"
        className="flex items-center gap-1 overflow-hidden text-[11px] text-ink-400 sm:text-xs"
      >
        <Link
          href="/"
          className="-my-1.5 shrink-0 py-1.5 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          হোম
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-brand-200" aria-hidden="true" />
        <Link
          href="/tolet"
          className="-my-1.5 shrink-0 py-1.5 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          বাসা ভাড়া
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-brand-200" aria-hidden="true" />
        <span aria-current="page" className="truncate font-medium text-ink-600">
          {area?.nameBn ?? 'বিজ্ঞাপনের বিবরণ'}
        </span>
      </nav>

      <div className="mt-2 flex items-start justify-between gap-3 sm:mt-3">
        <div className="min-w-0 flex-1">
          {/* Type + status chips. A live listing gets no status chip — a
              "প্রকাশিত" badge on a published listing is noise. */}
          <div className="flex flex-wrap items-center gap-1.5">
            {typeInfo?.labelBn && (
              <span className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-1.5 py-[3px] text-[10.5px] font-extrabold text-brand-800">
                {typeInfo.labelBn}
              </span>
            )}
            {!isLive && (
              <ListingStatusBadge status={listing.status} />
            )}
            {listing.isVerified && isLive && (
              <span className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white px-1.5 py-[3px] text-[10.5px] font-bold text-brand-700">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                যাচাইকৃত
              </span>
            )}
          </div>

          <h1 className="mt-1.5 text-[1.2rem] font-extrabold leading-[1.3] tracking-tight text-ink-900 sm:text-[1.6rem] lg:text-[1.85rem]">
            {listing.title}
          </h1>

          <p className="mt-1 flex items-start gap-1 text-[12px] leading-relaxed text-ink-500 sm:text-[13px]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="min-w-0">
              {listing.specificAddress}
              <span className="text-ink-400">
                {' '}— {area?.nameBn ?? ''}
                {area?.wardNo ? `, ${area.wardLabelBn}` : ''}
              </span>
            </span>
          </p>
        </div>

        {/* Share: hidden on the smallest screens to keep the title block
            uncluttered; the sticky bar still carries contact actions. */}
        <div className="hidden shrink-0 sm:block">
          <ShareButton listing={listing} userId={userId} />
        </div>
      </div>

      {isLoggedIn && !isLive && statusInfo && (
        <p className="mt-2 rounded-lg border border-accent-200 bg-accent-100/60 px-2.5 py-1.5 text-[11.5px] font-medium text-accent-700">
          এই বিজ্ঞাপনটি এখনো সবার জন্য প্রকাশিত হয়নি — অবস্থা: {statusInfo.labelBn}
        </p>
      )}
    </header>
  );
}

/** Compact share row for phones, rendered under the header. */
export function ToletDetailMobileShare({
  listing,
  userId,
  className,
}: {
  listing: ToletListing;
  userId?: string | null;
  className?: string;
}) {
  return (
    <div className={cn('sm:hidden', className)}>
      <ShareButton listing={listing} userId={userId} className="w-full justify-center" />
    </div>
  );
}

export { Share2 };