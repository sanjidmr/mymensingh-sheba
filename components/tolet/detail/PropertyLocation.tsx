'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, Map as MapIcon, Loader2 } from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';
import { getAreaById } from '@/lib/locations';
import {
  getAreaCoordinate,
  buildOsmEmbedUrl,
  buildGoogleMapsLink,
  hasAreaCoordinate,
} from '@/lib/mymensingh-geo';

/**
 * PropertyLocation — where the home is, with a map.
 *
 * Privacy, and why the map is click-to-load
 * -----------------------------------------
 * The marker is an AREA centroid, never a precise plot (see
 * `lib/mymensingh-geo.ts`), and the map is not embedded until the visitor taps
 * "মানচিত্র দেখুন". Three reasons, in order of importance:
 *
 *  1. A precise pin would leak the exact address of a rented home to anyone who
 *     screenshots the page — a real safety issue for tenants, and the reason
 *     the platform publishes neighbourhood granularity everywhere else too.
 *  2. An <iframe> to a third party loads the visitor's IP and referrer before
 *     they asked for a map. Deferring it until the tap means nothing about
 *     this visit is disclosed by default.
 *  3. No API key is required, so nothing breaks the day someone forgets to
 *     provision one. The "গুগল ম্যাপে খুলুন" link works in any map app.
 *
 * The nearby-landmark list is what actually helps a Mymensingh tenant decide
 * whether the commute works, so it carries more weight than the map itself —
 * those landmarks come from the gazette-sourced `lib/locations.ts`.
 */
export function PropertyLocation({ listing }: { listing: ToletListing }) {
  const [mapRequested, setMapRequested] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);

  const area = getAreaById(listing.areaId);
  const coord = getAreaCoordinate(listing.areaId);
  const precise = hasAreaCoordinate(listing.areaId);
  const areaName = area?.nameBn ?? listing.areaId;
  const searchQuery = `${listing.specificAddress}, ${areaName}, ময়মনসিংহ, বাংলাদেশ`;

  return (
    <section aria-labelledby="tolet-location-heading">
      <h2
        id="tolet-location-heading"
        className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900"
      >
        <span aria-hidden="true" className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent-400" />
        অবস্থান
      </h2>

      <div className="mt-2.5 overflow-hidden rounded-xl border border-brand-100 bg-white">
        {/* Address block */}
        <div className="px-3.5 py-3 sm:px-4">
          <p className="flex items-start gap-1.5 text-[13px] font-semibold leading-relaxed text-ink-900">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>{listing.specificAddress}</span>
          </p>
          <p className="mt-1 pl-[22px] text-[12px] text-ink-500">
            {areaName}
            {area?.wardNo ? ` • ${area.wardLabelBn}` : ''} • ময়মনসিংহ সিটি কর্পোরেশন
          </p>

          {/* Landmarks — the part that actually answers "will the commute work?" */}
          {area && area.prominentLandmarks.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-1.5 pl-[22px]">
              {area.prominentLandmarks.slice(0, 4).map((landmark) => (
                <li
                  key={landmark}
                  className="rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10.5px] font-medium text-ink-600"
                >
                  {landmark}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Map surface */}
        <div className="relative aspect-[16/9] w-full border-t border-brand-100 bg-mist-100">
          {mapRequested ? (
            <>
              {mapLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-mist-100">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
                  <span className="sr-only">মানচিত্র লোড হচ্ছে</span>
                </div>
              )}
              <iframe
                title={`${areaName} এলাকার মানচিত্র`}
                src={buildOsmEmbedUrl(coord)}
                loading="lazy"
                referrerPolicy="no-referrer"
                onLoad={() => setMapLoading(false)}
                className="h-full w-full border-0"
              />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setMapRequested(true)}
              className="group flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center transition-colors hover:bg-mist-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-700 shadow-sm transition-transform duration-150 group-hover:scale-105">
                <MapIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[13px] font-bold text-ink-900">মানচিত্র দেখুন</span>
              <span className="max-w-xs text-[11px] leading-relaxed text-ink-400">
                {precise
                  ? `${areaName} এলাকার আনুমানিক মানচিত্র। নির্দিষ্ট বাসার ঠিকানা প্রকাশ করা হয় না।`
                  : 'এলাকাটির সাধারণ মানচিত্র দেখানো হচ্ছে।'}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-brand-100 px-3.5 py-2.5 sm:px-4">
          <p className="text-[10.5px] leading-relaxed text-ink-400">
            নিরাপত্তার জন্য শুধু এলাকা পর্যন্ত চিহ্নিত করা হয়েছে।
          </p>
          <a
            href={buildGoogleMapsLink(searchQuery)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[11.5px] font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            পথ দেখুন
          </a>
        </div>
      </div>
    </section>
  );
}