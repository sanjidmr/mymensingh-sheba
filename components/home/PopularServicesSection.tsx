'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  href: string;
  image: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'tolet', name: 'বাসা ভাড়া, মেস, হোস্টেল', href: '/services/toilet', image: '/home.jpg' },
  { id: 'repair', name: 'Electrician ও Plumber', href: '/services/electrician', image: '/e&p.jpg' },
  { id: 'maid', name: 'কাজের বুয়া', href: '/services/maid', image: '/kajerbua.jpg' },
  { id: 'home-moving', name: 'বাসা পাল্টানো', href: '/services/home-moving', image: '/homechange.jpg' },
  { id: 'home-tutor', name: 'গৃহশিক্ষক', href: '/services/tutor', image: '/tutor.jpg' },
  { id: 'blood-donor', name: 'রক্তদান', href: '/services/blood-donor', image: '/doner.jpg' },
];

/**
 * জনপ্রিয় সেবা — premium service showcase (cream background, forest-green accent).
 *
 * Header: small accent line + dot, dominant Bengali heading, lighter subtitle,
 * and "সব সেবা →" aligned to the heading on the far right.
 *
 * Desktop: 3 columns × 2 rows. Tablet: 2 columns. Mobile: compact horizontal
 * swipe carousel (≈1.4 cards visible + pagination dots) — never a squeezed grid.
 *
 * Cards: image fills a fixed 4:3 top (object-cover, never distorted), rounded
 * top corners; compact white info area below with bold dark-green title, a short
 * secondary line and a small circular dark-green arrow at bottom-right.
 */
export default function PopularServicesSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const CARD_GAP = 12; // gap-3

  const updateActive = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-service-card]');
    const step = (card?.offsetWidth ?? 200) + CARD_GAP;
    const idx = Math.round(el.scrollLeft / step);
    setActiveIdx(Math.min(Math.max(idx, 0), CATEGORIES.length - 1));
  };

  return (
    <section aria-label="জনপ্রিয় সেবা" className="border-b border-brand-100 bg-mist-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
        {/* ——— Header ——— */}
        <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-[3px] w-7 rounded-full bg-brand-700 sm:w-9" aria-hidden="true" />
              <span className="h-1.5 w-1.5 rounded-full bg-brand-700" aria-hidden="true" />
            </div>
            <h2 className="mt-2.5 text-xl font-extrabold leading-tight tracking-tight text-brand-800 sm:text-2xl">
              জনপ্রিয় সেবা
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-400 sm:text-[13px]">
              আপনার প্রয়োজন অনুযায়ী বেছে নিন সেরা সেবাগুলো।
            </p>
          </div>

          <Link
            href="/services"
            className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brand-700 transition-colors hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:mt-1.5"
          >
            সব সেবা
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* ——— Desktop & tablet grid (2 cols, 3 cols on lg) ——— */}
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((item) => (
            <ServiceCard key={item.id} item={item} />
          ))}
        </div>

        {/* ——— Mobile: horizontal swipe carousel ——— */}
        <div className="md:hidden">
          <div className="-mx-4 px-4">
            <div
              ref={scrollerRef}
              onScroll={updateActive}
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {CATEGORIES.map((item) => (
                <ServiceCard
                  key={item.id}
                  item={item}
                  mobile
                />
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            {CATEGORIES.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`সেবা ${i + 1}`}
                aria-current={i === activeIdx}
                onClick={() => {
                  const el = scrollerRef.current;
                  const card = el?.querySelector<HTMLElement>('[data-service-card]');
                  const step = (card?.offsetWidth ?? 200) + CARD_GAP;
                  el?.scrollTo({ left: i * step, behavior: 'smooth' });
                  setActiveIdx(i);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? 'w-5 bg-brand-700'
                    : 'w-2 bg-brand-200 hover:bg-brand-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ item, mobile = false }: { item: CategoryItem; mobile?: boolean }) {
  return (
    <Link
      data-service-card
      href={item.href}
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 ${
        mobile ? 'w-[58vw] max-w-[250px] min-w-[190px] shrink-0 snap-start' : ''
      }`}
    >
      {/* Image — fixed ratio, fills container, never distorted */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-brand-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Info area — compact, uniform height */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-brand-800 sm:text-base">
          {item.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="text-[12px] font-medium text-ink-400 sm:text-[13px]">আরও দেখুন</span>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-white transition-colors group-hover:bg-brand-800 sm:h-9 sm:w-9"
            aria-hidden="true"
          >
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}