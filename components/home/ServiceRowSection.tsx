'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ServiceCard from '@/components/home/ServiceCard';
import {
  loadToletCards,
  loadTutorCards,
  loadDonorCards,
} from '@/components/home/section-loaders';
import type { HomePreviewCard } from '@/lib/home-preview';

/** Serialisable loader keys. Resolved HERE (client) rather than passed from
 *  the page, because a Server Component may not hand a function to a Client
 *  Component — passing `load={loadToletCards}` down from HomePage 500'd. */
export type ServiceRowSource = 'tolet' | 'tutor' | 'donor';

const ROW_LOADERS = {
  tolet: loadToletCards,
  tutor: loadTutorCards,
  donor: loadDonorCards,
} satisfies Record<ServiceRowSource, () => Promise<HomePreviewCard[]>>;

interface ServiceRowSectionProps {
  kicker: string;
  title: string;
  href: string;
  /** Async source (live listings) — resolved to a loader in this component */
  source?: ServiceRowSource;
  /** Static card list — used when there is no live loader yet */
  cards?: HomePreviewCard[];
  tone?: 'white' | 'mist';
  /** Text tone of the card bodies (e.g. red for the রক্তদাতা row) */
  cardTone?: 'default' | 'red';
  /** Skip the card media area entirely (no photo / no avatar placeholder) */
  hideImage?: boolean;
  /** Show demo photos on the cards (falls back to the imageless look when off) */
  withImage?: boolean;
  /** Demo photo pool — cycled across the cards in this row */
  demoImages?: string[];
  count?: number;
}

/**
 * ServiceRowSection — a light, compact homepage band: one service + its
 * latest entries in a single row of small cards (5 across on desktop).
 * Rows either show demo photos (`withImage` + `demoImages`) or stay text-only;
 * the blood-donor row stays imageless on purpose (privacy).
 */
export default function ServiceRowSection({
  kicker,
  title,
  href,
  source,
  cards,
  tone = 'white',
  cardTone = 'default',
  hideImage = false,
  withImage = false,
  demoImages = [],
  count = 6,
}: ServiceRowSectionProps) {
  const [items, setItems] = useState<HomePreviewCard[] | null>(cards ?? null);
  const [error, setError] = useState(false);
  const imageMode = withImage && !hideImage;

  /** Stable module-level reference, so this dep never churns between renders. */
  const load = source ? ROW_LOADERS[source] : undefined;

  useEffect(() => {
    if (!load) return;
    let alive = true;
    load()
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [load]);

  const shown = (items ?? []).slice(0, count);
  const loading = items === null && !error;

  /**
   * How many of the fetched cards each breakpoint shows.
   * Phone  -> six cards, two tidy rows of three.
   * sm+    -> four cards (the previous behaviour, untouched).
   * lg+    -> five cards across, the desktop row.
   * So the two "extra" cards are revealed and hidden at the opposite ends.
   */
  const visibilityAt = (index: number) => {
    if (index === 4) return 'max-sm:hidden';
    if (index === 5) return 'hidden lg:block';
    return '';
  };

  return (
    <section
      aria-label={title}
      className={
        tone === 'mist'
          ? 'border-b border-brand-100/70 bg-mist-50'
          : 'border-b border-brand-100/70 bg-white'
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        {/* Header — centered on mobile, left-aligned on larger screens */}
        <div className="text-center sm:text-left">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
            {kicker}
          </span>
          <h2 className="mx-auto mt-2 max-w-2xl text-xl font-extrabold leading-tight tracking-tight text-ink-900 sm:mx-0 sm:text-2xl lg:text-[1.7rem]">
            {title}
          </h2>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={`overflow-hidden rounded-lg border border-brand-100/80 bg-white sm:rounded-xl ${visibilityAt(i)}`}
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
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-4">
            {shown.map((card, index) => (
              <ServiceCard
                key={card.id}
                card={
                  imageMode && demoImages.length > 0 && !card.imageUrl
                    ? { ...card, imageUrl: demoImages[index % demoImages.length] }
                    : card
                }
                imageless={!imageMode}
                compact
                hideImage={imageMode ? false : hideImage}
                tone={cardTone}
                className={visibilityAt(index)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white px-6 py-10 text-center">
            <p className="text-sm font-medium text-ink-500">
              এই মুহূর্তে কোনো তালিকা নেই। কিছুক্ষণ পরে আবার দেখুন।
            </p>
          </div>
        )}

        {/* See-more — bottom of every row */}
        <div className="mt-5 flex justify-center">
          <Link
            href={href}
            className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-6 py-2.5 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-mist-50"
          >
            আরও দেখুন
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}