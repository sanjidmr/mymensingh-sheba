'use client';

/**
 * গাড়ী, অটো ও CNG — the directory (`/gari-auto-cng`).
 *
 * The card leads with the two numbers that decide a hire — how many it seats and
 * what it costs per unit — because a renter comparing six vehicles on a phone
 * is not reading titles. The unit sits in `priceSuffix`, never inside
 * `priceLabel`, because "৳২,২০০" alone is a price for a kilometre and a robbery for
 * a day and the difference is one word.
 *
 * Filtering is by ধরন, এলাকা and প্রদানকারী. Sorting offers seats descending
 * alongside newest, because "which car fits six people" is a question a name
 * does not answer.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CatalogDirectory, { providerGroup } from '@/components/catalog/CatalogDirectory';
import { TileCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  bnTakaDecimal,
  CATEGORY_UI,
  tagLabels,
  toBn,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.vehicle;

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'seats_desc', labelBn: 'বেশি সিট আগে' },
  { id: 'price_asc', labelBn: 'কম দাম আগে' },
];

const SORTERS = {
  seats_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.seatCount ?? -1) - (a.seatCount ?? -1),
  price_asc: (a: ServiceListing, b: ServiceListing) =>
    (a.ratePerKm ?? a.priceMin ?? Number.POSITIVE_INFINITY) - (b.ratePerKm ?? b.priceMin ?? Number.POSITIVE_INFINITY),
};

/**
 * The figure for a card, and its unit, kept apart.
 *
 * Returns `null` when neither bound is recorded — an admin who left the price
 * blank has said "ask me", and a card that prints "আলোচনা সাপেক্ষে" over a photo
 * is more honest than a card that prints a zero.
 */
function priceParts(listing: ServiceListing): { label: string; suffix?: string } | null {
  if (listing.ratePerKm != null) {
    return { label: bnTakaDecimal(listing.ratePerKm), suffix: '/কিমি' };
  }
  const { priceMin, priceMax, priceNoteBn } = listing;
  if (priceMin == null && priceMax == null) return null;

  if (priceMin != null && priceMax != null && priceMin !== priceMax) {
    return { label: `${bnTaka(priceMin)} – ${bnTaka(priceMax)}`, suffix: priceNoteBn };
  }
  if (priceMin != null) return { label: bnTaka(priceMin), suffix: priceNoteBn };
  return { label: `${bnTaka(priceMax!)} এর কম`, suffix: priceNoteBn };
}

export default function VehicleDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('vehicle');
        if (active) setListings(data.filter((listing) => listing.tags.includes('গাড়ি')));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      areaFilterGroupMulti(listings.flatMap((listing) => listing.areaIds)),
      providerGroup(listings),
    ],
    [listings]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const price = priceParts(listing);
    return (
      <TileCard
        href={`/gari-auto-cng/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.subtitleBn}
        imageUrl={listing.imageUrl}
        publicCode={listing.publicCode}
        priceLabel={price?.label}
        priceSuffix={price?.suffix}
        areaLabel={areaNames(listing.areaIds)}
        mobileMinimal
        actionLabel="বিস্তারিত ও ভাড়ার অনুরোধ"
        chips={[
          listing.seatCount ? `${toBn(listing.seatCount)} সিট` : undefined,
          ...tagLabels(listing.tags),
          ...(listing.availableFacilities ?? []).slice(0, 2),
          'যাচাইয়ের তথ্য নেই',
        ]}
        badge={
          listing.isFeatured
            ? 'ফিচার্ড'
            : undefined
        }
        badgeTone="brand"
      />
    );
  }, []);

  return (
    <CatalogDirectory
      ui={{ ...ui, subtitle: '', highlights: [] }}
      listings={listings}
      loading={loading}
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      renderCard={renderCard}
      action={<AdminListingLink category="vehicle" label="গাড়ি যোগ করুন" />}
      banner={<VehicleBookingCards />}
      resultsHeading="গাড়ি ভাড়া করুন"
    />
  );
}

function VehicleBookingCards() {
  return (
    <section aria-label="অটো ও CNG ভাড়া" className="grid grid-cols-2 items-stretch gap-3 sm:gap-4">
      <Link
        href="/gari-auto-cng/book/auto"
        aria-label="অটো ভাড়া করুন"
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-brand-100 bg-white text-center shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-mist-100">
          <Image
            src="/auto.jpg"
            alt="অটো ভাড়া"
            fill
            sizes="(max-width: 640px) 46vw, 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </span>
        <span className="flex min-h-12 flex-1 items-center justify-center px-3 py-2 text-sm font-bold text-ink-900 sm:text-base">অটো ভাড়া করুন</span>
      </Link>
      <Link
        href="/gari-auto-cng/book/cng"
        aria-label="CNG ভাড়া করুন"
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-brand-100 bg-white text-center shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-mist-100">
          <Image
            src="/cng.jpg"
            alt="CNG ভাড়া"
            fill
            sizes="(max-width: 640px) 46vw, 280px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </span>
        <span className="flex min-h-12 flex-1 items-center justify-center px-3 py-2 text-sm font-bold text-ink-900 sm:text-base">CNG ভাড়া করুন</span>
      </Link>
    </section>
  );
}