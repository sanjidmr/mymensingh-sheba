'use client';

import React, { useEffect, useState } from 'react';
import CatalogDetailView, {
  CatalogDetailMissing,
  ContactBlock,
  DetailSkeleton,
  RelatedListings,
  type DetailFact,
} from '@/components/catalog/CatalogDetailView';
import WifiDetailSections from '@/components/catalog/WifiDetailSections';
import DirectoryReviews from '@/components/catalog/DirectoryReviews';
import { fetchServiceListingForContact, fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  bnTakaRange,
  CATEGORY_UI,
  toBn,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.wifi;

export default function WifiDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [related, setRelated] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, rows] = await Promise.all([
          fetchServiceListingForContact('wifi', slug),
          // Hard-scoped to `wifi`: this page must never suggest a coaching
          // centre or any other category.
          fetchServiceListings('wifi'),
        ]);
        if (!active) return;
        setListing(data);
        setRelated(rows.filter((row) => row.slug !== slug).slice(0, 3));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <DetailSkeleton />;
  if (!listing) return <CatalogDetailMissing ui={ui} />;

  const contactPhone = listing.contactPhonePublic || listing.contactPhonePrivate;
  const priceRange =
    listing.priceMin != null
      ? bnTakaRange(listing.priceMin, listing.priceMax)
      : null;
  const facts: DetailFact[] = [
    ...(priceRange ? [{ label: 'মাসিক দাম', value: `${priceRange} টাকা` }] : []),
    ...(listing.speedMbps != null
      ? [{ label: 'স্পিড', value: `${toBn(listing.speedMbps)} Mbps` }]
      : []),
    ...(listing.addressBn ? [{ label: 'কভারেজ', value: listing.addressBn }] : []),
    ...(listing.areaIds.length > 0
      ? [{ label: 'সার্ভিস এলাকা', value: areaNames(listing.areaIds) }]
      : []),
    ...(listing.ratingCount && listing.ratingCount > 0
      ? [{ label: 'রেটিং', value: `${toBn((listing.ratingAvg ?? 0).toFixed(1))} / ৫ (${toBn(listing.ratingCount)})` }]
      : []),
  ];

  return (
    <CatalogDetailView
      ui={ui}
      listing={listing}
      facts={facts}
      body={
        <WifiDetailSections
          listingId={listing.id}
          connectionFee={listing.connectionFee}
          termsBn={listing.termsBn}
        />
      }
      action={<ContactBlock phone={contactPhone} hideRequestFallback />}
      reviews={
        <DirectoryReviews
          category="wifi"
          listingId={listing.id}
          ratingAvg={listing.ratingAvg}
          ratingCount={listing.ratingCount}
        />
      }
      related={<RelatedListings title="আরও WiFi প্রোভাইডার" listings={related} />}
    />
  );
}
