'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type FilterGroup } from '@/lib/directory-filters';
import CatalogDirectory, { distinctTextGroup, rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { TileCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  BUS_FARE_BANDS,
  BUS_TYPES,
  CATEGORY_UI,
  tagLabels,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.bus;

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'fare_asc', labelBn: 'কম ভাড়া আগে' },
  { id: 'fare_desc', labelBn: 'বেশি ভাড়া আগে' },
];

const SORTERS = {
  fare_asc: (a: ServiceListing, b: ServiceListing) =>
    (a.fareMin ?? Number.MAX_SAFE_INTEGER) - (b.fareMin ?? Number.MAX_SAFE_INTEGER),
  fare_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.fareMin ?? -1) - (a.fareMin ?? -1),
};



export default function BusDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('bus');
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
      // Origin and destination are free text in the database, so their facets
      // are derived from the rows that actually exist rather than from a
      // hard-coded list of routes we have no authority for.
      distinctTextGroup('origin', 'যাত্রার সূচি', listings.map((l) => l.originBn)),
      distinctTextGroup('destination', 'গন্তব্য', listings.map((l) => l.destinationBn)),
      tagFacet('busType', 'বাসের ধরন', BUS_TYPES),
      rangeGroup('fare', 'ভাড়া', BUS_FARE_BANDS),
    ],
    [listings]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const fare = bnTaka(listing.fareMin);
    const route = [listing.originBn, listing.destinationBn].filter(Boolean).join(' → ');
    return (
      <TileCard
        href={`/bus-ticket/${listing.slug}`}
        title={listing.titleBn}
        subtitle={route || listing.subtitleBn}
        imageUrl={listing.imageUrl}
        priceLabel={fare || undefined}
        priceSuffix={fare ? 'ভাড়া' : undefined}
        areaLabel={areaNames(listing.areaIds)}
        chips={tagLabels(listing.tags)}
        badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
        isVerified
        actionLabel="বিস্তারিত"
      />
    );
  }, []);

  return (
    <CatalogDirectory
      ui={ui}
      listings={listings}
      loading={loading}
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      renderCard={renderCard}
      action={<AdminListingLink category="bus" label="বাস যোগ করুন" />}
    />
  );
}
