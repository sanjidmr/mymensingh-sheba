'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { useState } from 'react';
import type { HomePreviewCard } from '@/lib/home-preview';

interface ServiceCardProps {
  card: HomePreviewCard;
  className?: string;
  imageless?: boolean;
  compact?: boolean;
  /** Skip the media block entirely (no photo / no avatar placeholder area) */
  hideImage?: boolean;
  /** Red text treatment for the card body (used by the রক্তদাতা row) */
  tone?: 'default' | 'red';
}

/**
 * New card language — lightweight, restrained, tactile.
 * White card, sage hairline border, warm bronze lift on hover, small corner radius.
 * Photo tiles stay clean: no text, no status badge on top of the image.
 * `hideImage` (privacy for রক্তদাতা) drops the media block entirely.
 */
export default function ServiceCard({
  card,
  className = '',
  imageless = false,
  compact = false,
  hideImage = false,
  tone = 'default',
}: ServiceCardProps) {
  const [imgError, setImgError] = useState(false);
  const showRating = typeof card.rating === 'number' && (card.ratingCount || 0) > 0;
  const red = tone === 'red';

  return (
    <Link
      href={card.href}
      className={`group flex h-full flex-col overflow-hidden rounded-lg border border-brand-100/90 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:rounded-xl ${className}`}
    >
      {!hideImage && imageless ? (
        <div className="relative flex aspect-[4/3] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-mist-50">
          <span
            aria-hidden="true"
            className="select-none text-3xl font-black leading-none text-brand-100/90 transition-transform duration-500 group-hover:scale-110 sm:text-6xl"
          >
            {card.avatarLabel}
          </span>
        </div>
      ) : !hideImage ? (
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-mist-100">
          {card.imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.imageUrl}
              alt={card.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist-50">
              <span className="text-3xl font-black leading-none text-brand-100/90 sm:text-5xl">
                {card.avatarLabel}
              </span>
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-brand-950/40 to-transparent sm:h-16"
          />
        </div>
      ) : null}

      {/* Body */}
      <div className={`flex flex-1 flex-col ${compact ? 'gap-1 p-2 sm:gap-1.5 sm:p-3' : 'gap-2.5 p-4'}`}>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-1 sm:gap-2">
            <h3 className={`line-clamp-2 break-words font-bold leading-[1.5] sm:leading-snug ${red ? 'text-red-700' : 'text-ink-900'} ${compact ? 'text-[14px] sm:text-[15px]' : 'text-base'}`}>
              {card.title}
            </h3>
            {showRating && card.rating != null && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1 py-0.5 text-[10px] font-bold text-amber-700 sm:px-1.5 sm:text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {card.rating.toFixed(1)}
              </span>
            )}
          </div>
          {card.subtitle && (
            <p className={`mt-1 line-clamp-2 break-words text-[13px] leading-relaxed sm:mt-1 sm:line-clamp-2 sm:text-sm ${red ? 'text-red-700' : 'text-ink-600'} ${card.mobileMinimal ? 'hidden sm:block' : ''}`}>{card.subtitle}</p>
          )}
          {card.mobileMeta && card.mobileMeta.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-semibold leading-snug text-brand-800 sm:hidden">
              {card.mobileMeta.map((item) => <span key={item}>{item}</span>)}
            </div>
          )}
          {card.mobileSubtitle && (
            <p className="mt-1 line-clamp-2 break-words text-xs leading-snug text-ink-600 sm:hidden">
              {card.mobileSubtitle}
            </p>
          )}
          {card.location && (
            <p className={`mt-1.5 hidden items-center gap-1 sm:flex ${compact ? 'text-xs' : 'text-sm'} ${red ? 'text-red-700' : 'text-ink-600'}`}>
              <MapPin className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0`} />
              <span className="line-clamp-1">{card.location}</span>
            </p>
          )}
        </div>

        {card.metaChips.length > 0 && (
          <div className="hidden flex-wrap gap-1.5 sm:flex">
            {card.metaChips
              .filter((chip) => chip.length > 0)
              .slice(0, 3)
              .map((chip) => (
                <span
                  key={chip}
                  className={`rounded-md border font-medium ${red ? 'border-red-200 bg-red-50 text-red-800' : 'border-brand-100 bg-mist-50 text-ink-800'} ${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-1 text-xs'}`}
                >
                  {chip}
                </span>
              ))}
          </div>
        )}

        {card.footer && (
          <div className={`mt-auto flex items-center border-t border-brand-100 ${compact ? 'pt-1.5 sm:pt-2' : 'pt-3'} ${card.mobileMinimal ? 'hidden sm:flex' : ''}`}>
            <span className={`truncate font-bold leading-snug ${red ? 'text-red-800' : 'text-brand-800'} ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>{card.footer}</span>
          </div>
        )}
      </div>
    </Link>
  );
}