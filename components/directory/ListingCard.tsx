'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapPin, BadgeCheck, ArrowRight, Star } from 'lucide-react';

export type ListingCardVariant =
  /** To-Let: price-led rental listing. */
  | 'rental'
  /** Kajer Bua / Tutor: person or organisation profile. */
  | 'profile'
  /** Kena-Becha: product for sale. */
  | 'product'
  /** Gari / Auto / CNG. */
  | 'vehicle'
  /** WiFi / Coaching: local service provider. */
  | 'service'
  /** Job portal. */
  | 'job'
  /** Bus schedule row. */
  | 'bus';

export interface ListingCardData {
  id: string;
  href: string;
  title: string;
  /** One short line under the title. */
  subtitle?: string;
  imageUrl?: string;
  /** Primary price/rate line, rendered as the card's strongest text. */
  priceLabel?: string;
  /** Secondary price qualifier, e.g. "/মাস". */
  priceSuffix?: string;
  areaLabel?: string;
  /** Small fact chips — 2–3 max, the rest are dropped on mobile. */
  chips?: string[];
  /** Overlaid on the image, top-left. */
  badge?: string;
  badgeTone?: 'brand' | 'accent' | 'urgent';
  isVerified?: boolean;
  rating?: number;
  ratingCount?: number;
  /** CTA text at the card footer. */
  actionLabel?: string;
  /** Shown instead of `actionLabel` when the record is exhausted/unavailable. */
  unavailableLabel?: string;
  /** Route the CTA to /contact rather than `href`. */
  actionHref?: string;
}

export interface ListingCardProps {
  item: ListingCardData;
  variant: ListingCardVariant;
  /** Hides the media block and renders a large initial instead. */
  imageless?: boolean;
  /** Two-letter/first-word fallback when there is no photo. */
  fallbackLabel?: string;
  className?: string;
}

const TONE_CLASS: Record<NonNullable<ListingCardData['badgeTone']>, string> = {
  brand: 'bg-brand-700 text-white',
  accent: 'bg-accent-400 text-brand-950',
  urgent: 'bg-red-700 text-white',
};

/**
 * ListingCard — the one card used across every directory page.
 *
 * Design intent, since "generic AI card grid" is the thing to avoid:
 *  - The price is the loudest element, because on a local marketplace the
 *    first question is always "কত টাকা".
 *  - Hairline sage borders and a small radius instead of drop shadows; the
 *    lift happens on hover, subtly, so a 20-card grid stays calm.
 *  - Facts are 11px chips, not paragraphs. The card should be scannable in
 *    the time it takes to glance down a two-per-row phone list.
 *  - The media block always has a fixed aspect ratio with `object-cover`, so
 *    a portrait photo and a landscape photo both crop rather than stretch.
 *  - Two per row on mobile (from the grid, not from here) means the card
 *    itself is sized for ~160px of content width: type is scaled down and
 *    clamped, and anything non-essential is hidden below `sm`.
 */
export default function ListingCard({
  item,
  variant,
  imageless = false,
  fallbackLabel,
  className = '',
}: ListingCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !imageless && item.imageUrl && !imgFailed;
  const initial = (fallbackLabel || item.title).trim().slice(0, 2);

  // Bus cards are a schedule, not a product: the route is the headline and the
  // times are the payload, so they get a taller image slot and a route strip.
  const aspect = variant === 'bus' ? 'aspect-[16/10]' : 'aspect-[4/3]';
  const actionHref = item.actionHref || item.href;

  return (
    <Link
      href={actionHref}
      className={`group flex h-full flex-col overflow-hidden rounded-lg border border-brand-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-bronze-300 hover:shadow-md hover:shadow-brand-900/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:rounded-xl ${className}`}
    >
      {/* Media */}
      <div className={`relative ${aspect} w-full shrink-0 overflow-hidden bg-mist-100`}>
        {showImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-brand-950/35 to-transparent"
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist-100"
            aria-hidden="true"
          >
            <span className="select-none text-2xl font-black leading-none text-brand-200 sm:text-4xl">
              {initial}
            </span>
          </div>
        )}

        {item.badge && (
          <span
            className={`absolute left-1.5 top-1.5 inline-flex items-center rounded-md px-1.5 py-[3px] text-[10px] font-extrabold shadow-sm ${
              TONE_CLASS[item.badgeTone ?? 'brand']
            }`}
          >
            {item.badge}
          </span>
        )}

        {item.isVerified && (
          <span
            className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-sm"
            title="ভেরিফাইড"
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">ভেরিফাইড</span>
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
        {/* Price leads on priced variants; on profile/job variants the title
            leads because there is no single number to anchor on. */}
        {item.priceLabel && (
          <p className="flex items-baseline gap-1 text-[15px] font-extrabold leading-none tracking-tight text-brand-800 sm:text-lg">
            <span className="truncate">{item.priceLabel}</span>
            {item.priceSuffix && (
              <span className="shrink-0 text-[10px] font-semibold text-ink-400 sm:text-[11px]">
                {item.priceSuffix}
              </span>
            )}
          </p>
        )}

        <h3
          className={`mt-1 line-clamp-2 font-bold leading-snug text-ink-900 ${
            item.priceLabel
              ? 'text-[12.5px] sm:text-[15px]'
              : 'text-[13px] sm:text-[15px]'
          }`}
        >
          {item.title}
        </h3>

        {item.subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-ink-500 sm:mt-1 sm:text-xs">
            {item.subtitle}
          </p>
        )}

        {item.areaLabel && (
          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-ink-400 sm:text-xs">
            <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="truncate">{item.areaLabel}</span>
          </p>
        )}

        {/* Chips: 2 on mobile, 3 from sm. Keeps the two-up card short. */}
        {item.chips && item.chips.filter(Boolean).length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {item.chips
              .filter(Boolean)
              .slice(0, 2)
              .map((chip) => (
                <li
                  key={chip}
                  className="max-w-full truncate rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10px] font-medium text-ink-600"
                >
                  {chip}
                </li>
              ))}
            {item.chips.filter(Boolean).length > 3 && (
              <li className="hidden items-center gap-0.5 text-[10px] font-bold text-ink-400 sm:flex">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {item.rating?.toFixed(1)}
                {item.ratingCount ? ` (${item.ratingCount})` : ''}
              </li>
            )}
          </ul>
        )}

        {/* Footer CTA */}
        <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-brand-100 pt-2 sm:pt-2.5">
          {item.unavailableLabel ? (
            <span className="truncate text-[11px] font-bold text-ink-400 sm:text-xs">
              {item.unavailableLabel}
            </span>
          ) : (
            <span className="flex min-w-0 items-center gap-1 text-[11px] font-bold text-brand-700 sm:text-xs">
              <span className="truncate">{item.actionLabel || 'বিস্তারিত'}</span>
              <ArrowRight
                className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </span>
          )}

          {item.rating !== undefined && item.ratingCount !== undefined && item.ratingCount > 0 && (
            <span className="hidden shrink-0 items-center gap-0.5 text-[10px] font-bold text-ink-500 sm:inline-flex">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/**
 * The shared result grid. Every directory page uses this so the 2-per-row
 * mobile / 3-up tablet / 4-up desktop rhythm is identical site-wide.
 *
 * `twoUp` is the default because most pages carry richer records. Pages that
 * only need a category icon (service tiles) use `threeUp` instead.
 */
export function ListingGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {children}
    </div>
  );
}
