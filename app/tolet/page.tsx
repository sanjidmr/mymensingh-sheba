'use client';

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { PlusCircle, MapPin, Loader2, AlertTriangle } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { fetchPublicListings } from '@/lib/tolet-service';
import { filterToletListings } from '@/lib/tolet-filters';
import type { ToletListing } from '@/lib/tolet-types';
import { getAreaById } from '@/lib/locations';
import { useAuth } from '@/lib/auth-context';
import ServiceFilterBar from '@/components/filters/ServiceFilterBar';
import EmptyFilterResults from '@/components/filters/EmptyFilterResults';
import { ToletListingCard } from '@/components/tolet/ToletListingCard';
import { COMMON_SORT_OPTIONS } from '@/lib/filter-definitions';

const RENT_PRESETS: Record<string, { min: number | undefined; max: number | undefined }> = {
  under5k: { min: 0, max: 5000 },
  '5k-10k': { min: 5000, max: 10000 },
  '10k-20k': { min: 10000, max: 20000 },
  above20k: { min: 20000, max: undefined },
};

function ToletContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, savedListings, toggleSaveItem } = useAuth();

  const initialArea = searchParams.get('area') || searchParams.get('areaId') || undefined;
  const initialType = searchParams.get('type') || 'all';
  const initialRentPreset = searchParams.get('rent') || 'all';
  const initialBedrooms = searchParams.get('beds') || 'all';
  const initialBathrooms = searchParams.get('baths') || 'all';
  const initialAvailability = searchParams.get('avail') || 'all';
  const initialSort = searchParams.get('sort') || 'newest';

  const [listings, setListings] = useState<ToletListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [guestFavorites, setGuestFavorites] = useState<Record<string, boolean>>({});

  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({
    areaId: initialArea,
    propertyType: initialType !== 'all' ? initialType : undefined,
    rentPreset: initialRentPreset !== 'all' ? initialRentPreset : undefined,
    bedrooms: initialBedrooms !== 'all' ? initialBedrooms : undefined,
    bathrooms: initialBathrooms !== 'all' ? initialBathrooms : undefined,
    availability: initialAvailability !== 'all' ? initialAvailability : undefined,
  });
  const [sortBy, setSortBy] = useState<string>(initialSort);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await fetchPublicListings();
      if (!active) return;
      setListings(data);
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setLoadError(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const savedToletIds = useMemo(() => {
    const set = new Set<string>();
    for (const item of savedListings) {
      if (item.itemType !== 'tolet') continue;
      const id = item.linkHref.split('/').filter(Boolean).pop();
      if (id) set.add(id);
    }
    return set;
  }, [savedListings]);

  const isFavorite = useCallback(
    (id: string) => savedToletIds.has(id) || !!guestFavorites[id],
    [savedToletIds, guestFavorites]
  );

  const toggleFavoriteForId = useCallback(
    (id: string, next: boolean) => {
      const listing = listings.find((l) => l.id === id);
      if (!listing) return;
      if (user) {
        const area = getAreaById(listing.areaId);
        toggleSaveItem({
          itemType: 'tolet',
          title: listing.title,
          areaName: area?.nameBn || listing.areaId,
          priceOrRate: `৳${listing.rentPrice.toLocaleString('bn-BD')}/মাস`,
          linkHref: `/tolet/${listing.id}`,
        }).catch(() => {});
      } else {
        setGuestFavorites((prev) => ({ ...prev, [id]: next }));
      }
    },
    [listings, user, toggleSaveItem]
  );

  // Synchronize URL search params
  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilterValues(newFilters);
    const params = new URLSearchParams();
    if (newFilters.areaId) params.set('area', String(newFilters.areaId));
    if (newFilters.propertyType && newFilters.propertyType !== 'all') params.set('type', String(newFilters.propertyType));
    if (newFilters.rentPreset && newFilters.rentPreset !== 'all') params.set('rent', String(newFilters.rentPreset));
    if (newFilters.bedrooms && newFilters.bedrooms !== 'all') params.set('beds', String(newFilters.bedrooms));
    if (newFilters.bathrooms && newFilters.bathrooms !== 'all') params.set('baths', String(newFilters.bathrooms));
    if (newFilters.availability && newFilters.availability !== 'all') params.set('avail', String(newFilters.availability));
    if (sortBy !== 'newest') params.set('sort', sortBy);
    const query = params.toString();
    router.replace(`/tolet${query ? `?${query}` : ''}`, { scroll: false });
  };

  const handleResetFilters = () => {
    setFilterValues({});
    setSortBy('newest');
    router.replace('/tolet', { scroll: false });
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    const params = new URLSearchParams(searchParams.toString());
    if (newSort === 'newest') params.delete('sort');
    else params.set('sort', newSort);
    const query = params.toString();
    router.replace(`/tolet${query ? `?${query}` : ''}`, { scroll: false });
  };

  const preset = RENT_PRESETS[String(filterValues.rentPreset || 'all')];

  const filteredListings = useMemo(() => {
    const fq = {
      areaId: typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined,
      propertyType:
        typeof filterValues.propertyType === 'string' ? filterValues.propertyType : undefined,
      minRent: preset?.min,
      maxRent: preset?.max,
      bedrooms: typeof filterValues.bedrooms === 'string' ? filterValues.bedrooms : undefined,
      bathrooms: typeof filterValues.bathrooms === 'string' ? filterValues.bathrooms : undefined,
      facilities: Array.isArray(filterValues.facilities)
        ? (filterValues.facilities as string[])
        : undefined,
      availability:
        typeof filterValues.availability === 'string' ? filterValues.availability : undefined,
    };
    return filterToletListings(listings, fq, sortBy);
  }, [listings, filterValues, preset, sortBy]);

  const filtersForQuery = {
    areaId: typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined,
    propertyType: typeof filterValues.propertyType === 'string' ? filterValues.propertyType : undefined,
    minRent: preset?.min,
    maxRent: preset?.max,
    bedrooms: typeof filterValues.bedrooms === 'string' ? filterValues.bedrooms : undefined,
    bathrooms: typeof filterValues.bathrooms === 'string' ? filterValues.bathrooms : undefined,
    facilities: Array.isArray(filterValues.facilities) ? (filterValues.facilities as string[]) : undefined,
    availability: typeof filterValues.availability === 'string' ? filterValues.availability : undefined,
  };

  const activeArea = getAreaById(filtersForQuery.areaId);

  return (
    <RoutePlaceholderShell
      title="বাসা ভাড়া (To-Let) — ময়মনসিংহ"
      subtitle="ময়মনসিংহ সিটি কর্পোরেশন এলাকার ফ্ল্যাট, মেস, হোস্টেল, সাবলেট ও সিট ভাড়ার সরাসরি বিজ্ঞাপন।"
      categoryBadge="বাসা ভাড়া"
      breadcrumbs={[{ label: 'বাসা ভাড়া' }]}
    >
      {/* Top Banner with Post To-Let CTA */}
      <div className="bg-emerald-800 text-white rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-xs text-emerald-200 uppercase tracking-wider font-bold block mb-1">
            মালিকদের জন্য সরাসরি পোস্ট
          </span>
          <h2 className="text-base sm:text-xl font-extrabold">
            আপনার ফ্ল্যাট, মেস বা রুম ভাড়া দিতে চান?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            একই অ্যাকাউন্ট থেকে সরাসরি টু-লেট বিজ্ঞাপন পোস্ট করুন। কোনো মধ্যস্বত্বভোগী নেই।
          </p>
        </div>

        <Link
          href="/profile/tolet/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-emerald-950 text-xs sm:text-sm font-bold hover:bg-emerald-50 transition-colors shrink-0 shadow-2xs"
        >
          <PlusCircle className="w-4 h-4 text-emerald-700" />
          <span>বাসা ভাড়া পোস্ট করুন</span>
        </Link>
      </div>

      {/* Centralized Filter Bar */}
      <ServiceFilterBar
        serviceType="tolet"
        filterValues={filterValues}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={filteredListings.length}
        sortOptions={[
          COMMON_SORT_OPTIONS.newest,
          COMMON_SORT_OPTIONS.priceAsc,
          COMMON_SORT_OPTIONS.priceDesc,
          COMMON_SORT_OPTIONS.availability,
          COMMON_SORT_OPTIONS.recent,
        ]}
        currentSort={sortBy}
        onSortChange={handleSortChange}
      />

      {loading ? (
        <div className="py-16 flex flex-col items-center gap-3 text-slate-500 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span>বাসা ভাড়ার তালিকা লোড হচ্ছে...</span>
        </div>
      ) : loadError ? (
        <div className="py-16 text-center text-sm text-rose-600 flex flex-col items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          <span>তালিকা লোড করতে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।</span>
        </div>
      ) : filteredListings.length === 0 ? (
        <EmptyFilterResults onResetFilters={handleResetFilters} areaName={activeArea?.nameBn} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredListings.map((listing) => (
            <ToletListingCard
              key={listing.id}
              listing={listing}
              isFavorite={isFavorite(listing.id)}
              onFavoriteToggle={toggleFavoriteForId}
            />
          ))}
        </div>
      )}

      {!user && !loading && (
        <p className="mt-8 text-center text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 inline-block text-emerald-700 -mt-0.5" /> লাইক করা বিজ্ঞাপনগুলো
          সংরক্ষণ করতে লগইন করুন। লগইন ছাড়াও ব্রাউজ করা যাবে।
        </p>
      )}
    </RoutePlaceholderShell>
  );
}

export default function ToletPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
          বাসা ভাড়ার তালিকা লোড হচ্ছে...
        </div>
      }
    >
      <ToletContent />
    </Suspense>
  );
}