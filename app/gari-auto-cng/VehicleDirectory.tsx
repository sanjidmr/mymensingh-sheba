'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogDirectory, { providerGroup } from '@/components/catalog/CatalogDirectory';
import { TileCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
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
];

const SORTERS = {
  seats_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.seatCount ?? -1) - (a.seatCount ?? -1),
};

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

  const renderCard = useCallback(
    (listing: ServiceListing) => (
      <TileCard
        href={`/gari-auto-cng/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.subtitleBn}
        imageUrl={listing.imageUrl}
        areaLabel={areaNames(listing.areaIds)}
        chips={[
          listing.seatCount ? `${toBn(listing.seatCount)} সিট` : undefined,
          ...tagLabels(listing.tags),
        ]}
        badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
        isVerified
      />
    ),
    []
  );

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
    />
  );
}
