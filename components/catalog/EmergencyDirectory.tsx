'use client';

/**
 * The four emergency contact pages.
 *
 * These are the pages that most must not be empty or vague. A reader in
 * Mymensingh needs the *local* upazila police station, the nearest fire unit,
 * an ambulance that actually answers — not a national hotline. So:
 *
 *  - numbers come only from `emergency_contacts`, which admins curate
 *  - a row with no verified number shows a request button, never a substitute
 *  - no local list is ever invented, and no national number is used as filler
 *  - the page is honest when the district has not been entered yet
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import { ContactRow } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { fetchEmergencyContacts } from '@/lib/catalog-service';
import {
  areaNames,
  EMERGENCY_UI,
  toBn,
  type EmergencyContact,
  type EmergencyService,
} from '@/lib/catalog-types';
import { areaFilterGroupMulti, type MatchableRecord } from '@/lib/directory-filters';
import { useDirectoryController } from '@/lib/use-directory-controller';
import type { SearchableFields } from '@/lib/directory-search';
import { getAreaById } from '@/lib/locations';

export default function EmergencyDirectory({ service }: { service: EmergencyService }) {
  const ui = EMERGENCY_UI[service];
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchEmergencyContacts(service);
        if (active) setContacts(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [service]);

  const filterGroups = useMemo(() => [areaFilterGroupMulti()], []);

  const searchable = useCallback(
    (c: EmergencyContact): SearchableFields => ({
      title: c.nameBn,
      area: c.areaId ? (getAreaById(c.areaId)?.nameBn ?? '') : '',
      description: [c.organizationBn, c.addressBn, c.sourceNote]
        .filter(Boolean)
        .join(' '),
    }),
    []
  );

  const matchable = useCallback(
    (c: EmergencyContact): MatchableRecord => ({
      areaIds: c.areaId ? [c.areaId] : [],
    }),
    []
  );

  const controller = useDirectoryController<EmergencyContact>({
    items: contacts,
    searchable,
    matchable,
    filterGroups,
  });

  const results = controller.results;
  const areaGroup = filterGroups[0];
  const selectedAreas = controller.filterState.areas;
  // The group is `multi` (a shared group across directories), but a single
  // select is the right control here, so the first entry is the one on offer.
  const selectedArea = Array.isArray(selectedAreas) ? selectedAreas[0] ?? '' : '';

  function selectArea(value: string) {
    controller.setFilterState({ ...controller.filterState, areas: value ? [value] : [] });
  }

  return (
    <DirectoryShell
      title={ui.title}
      subtitle={ui.subtitle}
      breadcrumbs={[{ label: ui.title }]}
      highlights={ui.highlights}
    >
      {/*
        A compact search row plus an inline area select, rather than the full
        sort/filter bar. Area is the only useful facet on an emergency page, and
        burying a single checkbox grid behind a "বেছে নিন" button is friction
        without benefit — a reader in a hurry wants to type an upazila and tap
        it. The select drives the same `areas` filter group the shared matcher
        reads, so it composes with search exactly like the drawer would.
      */}
      <div className="mb-3 grid grid-cols-[1fr_auto] gap-2 sm:max-w-md">
        <label htmlFor={`${service}-search`} className="sr-only">
          {ui.title} খুঁজুন
        </label>
        <input
          id={`${service}-search`}
          type="search"
          value={controller.query}
          onChange={(e) => controller.setQuery(e.target.value)}
          placeholder={ui.placeholder}
          className={`min-h-[44px] w-full rounded-lg border border-brand-100 bg-white px-3 text-sm outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 ${LIGHT_FOCUS}`}
        />
        <label htmlFor={`${service}-area`} className="sr-only">
          এলাকা
        </label>
        <select
          id={`${service}-area`}
          value={selectedArea}
          onChange={(e) => selectArea(e.target.value)}
          className={`min-h-[44px] rounded-lg border border-brand-100 bg-white px-2.5 text-sm font-medium text-ink-700 outline-none transition-colors focus:border-brand-500 ${LIGHT_FOCUS}`}
        >
          <option value="">সব এলাকা</option>
          {areaGroup.options.map((area) => (
            <option key={area.id} value={area.id}>
              {area.labelBn}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="h-32 animate-pulse rounded-xl bg-mist-100"
              aria-hidden="true"
            />
          ))}
        </ul>
      ) : results.length === 0 ? (
        <EmergencyEmpty ui={ui} hasAnyData={contacts.length > 0} />
      ) : (
        <>
          <p className="mb-2.5 text-[12px] font-semibold text-ink-500">
            {ui.noun} {toBn(results.length)}টি পাওয়া গেছে
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {results.map((contact) => (
              <li key={contact.id}>
                <ContactRow
                  name={contact.nameBn}
                  organization={contact.organizationBn}
                  areaLabel={contact.areaId ? areaNames([contact.areaId]) : undefined}
                  address={contact.addressBn}
                  phone={contact.phone}
                  // The source note is the trust signal here: it records where
                  // the admin got the number, which is what makes a curated
                  // directory auditable rather than a rumour mill.
                  notes={contact.sourceNote}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-4 rounded-lg border border-brand-100 bg-white px-3 py-2.5 text-[11.5px] leading-relaxed text-ink-500">
        {ui.disclaimer}
      </p>
    </DirectoryShell>
  );
}

function EmergencyEmpty({
  ui,
  hasAnyData,
}: {
  ui: (typeof EMERGENCY_UI)[EmergencyService];
  hasAnyData: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-white px-5 py-8 text-center">
      <h2 className="text-base font-extrabold text-ink-900">
        {hasAnyData ? 'আপনার খোঁজার মতো কোনো তথ্য পাওয়া যায়নি।' : `${ui.title} তালিকা এখনো যোগ করা হয়নি`}
      </h2>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-500">
        {hasAnyData
          ? 'অন্য কোনো শব্দ বা এলাকা দিয়ে খুঁজে দেখুন।'
          : 'অ্যাডমিন যাচাই করা তথ্য যোগ করা হলে এখানে দেখা যাবে। নিজে থেকে কোনো নম্বর বসানো হয় না।'}
      </p>
      <a
        href="/contact#contact-form"
        className={`mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
      >
        তথ্য জানান / অনুরোধ পাঠান
      </a>
    </div>
  );
}
