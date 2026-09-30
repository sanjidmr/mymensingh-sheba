'use client';

import React, { useEffect, useState } from 'react';
import CatalogDetailView, {
  CatalogDetailMissing,
  ContactBlock,
  DetailSkeleton,
  type DetailFact,
} from '@/components/catalog/CatalogDetailView';
import { fetchServiceListingForContact } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
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

  const facts: DetailFact[] = [
    ...(listing.priceMin != null
      ? [{ label: 'মাসিক দাম', value: `${bnTaka(listing.priceMin)} টাকা` }]
      : []),
    ...(listing.speedMbps != null
      ? [{ label: 'স্পিড', value: `${toBn(listing.speedMbps)} Mbps` }]
      : []),
    ...(listing.areaIds.length > 0
      ? [{ label: 'সার্ভিস এলাকা', value: areaNames(listing.areaIds) }]
      : []),
  ];

  return (
    <CatalogDetailView
      ui={ui}
      listing={listing}
      facts={facts}
      action={<ContactBlock phone={listing.contactPhonePrivate} />}
    />
  );
}
