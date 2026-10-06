'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Heart, Images, X } from 'lucide-react';
import type { ToletListing } from '@/lib/tolet-types';
import { cn } from '@/lib/utils';

/**
 * PropertyGallery — the hero image surface of a listing detail page.
 *
 * Design intent, and the reasoning behind it:
 *
 *  - Mobile is a 4:5 portrait crop of ONE photo. A tenant on a phone decides
 *    in about a second whether this looks like a real, cared-for home, and a
 *    grid of thumbnails gives them nothing to judge. Desktop gets the photo
 *    plus a thumbnail strip, because there is room for it.
 *  - 44px minimum touch targets for the arrows and the close button, per the
 *    project's mobile ergonomics rule.
 *  - A single, calm transition (150ms opacity) on the active image. No
 *    cross-fade carousel on the main surface: it reads as a marketing widget,
 *    and a house listing should read as a record, not an ad.
 *  - A broken or blocked photo degrades to a labelled placeholder instead of an
 *    empty grey box, so the page never looks half-loaded.
 *  - `priority` on the first photo only; the rest lazy-load, because the
 *    thumbnails below the fold should not compete with the hero.
 */
interface PropertyGalleryProps {
  listing: ToletListing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function PropertyGallery({ listing, isFavorite, onToggleFavorite }: PropertyGalleryProps) {
  const photos = useMemoListPhotos(listing.photos);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Lock body scroll while the lightbox owns the screen.
  useEffect(() => {
    if (!lightboxOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [lightboxOpen]);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => {
        if (photos.length === 0) return 0;
        return (current + delta + photos.length) % photos.length;
      });
    },
    [photos.length]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    },
    [lightboxOpen, go]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handleKeyDown]);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl border border-dashed border-brand-200 bg-mist-50 sm:aspect-[16/10]">
        <p className="px-6 text-center text-[13px] font-medium leading-relaxed text-ink-400">
          এই বাসার ছবি এখনো যোগ করা হয়নি।
          <br />
          বিস্তারিত জানতে মালিকের সাথে যোগাযোগ করুন।
        </p>
      </div>
    );
  }

  // Derived, clamped at read time rather than kept in sync by an effect.
  // `index` is what the visitor last asked for; `activeIndex` is what actually
  // exists right now. Clamping here means a listing whose photo list shrinks
  // underneath us (admin removed a photo, deep link changed) can never render
  // `photos[out-of-range]` — without a sync effect that would cost a render pass
  // and risk a flash of an empty frame.
  const activeIndex = Math.min(index, photos.length - 1);
  const currentFailed = failed[activeIndex];

  return (
    <>
      {/* ---------- Hero ---------- */}
      <div
        className="group relative overflow-hidden rounded-xl border border-brand-100 bg-mist-100 sm:rounded-2xl"
        // Swipe on touch: one photo per swipe, no momentum hijack of vertical scroll.
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start === null || end === undefined) return;
          const delta = end - start;
          if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
        }}
      >
        <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
          {currentFailed ? (
            <PhotoFallback label={listing.title} />
          ) : (
            <Image
              key={photos[activeIndex]}
              src={photos[activeIndex]}
              alt={`${listing.title} — ছবি ${activeIndex + 1}`}
              fill
              // The hero is the page's LCP element, and it is the one image that
              // must not be lazy.
              //
              // `priority` is set because it is Next's documented way to say
              // "this is the LCP image" (and it keeps the dev-mode LCP warning
              // quiet), but on its own it is not enough here: it emits its
              // preload <link> during SSR, and this hero does not exist during
              // SSR — it only appears after hydration plus a client-side fetch,
              // so no preload can be present in the initial HTML.
              //
              // The plain HTML hints are what actually do the work, because the
              // browser applies them to the element whenever it appears. Every
              // other photo stays lazy.
              priority={activeIndex === 0}
              loading={activeIndex === 0 ? 'eager' : 'lazy'}
              fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 620px"
              className="animate-[mms-fade-in_150ms_ease-out] object-cover"
              referrerPolicy="no-referrer"
              onError={() => setFailed((prev) => ({ ...prev, [activeIndex]: true }))}
            />
          )}
        </div>

        {/* Scrim only behind the controls, so the photo is never darkened
            across its full height. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-brand-950/35 to-transparent"
        />

        {/* Photo count / expand — top right, beside the favourite button */}
        <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5">
          {photos.length > 1 && (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="সব ছবি বড় করে দেখুন"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-950/55 px-2.5 text-[11px] font-bold text-white backdrop-blur-sm transition-colors hover:bg-brand-950/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
            >
              <Images className="h-3.5 w-3.5" aria-hidden="true" />
              {activeIndex + 1}/{photos.length}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দ তালিকায় রাখুন'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm transition-colors hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <Heart
              className={cn('h-5 w-5', isFavorite && 'fill-rose-600 text-rose-600')}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Arrows — desktop only. On mobile a swipe is the expected gesture and
            arrows would cover the photo. */}
        {photos.length > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => go(-1)} />
            <GalleryArrow side="right" onClick={() => go(1)} />
          </>
        )}

        {/* Dot indicators — phones only, and only when there are few enough
            that the dots stay readable.

            Deliberately NOT buttons. At 6–8px they are far below any usable
            touch target, so rendering them as buttons would put focusable
            controls on screen that nobody can reliably hit — the worst of both
            worlds. They are now pure `aria-hidden` progress marks: swipe is the
            gesture on a phone, and from `sm` up the thumbnail strip below is
            the real, correctly-sized control. */}
        {photos.length > 1 && photos.length <= 8 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5 sm:hidden"
          >
            {photos.map((photo, i) => (
              <span
                key={`${photo}-${i}`}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-150',
                  i === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/55'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---------- Thumbnail strip (sm and up) ---------- */}
      {photos.length > 1 && (
        <div
          className="mt-2 hidden gap-2 overflow-x-auto no-scrollbar sm:flex"
          role="tablist"
          aria-label="বাসার ছবি"
        >
          {photos.map((photo, i) => (
            <button
              key={`${photo}-thumb-${i}`}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`ছবি ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                'relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                i === activeIndex
                  ? 'border-brand-600'
                  : 'border-transparent opacity-65 hover:opacity-100'
              )}
            >
              {failed[i] ? (
                <span className="flex h-full w-full items-center justify-center bg-mist-100 text-[11px] font-bold text-ink-400">
                  নেই
                </span>
              ) : (
                <Image
                  src={photo}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setFailed((prev) => ({ ...prev, [i]: true }))}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <GalleryLightbox
          photos={photos}
          index={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          title={listing.title}
        />
      )}
    </>
  );
}

function useMemoListPhotos(photos: string[]): string[] {
  // De-duplicate and drop blanks in one stable pass. Written inline (rather
  // than useMemo) because photo arrays are tiny and a new array identity would
  // only add a dependency to watch.
  const out: string[] = [];
  for (const photo of photos) {
    if (typeof photo === 'string' && photo.trim() && !out.includes(photo)) out.push(photo);
  }
  return out;
}

function PhotoFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-mist-100 px-8 text-center">
      <p className="line-clamp-2 text-[13px] font-semibold leading-relaxed text-ink-400">
        ছবিটি লোড করা যায়নি
        <span className="sr-only"> — {label}</span>
      </p>
    </div>
  );
}

function GalleryArrow({
  side,
  onClick,
}: {
  side: 'left' | 'right';
  onClick: () => void;
}) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'আগের ছবি' : 'পরের ছবি'}
      className={cn(
        'absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:inline-flex',
        side === 'left' ? 'left-3' : 'right-3'
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

/** Full-screen photo viewer. Kept separate so the hero never re-renders with it. */
function GalleryLightbox({
  photos,
  index,
  title,
  onClose,
  onPrev,
  onNext,
}: {
  photos: string[];
  index: number;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="বাসার ছবি"
      className="fixed inset-0 z-[70] flex flex-col bg-brand-950/96"
    >
      <div className="flex items-center justify-between px-3 py-3 sm:px-5">
        <p className="min-w-0 truncate text-[12px] font-semibold text-white/80">
          {title}
          <span className="ml-2 text-white/55">
            {index + 1} / {photos.length}
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="ছবি বন্ধ করুন"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <Image
          key={photos[index]}
          src={photos[index]}
          alt={`${title} — ছবি ${index + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-4 px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onPrev}
            aria-label="আগের ছবি"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="পরের ছবি"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}