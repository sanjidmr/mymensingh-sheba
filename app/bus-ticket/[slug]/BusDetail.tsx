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
  bnTaka,
  bnTakaRange,
  BUS_TYPES,
  CATEGORY_UI,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.bus;

export default function BusDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListingForContact('bus', slug);
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
    ...(listing.originBn ? [{ label: 'যাত্রার সূচি', value: listing.originBn }] : []),
    ...(listing.destinationBn
      ? [{ label: 'গন্তব্য', value: listing.destinationBn }]
      : []),
    ...(listing.fareMin != null
      ? [
          {
            label: 'এক-ওয়ে ভাড়া',
            value: `${bnTakaRange(listing.fareMin, listing.fareMax) ?? bnTaka(listing.fareMin)} টাকা`,
          },
        ]
      : []),
    ...(listing.seatCount != null
      ? [{ label: 'সিট সংখ্যা', value: String(listing.seatCount) }]
      : []),
  ];

  const busType = BUS_TYPES.find((t) => listing.tags.includes(t.id));
  if (busType) facts.push({ label: 'বাসের ধরন', value: busType.labelBn });

  return (
    <CatalogDetailView
      ui={ui}
      listing={listing}
      facts={facts}
      action={<ContactBlock phone={listing.contactPhonePrivate} />}
    />
  );
}
