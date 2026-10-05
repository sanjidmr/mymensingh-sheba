'use client';

import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Flag, ShieldAlert, Info } from 'lucide-react';

import Navbar from '@/components/Navbar';
import { PropertyGallery } from '@/components/tolet/detail/PropertyGallery';
import { PropertyFactGrid } from '@/components/tolet/detail/PropertyFactGrid';
import { FacilityPanels } from '@/components/tolet/detail/FacilityPanels';
import { PropertyLocation } from '@/components/tolet/detail/PropertyLocation';
import { RentSummaryCard } from '@/components/tolet/detail/RentSummaryCard';
import { OwnerProfileCard } from '@/components/tolet/detail/OwnerProfileCard';
import { ContactActionsPanel } from '@/components/tolet/detail/ContactActions';
import {
  ToletDetailHeader,
  ToletDetailMobileShare,
} from '@/components/tolet/detail/ToletDetailHeader';
import {
  StickyContactBar,
  StickyContactBarSpacer,
} from '@/components/tolet/detail/StickyContactBar';
import { SimilarProperties } from '@/components/tolet/detail/SimilarProperties';
import { RequestSection } from '@/components/tolet/RequestSection';
import { ReportSheet } from '@/components/tolet/ReportSheet';

import { fetchListingById, fetchSimilarListings } from '@/lib/tolet-service';
import type { ToletListing } from '@/lib/tolet-types';
import { useAuth } from '@/lib/auth-context';
import { trackListingView, trackToletEvent } from '@/lib/tolet-tracking';
import { getAreaById } from '@/lib/locations';
import { toBengaliDigits } from '@/lib/bengali-numerals';

/**
 * To-Let listing detail page.
 *
 * Layout contract
 * ---------------
 * Mobile is a single column in reading order: photo → key numbers → money →
 * description → facilities → map → contact → owner → request. On `lg` the page
 * becomes two columns: the property and everything about it on the left, the
 * money + contact summary in a sticky rail on the right.
 *
 * Only ONE element is rendered twice — the rent card, hidden per breakpoint.
 * It must sit high in the phone flow (above the description) *and* in the
 * desktop rail, and those are incompatible positions in a single DOM order.
 * It is pure presentational markup with no state, so the duplication costs
 * nothing. Everything else — contact, owner, request — is rendered exactly once,
 * because below `lg` the two-column wrapper is not a grid and the rail simply
 * flows after the left column, which is already where the phone needs it.
 *
 * Everything is driven off a `ToletListing`, so any listing — live from Supabase
 * or from the showcase seed — renders through exactly this page. There is no
 * per-demo special-casing anywhere below.
 *
 * Tracking notes
 * --------------
 * The page view is recorded once per browser session (see `trackListingView`),
 * and favourite / call / WhatsApp / share are recorded by the components that
 * own those actions. `call_click` means the button was pressed — never that a
 * call happened.
 */
interface ToletDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * The outcome of loading a listing, tagged with the id it describes.
 *
 * Tagging is what lets `loading` be *derived* rather than stored: the request
 * in flight is exactly "no result yet for this id", so the effect below never
 * has to reset a flag synchronously before it starts fetching. That removes the
 * extra render pass an id change used to cause, and makes it impossible for
 * `loading` and the listing to disagree about which id they refer to — which is
 * how the previous version could briefly render listing A's data under
 * listing B's URL.
 */
type ListingLoad =
  | { id: string; status: 'loading' }
  | { id: string; status: 'missing' }
  | { id: string; status: 'ready'; listing: ToletListing; similar: ToletListing[] };

/** Stable empty array, so the derived `similar` keeps referential identity. */
const NO_SIMILAR: ToletListing[] = [];

export default function ToletDetailPage({ params }: ToletDetailPageProps) {
  const { id } = use(params);
  const { user, savedListings, toggleSaveItem } = useAuth();

  const [load, setLoad] = useState<ListingLoad | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [guestFavorite, setGuestFavorite] = useState(false);
  const [requestAnchor, setRequestAnchor] = useState<HTMLElement | null>(null);

  // ---- Load the listing, then the related ones -----------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const found = await fetchListingById(id);
      if (cancelled) return;

      if (!found) {
        setLoad({ id, status: 'missing' });
        return;
      }

      // Publish the listing on its own. Related listings are secondary, so they
      // stream in afterwards — a slow second query must never hold the gallery
      // hostage.
      setLoad({ id, status: 'ready', listing: found, similar: NO_SIMILAR });

      const related = await fetchSimilarListings(found, 4);
      if (cancelled) return;
      setLoad((current) =>
        current?.id === id && current.status === 'ready'
          ? { ...current, similar: related }
          : current
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Derived, not stored. Anything describing a *different* id than the current
  // route is treated as "not loaded yet".
  const isForCurrentId = load?.id === id;
  const ready = isForCurrentId && load.status === 'ready' ? load : null;
  const listing = ready?.listing ?? null;
  const similar = ready?.similar ?? NO_SIMILAR;

  // ---- View tracking: once per session per listing --------------------------
  useEffect(() => {
    if (!listing) return;
    trackListingView({
      listingId: listing.id,
      userId: user?.id ?? null,
      areaId: listing.areaId,
      propertyType: listing.propertyType,
      rentPrice: listing.rentPrice,
    });
  }, [listing, user?.id]);

  // ---- Favourite ------------------------------------------------------------
  const savedForThisListing = useMemo(
    () =>
      savedListings.find((item) => item.linkHref === `/tolet/${listing?.id}`) ?? null,
    [savedListings, listing?.id]
  );
  const isFavorite = user ? Boolean(savedForThisListing) : guestFavorite;

  const handleToggleFavorite = useCallback(async () => {
    if (!listing) return;
    const next = !isFavorite;

    if (!user) {
      // Guests can keep a local shortlist for the session; it simply is not
      // synced anywhere, and we say so rather than pretending it is.
      setGuestFavorite(next);
    } else {
      const area = getAreaById(listing.areaId);
      try {
        await toggleSaveItem({
          itemType: 'tolet',
          title: listing.title,
          areaName: area?.nameBn ?? listing.areaId,
          priceOrRate: `৳${listing.rentPrice.toLocaleString('en-IN')}`,
          linkHref: `/tolet/${listing.id}`,
        });
      } catch {
        // Saving is best-effort; never let it break the page.
      }
    }

    void trackToletEvent({
      listingId: listing.id,
      eventType: 'favorite',
      source: 'detail_page',
      userId: user?.id ?? null,
      areaId: listing.areaId,
      propertyType: listing.propertyType,
      rentPrice: listing.rentPrice,
    });
  }, [listing, isFavorite, user, toggleSaveItem]);

  // ---- Contact fallback: jump to the request form --------------------------
  const scrollToRequest = useCallback(() => {
    requestAnchor?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [requestAnchor]);

  if (!isForCurrentId) return <ListingSkeleton />;
  if (!listing) notFound();

  const description = listing.description.trim();

  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
        <ToletDetailHeader
          listing={listing}
          userId={user?.id ?? null}
          isLoggedIn={Boolean(user)}
        />
        <ToletDetailMobileShare
          listing={listing}
          userId={user?.id ?? null}
          className="mb-3"
        />

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          {/* ---------------- Left column: the property itself ---------------- */}
          <div className="min-w-0 space-y-5 sm:space-y-6">
            <PropertyGallery
              listing={listing}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
            />

            <PropertyFactGrid listing={listing} />

            {/* Money, phone only. On desktop the rail owns this card. */}
            <div className="lg:hidden">
              <RentSummaryCard listing={listing} />
            </div>

            {description && (
              <section aria-labelledby="tolet-description-heading">
                <h2
                  id="tolet-description-heading"
                  className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink-900 sm:text-[17px]"
                >
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-[3px] shrink-0 rounded-full bg-accent-400"
                  />
                  বিস্তারিত বর্ণনা
                </h2>
                <div className="mt-2.5 rounded-xl border border-brand-100 bg-white px-3.5 py-3.5 sm:px-4">
                  <p className="whitespace-pre-line text-[13px] leading-[1.85] text-ink-700">
                    {description}
                  </p>
                </div>
              </section>
            )}

            <FacilityPanels
              facilities={listing.facilities}
              unavailableFacilities={listing.unavailableFacilities}
            />

            <PropertyLocation listing={listing} />

            {/* Posted-at note, so an old listing is obviously an old listing. */}
            {listing.publishedAt && (
              <p className="flex items-center gap-1.5 text-[11px] text-ink-400">
                <Info className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                বিজ্ঞাপনটি প্রকাশিত হয়েছে{' '}
                {formatPostedBn(listing.publishedAt)}
              </p>
            )}

            {/* Safety note — last thing in the left column, before the rail's
                contact actions in the phone flow. */}
            <p className="flex items-start gap-2 rounded-xl border border-bronze-200 bg-bronze-50/60 px-3.5 py-3 text-[11.5px] leading-relaxed text-ink-600">
              <ShieldAlert
                className="mt-0.5 h-4 w-4 shrink-0 text-bronze-500"
                aria-hidden="true"
              />
              <span>
                <strong className="font-extrabold text-ink-800">নিরাপত্তা ও সতর্কতা:</strong>{' '}
                ভাড়া দেওয়ার আগে ঘর, পানি ও বিদ্যুৎ সরাসরি দেখে নিন। কোনো টাকা বা
                ডকুমেন্ট হাতে দেওয়ার আগে চুক্তিপত্রে মালিক ও ভাড়াটিয়ার দুই পক্ষের
                স্বাক্ষর নিন। কোনো ব্যক্তিকে অগ্রিম টাকা পাঠাতে বলা হলে{' '}
                <Link
                  href="/contact"
                  className="font-bold text-brand-800 underline underline-offset-2"
                >
                  যোগাযোগ করুন
                </Link>
                ।
              </span>
            </p>

            </div>

          {/* ---------------- Right rail: money + contact ----------------
              Below `lg` the wrapper is not a grid, so this aside simply flows
              after the left column — which is exactly where the phone needs the
              contact actions, owner card and request form to land. That is why
              only the rent card is rendered twice: it has to sit high in the
              phone flow (above the description) AND in the desktop rail, and
              those are incompatible positions in one DOM order. Everything else
              is rendered exactly once — no duplicated headings, ids or hooks. */}
          <aside className="mt-5 space-y-4 lg:sticky lg:top-20 lg:mt-0">
            {/* Money, desktop only — the phone copy sits next to the photos. */}
            <div className="hidden lg:block">
              <RentSummaryCard listing={listing} />
            </div>

            <ContactActionsPanel
              listing={listing}
              userId={user?.id ?? null}
              isLoggedIn={Boolean(user)}
              onRequestFallback={scrollToRequest}
            />

            <OwnerProfileCard listing={listing} />

            <div ref={setRequestAnchor} className="scroll-mt-24">
              <RequestSection listingId={listing.id} user={user} />
            </div>

            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold text-ink-400 transition-colors hover:bg-mist-100 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                বিজ্ঞাপনটি রিপোর্ট করুন
              </button>
            </div>
          </aside>
        </div>

        <SimilarProperties listings={similar} />

        <StickyContactBarSpacer />
      </main>

      <StickyContactBar
        listing={listing}
        userId={user?.id ?? null}
        onRequestFallback={scrollToRequest}
      />

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        listingId={listing.id}
        user={user}
      />
    </div>
  );
}

/** "২ দিন আগে" / "১ মাস আগে" — never an ambiguous "২/১০"-style timestamp. */
function formatPostedBn(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'একটি সময় আগে';
  const diffMs = Date.now() - then.getTime();
  const days = Math.floor(diffMs / 86_400_000);

  if (days <= 0) {
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours <= 0) return `${toBengaliDigits(Math.max(1, Math.floor(diffMs / 60_000)))} মিনিট আগে`;
    return `${toBengaliDigits(hours)} ঘণ্টা আগে`;
  }
  if (days === 1) return 'গতকাল';
  if (days < 30) return `${toBengaliDigits(days)} দিন আগে`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${toBengaliDigits(months)} মাস আগে`;
  return `${toBengaliDigits(Math.floor(days / 365))} বছর আগে`;
}

/**
 * Skeleton for the first paint. Shaped like the real layout (photo block above,
 * two columns below) so the page does not visibly jump when data lands, and so
 * a slow connection shows the structure of a property page rather than a spinner.
 */
function ListingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-5 lg:px-8">
        <div className="h-3 w-48 animate-pulse rounded bg-brand-100" />
        <div className="mt-3 h-6 w-3/4 animate-pulse rounded bg-brand-100" />
        <div className="mt-2 h-3.5 w-1/2 animate-pulse rounded bg-brand-100" />
        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
          <div className="min-w-0 space-y-5">
            <div className="aspect-[4/5] w-full animate-pulse rounded-xl bg-brand-100 sm:aspect-[16/10]" />
            <div className="h-20 w-full animate-pulse rounded-xl bg-brand-100" />
          </div>
          <div className="mt-5 space-y-4 lg:mt-0">
            <div className="h-44 w-full animate-pulse rounded-xl bg-brand-100" />
            <div className="h-32 w-full animate-pulse rounded-xl bg-brand-100" />
          </div>
        </div>
        <p className="sr-only" role="status">
          বিজ্ঞাপনের বিবরণ লোড হচ্ছে
        </p>
      </main>
    </div>
  );
}