'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogDirectory, { providerGroup, rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { BannerCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import OwnerListingCta from '@/components/catalog/OwnerListingCta';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchCoachingBatchYears, fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTakaRange,
  CATEGORY_UI,
  COACHING_CATEGORIES,
  COACHING_CLASSES,
  COACHING_FEE_BANDS,
  COACHING_SUBJECTS,
  COACHING_SUBJECTS_BY_CATEGORY,
  tagLabels,
  toBn,
  type ServiceListing,
  type CoachingCategory,
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
const LEGACY_CATEGORY_IDS = new Set(['general', 'hsc', 'admission', 'university', 'government']);

export default function CoachingDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CoachingCategory | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('coaching', true);
        if (active) setListings(data);
        try {
          const yearsByListing = await fetchCoachingBatchYears(data.map((listing) => listing.id), true);
          if (active) {
            setListings(data.map((listing) => ({
              ...listing,
              coachingBatchYears: yearsByListing[listing.id] ?? [],
            })));
          }
        } catch (cause) {
          if (active) setLoadError(cause instanceof Error ? cause.message : 'ব্যাচের বছর লোড করা যায়নি।');
        }
      } catch (cause) {
        if (active) setLoadError(cause instanceof Error ? cause.message : 'তালিকা লোড করা যায়নি।');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Category is a four-choice selector above the results. Area and the remaining
  // facets are applied to that category-filtered list by the shared directory.
  const categoryListings = useMemo(
    () => selectedCategory
      ? listings.filter((listing) => listing.coachingCategory === selectedCategory)
      : listings,
    [listings, selectedCategory]
  );

  const subjectOptions = useMemo(() => {
    const standardSubjects = selectedCategory
      ? COACHING_SUBJECTS_BY_CATEGORY[selectedCategory]
      : COACHING_SUBJECTS;
    const knownSubjectIds = new Set(COACHING_SUBJECTS.map((subject) => subject.id));
    const classIds = new Set(COACHING_CLASSES.map((item) => item.id));
    const categoryIds = new Set<string>(COACHING_CATEGORIES.map((item) => item.id));
    const customSubjects = Array.from(new Set(categoryListings.flatMap((listing) =>
      listing.tags.filter((tag) =>
        !knownSubjectIds.has(tag) && !classIds.has(tag) && !categoryIds.has(tag)
      )
    ))).sort((a, b) => a.localeCompare(b, 'bn'));
    return [
      ...standardSubjects,
      ...customSubjects.map((subject) => ({ id: subject, labelBn: subject })),
    ];
  }, [categoryListings, selectedCategory]);

  const filterGroups = useMemo<FilterGroup[]>(
    () => {
      const years = Array.from(new Set(listings.flatMap((listing) => listing.coachingBatchYears ?? [])))
        .sort((a, b) => a - b);
      return [
        areaFilterGroupMulti(),
        tagFacet('class', 'ক্লাস', COACHING_CLASSES),
        tagFacet('subject', 'বিষয়', subjectOptions),
        ...(years.length > 0 ? [{
          id: 'batchYear',
          labelBn: 'ব্যাচের বছর',
          type: 'single' as const,
          options: years.map((year) => ({ id: String(year), labelBn: toBn(year) })),
        }] : []),
        rangeGroup('monthlyFee', 'মাসিক ফি', COACHING_FEE_BANDS),
        providerGroup(listings),
      ];
    },
    [listings, subjectOptions]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const fee = bnTakaRange(listing.monthlyFeeMin, listing.monthlyFeeMax);
    const categoryLabel = COACHING_CATEGORIES.find((item) => item.id === listing.coachingCategory)?.labelBn;
    return (
      <BannerCard
        href={`/coaching/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.subtitleBn}
        imageUrl={listing.imageUrl || listing.logoUrl}
        priceLabel={fee}
        priceSuffix={fee ? '/মাস' : undefined}
        areaLabel={areaNames(listing.areaIds)}
        chips={[
          ...(categoryLabel ? [categoryLabel] : []),
          ...tagLabels(listing.tags.filter((tag) => !LEGACY_CATEGORY_IDS.has(tag))),
          'যাচাইয়ের তথ্য নেই',
        ]}
        description={listing.summaryBn}
        badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
        ratingAvg={listing.ratingAvg}
        ratingCount={listing.ratingCount}
      />
    );
  }, []);

  return (
    <CatalogDirectory
      ui={ui}
      listings={categoryListings}
      loading={loading}
      loadError={loadError}
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      renderCard={renderCard}
      banner={
        <div className="space-y-3">
          <section aria-labelledby="coaching-categories-heading" className="rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-4">
            <h2 id="coaching-categories-heading" className="text-sm font-extrabold text-ink-900">
              কোচিংয়ের ক্যাটাগরি
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {COACHING_CATEGORIES.map((category) => {
                const selected = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedCategory(selected ? null : category.id)}
                    className={`min-h-11 rounded-xl border px-3 py-2 text-[12px] font-bold transition-colors ${
                      selected
                        ? 'border-brand-700 bg-brand-700 text-white'
                        : 'border-brand-200 bg-white text-ink-700 hover:bg-mist-50'
                    }`}
                  >
                    {category.labelBn}
                  </button>
                );
              })}
            </div>
          </section>
          <OwnerListingCta category="coaching" />
        </div>
      }
      action={<AdminListingLink category="coaching" label="কোচিং যোগ করুন" />}
    />
  );
}
