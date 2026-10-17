'use client';

import React, { useEffect, useState } from 'react';
import CatalogDetailView, {
  CatalogDetailMissing,
  ContactBlock,
  DetailSkeleton,
  type DetailFact,
} from '@/components/catalog/CatalogDetailView';
import CoachingDetailSections from '@/components/catalog/CoachingDetailSections';
import { fetchServiceListingForContact } from '@/lib/catalog-service';
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
 * Resolves a taxonomy facet into the labels a listing was actually tagged with.
 *
 * Only facets that produced a hit are shown, so a centre that teaches only
 * primary classes does not get a "বিষয়: —" row on its detail page.
 */
function taxonomyFacts(listing: ServiceListing): DetailFact[] {
  const groups: [string, { id: string; labelBn: string }[]][] = [
    ['ক্লাস', COACHING_CLASSES],
    ['বিষয়', COACHING_SUBJECTS],
    ['ক্যাটাগরি', COACHING_CATEGORIES],
  ];
  const facts: DetailFact[] = [];
  for (const [label, taxonomy] of groups) {
    const hit = taxonomy.filter((t) => listing.tags.includes(t.id)).map((t) => t.labelBn);
    if (hit.length > 0) facts.push({ label, value: hit.join(', ') });
  }
  return facts;
}

export default function CoachingDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListingForContact('coaching', slug);
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

  const fee = bnTakaRange(listing.monthlyFeeMin, listing.monthlyFeeMax);
  const contactPhone = listing.contactPhonePublic || listing.contactPhonePrivate;
  const facts: DetailFact[] = [
    ...(fee ? [{ label: 'মাসিক ফি', value: `${fee} টাকা` }] : []),
    ...(listing.addressBn ? [{ label: 'ঠিকানা', value: listing.addressBn }] : []),
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
      body={
        <CoachingDetailSections
          listingId={listing.id}
          ratingAvg={listing.ratingAvg}
          ratingCount={listing.ratingCount}
        />
      }
      action={
        <ContactBlock
          phone={contactPhone}
          hideRequestFallback
          onCopy={() => {
            if (!contactPhone) return;
            void navigator.clipboard?.writeText(contactPhone);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
        />
      }
    >
      {copied && (
        <p className="rounded-lg border border-brand-100 bg-mist-50 px-3 py-2 text-center text-[12px] font-semibold text-brand-700">
          নম্বর কপি হয়েছে
        </p>
      )}
    </CatalogDetailView>
  );
}


