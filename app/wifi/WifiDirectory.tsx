'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CatalogDirectory, { providerGroup, rangeGroup } from '@/components/catalog/CatalogDirectory';
import { BannerCard } from '@/components/catalog/CatalogCards';
import AdminListingLink from '@/components/catalog/AdminListingLink';
import OwnerListingCta from '@/components/catalog/OwnerListingCta';
import { areaFilterGroupMulti, type FilterGroup } from '@/lib/directory-filters';
import { fetchServiceListings, fetchWifiPackagesForListings } from '@/lib/catalog-service';
import {
  areaNames,
  bnTaka,
  CATEGORY_UI,
  WIFI_PRICE_BANDS,
  WIFI_SPEED_BANDS,
  toBn,
  type ServiceListing,
  type WifiPackage,
} from '@/lib/catalog-types';

const ui = CATEGORY_UI.wifi;

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'price_asc', labelBn: 'কম দাম আগে' },
  { id: 'price_desc', labelBn: 'বেশি দাম আগে' },
  { id: 'speed_desc', labelBn: 'বেশি স্পিড আগে' },
];

const SORTERS = {
  speed_desc: (a: ServiceListing, b: ServiceListing) =>
    (b.speedMbps ?? -1) - (a.speedMbps ?? -1),
};

export default function WifiDirectory() {
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [packagesByListing, setPackagesByListing] = useState<Record<string, WifiPackage[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListings('wifi', true);
        const packages = await fetchWifiPackagesForListings(data.map((listing) => listing.id), true);
        if (active) {
          setListings(data);
          setPackagesByListing(packages);
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

  const filterGroups = useMemo<FilterGroup[]>(
    () => [
      areaFilterGroupMulti(),
      rangeGroup('speed', 'স্পিড', WIFI_SPEED_BANDS),
      rangeGroup('price', 'মাসিক দাম', WIFI_PRICE_BANDS),
      providerGroup(listings),
    ],
    [listings]
  );

  const renderCard = useCallback((listing: ServiceListing) => {
    const packages = packagesByListing[listing.id] ?? [];
    const price = packages.length > 0 ? '' : bnTaka(listing.priceMin);
    return (
      <BannerCard
        href={`/wifi/${listing.slug}`}
        title={listing.titleBn}
        subtitle={listing.subtitleBn}
        imageUrl={listing.logoUrl || listing.imageUrl}
        priceLabel={price || undefined}
        priceSuffix={price ? '/মাস' : undefined}
        packageLines={packages.map((item) =>
          `${item.speedMbps != null ? `${toBn(item.speedMbps)} Mbps` : 'স্পিড উল্লেখ নেই'} · ${item.price != null ? `${bnTaka(item.price)}/মাস` : 'দাম উল্লেখ নেই'}`
        )}
        details={[
          listing.connectionFee != null ? `সংযোগ ফি: ${bnTaka(listing.connectionFee)}` : undefined,
          listing.termsBn ? `শর্ত: ${listing.termsBn}` : undefined,
          ...packages.flatMap((item) =>
            item.connectionFee != null ? [`${item.nameBn} সংযোগ ফি: ${bnTaka(item.connectionFee)}`] : []
          ),
        ].filter((item): item is string => Boolean(item))}
        areaLabel={areaNames(listing.areaIds)}
        chips={[
          ...listing.tags,
          'যাচাইয়ের তথ্য নেই',
        ]}
        description={listing.summaryBn}
        badge={listing.isFeatured ? 'ফিচার্ড' : undefined}
        actionLabel="বিস্তারিত"
        ratingAvg={listing.ratingAvg}
        ratingCount={listing.ratingCount}
      />
    );
  }, [packagesByListing]);

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
      banner={<OwnerListingCta category="wifi" />}
      action={<AdminListingLink category="wifi" label="প্রোভাইডার যোগ করুন" />}
    />
  );
}
