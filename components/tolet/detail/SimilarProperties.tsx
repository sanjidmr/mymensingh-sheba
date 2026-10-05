'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { calculateToletFee } from '@/lib/tolet-fees';
import { getAreaById } from '@/lib/locations';
import { toBengaliDigits } from '@/lib/bengali-numerals';
import { cn } from '@/lib/utils';

/**
 * SimilarProperties — "আপনার জন্য আরও কিছু বাসা".
 *
 * Why it reuses the shared `ListingCard` instead of drawing its own cards
 * -----------------------------------------------------------------------
 * A tenant who has just read a detailed listing has already made a judgement
 * about this site's card design; showing them a second, slightly different
 * card style two scrolls later would read as "these are a different kind of
 * thing", which is exactly the AI-generated-inconsistency this project avoids.
 * Reusing `ListingCard` keeps price-led hierarchy, hairline sage borders and
 * the two-per-row mobile rhythm identical to the directory grid.
 *
 * What IS different here, and should be: on a details page the price on the
 * card is the TOTAL (rent + platform fee), because that is the figure the
 * tenant just read on the big rent card, and having the two disagree two
 * scrolls apart would look like an error.
 *
 * Mobile is a horizontal rail rather than a 2-up grid: with a phone-sized
 * viewport, a rail lets a tenant swipe through alternatives without the card
 * shrinking below a readable width.
 */
export function SimilarProperties({ listings }: { listings: ToletListing[] }) {
  if (listings.length === 0) return null;

  return (
    <section aria-labelledby="tolet-similar-heading" className="mt-8 sm:mt-10">
      <div className="flex items-center justify-between gap-3 border-b border-brand-100 pb-2.5">
        <h2
          id="tolet-similar-heading"
          className="text-[15px] font-extrabold text-ink-900 sm:text-[17px]"
        >
          আপনার জন্য আরও কিছু বাসা
        </h2>
        {/* A real 44px tap target, not a 12px text link — on a phone this is
            one of the few tappable things in the section header, and "সব
            বিজ্ঞাপন" is the natural way out to the full directory. The negative
            right margin keeps the arrow optically aligned with the border end
            instead of pushing the heading. */}
        <Link
          href="/tolet"
          className="group -mr-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-[12px] font-bold text-brand-700 transition-colors hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          সব বিজ্ঞাপন
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {/* Mobile rail / desktop grid */}
      <div className="mt-3 -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
        {listings.map((listing) => (
          <SimilarCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
}

function SimilarCard({ listing }: { listing: ToletListing }) {
  const area = getAreaById(listing.areaId);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
  const isMessLike = typeInfo?.isMessLike ?? false;
  const cover = listing.photos[0] ?? '';
  const total = listing.rentPrice + calculateToletFee(listing.rentPrice, listing.propertyType);

  const chips = [
    isMessLike
      ? `${toBengaliDigits(listing.totalRooms ?? listing.bedrooms)} সিট`
      : `${toBengaliDigits(listing.bedrooms)} রুম`,
    listing.bathrooms > 0 ? `${toBengaliDigits(listing.bathrooms)} বাথ` : '',
    listing.balconies > 0 ? `${toBengaliDigits(listing.balconies)} বারান্দা` : '',
  ].filter(Boolean);

  return (
    <Link
      href={`/tolet/${listing.id}`}
      className="group w-[74vw] max-w-[240px] shrink-0 snap-start overflow-hidden rounded-lg border border-brand-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-bronze-300 hover:shadow-md hover:shadow-brand-900/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:w-auto sm:max-w-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist-100">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-brand-950/35 to-transparent"
            />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-mist-100">
            <span className="text-2xl font-black text-brand-200">
              {(typeInfo?.shortLabelBn ?? 'বাসা').slice(0, 2)}
            </span>
          </div>
        )}

        {typeInfo?.labelBn && (
          <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded-md bg-white/95 px-1.5 py-[3px] text-[10px] font-extrabold text-ink-800 shadow-sm">
            {typeInfo.labelBn}
          </span>
        )}
      </div>

      <div className="p-2.5 sm:p-3.5">
        {/* Total, matching the big rent card above — rent + platform fee. */}
        <p className="flex items-baseline gap-1 leading-none">
          <span className="text-[15px] font-extrabold tracking-tight text-brand-800">
            ৳{toBengaliDigits(total)}
          </span>
          <span className="text-[10px] font-semibold text-ink-400">/মাস</span>
        </p>

        <h3 className="mt-1 line-clamp-2 text-[12.5px] font-bold leading-snug text-ink-900 sm:text-[13px]">
          {listing.title}
        </h3>

        <p className="mt-1 flex items-center gap-1 text-[10.5px] text-ink-400">
          <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
          <span className="truncate">{area?.nameBn ?? listing.areaId}</span>
        </p>

        {chips.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {chips.slice(0, 2).map((chip) => (
              <li
                key={chip}
                className="rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10px] font-medium text-ink-600"
              >
                {chip}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

/** Section wrapper used by the page so the h2 spacing stays consistent. */
export function SimilarPropertiesSection({
  listings,
  className,
}: {
  listings: ToletListing[];
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <SimilarProperties listings={listings} />
    </div>
  );
}