'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogDirectory, { providerGroup, rangeGroup } from '@/components/catalog/CatalogDirectory';
import { BannerCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  CATEGORY_UI,
  WIFI_PRICE_BANDS,
  WIFI_SPEED_BANDS,
  toBn,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.wifi;

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'price_asc', labelBn: 'কম দাম আগে' },
  { id: 'price_desc', labelBn: 'বেশি দাম আগে' },
  { id: 'speed_desc', labelBn: 'বেশি স্পিড আগে' },
];

const SORTERS = {
  speed_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.speedMbps ?? -1) - (a.speedMbps ?? -1),
};

export default function WifiDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('wifi');
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
      rangeGroup('speed', 'স্পিড', WIFI_SPEED_BANDS),
      rangeGroup('price', 'মাসিক দাম', WIFI_PRICE_BANDS),
      providerGroup(listings),
    ],
    [listings]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const price = bnTaka(listing.priceMin);
    return (
      <BannerCard
        href={`/wifi/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.subtitleBn}
        imageUrl={listing.logoUrl || listing.imageUrl}
        priceLabel={price || undefined}
        priceSuffix={price ? '/মাস' : undefined}
        areaLabel={areaNames(listing.areaIds)}
        chips={[
          listing.speedMbps ? `${toBn(listing.speedMbps)} Mbps` : undefined,
          ...listing.tags,
        ]}
        description={listing.summaryBn}
        isVerified
        badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
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
      action={<AdminListingLink category="wifi" label="প্রোভাইডার যোগ করুন" />}
    />
  );
}
