'use client';

/**
 * The blood-donor directory.
 *
 * This is the whole feature: a filter bar and a grid of cards. There is no
 * detail page to link to (`/blood-donor/[id]` redirects here), so everything a
 * reader needs — including the call action — happens on this screen.
 */

import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Droplets, Loader2, PlusCircle, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceFilterBar from '@/components/filters/ServiceFilterBar';
import EmptyFilterResults from '@/components/filters/EmptyFilterResults';
import DonorCard from '@/components/blood-donor/DonorCard';
import { fetchPublishedDonors } from '@/lib/blood-donor-service';
import type { BloodDonorProfile } from '@/lib/supabase/types';

function BloodDonorContent() {
  const searchParams = useSearchParams();

  // Blood group remains the only filter; donor readiness is shown directly on
  // each card from the saved availability field.
  const initialGroup = searchParams.get('group') || searchParams.get('bloodGroup') || 'all';
  /** Set by the `/blood-donor/[id]` redirect — which card to bring into view. */
  const focusDonorId = searchParams.get('donor');

  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({
    bloodGroup: initialGroup !== 'all' ? initialGroup : undefined,
  });
  const [donors, setDonors] = useState<BloodDonorProfile[] | null>(null);
  const [loading, setLoading] = useState(true);

  const cardRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    let cancelled = false;
    fetchPublishedDonors().then((data) => {
      if (cancelled) return;
      setDonors(data);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // A shared `/blood-donor/[id]` link lands here; bring that card into view
  // once it exists. Scroll only — never auto-open a request form off a link.
  useEffect(() => {
    if (loading || !focusDonorId) return;
    const node = cardRefs.current.get(focusDonorId);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2');
    const timer = window.setTimeout(
      () => node.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2'),
      2600
    );
    return () => window.clearTimeout(timer);
  }, [loading, focusDonorId, donors]);

  /**
   * Keep the address bar in step with the filter.
   *
   * This page is a static shell that filters in the browser, so a router
   * navigation to the same route with a new query string is swallowed: the
   * RSC payload is identical, the address bar never changes, and a reader who
   * reloads — or copies the link — loses the group they picked. The native
   * History API is integrated with `useSearchParams`, so the URL and the page
   * state move together without a server round trip.
   */
  const syncUrl = (query: string) => {
    window.history.replaceState(null, '', `/blood-donor${query ? `?${query}` : ''}`);
  };

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilterValues(newFilters);
    const params = new URLSearchParams();
    if (newFilters.bloodGroup && newFilters.bloodGroup !== 'all') {
      params.set('group', String(newFilters.bloodGroup));
    }
    // The filter sheet's own reset clears `?donor`, which is right: a reader who
    // has changed the filters is no longer looking at the linked card.
    if (focusDonorId && !params.toString()) params.set('donor', focusDonorId);
    syncUrl(params.toString());
  };

  const handleResetFilters = () => {
    setFilterValues({});
    syncUrl('');
  };

  const filteredDonors = useMemo(() => {
    if (!donors) return [];
    return donors.filter((d) => {
      if (filterValues.bloodGroup && filterValues.bloodGroup !== 'all') {
        if (d.bloodGroup !== filterValues.bloodGroup) return false;
      }
      return true;
    });
  }, [donors, filterValues]);

  // Every row is a sample profile while the live directory is empty — the
  // fallback swaps wholesale, so this is all-or-nothing rather than per-card.
  const isShowcase = donors?.some((d) => d.isDemo) ?? false;

  if (loading) {
    return (
      <div className="min-h-screen bg-mist-50">
        <Navbar />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-20 text-ink-500">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
          <span className="text-sm">রক্তদাতাদের তালিকা লোড হচ্ছে...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-10 sm:py-9">
        <header className="mx-auto mb-5 max-w-2xl text-center">
          <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-bold text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            সম্পূর্ণ স্বেচ্ছাসেবী ও অ-বাণিজ্যিক সেবা
          </span>
          <h1 className="text-2xl font-black leading-tight text-ink-900 sm:text-[28px]">
            রক্তদাতা ডিরেক্টরি — ময়মনসিংহ
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
            রক্তের গ্রুপ বেছে নিন। অনুমোদিত রক্তদাতার কার্ডে বা “কল করুন” বাটনে চাপ দিলে
            সরাসরি ফোন কল চলে যায়।
          </p>
        </header>

        {/* The group picker comes before the privacy note on a phone: the filter
            is the reason the reader is here, and it must be visible without
            scrolling past a full-width explainer. */}
        <ServiceFilterBar
          serviceType="blood-donor"
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalResults={filteredDonors.length}
        />

        <div className="mb-5 flex justify-stretch sm:justify-end">
          <Link
            href="/profile/blood-donor/setup"
            className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-4 text-[13px] font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            রক্তদাতা হিসেবে নিবন্ধন
          </Link>
        </div>

        {isShowcase && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-100/50 p-3 text-[12.5px] leading-relaxed text-accent-700">
            <Droplets className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              এখন দেখানো হচ্ছে <strong>নমুনা প্রোফাইল</strong> — অ্যাডমিন অনুমোদন করা
              প্রকৃত রক্তদাতা যোগ হলে এগুলো সরে যাবে। নমুনা প্রোফাইলের সঙ্গে কোনো যোগাযোগ
              করা হয় না।
            </span>
          </p>
        )}

        <div className="mt-4">
          {filteredDonors.length === 0 ? (
            <EmptyFilterResults
              onResetFilters={handleResetFilters}
              customMessage="নির্বাচিত গ্রুপের কোনো রক্তদাতা পাওয়া যায়নি। অন্য গ্রুপ সিলেক্ট করে দেখুন বা সব গ্রুপ দেখুন।"
            />
          ) : (
            // One-up on a phone. Unlike a two-up marketplace grid, this card
            // has to stay readable at a glance: a reader is comparing blood
            // groups and recovery windows, and a 160px-wide card makes the
            // group token and the status line wrap into noise.
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {filteredDonors.map((donor) => (
                <div
                  key={donor.id}
                  ref={(node) => {
                    if (node) cardRefs.current.set(donor.id, node);
                    else cardRefs.current.delete(donor.id);
                  }}
                  className="rounded-2xl transition-shadow duration-150"
                >
                  <DonorCard donor={donor} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function BloodDonorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mist-50">
          <Navbar />
          <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-ink-500">
            রক্তদাতাদের তালিকা লোড হচ্ছে...
          </div>
        </div>
      }
    >
      <BloodDonorContent />
    </Suspense>
  );
}