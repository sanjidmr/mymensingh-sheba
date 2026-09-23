'use client';

import ServiceCard from '@/components/home/ServiceCard';
import type { HomePreviewCard } from '@/lib/home-preview';

interface ServiceCarouselProps {
  cards: HomePreviewCard[];
  columns?: 4 | 5;
}

/**
 * Responsive service rail:
 * - mobile: horizontal snap carousel (~1.3–1.5 cards visible, so swiping is obvious)
 * - lg+: fluid grid up to `columns`
 */
export default function ServiceCarousel({ cards, columns = 4 }: ServiceCarouselProps) {
  const gridBlock =
    columns === 5
      ? 'lg:grid-cols-2 xl:grid-cols-5'
      : 'lg:grid-cols-2 xl:grid-cols-4';

  return (
    <div
      className={`no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scroll-px-4 lg:mx-0 lg:grid lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0 lg:snap-none ${gridBlock}`}
      aria-label="সেবা প্রোফাইলের তালিকা"
    >
      {cards.map((card) => (
        <div key={card.id} className="w-[72%] shrink-0 snap-start sm:w-[46%] lg:w-auto">
          <ServiceCard card={card} />
        </div>
      ))}
    </div>
  );
}