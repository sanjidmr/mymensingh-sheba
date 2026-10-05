'use client';

import React from 'react';
import { Check, X } from 'lucide-react';
import { TOLET_FACILITY_OPTIONS } from '@/lib/filter-definitions';

/** id → Bangla label, built once from the single facility definition. */
const FACILITY_LABEL: Record<string, string> = {};
for (const option of TOLET_FACILITY_OPTIONS) FACILITY_LABEL[option.id] = option.labelBn;

/**
 * Resolves a facility id to its Bangla label.
 * Falls back to the raw id rather than rendering nothing, so a facility a future
 * code change introduces never disappears silently from a listing.
 */
export function facilityLabel(id: string): string {
  return FACILITY_LABEL[id] ?? id;
}

/**
 * FacilityPanels — "এই বাসায় যা যা আছে" and "এই বাসায় যা নেই".
 *
 * Why both panels, and why the second one is muted rather than hidden
 * ---------------------------------------------------------------------
 * Tenants' most common regret about local rental ads is discovering a deal
 * breaker after moving in: the gas is cylinder-only, there is no lift for the
 * fifth floor, the room is unfurnished. When an owner states those absences up
 * front the listing reads as honest and serious — and the platform looks
 * trustworthy, because it is on the tenant's side.
 *
 * So the "এই বাসায় যা যা আছে" panel is the confident one (ticks, brand green),
 * and "এই বাসায় যা নেই" is deliberately quieter: a bordered list with an ×
 * and no fill, never red. Red would read as a defect report about the house.
 * When a listing has no recorded absences the second panel is simply omitted —
 * an empty "nothing is missing" panel would be a claim the owner never made.
 *
 * The "এই বাসায় যা নেই" panel requires `unavailableFacilities` data, exactly
 * as specified; it is never inferred from the absence of an entry in
 * `facilities`.
 */
export function FacilityPanels({
  facilities,
  unavailableFacilities,
}: {
  facilities: string[];
  unavailableFacilities?: string[];
}) {
  const present = facilities.filter(Boolean);
  const missing = (unavailableFacilities ?? []).filter(Boolean);

  if (present.length === 0 && missing.length === 0) return null;

  return (
    <div className="space-y-5">
      {present.length > 0 && (
        <section aria-labelledby="tolet-facilities-present">
          <h2
            id="tolet-facilities-present"
            className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900"
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent-400"
            />
            এই বাসায় যা যা আছে
          </h2>

          <ul className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {present.map((id) => (
              <li
                key={id}
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-brand-100 bg-white px-2.5 py-2"
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-brand-600"
                  strokeWidth={3}
                  aria-hidden="true"
                />
                <span className="truncate text-[12px] font-semibold text-ink-700">
                  {facilityLabel(id)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {missing.length > 0 && (
        <section aria-labelledby="tolet-facilities-missing">
          <h2
            id="tolet-facilities-missing"
            className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900"
          >
            <span
              aria-hidden="true"
              className="h-3.5 w-[3px] shrink-0 rounded-full bg-ink-400/45"
            />
            এই বাসায় যা নেই
          </h2>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-400">
            মালিক নিজে উল্লেখ করেছেন — ভাড়াটিয়া হিসেব করার আগে জেনে রাখুন।
          </p>

          <ul className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {missing.map((id) => (
              <li
                key={id}
                className="flex min-w-0 items-center gap-1.5 rounded-lg border border-dashed border-ink-400/30 bg-mist-50 px-2.5 py-2"
              >
                <X
                  className="h-3.5 w-3.5 shrink-0 text-ink-400"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
                <span className="truncate text-[12px] font-medium text-ink-500">
                  {facilityLabel(id)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}