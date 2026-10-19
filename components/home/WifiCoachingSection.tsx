'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Wifi } from 'lucide-react';
import ServiceCard from '@/components/home/ServiceCard';
import { fetchServiceListings } from '@/lib/catalog-service';
import { listingToPreviewCard } from '@/lib/home-preview';
import type { HomePreviewCard } from '@/lib/home-preview';

/** Three of each keeps the pair balanced in a single desktop row of six. */
const CARD_LIMIT = 3;

interface LoadedCards {
  wifi: HomePreviewCard[];
  coaching: HomePreviewCard[];
}

/**
 * WiFi ও কোচিং — the homepage band that shows the actual published providers
 * instead of two links to the directory pages.
 *
 * Both categories are approved, active rows in `service_listings`, so the same
 * public reader the /wifi and /coaching pages use is reused here. The newest
 * three of each are mapped to the shared compact card; the two directory links
 * stay as small "সব দেখুন" actions below the row, because the band is still the
 * only entrance to the full lists.
 */
export default function WifiCoachingSection() {
  const [cards, setCards] = useState<LoadedCards | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchServiceListings('wifi'), fetchServiceListings('coaching')])
      .then(([wifi, coaching]) => {
        if (!alive) return;
        setCards({
          wifi: wifi.slice(0, CARD_LIMIT).map(listingToPreviewCard),
          coaching: coaching.slice(0, CARD_LIMIT).map(listingToPreviewCard),
        });
      })
      .catch(() => {
        if (alive) setCards({ wifi: [], coaching: [] });
      });
    return () => {
      alive = false;
    };
  }, []);

  const shown = cards ? [...cards.wifi, ...cards.coaching] : [];
  const loading = cards === null;

  return (
    <section
      aria-labelledby="wifi-coaching-heading"
      className="border-b border-brand-100/70 bg-mist-50"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold text-brand-600 sm:text-xs">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              আরও স্থানীয় সেবা
            </span>
            <h2
              id="wifi-coaching-heading"
              className="mx-auto mt-2 max-w-2xl text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:mx-0 sm:text-2xl"
            >
              WiFi ও কোচিং
            </h2>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/wifi"
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2 text-[12.5px] font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <Wifi className="h-4 w-4" aria-hidden="true" />
              WiFi সব দেখুন
            </Link>
            <Link
              href="/coaching"
              className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2 text-[12.5px] font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              কোচিং সব দেখুন
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-3">
            {Array.from({ length: CARD_LIMIT * 2 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-brand-100/80 bg-white sm:rounded-xl"
              >
                <div className="aspect-[4/3] animate-pulse bg-brand-100/60" />
                <div className="space-y-2 p-2 sm:p-3">
                  <div className="h-3 w-4/5 animate-pulse rounded-sm bg-brand-100/60" />
                  <div className="h-3 w-2/3 animate-pulse rounded-sm bg-brand-100/50" />
                </div>
              </div>
            ))}
          </div>
        ) : shown.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6 lg:gap-3">
            {shown.map((card) => (
              <ServiceCard key={card.id} card={card} compact />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white px-6 py-8 text-center">
            <p className="text-sm font-medium text-ink-500">
              এখনো কোনো WiFi বা কোচিং কার্ড পোস্ট হয়নি। কিছুক্ষণ পরে আবার দেখুন।
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/wifi"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-[12.5px] font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                WiFi পেজে যান
              </Link>
              <Link
                href="/coaching"
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2 text-[12.5px] font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                কোচিং পেজে যান
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
