'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogDirectory, { providerGroup, rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { BannerCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTakaRange,
  CATEGORY_UI,
  COACHING_CATEGORIES,
  COACHING_CLASSES,
  COACHING_FEE_BANDS,
  COACHING_SUBJECTS,
  tagLabels,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.coaching;

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'fee_asc', labelBn: 'কম ফি আগে' },
  { id: 'fee_desc', labelBn: 'বেশি ফি আগে' },
];

/**
 * Fee comparison uses the *low* end of a listed band. A centre quoted at
 * "৳500–1000" is a cheaper option than one at "৳2000", and sorting on the max
 * would mix the two ends of a range against each other.
 */
const SORTERS = {
  fee_asc: (a: ServiceListing, b: ServiceListing) =>
    (a.monthlyFeeMin ?? Number.MAX_SAFE_INTEGER) -
    (b.monthlyFeeMin ?? Number.MAX_SAFE_INTEGER),
  fee_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.monthlyFeeMin ?? -1) - (a.monthlyFeeMin ?? -1),
};

export default function CoachingDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('coaching');
        if (active) setListings(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Class / subject / centre-type are one fixed vocabulary each, so the facets
  // are static and only the "provider" facet has to wait for real data.
  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      areaFilterGroupMulti(),
      tagFacet('class', 'ক্লাস', COACHING_CLASSES),
      tagFacet('subject', 'বিষয়', COACHING_SUBJECTS),
      tagFacet('category', 'ক্যাটাগরি', COACHING_CATEGORIES),
      rangeGroup('monthlyFee', 'মাসিক ফি', COACHING_FEE_BANDS),
      providerGroup(listings),
    ],
    [listings]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const fee = bnTakaRange(listing.monthlyFeeMin, listing.monthlyFeeMax);
    return (
      <BannerCard
        href={`/coaching/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.subtitleBn}
        imageUrl={listing.imageUrl || listing.logoUrl}
        priceLabel={fee}
        priceSuffix={fee ? '/মাস' : undefined}
        areaLabel={areaNames(listing.areaIds)}
        chips={tagLabels(listing.tags)}
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
      action={<AdminListingLink category="coaching" label="কোচিং যোগ করুন" />}
    />
  );
}
