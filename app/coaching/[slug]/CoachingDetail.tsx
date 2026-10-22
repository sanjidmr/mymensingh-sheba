'use client';

import React, { useEffect, useState } from 'react';
import CatalogDetailView, {
  CatalogDetailMissing,
  ContactBlock,
  DetailSkeleton,
  RelatedListings,
  type DetailFact,
} from '@/components/catalog/CatalogDetailView';
import CoachingDetailSections from '@/components/catalog/CoachingDetailSections';
import DirectoryReviews from '@/components/catalog/DirectoryReviews';
import { fetchServiceListingForContact, fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTakaRange,
  CATEGORY_UI,
  COACHING_CATEGORIES,
  COACHING_CLASSES,
  COACHING_SUBJECTS,
  toBn,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.coaching;

/**
 * Resolves class and subject tags, plus the persisted centre category.
 *
 * Only facets that produced a hit are shown, so a centre that teaches only
 * primary classes does not get a "বিষয়: —" row on its detail page.
 */
function taxonomyFacts(listing: ServiceListing): DetailFact[] {
  const groups: [string, { id: string; labelBn: string }[]][] = [
    ['ক্লাস', COACHING_CLASSES],
    ['বিষয়', COACHING_SUBJECTS],
  ];
  const categoryLabel = COACHING_CATEGORIES.find((item) => item.id === listing.coachingCategory)?.labelBn;
  const facts: DetailFact[] = categoryLabel
    ? [{ label: 'ক্যাটাগরি', value: categoryLabel }]
    : [];
  for (const [label, taxonomy] of groups) {
    const hit = taxonomy.filter((t) => listing.tags.includes(t.id)).map((t) => t.labelBn);
    if (hit.length > 0) facts.push({ label, value: hit.join(', ') });
  }
  return facts;
}

export default function CoachingDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [related, setRelated] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [data, rows] = await Promise.all([
          fetchServiceListingForContact('coaching', slug),
          // Hard-scoped to `coaching`: WiFi providers are never recommended
          // from a coaching page.
          fetchServiceListings('coaching'),
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

  const fee = bnTakaRange(listing.monthlyFeeMin, listing.monthlyFeeMax);
  const contactPhone = listing.contactPhonePublic || listing.contactPhonePrivate;
  const facts: DetailFact[] = [
    ...(fee ? [{ label: 'মাসিক ফি', value: `${fee} টাকা` }] : []),
    ...(listing.addressBn ? [{ label: 'ঠিকানা', value: listing.addressBn }] : []),
    ...(listing.admissionFee != null
      ? [{ label: 'ভর্তি ফি', value: `${bnTakaRange(listing.admissionFee, listing.admissionFee)} টাকা` }]
      : []),
    ...(listing.areaIds.length > 0
      ? [{ label: 'এলাকা', value: areaNames(listing.areaIds) }]
      : []),
    ...taxonomyFacts(listing),
    ...(listing.ratingCount && listing.ratingCount > 0
      ? [{ label: 'রেটিং', value: `${toBn((listing.ratingAvg ?? 0).toFixed(1))} / ৫ (${toBn(listing.ratingCount)})` }]
      : []),
    ...(listing.admissionInfoBn
      ? [{ label: 'ভর্তি ও ফি তথ্য', value: listing.admissionInfoBn }]
      : []),
  ];

  return (
    <CatalogDetailView
      ui={ui}
      listing={listing}
      facts={facts}
      body={<CoachingDetailSections listingId={listing.id} />}
      action={<ContactBlock phone={contactPhone} hideRequestFallback />}
      reviews={
        <DirectoryReviews
          category="coaching"
          listingId={listing.id}
          ratingAvg={listing.ratingAvg}
          ratingCount={listing.ratingCount}
        />
      }
      related={<RelatedListings title="আরও কোচিং সেন্টার" listings={related} />}
    />
  );
}
