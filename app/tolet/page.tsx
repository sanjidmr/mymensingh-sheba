'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Lock, ShieldCheck, Home } from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import DirectorySearchBar from '@/components/directory/DirectorySearchBar';
import DirectoryResults, { ListingGrid } from '@/components/directory/DirectoryResults';
import ListingCard, { type ListingCardData } from '@/components/directory/ListingCard';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useDirectoryController } from '@/lib/use-directory-controller';
import { toletAreaFilterGroup, type FilterGroup } from '@/lib/directory-filters';
import type { SearchableFields } from '@/lib/directory-search';
import { fetchPublicListings } from '@/lib/tolet-service';
import type { ToletListing } from '@/lib/tolet-types';
import { getToletAreaById } from '@/lib/tolet-areas';
import {
  TOLET_PROPERTY_TYPE_INFO,
  TOLET_LISTING_STATUS_INFO,
} from '@/lib/tolet-types';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'price_asc', labelBn: 'কম ভাড়া আগে' },
  { id: 'price_desc', labelBn: 'বেশি ভাড়া আগে' },
];

const FILTER_GROUPS: FilterGroup[] = [
  toletAreaFilterGroup(),
  {
    id: 'propertyType',
    labelBn: 'বাসার ধরন',
    type: 'single',
    options: [
      { id: 'all', labelBn: 'সব ধরন' },
      ...Object.entries(TOLET_PROPERTY_TYPE_INFO).map(([id, info]) => ({
        id,
        labelBn: info.labelBn,
      })),
    ],
  },
  {
    id: 'rent',
    labelBn: 'ভাড়া / বাজেট',
    type: 'multi',
    options: [
      { id: 'under5k', labelBn: '৫,০০০ ৳ এর নিচে', min: 0, max: 5000 },
      { id: '5k-10k', labelBn: '৫–১০ হাজার', min: 5000, max: 10000 },
      { id: '10k-20k', labelBn: '১০–২০ হাজার', min: 10000, max: 20000 },
      { id: 'above20k', labelBn: '২০ হাজারের বেশি', min: 20000 },
    ],
  },
  {
    id: 'bedrooms',
    labelBn: 'রুম সংখ্যা',
    type: 'single',
    options: [
      { id: 'all', labelBn: 'যে কোনো' },
      { id: '1', labelBn: '১ রুম' },
      { id: '2', labelBn: '২ রুম' },
      { id: '3', labelBn: '৩ রুম' },
      { id: '4', labelBn: '৪+ রুম' },
    ],
  },
  {
    id: 'facilities',
    labelBn: 'সুবিধা',
    type: 'multi',
    options: [
      { id: 'wifi', labelBn: 'ওয়াইফাই' },
      { id: 'lift', labelBn: 'লিফট' },
      { id: 'gas', labelBn: 'তিতাস গ্যাস' },
      { id: 'generator', labelBn: 'জেনারেটর' },
      { id: 'water', labelBn: '২৪ ঘণ্টা পানি' },
      { id: 'balcony', labelBn: 'বারান্দা' },
      { id: 'parking', labelBn: 'পার্কিং' },
    ],
  },
];

const PLACEHOLDER =
  'এলাকা, বাজেট, সুবিধা বা প্রয়োজনীয় কিছু লিখে খুঁজুন…';

function ToletDirectory() {
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPublicListings();
        if (active) setListings(data);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const searchable = useCallback(
    (l: ToletListing): SearchableFields => {
      const area = getToletAreaById(l.areaId);
      return {
        title: l.title,
        subtitle: TOLET_PROPERTY_TYPE_INFO[l.propertyType]?.labelBn,
        area: area?.nameBn,
        address: l.specificAddress,
        priceText: `${l.rentPrice}`,
        // The area's English name + transliterations are indexed as tags so a
        // Latin query ("Senbari", "Trishal bus stand", "Golpukur par") finds a
        // listing whose stored area label is Bengali.
        tags: [
          ...l.facilities,
          l.floor || '',
          l.availableFrom || '',
          ...(area ? [area.nameEn, ...area.aliases] : []),
        ],
        description: l.description,
        // Primary price first so "৫০০০ টাকা" ranks by rent, then room counts.
        numbers: [l.rentPrice, l.bedrooms, l.bathrooms],
      };
    },
    []
  );

  const matchable = useCallback(
    (l: ToletListing) => ({
      areaIds: [l.areaId],
      ranges: { price: l.rentPrice, bedrooms: l.bedrooms },
      values: {
        propertyType: l.propertyType,
        facilities: l.facilities,
        // "4+" bucket for the room facet.
        bedrooms:
          l.bedrooms >= 4 ? '4' : String(l.bedrooms),
      },
    }),
    []
  );

  const controller = useDirectoryController<ToletListing>({
    items: listings,
    searchable,
    matchable,
    filterGroups: FILTER_GROUPS,
    paramMap: { area: 'areaId', rent: 'rent', bedrooms: 'beds' },
  });

  const cards = useMemo<ListingCardData[]>(
    () =>
      controller.results.map((listing) => {
        const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
        const statusInfo = TOLET_LISTING_STATUS_INFO[listing.status];
        const isLive = listing.status === 'approved';
        return {
          id: listing.id,
          href: `/tolet/${listing.id}`,
          title: listing.title,
          subtitle: typeInfo?.labelBn,
          imageUrl: listing.photos?.[0],
          priceLabel: `৳${toBengaliDigits(listing.rentPrice)}`,
          priceSuffix: '/মাস',
          areaLabel: getToletAreaById(listing.areaId)?.nameBn,
          chips: [
            listing.bedrooms > 0 ? `${toBengaliDigits(listing.bedrooms)} রুম` : '',
            listing.bathrooms > 0 ? `${toBengaliDigits(listing.bathrooms)} বাথ` : '',
            ...listing.facilities.slice(0, 2),
          ].filter(Boolean),
          isVerified: listing.isVerified,
          // Only surface a badge when it carries information: a live listing
          // needs none, a pending/unavailable one must not read as available.
          badge: isLive ? undefined : statusInfo?.labelBn,
          badgeTone: 'brand' as const,
          unavailableLabel: isLive ? undefined : statusInfo?.labelBn,
        };
      }),
    [controller.results]
  );

  return (
    <DirectoryShell
      title="বাসা ভাড়া (To-Let)"
      subtitle="ময়মনসিংহ সিটি কর্পোরেশন এলাকার যাচাই করা ফ্ল্যাট, মেস ও সিট ভাড়ার বিজ্ঞাপন।"
      breadcrumbs={[{ label: 'বাসা ভাড়া' }]}
      highlights={['যাচাই করা বিজ্ঞাপন', 'সরাসরি মালিকের সাথে', 'মধ্যস্বত্বভোগী নেই']}
    >
      <DirectorySearchBar
        value={controller.query}
        onChange={controller.setQuery}
        placeholder={PLACEHOLDER}
        filterGroups={FILTER_GROUPS}
        filterState={controller.filterState}
        onFilterStateChange={controller.setFilterState}
        resultCount={cards.length}
        resultNoun="বিজ্ঞাপন"
        tone="narrow"
        sortOptions={SORT_OPTIONS}
        currentSort={controller.sort}
        onSortChange={controller.setSort}
        inlineAction={
          <Link
            href="/profile/tolet/new"
            className={`inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-2 text-[11px] font-extrabold text-brand-800 transition-colors hover:bg-brand-100 sm:min-h-[42px] sm:gap-2 sm:px-3 sm:text-sm ${LIGHT_FOCUS}`}
          >
            <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap">আপনার বাসা ভাড়া দিন</span>
          </Link>
        }
      />

      <div className="mt-2.5">
        <DirectoryResults
          loading={loading || controller.initialLoading}
          empty={cards.length === 0}
          count={cards.length}
          noun="বিজ্ঞাপন"
          loadingText="বাসা ভাড়ার বিজ্ঞাপন লোড হচ্ছে…"
          onReset={controller.resetAll}
        >
          <ListingGrid>
            {cards.map((card) => (
              <ListingCard
                key={card.id}
                item={card}
                variant="rental"
                fallbackLabel="বাসা"
              />
            ))}
          </ListingGrid>
        </DirectoryResults>
      </div>

      {!loading && !loadError && cards.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            বিজ্ঞাপন বাড়াতে <Link href="/register" className="font-semibold text-brand-700 underline">অ্যাকাউন্ট খুলুন</Link>।
            লগইন করে বিজ্ঞাপন সংরক্ষণ করা যাবে — লগইন ছাড়াও সব বিজ্ঞাপন দেখা যায়।
          </span>
        </p>
      )}

      {loadError && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-red-700">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          বিজ্ঞাপন লোড করতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।
        </p>
      )}

      {/* Compact, unframed context strip — not another card. */}
      <section className="mt-5 border-t border-brand-100 pt-4">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink-900">
          <Home className="h-4 w-4 text-brand-600" aria-hidden="true" />
          ভাড়া নেওয়ার আগে যা জানা দরকার
        </h2>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[12px] leading-relaxed text-ink-500 sm:grid-cols-2 lg:grid-cols-3">
          <li>• বিজ্ঞাপন দেওয়ার আগে ঘর, পানি ও বিদ্যুৎ সরাসরি দেখে নিন।</li>
          <li>• অগ্রিম টাকার জন্য সবসময় রশিদ লিখে রাখুন।</li>
          <li>• ভাড়ার চুক্তিপত্রে মালিক ও ভাড়াটিয়ের স্বাক্ষর নিন।</li>
          <li>• কোনো মধ্যস্বত্বভোগী নেই — সরাসরি মালিকের সাথে যোগাযোগ করুন।</li>
        </ul>
      </section>
    </DirectoryShell>
  );
}

export default function ToletPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center text-sm text-ink-500">
          বাসা ভাড়ার বিজ্ঞাপন লোড হচ্ছে…
        </div>
      }
    >
      <ToletDirectory />
    </Suspense>
  );
}
