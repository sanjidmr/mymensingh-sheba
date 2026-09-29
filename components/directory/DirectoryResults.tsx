'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, SearchX, PlusCircle } from 'lucide-react';
import { ListingGrid } from './ListingCard';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export interface DirectoryResultsProps {
  loading: boolean;
  empty: boolean;
  count: number;
  noun: string;
  loadingText?: string;
  onReset: () => void;
  /** Rendered when there is genuinely no data at all (vs. filters too narrow). */
  unpopulated?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * DirectoryResults — the result region shared by every directory page.
 *
 * Reserves a minimum height so arriving from a list page does not jump the
 * layout, and keeps the "nothing here" state honest: it distinguishes between
 * "your filters excluded everything" (offer a reset) and "this directory has
 * no entries yet" (let the page supply an honest empty state, e.g. the bus
 * schedule, where inventing rows would be worse than an empty page).
 */
export default function DirectoryResults({
  loading,
  empty,
  count,
  noun,
  loadingText = 'তালিকা লোড হচ্ছে…',
  onReset,
  unpopulated,
  children,
}: DirectoryResultsProps) {
  if (loading) {
    return (
      <div className="flex min-h-[45vh] flex-col items-center justify-center gap-2.5 text-ink-500">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
        <p className="text-sm">{loadingText}</p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="min-h-[45vh]">{unpopulated ?? <EmptyState onReset={onReset} noun={noun} />}</div>
    );
  }

  return (
    <>
      <p className="sr-only" aria-live="polite">
        {count} {noun} পাওয়া গেছে
      </p>
      {children}
    </>
  );
}

function EmptyState({ onReset, noun }: { onReset: () => void; noun: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-brand-200 bg-white px-5 py-12 text-center">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-mist-50 text-brand-500"
      >
        <SearchX className="h-5 w-5" />
      </span>
      <h2 className="mt-3.5 text-base font-extrabold text-ink-900">কিছু পাওয়া যায়নি</h2>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-500">
        আপনার বেছে নেওয়া শর্ত অনুযায়ী কোনো {noun} মেলেনি। ফিল্টার বদলে দেখুন বা
        সব ফিল্টার মুছে আবার চেষ্টা করুন।
      </p>
      <button
        type="button"
        onClick={onReset}
        className={`mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
      >
        সব ফিল্টার মুছুন
      </button>
    </div>
  );
}

/**
 * Honest empty state for a directory that is not populated yet. Used by the
 * bus timetable, news desk and any other page where fabricating rows would
 * mean inventing facts the platform cannot stand behind.
 */
export function ComingSoonState({
  title,
  body,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-100 bg-white">
      <div className="border-b border-brand-100 bg-mist-50 px-5 py-6 text-center">
        <h2 className="text-base font-extrabold text-ink-900 sm:text-lg">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-500">{body}</p>
      </div>
      {ctaHref && ctaLabel && (
        <div className="px-5 py-4 text-center">
          <Link
            href={ctaHref}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

export { ListingGrid };
