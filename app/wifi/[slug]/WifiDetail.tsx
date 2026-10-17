'use client';

import React, { useEffect, useState } from 'react';
import CatalogDetailView, {
  CatalogDetailMissing,
  ContactBlock,
  DetailSkeleton,
  type DetailFact,
} from '@/components/catalog/CatalogDetailView';
import WifiDetailSections from '@/components/catalog/WifiDetailSections';
import { fetchServiceListingForContact } from '@/lib/catalog-service';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListingForContact('wifi', slug);
        if (active) setListing(data);
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
    ...(listing.connectionFee != null
      ? [{ label: 'সংযোগ ফি', value: `${bnTaka(listing.connectionFee)} টাকা` }]
      : []),
    ...(listing.addressBn ? [{ label: 'কভারেজ', value: listing.addressBn }] : []),
    ...(listing.areaIds.length > 0
      ? [{ label: 'সার্ভিস এলাকা', value: areaNames(listing.areaIds) }]
      : []),
    ...(listing.ratingCount && listing.ratingCount > 0
      ? [{ label: 'রেটিং', value: `${toBn((listing.ratingAvg ?? 0).toFixed(1))} / ৫ (${toBn(listing.ratingCount)})` }]
      : []),
    ...(listing.termsBn ? [{ label: 'সংযোগের শর্ত', value: listing.termsBn }] : []),
  ];

  return (
    <CatalogDetailView
      ui={ui}
      listing={listing}
      facts={facts}
      body={
        <WifiDetailSections
          listingId={listing.id}
          ratingAvg={listing.ratingAvg}
          ratingCount={listing.ratingCount}
        />
      }
      action={<ContactBlock phone={contactPhone} hideRequestFallback />}
    />
  );
}
