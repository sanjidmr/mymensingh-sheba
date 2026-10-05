'use client';

/**
 * Vehicle gallery, spec grid and pricing panel for `/gari-auto-cng/[slug]`.
 *
 * The rule running through all three: print what is in the row and nothing
 * else. A vehicle hire is a purchase decision, so an empty field is not a
 * cosmetic problem — a reader who is not told the car has air-conditioning will
 * assume it does, and find out at ৳8,000 km. Where a value is genuinely unknown
 * (the admin never recorded it) the grid says "জানা নেই" rather than omitting
 * the row, because a missing row is indistinguishable from an unimportant one.
 *
 * The one place that rule is bent is `has_ac` / `driver_included`, which are
 * nullable booleans rather than strings precisely so "not recorded" can be told
 * apart from "recorded as no".
 */

import React, { useState } from 'react';
import {
  Armchair,
  Bus,
  CalendarClock,
  Car,
  Clock,
  Gauge,
  KeyRound,
  MapPin,
  Users,
  Wind,
} from 'lucide-react';
import type { ServiceListing, VehicleKind } from '@/lib/catalog-types';
import { areaNames, toBn, bnTaka } from '@/lib/catalog-types';

// ---------------------------------------------------------------------------
// Gallery
// ---------------------------------------------------------------------------

/**
 * One large photo plus a thumbnail strip.
 *
 * A vehicle listing has several angles or it has none — and if a row only stored
 * one image, `photos` is absent and this renders a single hero with no strip
 * rather than a strip of one, which looks broken.
 */
export function VehicleGallery({ listing }: { listing: ServiceListing }) {
  // `photos` holds the full set when present; otherwise the cover is all there is.
  const shots = listing.photos && listing.photos.length > 0 ? listing.photos : listing.imageUrl ? [listing.imageUrl] : [];
  const [active, setActive] = useState(0);

  if (shots.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center bg-mist-100">
        <Car className="h-10 w-10 text-ink-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-mist-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shots[active]}
          alt={`${listing.titleBn} — ছবি ${toBn(active + 1)}`}
          className="h-full w-full object-cover"
        />
        {shots.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-ink-900/70 px-2 py-0.5 text-[11px] font-bold text-white">
            {toBn(active + 1)} / {toBn(shots.length)}
          </span>
        )}
      </div>

      {shots.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {shots.map((shot, i) => (
            <li key={`${shot}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`ছবি ${toBn(i + 1)} দেখুন`}
                aria-current={i === active}
                className={`h-14 w-20 overflow-hidden rounded-lg border-2 bg-mist-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${
                  i === active ? 'border-brand-600' : 'border-transparent hover:border-mist-200'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spec grid
// ---------------------------------------------------------------------------

const UNKNOWN = 'জানা নেই';

interface Spec {
  icon: React.ElementType;
  labelBn: string;
  value: string;
  /** Dimmed — a real "nobody recorded this" rather than a real value. */
  unknown?: boolean;
}

/** The vehicle kind from the tag list, or null for a row without one. */
export function vehicleKindOf(listing: ServiceListing): VehicleKind | null {
  return listing.tags.find((t): t is VehicleKind => t === 'গাড়ি' || t === 'অটো' || t === 'CNG') ?? null;
}

/**
 * বিস্তারিত — the spec sheet.
 *
 * Ordered the way a renter asks, not the way a database stores: what it is, how
 * old, how many fit, is it comfortable, do I have to drive, when can I have it,
 * where does it go, and what does it cost.
 */
export function VehicleSpecGrid({ listing }: { listing: ServiceListing }) {
  const kind = vehicleKindOf(listing);
  const specs: Spec[] = [];

  if (kind) {
    specs.push({ icon: kind === 'অটো' ? Bus : Car, labelBn: 'যানের ধরন', value: kind });
  }
  if (listing.modelNameBn) {
    specs.push({ icon: Car, labelBn: 'মডেল', value: listing.modelNameBn });
  }
  if (listing.modelYear != null) {
    specs.push({ icon: CalendarClock, labelBn: 'মডেল সাল', value: toBn(listing.modelYear) });
  }
  if (listing.seatCount != null) {
    specs.push({ icon: Users, labelBn: 'সিট সংখ্যা', value: `${toBn(listing.seatCount)} জন` });
  }

  // Nullable booleans. Three states, three renderings — this is the whole
  // reason `has_ac` is not a text column.
  if (listing.hasAc === true) {
    specs.push({ icon: Wind, labelBn: 'এসি', value: 'হ্যাঁ, আছে' });
  } else if (listing.hasAc === false) {
    specs.push({ icon: Wind, labelBn: 'এসি', value: 'নেই' });
  } else {
    specs.push({ icon: Wind, labelBn: 'এসি', value: UNKNOWN, unknown: true });
  }

  if (listing.driverIncluded === true) {
    specs.push({ icon: KeyRound, labelBn: 'চালক', value: 'চালকসহ' });
  } else if (listing.driverIncluded === false) {
    specs.push({ icon: KeyRound, labelBn: 'চালক', value: 'চালক ছাড়া (সেলফ ড্রাইভ)' });
  } else {
    specs.push({ icon: KeyRound, labelBn: 'চালক', value: UNKNOWN, unknown: true });
  }

  if (listing.availableTimeBn) {
    specs.push({ icon: Clock, labelBn: 'উপলব্ধ সময়', value: listing.availableTimeBn });
  }

  if (listing.areaIds.length > 0) {
    specs.push({ icon: MapPin, labelBn: 'সার্ভিস এলাকা', value: areaNames(listing.areaIds) });
  }

  // Free-text tags that are not the kind. These are the owner's own words
  // ("চালকসহ", "পারিবারিক", "নন-এসি") and are the only place extra detail can
  // come from, since there is no admin form for more columns yet.
  const extraTags = listing.tags.filter((t) => t !== kind);
  if (extraTags.length > 0) {
    specs.push({ icon: Gauge, labelBn: 'অন্যান্য তথ্য', value: extraTags.join(', ') });
  }

  return (
    <section className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
      <h2 className="text-[14.5px] font-extrabold text-ink-900">বিস্তারিত</h2>
      <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3">
        {specs.map((spec, i) => (
          <SpecCell key={`${spec.labelBn}-${i}`} spec={spec} />
        ))}
      </dl>
    </section>
  );
}

function SpecCell({ spec }: { spec: Spec }) {
  const Icon = spec.icon;
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[10.5px] font-medium leading-tight text-ink-400">
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
        <span className="truncate">{spec.labelBn}</span>
      </dt>
      <dd
        className={`mt-1 text-[13px] font-bold leading-snug ${
          spec.unknown ? 'text-ink-400' : 'text-ink-900'
        }`}
      >
        {spec.value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/**
 * ভাড়া — the number, with the unit spelled out.
 *
 * The unit is the part people get wrong. "৳২,২০০" is cheap per kilometre and
 * absurd per day, and a number without its unit is not a price. So
 * `priceNoteBn` is rendered directly under the figure, and the figure itself is
 * never printed without it — if an admin never recorded the unit, the panel says
 * the price is on request rather than showing a bare number.
 */
export function VehiclePricing({ listing }: { listing: ServiceListing }) {
  const { priceMin, priceMax, priceNoteBn } = listing;

  const figure = (() => {
    if (priceMin != null && priceMax != null && priceMin !== priceMax) {
      return `${bnTaka(priceMin)} – ${bnTaka(priceMax)}`;
    }
    if (priceMin != null) return bnTaka(priceMin);
    if (priceMax != null) return `${bnTaka(priceMax)} এর কম`;
    return null;
  })();

  return (
    <section className="rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">ভাড়া</p>
      {figure && priceNoteBn ? (
        <>
          <p className="mt-1 text-xl font-black leading-tight text-brand-900 sm:text-2xl">
            {figure}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-brand-800/85">{priceNoteBn}</p>
        </>
      ) : figure ? (
        <>
          <p className="mt-1 text-xl font-black leading-tight text-brand-900 sm:text-2xl">
            {figure}
          </p>
          {/* Deliberately not silent. A bare number reads as a complete price. */}
          <p className="mt-1 text-[12.5px] leading-relaxed text-brand-800/85">
            এই তালিকায় ভাড়ার একক কোনো তথ্য দেওয়া হয়নি। অনুরোধ পাঠালে জানানো হবে।
          </p>
        </>
      ) : (
        <>
          <p className="mt-1 text-lg font-black leading-tight text-brand-900">আলোচনা সাপেক্ষে</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-brand-800/85">
            এই তালিকায় কোনো নির্দিষ্ট দাম দেওয়া হয়নি। অনুরোধে যাত্রার বিবরণ লিখে পাঠালে
            সরাসরি জানানো হবে।
          </p>
        </>
      )}
      {listing.seatCount != null ? (
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-brand-800/70">
          <Armchair className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          সর্বোচ্চ {toBn(listing.seatCount)} জনের জন্য উপযোগী
        </p>
      ) : null}
    </section>
  );
}