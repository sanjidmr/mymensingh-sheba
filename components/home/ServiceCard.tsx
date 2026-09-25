'use client';

import Link from 'next/link';
import { BadgeCheck, MapPin, Star, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import type { HomePreviewCard } from '@/lib/home-preview';

interface ServiceCardProps {
  card: HomePreviewCard;
  className?: string;
}

function AvatarFallback({
  label,
  tone,
}: {
  label: string;
  tone: 'green' | 'rose';
}) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center text-4xl font-bold ${
        tone === 'rose'
          ? 'bg-rose-50 text-rose-700'
          : 'bg-mist-100 text-brand-800'
      }`}
      aria-hidden="true"
    >
      {label}
    </div>
  );
}

export default function ServiceCard({ card, className = '' }: ServiceCardProps) {
  const [imgError, setImgError] = useState(false);
  const showImage = card.imageUrl && !imgError;
  const showRating = typeof card.rating === 'number' && (card.ratingCount || 0) > 0;

  const arrowBoxClass =
    card.avatarTone === 'rose' ? 'bg-rose-700' : 'bg-brand-700';

  return (
    <Link
      href={card.href}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${className}`}
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-mist-100">
        {showImage ? (
          <img
            src={card.imageUrl}
            alt={card.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <AvatarFallback label={card.avatarLabel} tone={card.avatarTone || 'green'} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {card.verified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white">
            <BadgeCheck className="h-3.5 w-3.5" />
            যাচাইকৃত
          </span>
        )}

        {card.availability && (
          <span
            className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
              card.availability.tone === 'green'
                ? 'border-brand-200 bg-white text-brand-800'
                : card.availability.tone === 'amber'
                  ? 'border-amber-200 bg-white text-amber-800'
                  : 'border-slate-200 bg-white text-slate-600'
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

        <span
          className={`absolute bottom-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-md ${arrowBoxClass}`}
          aria-hidden="true"
        >
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4 sm:p-5">
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-ink-900 sm:text-base">
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
            <p className="line-clamp-1 text-[13px] text-ink-500 sm:text-sm">{card.subtitle}</p>
          )}
          {card.location && (
            <p className="flex items-center gap-1 text-xs text-ink-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
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
                  className="rounded-md border border-brand-100 bg-mist-50 px-2 py-1 text-[11px] font-medium text-ink-700 sm:text-xs"
                >
                  {chip}
                </span>
              ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm font-bold text-brand-700 sm:text-[15px]">{card.footer}</span>
          <span className="text-xs font-medium text-brand-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {card.footerLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}