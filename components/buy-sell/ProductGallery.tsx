'use client';

/**
 * Marketplace product gallery.
 *
 * Same reasoning as `components/tolet/detail/PropertyGallery` and for the same
 * reason: a marketplace item is judged on the photo, so the photo gets the
 * viewport's full width, a swipable carousel and a thumbnail strip, and every
 * other photo on the page stays lazy.
 *
 * What is different from the tolet gallery is the failure path. A marketplace
 * seller uploads from a phone and frequently supplies one bad URL; when an image
 * 404s the frame must not collapse, because a broken <img> with intrinsic sizing
 * is exactly the thing that makes the rest of the page jump. Each slot keeps its
 * aspect ratio and swaps in a neutral placeholder, so the strip height is stable
 * whether or not every photo loaded.
 */

import React, { useState } from 'react';
import { Heart, Images } from 'lucide-react';

interface GalleryProps {
  photos: string[];
  alt: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function ProductGallery({ photos, alt, isFavorite, onToggleFavorite }: GalleryProps) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-mist-200 bg-mist-100">
        <Images className="h-8 w-8 text-ink-300" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-mist-200 bg-mist-100 sm:aspect-[16/10]">
        {failed[active] ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-300">
            <Images className="h-8 w-8" aria-hidden="true" />
            <span className="text-[12px]">ছবিটি দেখা যাচ্ছে না</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[active]}
            alt={`${alt} — ছবি ${active + 1}`}
            // The first photo is the LCP element on this page and arrives with
            // the client fetch, so there is no SSR preload to rely on. The HTML
            // hints below are what actually get it fetched sooner; every other
            // photo stays lazy.
            loading={active === 0 ? 'eager' : 'lazy'}
            fetchPriority={active === 0 ? 'high' : 'auto'}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 620px"
            className="h-full w-full animate-[mms-fade-in_150ms_ease-out] object-cover"
            referrerPolicy="no-referrer"
            onError={() => setFailed((prev) => ({ ...prev, [active]: true }))}
          />
        )}

        {/* Scrim only behind the controls, so the photo is never darkened
            across its full height. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand-950/30 to-transparent"
        />

        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          {photos.length > 1 && (
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-950/55 px-2.5 text-[11px] font-bold text-white backdrop-blur-sm">
              <Images className="h-3.5 w-3.5" aria-hidden="true" />
              {active + 1}/{photos.length}
            </span>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দ তালিকায় রাখুন'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
              isFavorite ? 'text-rose-600' : 'text-ink-600 hover:text-rose-600'
            }`}
          >
            <Heart
              className={`h-5 w-5 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {/* Thumbnail strip. Only rendered when there is more than the cover — a
          strip of one looks like a broken component. */}
      {photos.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <li key={`${photo}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`ছবি ${i + 1} দেখুন`}
                aria-current={i === active}
                className={`h-16 w-20 overflow-hidden rounded-lg border-2 bg-mist-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1 ${
                  i === active ? 'border-brand-600' : 'border-transparent hover:border-mist-200'
                }`}
              >
                {failed[i] ? (
                  <span className="flex h-full w-full items-center justify-center">
                    <Images className="h-4 w-4 text-ink-300" aria-hidden="true" />
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                    onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}