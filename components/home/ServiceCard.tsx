'use client';

import Link from 'next/link';
import { BadgeCheck, MapPin, Star, ArrowRight } from 'lucide-react';
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
 * The imgless variant (privacy for কাজের বুয়া/রক্তদাতা) renders a soft forest-green
 * header with a big brand initial and the status pills — no photo ever.
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

  const arrowBoxClass =
    card.avatarTone === 'rose' ? 'bg-rose-700' : red ? 'bg-red-700' : 'bg-brand-700';

  const statusPill = (
    <>
      {card.verified && (
        <span className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-2 py-1 text-[10px] font-bold text-white">
          <BadgeCheck className="h-3 w-3" />
          যাচাইকৃত
        </span>
      )}
      {card.availability && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-[10px] font-bold ${
            card.availability.tone === 'green'
              ? 'border-brand-200 text-brand-800'
              : card.availability.tone === 'amber'
                ? 'border-amber-200 text-amber-800'
                : 'border-slate-200 text-slate-600'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              card.availability.tone === 'green'
                ? 'bg-brand-600'
                : card.availability.tone === 'amber'
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
            }`}
            aria-hidden="true"
          />
          {card.availability.label}
        </span>
      )}
    </>
  );

  return (
    <Link
      href={card.href}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border border-brand-100/90 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${className}`}
    >
      {!hideImage && imageless ? (
        <div className="relative flex aspect-[4/3] shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 to-mist-50">
          <span
            aria-hidden="true"
            className="select-none text-6xl font-black leading-none text-brand-100/90 transition-transform duration-500 group-hover:scale-110"
          >
            {card.avatarLabel}
          </span>
          <span className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
            {statusPill}
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
              <span className="text-5xl font-black leading-none text-brand-100/90">
                {card.avatarLabel}
              </span>
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-950/40 to-transparent"
          />
          <span className="absolute left-2.5 top-2.5 flex flex-wrap items-center gap-1.5">
            {card.verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-2 py-1 text-[10px] font-bold text-white">
                <BadgeCheck className="h-3 w-3" />
                যাচাইকৃত
              </span>
            )}
          </span>
          {card.availability && (
            <span
              className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md border bg-white px-2 py-1 text-[10px] font-bold ${
                card.availability.tone === 'green'
                  ? 'border-brand-200 text-brand-800'
                  : card.availability.tone === 'amber'
                    ? 'border-amber-200 text-amber-800'
                    : 'border-slate-200 text-slate-600'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  card.availability.tone === 'green'
                    ? 'bg-brand-600'
                    : card.availability.tone === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                }`}
                aria-hidden="true"
              />
              {card.availability.label}
            </span>
          )}
          {!imageless && (
            <span
              className={`absolute bottom-2.5 right-2.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-white shadow-md ${arrowBoxClass}`}
              aria-hidden="true"
            >
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      ) : null}

      {/* Body */}
      <div className={`flex flex-1 flex-col ${compact ? 'gap-1.5 p-3' : 'gap-2.5 p-4'}`}>
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className={`line-clamp-2 font-bold leading-snug ${red ? 'text-red-700' : 'text-ink-900'} ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
              {card.title}
            </h3>
            {showRating && card.rating != null && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {card.rating.toFixed(1)}
              </span>
            )}
          </div>
          {card.subtitle && (
            <p className={`mt-1 line-clamp-1 ${compact ? 'text-xs' : 'text-[13px]'} ${red ? 'text-red-500/80' : 'text-ink-500'}`}>{card.subtitle}</p>
          )}
          {card.location && (
            <p className={`mt-1.5 flex items-center gap-1 ${compact ? 'text-[11px]' : 'text-xs'} ${red ? 'text-red-500/70' : 'text-ink-400'}`}>
              <MapPin className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} shrink-0`} />
              <span className="line-clamp-1">{card.location}</span>
            </p>
          )}
        </div>

        {card.metaChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {card.metaChips
              .filter((chip) => chip.length > 0)
              .slice(0, 3)
              .map((chip) => (
                <span
                  key={chip}
                  className={`rounded-md border font-medium ${red ? 'border-red-200 bg-red-50 text-red-700' : 'border-brand-100 bg-mist-50 text-ink-700'} ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'}`}
                >
                  {chip}
                </span>
              ))}
          </div>
        )}

        <div className={`mt-auto flex items-center justify-between gap-3 border-t border-brand-100 ${compact ? 'pt-2' : 'pt-3'}`}>
          <span className={`truncate font-bold ${red ? 'text-red-700' : 'text-brand-800'} ${compact ? 'text-xs' : 'text-sm'}`}>{card.footer}</span>
          <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${red ? 'text-red-600' : 'text-brand-600'} ${compact ? 'text-[11px]' : ''}`}>
            {card.footerLabel}
            {imageless && (
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-white ${arrowBoxClass}`}
                aria-hidden="true"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}