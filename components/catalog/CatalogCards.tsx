'use client';

/**
 * The card family for the newer service pages.
 *
 * The existing `ListingCard` is tuned for a 2-up phone grid, which is wrong for
 * the pages below: coaching and WiFi are one-per-row on a phone and want a
 * wide banner; buy-sell is a 5-up desktop grid that wants a tight card. Rather
 * than fork that component into three near-duplicates, the layout-critical
 * pieces are extracted here and each page composes the variant it needs.
 *
 * Shared rules, so a page cannot accidentally look "off-brand":
 *  - hairline `brand-100` borders, `rounded-xl` max, lift only on hover
 *  - 11–12px fact chips instead of paragraphs
 *  - fixed media aspect ratio + `object-cover`, with a graceful initial fallback
 *  - no drop shadows at rest, no gradients beyond a legibility scrim on photos
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, MapPin, Phone } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

/** Initial-letter tile shown when a listing has no photo. */
export function MediaInitial({
  label,
  className = '',
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist-100 ${className}`}
    >
      <span className="select-none text-2xl font-black leading-none text-brand-200 sm:text-4xl">
        {(label || '?').trim().slice(0, 2)}
      </span>
    </div>
  );
}

/**
 * A photo that degrades to an initial tile instead of a broken-image icon.
 * Every listing image in the app goes through this.
 */
export function ListingMedia({
  src,
  alt,
  label,
  className = '',
  imgClassName = '',
}: {
  src?: string;
  alt: string;
  label: string;
  className?: string;
  imgClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <MediaInitial label={label} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${imgClassName} ${className}`}
    />
  );
}

export function FactChips({
  items,
  max = 3,
  className = '',
}: {
  items: (string | undefined | false)[];
  max?: number;
  className?: string;
}) {
  const clean = items.filter(Boolean) as string[];
  if (clean.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1 ${className}`}>
      {clean.slice(0, max).map((chip) => (
        <li
          key={chip}
          className="max-w-full truncate rounded border border-brand-100 bg-mist-50 px-1.5 py-[2px] text-[10px] font-medium text-ink-600"
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}

const CARD_BASE =
  'group flex h-full flex-col overflow-hidden rounded-xl border border-brand-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-bronze-300 hover:shadow-md hover:shadow-brand-900/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

// ---------------------------------------------------------------------------
// Banner card — coaching / WiFi
// ---------------------------------------------------------------------------

export interface BannerCardProps {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** The loudest line, e.g. "৳৫০০ – ১০০০ / মাস". */
  priceLabel?: string;
  priceSuffix?: string;
  areaLabel?: string;
  chips?: (string | undefined | false)[];
  description?: string;
  isVerified?: boolean;
  badge?: string;
  actionLabel?: string;
  /** Overrides the default link CTA (e.g. route to /contact instead). */
  actionHref?: string;
  tone?: 'brand' | 'bronze' | 'cyan';
}

/**
 * A wide, horizontal card. On a phone it is one per row: a 4:3 media block on
 * the left, the payload on the right. From `sm` the media grows and the whole
 * card becomes a proper directory banner.
 *
 * This is the "premium education / ISP directory" look — deliberately not the
 * same silhouette as the 2-up ListingCard, because these two pages genuinely
 * have more to say per record.
 */
export function BannerCard({
  href,
  title,
  subtitle,
  imageUrl,
  priceLabel,
  priceSuffix,
  areaLabel,
  chips,
  description,
  isVerified,
  badge,
  actionLabel = 'বিস্তারিত',
  actionHref,
  tone = 'brand',
}: BannerCardProps) {
  const accent =
    tone === 'bronze'
      ? 'text-bronze-600'
      : tone === 'cyan'
        ? 'text-brand-600'
        : 'text-brand-700';

  return (
    <Link
      href={actionHref || href}
      className={`${CARD_BASE} flex-row`}
    >
      <div className="relative aspect-[4/3] w-[38%] shrink-0 overflow-hidden bg-mist-100 sm:aspect-[16/10] sm:w-[42%]">
        <ListingMedia src={imageUrl} alt={title} label={title} />
        {badge && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-white/95 px-1.5 py-[3px] text-[10px] font-extrabold text-brand-800 shadow-sm ring-1 ring-brand-100">
            {badge}
          </span>
        )}
        {isVerified && (
          <span
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-sm"
            title="অ্যাডমিন যাচাইকৃত"
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">অ্যাডমিন যাচাইকৃত</span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-4">
        {priceLabel && (
          <p className="text-[15px] font-extrabold leading-none tracking-tight text-brand-800 sm:text-lg">
            <span className="truncate">{priceLabel}</span>
            {priceSuffix && (
              <span className="ml-1 text-[10px] font-semibold text-ink-400 sm:text-[11px]">
                {priceSuffix}
              </span>
            )}
          </p>
        )}

        <h3
          className={`mt-1 line-clamp-2 text-[13.5px] font-bold leading-snug text-ink-900 sm:text-base ${
            priceLabel ? '' : 'mt-0'
          }`}
        >
          {title}
        </h3>

        {subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-ink-500 sm:text-xs">
            {subtitle}
          </p>
        )}

        {description && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-500 sm:line-clamp-2 sm:text-[13px]">
            {description}
          </p>
        )}

        {areaLabel && (
          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-ink-400 sm:text-xs">
            <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="truncate">{areaLabel}</span>
          </p>
        )}

        <FactChips items={chips ?? []} max={3} className="mt-1.5" />

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-brand-100 pt-2">
          <span
            className={`flex min-w-0 items-center gap-1 text-[11px] font-bold sm:text-xs ${accent}`}
          >
            <span className="truncate">{actionLabel}</span>
            <ArrowRight
              className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Tile card — bus / vehicle (2-up phone)
// ---------------------------------------------------------------------------

export interface TileCardProps {
  href: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  /** Optional emphasized line — the price, on categories that have one. */
  priceLabel?: string;
  priceSuffix?: string;
  areaLabel?: string;
  chips?: (string | undefined | false)[];
  badge?: string;
  badgeTone?: 'brand' | 'accent' | 'urgent';
  isVerified?: boolean;
  actionLabel?: string;
  actionHref?: string;
}

export function TileCard({
  href,
  title,
  subtitle,
  imageUrl,
  priceLabel,
  priceSuffix,
  areaLabel,
  chips,
  badge,
  badgeTone = 'brand',
  isVerified,
  actionLabel = 'বিস্তারিত',
  actionHref,
}: TileCardProps) {
  const toneClass =
    badgeTone === 'urgent'
      ? 'bg-red-700 text-white'
      : badgeTone === 'accent'
        ? 'bg-accent-400 text-brand-950'
        : 'bg-brand-700 text-white';

  return (
    <Link href={actionHref || href} className={CARD_BASE}>
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-mist-100">
        <ListingMedia src={imageUrl} alt={title} label={title} />
        {badge && (
          <span
            className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-[3px] text-[10px] font-extrabold shadow-sm ${toneClass}`}
          >
            {badge}
          </span>
        )}
        {isVerified && (
          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-sm">
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">অ্যাডমিন যাচাইকৃত</span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3.5">
        {priceLabel && (
          <p className="text-[15px] font-extrabold leading-none tracking-tight text-brand-800 sm:text-lg">
            <span className="truncate">{priceLabel}</span>
            {priceSuffix && (
              <span className="ml-1 text-[10px] font-semibold text-ink-400 sm:text-[11px]">
                {priceSuffix}
              </span>
            )}
          </p>
        )}

        <h3 className="mt-1 line-clamp-2 text-[12.5px] font-bold leading-snug text-ink-900 sm:text-[15px]">
          {title}
        </h3>

        {subtitle && (
          <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-ink-500 sm:text-xs">
            {subtitle}
          </p>
        )}

        {areaLabel && (
          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-ink-400 sm:text-xs">
            <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="truncate">{areaLabel}</span>
          </p>
        )}

        <FactChips items={chips ?? []} max={2} className="mt-1.5" />

        <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-brand-100 pt-2 sm:pt-2.5">
          <span className="flex min-w-0 items-center gap-1 text-[11px] font-bold text-brand-700 sm:text-xs">
            <span className="truncate">{actionLabel}</span>
            <ArrowRight
              className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Compact card — buy-sell (2-up phone, 5-up desktop)
// ---------------------------------------------------------------------------

export interface CompactCardProps {
  href: string;
  title: string;
  imageUrl?: string;
  priceLabel?: string;
  areaLabel?: string;
  chips?: (string | undefined | false)[];
  badge?: string;
  isVerified?: boolean;
}

export function CompactCard({
  href,
  title,
  imageUrl,
  priceLabel,
  areaLabel,
  chips,
  badge,
  isVerified,
}: CompactCardProps) {
  return (
    <Link href={href} className={CARD_BASE}>
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-mist-100">
        <ListingMedia src={imageUrl} alt={title} label={title} />
        {badge && (
          <span className="absolute left-1.5 top-1.5 rounded-md bg-accent-400 px-1.5 py-[3px] text-[10px] font-extrabold text-brand-950 shadow-sm">
            {badge}
          </span>
        )}
        {isVerified && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/95 text-brand-700 shadow-sm">
            <BadgeCheck className="h-3 w-3" aria-hidden="true" />
            <span className="sr-only">অ্যাডমিন যাচাইকৃত</span>
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-2 sm:p-2.5">
        {priceLabel && (
          <p className="truncate text-[13px] font-extrabold leading-none tracking-tight text-brand-800 sm:text-sm">
            {priceLabel}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-[11.5px] font-bold leading-snug text-ink-900 sm:text-[13px]">
          {title}
        </h3>
        {areaLabel && (
          <p className="mt-1 flex items-center gap-0.5 text-[10px] text-ink-400">
            <MapPin className="h-2.5 w-2.5 shrink-0 text-brand-500" aria-hidden="true" />
            <span className="truncate">{areaLabel}</span>
          </p>
        )}
        <FactChips items={chips ?? []} max={1} className="mt-1" />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Emergency contact row
// ---------------------------------------------------------------------------

export interface ContactRowProps {
  name: string;
  organization?: string;
  areaLabel?: string;
  address?: string;
  /** The verified local number. Only rendered when a real one exists. */
  phone?: string;
  notes?: string;
  isVerified?: boolean;
}

/**
 * Emergency listing row.
 *
 * The number is only rendered when the database actually holds one. There is no
 * national fallback (999/102) baked in here on purpose — a page full of
 * national hotlines is not what a Mymensingh resident needs, and inventing a
 * local number would be worse. If no verified number exists, the row still
 * shows the name and area with a request button instead of a fake dial target.
 */
export function ContactRow({
  name,
  organization,
  areaLabel,
  address,
  phone,
  notes,
  isVerified,
}: ContactRowProps) {
  const hasPhone = Boolean(phone && phone.trim());
  return (
    <article className="flex flex-col rounded-xl border border-brand-100 bg-white p-3.5 transition-colors hover:border-brand-200 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold leading-snug text-ink-900 sm:text-base">
            {name}
          </h3>
          {organization && (
            <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500 sm:text-[13px]">
              {organization}
            </p>
          )}
        </div>
        {isVerified && (
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
            title="অ্যাডমিন যাচাইকৃত"
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">অ্যাডমিন যাচাইকৃত</span>
          </span>
        )}
      </div>

      {areaLabel && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink-500 sm:text-xs">
          <MapPin className="h-3 w-3 shrink-0 text-brand-500" aria-hidden="true" />
          <span className="truncate">{areaLabel}</span>
        </p>
      )}

      {address && (
        <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500 sm:text-[13px]">
          {address}
        </p>
      )}

      {notes && (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-500 sm:text-[13px]">
          {notes}
        </p>
      )}

      <div className="mt-auto pt-3">
        {hasPhone ? (
          <a
            href={`tel:${phone!.replace(/[^\d+]/g, '')}`}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            যোগাযোগ করুন
            <span className="font-bold">{phone}</span>
          </a>
        ) : (
          <Link
            href="/contact#contact-form"
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-mist-50 ${LIGHT_FOCUS}`}
          >
            অনুরোধ পাঠান
          </Link>
        )}
      </div>
    </article>
  );
}
