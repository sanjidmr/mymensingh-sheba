'use client';

import { useEffect, useState } from 'react';
import ServiceSection from '@/components/home/ServiceSection';
import ServiceCarousel from '@/components/home/ServiceCarousel';
import type { HomePreviewCard } from '@/lib/home-preview';

export interface HomeServiceSectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  seeMoreHref: string;
  background?: 'white' | 'soft' | 'tint';
  load: () => Promise<HomePreviewCard[]>;
  limit?: number;
}

function SkeletonCard() {
  return (
    <div className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
      <div className="animate-pulse overflow-hidden rounded-2xl border border-brand-100 bg-white">
        <div className="aspect-[4/3] w-full bg-mist-100" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-3/4 rounded bg-mist-100" />
          <div className="h-3 w-1/2 rounded bg-mist-50" />
          <div className="h-3 w-full rounded bg-mist-50" />
        </div>
      </div>
    </div>
  );
}

export default function HomeServiceSection({
  id,
  eyebrow,
  title,
  description,
  seeMoreHref,
  background = 'white',
  load,
  limit = 6,
}: HomeServiceSectionProps) {
  const [cards, setCards] = useState<HomePreviewCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    load()
      .then((result) => {
        if (!cancelled) setCards(result.slice(0, limit));
      })
      .catch(() => {
        if (!cancelled) setCards([]);
      });
    return () => {
      cancelled = true;
    };
  }, [load, limit]);

  return (
    <ServiceSection
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      seeMoreHref={seeMoreHref}
      background={background}
    >
      {cards === null ? (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:px-0 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-mist-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink-500">
            এই মুহূর্তে নতুন প্রোফাইল দেখা যাচ্ছে না। কিছুক্ষণ পর আবার দেখুন।
          </p>
        </div>
      ) : (
        <ServiceCarousel cards={cards} columns={id === 'blood-donor-preview' ? 5 : 4} />
      )}
    </ServiceSection>
  );
}