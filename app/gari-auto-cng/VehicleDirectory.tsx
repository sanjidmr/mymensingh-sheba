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
import CatalogDirectory, { providerGroup } from '@/components/catalog/CatalogDirectory';
import { TileCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  CATEGORY_UI,
  tagLabels,
  toBn,
  VEHICLE_KINDS,
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
    (a.priceMin ?? Number.POSITIVE_INFINITY) - (b.priceMin ?? Number.POSITIVE_INFINITY),
};

/**
 * The figure for a card, and its unit, kept apart.
 *
 * Returns `null` when neither bound is recorded — an admin who left the price
 * blank has said "ask me", and a card that prints "আলোচনা সাপেক্ষে" over a photo
 * is more honest than a card that prints a zero.
 */
function priceParts(listing: ServiceListing): { label: string; suffix?: string } | null {
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
        if (active) setListings(data);
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
      areaFilterGroupMulti(),
      {
        id: 'kind',
        labelBn: 'যানের ধরন',
        type: 'multi',
        compact: true,
        options: VEHICLE_KINDS.map((k) => ({ id: k, labelBn: k })),
      },
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
        priceLabel={price?.label}
        priceSuffix={price?.suffix}
        areaLabel={areaNames(listing.areaIds)}
        chips={[
          listing.seatCount ? `${toBn(listing.seatCount)} সিট` : undefined,
          ...tagLabels(listing.tags),
        ]}
        badge={
          listing.isFeatured
            ? 'ফিচার্ড'
            : listing.isDemo
              ? 'নমুনা'
              : undefined
        }
        badgeTone={listing.isDemo && !listing.isFeatured ? 'accent' : 'brand'}
        isVerified
      />
    );
  }, []);

  // Only announced when the directory is actually showing fallback rows, so a
  // real inventory never carries a banner it did not need.
  const showingDemo = listings.length > 0 && listings.every((l) => l.isDemo);

  return (
    <CatalogDirectory
      ui={ui}
      listings={listings}
      loading={loading}
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      renderCard={renderCard}
      action={<AdminListingLink category="vehicle" label="যান যোগ করুন" />}
      banner={
        showingDemo ? (
          <p className="rounded-xl border border-accent-200 bg-accent-100/50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-accent-700">
            এখনকার ভাড়ার তালিকায় কোনো গাড়ি যোগ করা হয়নি। নিচের সবগুলো{' '}
            <strong className="font-bold">নমুনা তালিকা</strong> — বাস্তবে ভাড়া দেওয়া হয় না,
            অনুরোধ পাঠালে কোনো গাড়ির সঙ্গে যোগাযোগ হবে না।
          </p>
        ) : null
      }
    />
  );
}