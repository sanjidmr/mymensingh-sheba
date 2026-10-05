'use client';

/**
 * CatalogDirectory — the shared listing page for the four ADMIN-curated
 * directories (coaching, wifi, bus, vehicle).
 *
 * These four pages are the same interaction with different vocabulary, so they
 * share one component: search, "বেছে নিন" filter, sort, a per-category card
 * grid, and an honest empty state. The only per-category differences are the
 * filter groups, the card mapping and the grid columns, all of which arrive as
 * data.
 *
 * It deliberately reuses the existing `useDirectoryController`,
 * `DirectorySearchBar` and `DirectoryResults` so URL-shared filter state, the
 * filter sheet and the site-wide search behaviour stay identical to /tolet and
 * /kajer-bua.
 */
import React, { useCallback, useMemo, useState } from 'react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import DirectorySearchBar from '@/components/directory/DirectorySearchBar';
import DirectoryResults from '@/components/directory/DirectoryResults';
import { useDirectoryController } from '@/lib/use-directory-controller';
import type { MatchableRecord } from '@/lib/directory-filters';
import type { FilterGroup } from '@/lib/directory-filters';
import type { SearchableFields } from '@/lib/directory-search';
import { getAreaById } from '@/lib/locations';
import {
  categoryGridClass,
  tagLabels,
  type CategoryUiConfig,
  type PriceBand,
  type ServiceListing,
} from '@/lib/catalog-types';

export interface CatalogDirectoryProps {
  ui: CategoryUiConfig;
  listings: ServiceListing[];
  loading: boolean;
  /** Facet declarations for this category. */
  filterGroups: FilterGroup[];
  sortOptions: { id: string; labelBn: string }[];
  /** Page-specific sort orders. MUST be memoized at the call site. */
  sorters: Record<string, (a: ServiceListing, b: ServiceListing) => number>;
  /** Maps a listing to the card the page wants. */
  renderCard: (listing: ServiceListing) => React.ReactNode;
  /** Header action, e.g. an admin "add" link. */
  action?: React.ReactNode;
  /**
   * Optional notice between the header and the search bar.
   *
   * Used by the categories that can fall back to demo rows, to say so. It lives
   * here rather than at the call site because `CatalogDirectory` owns the whole
   * page frame including the Navbar — a sibling node rendered by the caller
   * would land above the navbar, not above the results.
   */
  banner?: React.ReactNode;
}

export default function CatalogDirectory({
  ui,
  listings,
  loading,
  filterGroups,
  sortOptions,
  sorters,
  renderCard,
  action,
  banner,
}: CatalogDirectoryProps) {
  const searchable = useCallback(
    (item: ServiceListing): SearchableFields => ({
      title: item.titleBn,
      subtitle: item.subtitleBn,
      area: item.areaIds.map((id) => getAreaById(id)?.nameBn ?? '').join(' '),
      // Facets store the taxonomy slug, so the index has to carry the Bangla
      // label too — otherwise searching "গণিত" would miss a centre tagged
      // `math`. Both are included: slug for typed English, label for Bangla.
      tags: [...item.tags, ...tagLabels(item.tags)],
      description: item.descriptionBn ?? item.summaryBn ?? '',
      numbers: [
        item.monthlyFeeMax,
        item.monthlyFeeMin,
        item.priceMax,
        item.priceMin,
        item.fareMax,
        item.fareMin,
        item.speedMbps,
      ].filter((n): n is number => typeof n === 'number'),
    }),
    []
  );

  const matchable = useCallback(
    (item: ServiceListing): MatchableRecord => ({
      areaIds: item.areaIds,
      // Group id -> the number a `range` group compares against.
      ranges: {
        monthlyFee: item.monthlyFeeMax ?? item.monthlyFeeMin,
        price: item.priceMax ?? item.priceMin,
        speed: item.speedMbps,
        fare: item.fareMax ?? item.fareMin,
      },
      values: {
        // `all` is the "no constraint" sentinel the filter sheet writes.
        provider: item.titleBn,
        area: item.areaIds.map((id) => getAreaById(id)?.nameBn ?? '').join(', '),
        // Every taxonomy facet of a curated listing resolves against the same
        // `tags` array, so each group id points at it. The generic matcher
        // tests membership, so a listing tagged `math` satisfies a `math`
        // selection and ignores a `chemistry` one.
        class: item.tags,
        subject: item.tags,
        category: item.tags,
        busType: item.tags,
        // Vehicle kind is written into `tags` as its Bengali label, so the facet
        // ids are those labels.
        kind: item.tags,
        // Free-text route facets, built from the rows that exist rather than a
        // hard-coded route list.
        origin: item.originBn,
        destination: item.destinationBn,
      },
    }),
    []
  );

  const controller = useDirectoryController<ServiceListing>({
    items: listings,
    searchable,
    matchable,
    filterGroups,
    sorters,
  });

  return (
    <DirectoryShell
      title={ui.title}
      subtitle={ui.subtitle}
      breadcrumbs={[{ label: ui.title }]}
      highlights={ui.highlights}
      action={action}
    >
      {banner ? <div className="mb-3">{banner}</div> : null}

      <DirectorySearchBar
        value={controller.query}
        onChange={controller.setQuery}
        placeholder={ui.placeholder}
        filterGroups={filterGroups}
        filterState={controller.filterState}
        onFilterStateChange={controller.setFilterState}
        resultCount={controller.results.length}
        resultNoun={ui.noun}
        tone="choose"
        sortOptions={sortOptions}
        currentSort={controller.sort}
        onSortChange={controller.setSort}
      />

      <div className="mt-2.5">
        <DirectoryResults
          loading={loading}
          empty={controller.results.length === 0}
          count={controller.results.length}
          noun={ui.noun}
          loadingText="তালিকা লোড হচ্ছে…"
          onReset={controller.resetAll}
          unpopulated={<UnpopulatedState ui={ui} hasAnyData={listings.length > 0} />}
        >
          <div className={categoryGridClass(ui)}>
            {controller.results.map((listing) => (
              <React.Fragment key={listing.id}>{renderCard(listing)}</React.Fragment>
            ))}
          </div>
        </DirectoryResults>
      </div>
    </DirectoryShell>
  );
}

/**
 * The honest empty state.
 *
 * Two distinct cases, because they need different words:
 *  - the directory has rows but the filters hid them -> offer a reset
 *  - the directory genuinely has no rows yet -> say so, and (admin-owned pages)
 *    point the admin at the console instead of pretending content is coming
 */
function UnpopulatedState({
  ui,
  hasAnyData,
}: {
  ui: CategoryUiConfig;
  hasAnyData: boolean;
}) {
  if (hasAnyData) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-brand-200 bg-white px-5 py-10 text-center">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-mist-50 text-brand-500"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </span>
        <h2 className="mt-3 text-base font-extrabold text-ink-900">
          আপনার খোঁজার মতো কোনো তথ্য পাওয়া যায়নি।
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-500">
          সার্চ বা ফিল্টারের শর্ত বদলে দেখুন, অথবা সব ফিল্টার মুছে আবার চেষ্টা করুন।
        </p>
        <CatalogResetHint label="সব ফিল্টার মুছুন" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white px-5 py-8 text-center">
      <h2 className="text-base font-extrabold text-ink-900">
        এখনো কোনো {ui.noun} যোগ করা হয়নি
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-500">
        {ui.adminOwned
          ? 'এই তালিকাটি অ্যাডমিন পরিচালনা করেন। যাচাই করা তথ্য যোগ করা হলে এখানে দেখা যাবে।'
          : 'এখনো কোনো তথ্য যোগ করা হয়নি।'}
      </p>
      {ui.adminOwned && (
        <p className="mx-auto mt-3 max-w-md rounded-lg border border-brand-100 bg-mist-50 px-3 py-2 text-[11.5px] leading-relaxed text-ink-500">
          অ্যাডমিন? কনসোল থেকে যাচাই করা তথ্য যোগ করুন — নকল কোনো তথ্য এখানে দেখানো হয় না।
        </p>
      )}
      <CatalogResetHint label="সব ফিল্টার মুছুন" />
    </div>
  );
}

function CatalogResetHint({ label }: { label: string }) {
  return (
    <p className="mt-3 text-[11.5px] text-ink-400">
      ফিল্টার মুছতে উপরের <span className="font-semibold text-ink-600">{label}</span> ব্যবহার
      করুন।
    </p>
  );
}

// ---------------------------------------------------------------------------
// Shared facet factories, so the four pages cannot drift apart
// ---------------------------------------------------------------------------

/** A numeric range facet (fee, price, speed, fare). */
export function rangeGroup(
  id: string,
  labelBn: string,
  bands: PriceBand[]
): FilterGroup {
  return { id, labelBn, type: 'range', options: bands };
}

/**
 * A multi-select facet whose values live in a listing's `tags` array.
 * Used by coaching for class / subject / category.
 */
export function tagFacet(
  id: string,
  labelBn: string,
  taxonomy: { id: string; labelBn: string }[]
): FilterGroup {
  return {
    id,
    labelBn,
    type: 'multi',
    compact: true,
    optionsAreTaxonomy: true,
    options: taxonomy.map((t) => ({ id: t.id, labelBn: t.labelBn })),
  };
}

/** A "provider / name" facet derived from the rows actually in the database. */
export function providerGroup(listings: ServiceListing[]): FilterGroup {
  const names = Array.from(new Set(listings.map((l) => l.titleBn))).sort();
  return {
    id: 'provider',
    labelBn: 'প্রোভাইডার',
    type: 'single',
    options: [
      { id: 'all', labelBn: 'সব প্রোভাইডার' },
      ...names.map((n) => ({ id: n, labelBn: n })),
    ],
  };
}

/**
 * A free-text facet for values that are not a fixed taxonomy (bus origin /
 * destination, for example) — the options are whatever the database holds.
 */
export function distinctTextGroup(
  id: string,
  labelBn: string,
  values: (string | undefined)[]
): FilterGroup {
  const unique = Array.from(new Set(values.filter(Boolean) as string[])).sort();
  return {
    id,
    labelBn,
    type: 'multi',
    compact: true,
    options: unique.map((v) => ({ id: v, labelBn: v })),
  };
}
