'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BusFront, MapPin } from 'lucide-react';
import { type FilterGroup } from '@/lib/directory-filters';
import CatalogDirectory, { distinctTextGroup, rangeGroup, tagFacet } from '@/components/catalog/CatalogDirectory';
import { TileCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import { fetchServiceListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  BUS_FARE_BANDS,
  BUS_TYPES,
  CATEGORY_UI,
  tagLabels,
  toBn,
  type ServiceListing,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.bus;

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'fare_asc', labelBn: 'কম ভাড়া আগে' },
  { id: 'fare_desc', labelBn: 'বেশি ভাড়া আগে' },
];

const SORTERS = {
  fare_asc: (a: ServiceListing, b: ServiceListing) =>
    (a.fareMin ?? Number.MAX_SAFE_INTEGER) - (b.fareMin ?? Number.MAX_SAFE_INTEGER),
  fare_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.fareMin ?? -1) - (a.fareMin ?? -1),
};

export default function BusDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('bus', true);
        if (active) setListings(data);
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

  // A destination picker only makes sense on the destinations the database
  // actually holds. Deriving it from the rows (rather than a fixed city list)
  // means a reader can never pick a destination that returns nothing.
  const destinations = useMemo(
    () => Array.from(new Set(listings.map((l) => l.destinationBn).filter(Boolean) as string[])).sort(),
    [listings]
  );
  const operators = useMemo(
    () => Array.from(new Set(listings.map((l) => l.operatorBn).filter(Boolean) as string[])).sort(),
    [listings]
  );

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      // Origin and destination are free text in the database, so their facets
      // are derived from the rows that actually exist rather than from a
      // hard-coded list of routes we have no authority for.
      distinctTextGroup('origin', 'যাত্রার সূচি', listings.map((l) => l.originBn)),
      distinctTextGroup('destination', 'গন্তব্য', listings.map((l) => l.destinationBn)),
      ...(operators.length > 1
        ? [distinctTextGroup('operator', 'অপারেটর', listings.map((l) => l.operatorBn))]
        : []),
      tagFacet('busType', 'বাসের ধরন', BUS_TYPES),
      rangeGroup('fare', 'ভাড়া', BUS_FARE_BANDS),
    ],
    [listings, operators.length]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const fare = bnTaka(listing.fareMin);
    const route = [listing.originBn, listing.destinationBn].filter(Boolean).join(' → ');
    return (
      <TileCard
        href={`/bus-ticket/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.operatorBn || route || listing.subtitleBn}
        imageUrl={listing.imageUrl}
        priceLabel={fare || undefined}
        priceSuffix={fare ? 'ভাড়া' : undefined}
        areaLabel={route || areaNames(listing.areaIds)}
        chips={[
          ...tagLabels(listing.tags),
          ...(listing.travelDays ?? []),
          listing.availableTimeBn,
          'যাচাইয়ের তথ্য নেই',
        ]}
        badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
      />
    );
  }, []);

  return (
    <CatalogDirectory
      ui={ui}
      listings={listings}
      loading={loading}
      loadError={loadError}
      filterGroups={filterGroups}
      sortOptions={SORT_OPTIONS}
      sorters={SORTERS}
      renderCard={renderCard}
      action={<AdminListingLink category="bus" label="বাস যোগ করুন" />}
      renderTools={(controller) => {
        const selectedDestination = Array.isArray(controller.filterState.destination)
          ? controller.filterState.destination[0] ?? ''
          : (controller.filterState.destination as string | undefined) ?? '';
        return (
          <div className="rounded-xl border border-brand-100 bg-white p-3">
            <label htmlFor="bus-destination" className="flex items-center gap-1.5 text-[12px] font-bold text-ink-700">
              <MapPin className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
              কোথায় যাবেন? গন্তব্য বাছুন
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <BusFront className="hidden h-4 w-4 shrink-0 text-brand-500 sm:block" aria-hidden="true" />
              <select
                id="bus-destination"
                value={selectedDestination}
                onChange={(event) => {
                  const next = event.target.value;
                  controller.setFilterState({
                    ...controller.filterState,
                    destination: next ? [next] : undefined,
                  });
                }}
                className="min-h-[44px] w-full rounded-lg border border-brand-200 bg-white px-3 text-[13.5px] font-semibold text-ink-800"
              >
                <option value="">সব গন্তব্য</option>
                {destinations.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-400">
              {selectedDestination
                ? `ময়মনসিংহ থেকে ${selectedDestination}-গামী ${toBn(controller.results.length)}টি বাস`
                : 'ময়মনসিংহ থেকে ছেড়ে যাওয়া বাস, গন্তব্য অনুযায়ী সাজানো।'}
            </p>
          </div>
        );
      }}
    />
  );
}
