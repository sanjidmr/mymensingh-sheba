'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PhoneCall, ShieldCheck, Sparkles } from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import DirectorySearchBar from '@/components/directory/DirectorySearchBar';
import DirectoryResults, { ListingGrid } from '@/components/directory/DirectoryResults';
import ListingCard, { type ListingCardData } from '@/components/directory/ListingCard';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useDirectoryController } from '@/lib/use-directory-controller';
import { areaFilterGroup, type FilterGroup } from '@/lib/directory-filters';
import type { SearchableFields } from '@/lib/directory-search';
import { fetchPublicStaffProfiles } from '@/lib/staff-service';
import {
  STAFF_AVAILABILITY_LABELS,
  STAFF_SERVICE_UI,
  STAFF_WORK_MODE_LABELS,
  formatExperienceBn,
  formatSalaryBn,
  type StaffProfile,
  type StaffServiceKey,
} from '@/lib/staff-types';
import { getAreaById } from '@/lib/locations';

export interface DirectoryPageClientProps {
  serviceKey: StaffServiceKey;
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  placeholder: string;
  workTypes: { id: string; labelBn: string }[];
  timeSlots?: { id: string; labelBn: string }[];
  variant: 'profile' | 'rental' | 'product' | 'vehicle' | 'service' | 'job';
  imageless?: boolean;
  highlights?: string[];
  filterLabel?: 'choose' | 'narrow';
}

const SORT_OPTIONS = [
  { id: 'newest', labelBn: 'নতুন আগে' },
  { id: 'price_asc', labelBn: 'কম দরে আগে' },
  { id: 'price_desc', labelBn: 'বেশি দরে আগে' },
];

/**
 * DirectoryPageClient — the browse-and-filter layout for the staff directories
 * (কাজের বুয়া today; shared shape so the other staff pages stay consistent).
 *
 * Kept as a client component because the whole result region is interactive,
 * but the shell/hero copy is passed in from the server page so metadata and the
 * no-JS first paint still show real text rather than a spinner.
 */
export default function DirectoryPageClient({
  serviceKey,
  title,
  subtitle,
  breadcrumbs,
  placeholder,
  workTypes,
  timeSlots,
  variant,
  imageless = false,
  highlights = [],
  filterLabel = 'choose',
}: DirectoryPageClientProps) {
  const serviceUi = STAFF_SERVICE_UI[serviceKey];
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchPublicStaffProfiles(serviceKey);
        if (active) setProfiles(data);
      } catch {
        if (active) setLoadError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [serviceKey]);

  // Pages build `workTypes`/`timeSlots` with an inline `.filter(...)` at the
  // call site, so their identities change on every server render. Keying the
  // memo on the serialised contents keeps `filterGroups` referentially stable,
  // which the URL-mirroring effect in `useDirectoryController` depends on —
  // otherwise each new payload would retrigger `router.replace` forever.
  const workTypesKey = JSON.stringify(workTypes);
  const timeSlotsKey = JSON.stringify(timeSlots ?? null);
  const filterGroups = useMemo<FilterGroup[]>(() => [
    areaFilterGroup(),
    {
      id: 'workType',
      labelBn: serviceUi.workTypeLabel,
      type: 'multi',
      compact: true,
      options: workTypes,
    },
    ...(timeSlots
      ? [
          {
            id: 'timeSlot',
            labelBn: 'পছন্দের সময়',
            type: 'single' as const,
            compact: true,
            options: timeSlots,
          },
        ]
      : []),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [workTypesKey, timeSlotsKey, serviceUi.workTypeLabel]);

  const searchable = useCallback(
    (p: StaffProfile): SearchableFields => ({
      title: p.nameBn,
      subtitle: p.titleBn,
      area: p.areaIds.map((id) => getAreaById(id)?.nameBn).filter(Boolean).join(' '),
      tags: p.workTypes,
      description: p.aboutBn,
      // Salary leads, so "১০০০০ টাকা খরচে কাজের বুয়া" ranks by pay band
      // rather than by experience.
      numbers: [p.salaryMax, p.salaryMin, p.experienceYears].filter(
        (n): n is number => typeof n === 'number'
      ),
    }),
    []
  );

  const matchable = useCallback(
    (p: StaffProfile) => ({
      areaIds: p.areaIds,
      ranges: { price: p.salaryMax, experience: p.experienceYears },
      values: {
        workType: p.workTypes,
        timeSlot: p.timeSlot,
        workMode: p.workMode,
        rating: '0',
      },
    }),
    []
  );

  const controller = useDirectoryController<StaffProfile>({
    items: profiles,
    searchable,
    matchable,
    filterGroups,
  });

  const cards = useMemo<ListingCardData[]>(
    () =>
      controller.results.map((profile) => ({
        id: profile.id,
        // No public phone: route the action through the contact form.
        href: `/contact?service=${profile.serviceSlug}&profile=${profile.id}`,
        title: profile.nameBn,
        subtitle: profile.titleBn,
        imageUrl: profile.imageUrl,
        priceLabel: serviceUi.usesSalary
          ? formatSalaryBn(profile.salaryMin, profile.salaryMax)
          : profile.rateLabel,
        chips: [
          formatExperienceBn(profile.experienceYears),
          STAFF_AVAILABILITY_LABELS[profile.availability],
          profile.workMode ? STAFF_WORK_MODE_LABELS[profile.workMode] : '',
        ].filter(Boolean),
        isVerified: profile.isVerified,
        badge: profile.isEmergency ? 'জরুরি' : undefined,
        badgeTone: profile.isEmergency ? ('urgent' as const) : undefined,
        areaLabel: profile.areaIds
          .slice(0, 2)
          .map((id) => getAreaById(id)?.nameBn)
          .filter(Boolean)
          .join(', '),
        actionLabel: 'যোগাযোগ করুন',
      })),
    [controller.results, serviceUi.usesSalary]
  );

  return (
    <DirectoryShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      highlights={highlights}
      action={
        <Link
          href="/contact#contact-form"
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3.5 text-[13px] font-extrabold text-brand-700 transition-colors hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
        >
          <PhoneCall className="h-4 w-4" aria-hidden="true" />
          অনুরোধ দিন
        </Link>
      }
    >
      <DirectorySearchBar
        value={controller.query}
        onChange={controller.setQuery}
        placeholder={placeholder}
        filterGroups={filterGroups}
        filterState={controller.filterState}
        onFilterStateChange={controller.setFilterState}
        resultCount={cards.length}
        resultNoun="প্রোফাইল"
        tone={filterLabel}
        sortOptions={SORT_OPTIONS}
        currentSort={controller.sort}
        onSortChange={controller.setSort}
      />

      <div className="mt-2.5">
        <DirectoryResults
          loading={loading || controller.initialLoading}
          empty={cards.length === 0}
          count={cards.length}
          noun="প্রোফাইল"
          loadingText="প্রোফাইল লোড হচ্ছে…"
          onReset={controller.resetAll}
          unpopulated={
            loading ? undefined : (
              <div className="rounded-xl border border-dashed border-brand-200 bg-white px-5 py-8 text-center">
                <span
                  aria-hidden="true"
                  className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-mist-50 text-brand-500"
                >
                  <Sparkles className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-[15px] font-extrabold text-ink-900">
                  এখনো কোনো প্রোফাইল যোগ করা হয়নি
                </h2>
                <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-ink-500">
                  আপনার চাহিদা অনুযায়ী অ্যাডমিন যাচাই করা প্রোফাইল তৈরি করে দেবেন।
                  নিচের ফর্মে তথ্য দিন।
                </p>
                <Link
                  href="/contact#contact-form"
                  className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
                >
                  অনুরোধ পাঠান
                </Link>
              </div>
            )
          }
        >
          <ListingGrid>
            {cards.map((card) => (
              <ListingCard
                key={card.id}
                item={card}
                variant={variant}
                imageless={imageless}
                fallbackLabel="কাজের বুয়া"
              />
            ))}
          </ListingGrid>
        </DirectoryResults>
      </div>

      {!loading && !loadError && cards.length > 0 && (
        <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            প্রোফাইলে ফোন নম্বর প্রকাশ করা হয় না — যোগাযোগের অনুরোধটি
            অ্যাডমিন পরিচালনা করেন, যাতে ভুল নম্বরে কেউ না পৌঁছে যায়।
          </span>
        </p>
      )}
    </DirectoryShell>
  );
}
