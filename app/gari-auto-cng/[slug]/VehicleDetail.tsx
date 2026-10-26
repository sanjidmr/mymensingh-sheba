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
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import { TileCard } from '@/components/catalog/CatalogCards';
import { DetailSkeleton, CatalogDetailMissing } from '@/components/catalog/CatalogDetailView';
import {
  VehicleGallery,
  VehiclePricing,
  VehicleSpecGrid,
  vehicleKindOf,
} from './VehicleParts';
import VehicleServiceRequest from './VehicleServiceRequest';
import { fetchServiceListingForContact, fetchServiceListings } from '@/lib/catalog-service';
import type { ServiceListing } from '@/lib/catalog-types';
import { areaNames, bnTaka, bnTakaDecimal, CATEGORY_UI, tagLabels, toBn } from '@/lib/catalog-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

const ui = CATEGORY_UI.vehicle;

export default function VehicleDetail({ slug }: { slug: string }) {
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<ServiceListing[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionError, setSuggestionError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState<{
    listingId: string;
    referenceCode: string;
    message: string;
  } | null>(null);
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
      } catch (cause) {
        if (active) {
          setListing(null);
          console.error('Vehicle detail could not be loaded.', cause);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await fetchServiceListings('vehicle');
        if (active) setSuggestions(rows.filter((row) => row.slug !== slug).slice(0, 3));
      } catch (cause) {
        if (active) {
          setSuggestionError(cause instanceof Error ? cause.message : 'অন্যান্য গাড়ির তালিকা লোড করা যায়নি।');
        }
      } finally {
        if (active) setSuggestionsLoading(false);
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

  if (requestSuccess?.listingId === listing.id) {
    return (
      <DirectoryShell
        title="অনুরোধ সফলভাবে জমা হয়েছে"
        hideHeading
        breadcrumbs={[
          { label: ui.title, href: ui.route },
          { label: listing.titleBn },
        ]}
      >
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white px-5 py-8 text-center shadow-sm sm:px-10 sm:py-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 sm:h-20 sm:w-20">
            <CheckCircle2 className="h-9 w-9 sm:h-11 sm:w-11" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-black leading-tight text-ink-900 sm:text-3xl">
            অনুরোধ সফলভাবে জমা হয়েছে
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-600">
            {requestSuccess.message}
          </p>
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-brand-100 bg-mist-50 p-4">
            <p className="text-xs font-semibold text-ink-500">সংশ্লিষ্ট গাড়ির ID</p>
            <p className="mt-1 break-all font-mono text-2xl font-black tracking-wider text-brand-800 sm:text-3xl">
              {listing.publicCode || listing.publicId || 'ID সিঙ্ক হচ্ছে'}
            </p>
            <p className="mt-2 text-sm font-bold text-ink-800">{listing.titleBn}</p>
            {requestSuccess.referenceCode && (
              <p className="mt-2 text-xs text-ink-500">
                অনুরোধ রেফারেন্স: <span className="font-mono font-bold">{requestSuccess.referenceCode}</span>
              </p>
            )}
          </div>
          <Link
            href="/gari-auto-cng"
            className={`mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-extrabold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            গাড়ির তালিকায় ফিরুন
          </Link>
        </section>
        <VehicleSuggestions
          listings={suggestions}
          loading={suggestionsLoading}
          error={suggestionError}
        />
      </DirectoryShell>
    );
  }

  const kind = vehicleKindOf(listing);
  // The subtitle is the thing that distinguishes one Axio from another on the
  // page: year, seats, and whether a driver comes with it.
  const subLine = [
    listing.modelNameBn,
    kind,
    listing.seatCount ? `${listing.seatCount} জনের গাড়ি` : null,
    listing.driverIncluded === true ? 'চালকসহ' : listing.driverIncluded === false ? 'সেলফ ড্রাইভ' : null,
    listing.driverNameBn,
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
            {listing.publicCode && (
              <p className="mt-2 inline-flex rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 font-mono text-sm font-extrabold tracking-wider text-brand-800">
                যানবাহন আইডি: {listing.publicCode}
              </p>
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
                <VehicleServiceRequest
                  listing={listing}
                  defaultKind={kind ?? undefined}
                  onSuccess={(referenceCode, message) =>
                    setRequestSuccess({ listingId: listing.id, referenceCode, message })
                  }
                />
              </div>
            </div>

            <p className="hidden text-center text-[11.5px] leading-relaxed text-ink-400 lg:block">
              অনুরোধ পাওয়ার পর অ্যাডমিন আপনার সঙ্গে যোগাযোগ করে ভাড়া ও সময় নিশ্চিত করবেন।
            </p>
          </div>
        </div>
      </div>

      <VehicleSuggestions
        listings={suggestions}
        loading={suggestionsLoading}
        error={suggestionError}
      />

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

function VehicleSuggestions({
  listings,
  loading,
  error,
}: {
  listings: ServiceListing[];
  loading: boolean;
  error: string;
}) {
  if (error) {
    return <p role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>;
  }
  if (!loading && listings.length === 0) return null;

  return (
    <section className="mt-7" aria-labelledby="vehicle-suggestions-heading">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">আরও পছন্দ</p>
          <h2 id="vehicle-suggestions-heading" className="mt-0.5 text-lg font-black text-ink-900 sm:text-xl">
            অন্যান্য উপলভ্য গাড়ি
          </h2>
        </div>
        <Link href="/gari-auto-cng" className="shrink-0 text-xs font-bold text-brand-700 hover:text-brand-900">
          সব দেখুন
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-xl bg-mist-100" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {listings.map((item) => (
            <TileCard
              key={item.id}
              href={`/gari-auto-cng/${item.slug}`}
              title={item.titleBn}
              subtitle={item.subtitleBn}
              imageUrl={item.imageUrl}
              publicCode={item.publicCode}
              priceLabel={
                item.ratePerKm != null
                  ? bnTakaDecimal(item.ratePerKm)
                  : item.priceMin != null
                    ? bnTaka(item.priceMin)
                    : undefined
              }
              priceSuffix={item.ratePerKm != null ? '/কিমি' : item.priceNoteBn}
              areaLabel={areaNames(item.areaIds)}
              chips={[
                item.seatCount ? `${toBn(item.seatCount)} সিট` : undefined,
                ...tagLabels(item.tags).slice(0, 1),
              ]}
              mobileMinimal
            />
          ))}
        </div>
      )}
    </section>
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