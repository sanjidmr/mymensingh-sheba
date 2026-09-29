'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Wrench,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import DirectoryResults, { ListingGrid } from '@/components/directory/DirectoryResults';
import ListingCard, { type ListingCardData } from '@/components/directory/ListingCard';
import ServiceRequestForm from '@/components/directory/ServiceRequestForm';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useDirectoryController } from '@/lib/use-directory-controller';
import { areaFilterGroup, type FilterGroup } from '@/lib/directory-filters';
import type { SearchableFields } from '@/lib/directory-search';
import { fetchPublicStaffProfiles } from '@/lib/staff-service';
import type { StaffProfile, StaffServiceKey } from '@/lib/staff-types';
import {
  STAFF_AVAILABILITY_LABELS,
  STAFF_SERVICE_UI,
  formatExperienceBn,
  formatSalaryBn,
} from '@/lib/staff-types';
import { getAreaById } from '@/lib/locations';

export interface RequestServicePageProps {
  serviceSlug: StaffServiceKey | string;
  title: string;
  subtitle: string;
  breadcrumbs: { label: string; href?: string }[];
  serviceTypes: { id: string; labelBn: string }[];
  serviceTypesLabel?: string;
  placeholder: string;
  /** Icon glyph key rendered on the problem tiles. */
  tileIcons?: Record<string, string>;
  showSchedule?: boolean;
  showPhoto?: boolean;
  placeholderDetails?: string;
  /** Secondary reassurance points under the form. */
  points?: string[];
  /** Profiles to list beneath the form. */
  showProfiles?: boolean;
  highlights?: string[];
}

/**
 * The layout for every service that is booked rather than browsed.
 *
 * Why the form comes first: for AC servicing, a plumbing repair or a house
 * move there is nothing to compare. The user arrives with a problem, not a
 * shopping list, so the fastest path to "someone will call me" is the first
 * thing on the page. The optional technician profiles sit below it as a
 * secondary reassurance, not as a browsable catalogue.
 *
 * The problem tiles above the form are the browse affordance — three per row on
 * mobile, as the icon-category grid requires. Tapping one preselects the
 * service type and scrolls to the form, so the tiles are a shortcut, not a
 * second navigation system.
 */
export default function RequestServicePage({
  serviceSlug,
  title,
  subtitle,
  breadcrumbs,
  serviceTypes,
  serviceTypesLabel = 'কাজ / সমস্যার ধরন',
  placeholder,
  tileIcons = {},
  showSchedule = true,
  showPhoto = true,
  placeholderDetails,
  points = [],
  showProfiles = true,
  highlights = [],
}: RequestServicePageProps) {
  const serviceUi = STAFF_SERVICE_UI[serviceSlug as StaffServiceKey];
  const wantsProfiles = showProfiles && Boolean(serviceUi);
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(wantsProfiles);
  const [selectedType, setSelectedType] = useState(serviceTypes[0]?.id ?? '');
  const formAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wantsProfiles || !serviceUi) return;
    let active = true;
    (async () => {
      try {
        const data = await fetchPublicStaffProfiles(serviceUi.key);
        if (active) setProfiles(data);
      } catch {
        if (active) setProfiles([]);
      } finally {
        if (active) setLoadingProfiles(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [wantsProfiles, serviceUi]);

  const filterGroups = useMemo<FilterGroup[]>(() => {
    const groups: FilterGroup[] = [];
    if (wantsProfiles) groups.push(areaFilterGroup());
    return groups;
  }, [wantsProfiles]);

  const searchable = useCallback(
    (p: StaffProfile): SearchableFields => ({
      title: p.nameBn,
      subtitle: p.titleBn,
      area: p.areaIds.map((id) => getAreaById(id)?.nameBn).filter(Boolean).join(' '),
      tags: p.workTypes,
      description: p.aboutBn,
    }),
    []
  );

  const matchable = useCallback((p: StaffProfile) => ({ areaIds: p.areaIds }), []);

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
        href: `/contact?service=${profile.serviceSlug}`,
        title: profile.nameBn,
        subtitle: profile.titleBn,
        imageUrl: profile.imageUrl,
        priceLabel: serviceUi?.usesSalary
          ? formatSalaryBn(profile.salaryMin, profile.salaryMax).replace(/\s*–\s*/, '–')
          : profile.rateLabel,
        chips: [
          formatExperienceBn(profile.experienceYears),
          STAFF_AVAILABILITY_LABELS[profile.availability],
          ...profile.workTypes.slice(0, 2),
        ].filter(Boolean),
        isVerified: profile.isVerified,
        badge: profile.isEmergency ? 'জরুরি সেবা' : undefined,
        badgeTone: profile.isEmergency ? ('urgent' as const) : undefined,
        areaLabel: profile.areaIds
          .slice(0, 2)
          .map((id) => getAreaById(id)?.nameBn)
          .filter(Boolean)
          .join(', '),
        actionLabel: 'যোগাযোগ করুন',
      })),
    [controller.results, serviceUi]
  );

  const pickType = (id: string) => {
    setSelectedType(id);
    formAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <DirectoryShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      highlights={highlights}
    >
      {/* Problem tiles: the browse shortcut into the form. */}
      <section aria-labelledby="pick-problem" className="mt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="pick-problem" className="text-[15px] font-extrabold text-ink-900 sm:text-base">
            {serviceTypesLabel} বেছে নিন
          </h2>
          <span className="shrink-0 text-[11px] text-ink-400">ট্যাপ করে নিচের ফর্মে যান</span>
        </div>

        <ul className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {serviceTypes.map((type) => {
            const active = selectedType === type.id;
            return (
              <li key={type.id}>
                <button
                  type="button"
                  onClick={() => pickType(type.id)}
                  aria-pressed={active}
                  className={`flex min-h-[76px] w-full flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all ${
                    active
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-brand-100 bg-white text-ink-600 hover:border-brand-300 hover:bg-mist-50'
                  } ${LIGHT_FOCUS}`}
                >
                  <Wrench
                    className={`h-4 w-4 ${active ? 'text-brand-600' : 'text-brand-400'}`}
                    aria-hidden="true"
                  />
                  <span className="line-clamp-2 text-[11px] font-bold leading-tight sm:text-xs">
                    {type.labelBn}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* The request funnel, the page's primary job. */}
      <div ref={formAnchor} className="mt-4 scroll-mt-24">
        <ServiceRequestForm
          serviceSlug={String(serviceSlug)}
          serviceLabelBn={title}
          serviceTypes={serviceTypes}
          serviceTypesLabel={serviceTypesLabel}
          showSchedule={showSchedule}
          showPhoto={showPhoto}
          placeholderDetails={placeholderDetails}
        />
      </div>

      {points.length > 0 && (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2.5 text-[12px] leading-relaxed text-ink-600"
            >
              <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>
      )}

      {/* Secondary: verified technicians, if the category has any. */}
      {wantsProfiles && (
        <section className="mt-6 border-t border-brand-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900 sm:text-base">
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
              যাচাই করা পেশাজীবী
            </h2>
            <span className="text-[11px] text-ink-400">{cards.length} জন</span>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
            ফোন নম্বর প্রকাশ করা হয় না — উপরের ফর্মে অনুরোধ দিলে অ্যাডমিন সংযুক্ত করে দেবেন।
          </p>

          <div className="mt-3">
            <DirectoryResults
              loading={loadingProfiles || controller.initialLoading}
              empty={cards.length === 0}
              count={cards.length}
              noun="পেশাজীবী"
              onReset={controller.resetAll}
              unpopulated={
                <div className="rounded-xl border border-dashed border-brand-200 bg-white px-5 py-7 text-center">
                  <p className="text-[13px] font-bold text-ink-700">এখনো কোনো প্রোফাইল নেই</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-relaxed text-ink-500">
                    উপরের ফর্মে অনুরোধ দিন — অ্যাডমিন যাচাই করে প্রোফাইল যোগ করবেন।
                  </p>
                </div>
              }
            >
              <ListingGrid>
                {cards.map((card) => (
                  <ListingCard key={card.id} item={card} variant="profile" />
                ))}
              </ListingGrid>
            </DirectoryResults>
          </div>
        </section>
      )}

      {/* Fallback for pages with no staff backend at all (AC, basha-paltano). */}
      {!wantsProfiles && (
        <section className="mt-6 rounded-xl border border-brand-100 bg-white px-4 py-5 sm:px-5">
          <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900">
            <PhoneCall className="h-4 w-4 text-brand-600" aria-hidden="true" />
            সরাসরি যোগাযোগ
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
            ফর্মে অনুরোধ দিলে অ্যাডমিন আপনার নম্বরে কল করে কাজের দাম ও সময় জানাবে।
            জরুরি প্রয়োজন হলে সরাসরি ফোন করতে চাইলে যোগাযোগ ফর্ম ব্যবহার করুন।
          </p>
          <Link
            href="/contact#contact-form"
            className={`mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-[13px] font-bold text-brand-700 transition-colors hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
          >
            যোগাযোগ ফর্ম খুলুন
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      )}
    </DirectoryShell>
  );
}
