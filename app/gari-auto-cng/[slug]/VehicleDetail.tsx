'use client';

/**
 * গাড়ী, অটো ও CNG — vehicle detail page (`/gari-auto-cng/[slug]`).
 *
 * Order on the page, and why it is this order:
 *   photo → what it is → the specs → the price → the request.
 *
 * A vehicle listing is a picture and eleven numbers. The photo has to be big and
 * has to be first, because a renter rejects on sight before reading a single
 * word — a black sedan with a cracked windscreen needs no further reading. Then
 * the name, then the specs as one dense grid (not eleven floating cards, which
 * on a phone is four screens of scrolling for data a driver reads in one
 * glance), then the price on its own panel, then the request.
 *
 * The request form is *revealed* by the "সেবা নিন" button rather than opened in
 * a modal. It has eleven fields, four of them optional and one of them a
 * five-row textarea; putting that in an overlay on a 360px phone means a
 * keyboard over half the form and a dialog the reader cannot scroll past. On
 * desktop it is simply always there in the sidebar. Opening in place and
 * scrolling to it keeps the vehicle in view while the request fills in, which is
 * what the reader is actually checking against.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Sparkles } from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import { DetailSkeleton, CatalogDetailMissing } from '@/components/catalog/CatalogDetailView';
import {
  VehicleGallery,
  VehiclePricing,
  VehicleSpecGrid,
  vehicleKindOf,
} from './VehicleParts';
import VehicleServiceRequest from './VehicleServiceRequest';
import { fetchServiceListingForContact } from '@/lib/catalog-service';
import type { ServiceListing } from '@/lib/catalog-types';
import { CATEGORY_UI } from '@/lib/catalog-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

const ui = CATEGORY_UI.vehicle;

export default function VehicleDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  // Mobile only. On desktop the form is in the sidebar from the first paint, so
  // this never gates anything a wide-screen reader can see.
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchServiceListingForContact('vehicle', slug);
        if (active) setListing(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  function openForm() {
    setFormOpen(true);
    // One frame for the reveal to land before scrolling to it, so the scroll
    // measures the form's final position rather than its collapsed one.
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (loading) return <DetailSkeleton />;
  if (!listing) return <CatalogDetailMissing ui={ui} />;

  const kind = vehicleKindOf(listing);
  // The subtitle is the thing that distinguishes one Axio from another on the
  // page: year, seats, and whether a driver comes with it.
  const subLine = [
    listing.modelNameBn,
    kind,
    listing.seatCount ? `${listing.seatCount} জনের গাড়ি` : null,
    listing.driverIncluded === true ? 'চালকসহ' : listing.driverIncluded === false ? 'সেলফ ড্রাইভ' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <DirectoryShell
      title={listing.titleBn}
      // The body below renders the only <h1> on the page, beside the photo.
      hideHeading
      breadcrumbs={[
        { label: ui.title, href: ui.route },
        { label: listing.titleBn },
      ]}
      action={
        <button
          type="button"
          onClick={openForm}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-700 px-3.5 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          সেবা নিন
        </button>
      }
    >
      {listing.isDemo && (
        <p className="mb-3 rounded-xl border border-accent-200 bg-accent-100/50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-accent-700">
          এটি একটি <strong className="font-bold">নমুনা তালিকা</strong>, বাস্তবে ভাড়া দেওয়া হয় না।
          অনুরোধ পাঠালে কোনো গাড়ির সঙ্গে যোগাযোগ হবে না।
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* ---------------------------------------------------------------
            Main column: photo, then facts.
            --------------------------------------------------------------- */}
        <div className="lg:col-span-7 xl:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-mist-200 bg-white">
            <VehicleGallery listing={listing} />
          </div>

          {/* Title block. The H1 is the listing title verbatim — not the model
              plus the model again, which is what the old page did. */}
          <div className="mt-3 rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
            <h1 className="text-xl font-black leading-tight text-ink-900 sm:text-2xl">
              {listing.titleBn}
            </h1>
            {subLine && (
              <p className="mt-1 text-[13.5px] font-medium text-ink-600">{subLine}</p>
            )}
            {listing.summaryBn && (
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-700">
                {listing.summaryBn}
              </p>
            )}
            {listing.descriptionBn && (
              <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-600">
                {listing.descriptionBn}
              </p>
            )}
          </div>

          <div className="mt-3">
            <VehicleSpecGrid listing={listing} />
          </div>
        </div>

        {/* ---------------------------------------------------------------
            Side column: price, then the request.
            --------------------------------------------------------------- */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="space-y-3 lg:sticky lg:top-4">
            <VehiclePricing listing={listing} />

            {/* Admin-only: a real published number, gated in the service layer. */}
            {listing.contactPhonePrivate && (
              <a
                href={`tel:${listing.contactPhonePrivate.replace(/[^\d+]/g, '')}`}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-4 text-[13.5px] font-extrabold text-brand-700 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                সরাসরি কল করুন
              </a>
            )}

            {/* Mobile: the CTA that reveals the form. Desktop: the form itself,
                which is why this button is `lg:hidden`. */}
            {!formOpen && (
              <button
                type="button"
                onClick={openForm}
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 lg:hidden ${LIGHT_FOCUS}`}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                সেবা নিন
              </button>
            )}

            {/* Always mounted on desktop so the page is one paint tall there;
                conditionally rendered on mobile so it does not sit as a wall
                between the reader and the specs. */}
            <div ref={formRef} className="scroll-mt-4">
              <div className={formOpen ? 'block' : 'hidden lg:block'}>
                <VehicleServiceRequest listing={listing} defaultKind={kind ?? undefined} />
              </div>
            </div>

            <p className="hidden text-center text-[11.5px] leading-relaxed text-ink-400 lg:block">
              অ্যাডমিন আপনার অনুরোধ পেয়ে সরাসরি কল করে জামালতা ঠিক করাবেন।
            </p>
          </div>
        </div>
      </div>

      <MobileServiceBar onOpen={openForm} />

      {/* Room for the bar and the fixed bottom navigation. */}
      <div aria-hidden="true" className="h-[4.5rem] lg:hidden" />

      <div className="mt-4 lg:hidden">
        <Link
          href="/gari-auto-cng"
          className={`inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-ink-500 ${LIGHT_FOCUS}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          সব গাড়ির তালিকায় ফিরে যান
        </Link>
      </div>
    </DirectoryShell>
  );
}

/**
 * The floating "সেবা নিন" bar.
 *
 * Offset by `var(--mms-bottom-nav-h)` rather than a hard-coded pixel value, for
 * the same reason as everywhere else on this site: the global bottom navigation
 * is `fixed` and its height is a token, so anything that also lives at the
 * bottom of the viewport has to be measured against the same token or the two
 * overlap the moment either one is restyled.
 */
function MobileServiceBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
      style={{
        paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom) + var(--mms-bottom-nav-h))',
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className={`pointer-events-auto mx-auto flex min-h-12 w-full max-w-lg items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[14px] font-extrabold text-white shadow-[0_4px_16px_rgba(7,39,31,0.14)] transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
      >
        সেবা নিন
      </button>
    </div>
  );
}