'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

export interface HeroSlide {
  src: string;
  tag: string;
  title: string;
  subtitle: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  interval?: number;
  /** 'bleed' = desktop full-width image (sheet edge-to-edge); 'mobile' = tall image band + overlay content */
  variant?: 'bleed' | 'mobile';
  /** Optional search UI — rendered inside the overlay for the 'mobile' variant */
  search?: React.ReactNode;
}

/**
 * Hero carousel with two layouts:
 * - bleed: full-bleed text-free sheet; stage sized to the image's intrinsic
 *   aspect ratio so nothing is cropped on desktop.
 * - mobile: a portrait-friendly image band (object-cover) with the active
 *   slide headline + supporting text + search bar overlaid, touch swipe, dots.
 * Images live in /public as /sheba1.png … /sheba4.png (jpg/png both accepted);
 * each slide probes one extension then the other before falling back to a
 * branded gradient panel.
 */
export default function HeroCarousel({
  slides,
  interval = 4500,
  variant = 'bleed',
  search,
}: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState<number[]>(() => slides.map(() => 0));
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchX = useRef<number | null>(null);

  const total = slides.length;
  const isMobile = variant === 'mobile';

  const candidates = (i: number): string[] => {
    const base = slides[i].src.replace(/\.(jpg|png)$/i, '');
    const other = slides[i].src.endsWith('.png') ? '.jpg' : '.png';
    return [slides[i].src, `${base}${other}`];
  };

  const srcFor = (i: number): string => {
    const list = candidates(i);
    const a = attempt[i] ?? 0;
    return list[Math.min(a, list.length - 1)] ?? slides[i].src;
  };

  const markFailed = () => {
    setAttempt((prev) => {
      const list = candidates(index);
      const a = prev[index] ?? 0;
      const next = [...prev];
      next[index] = Math.min(a + 1, list.length);
      return next;
    });
  };

  const go = useCallback(
    (dir: 1 | -1) => {
      setIndex((prev) => (prev + dir + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setTimeout(() => {
      setIndex((prev) => (prev + 1) % total);
    }, interval);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, paused, interval, total]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
  };

  const slide = slides[index];
  const stageClass = isMobile
    ? 'relative h-[78svh] min-h-[600px] w-full sm:h-[70svh] sm:max-h-[860px]'
    : 'relative aspect-[1672/941] w-full';
  const imgClass = isMobile
    ? 'absolute inset-0 h-full w-full object-cover object-center'
    : 'absolute inset-0 h-full w-full object-cover';

  return (
    <div
      className="relative w-full overflow-hidden bg-brand-900"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={(e) => {
        if (e.target === e.currentTarget) setPaused(true);
      }}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-roledescription="carousel"
      aria-label="ফিচারড সেবা"
    >
      <div
        data-hero="true"
        className={variant === 'bleed' ? stageClass : `${stageClass} flex items-center justify-center`}
        key={index}
        style={{ animation: 'heroFadeIn 600ms ease-out' }}
      >
        {(attempt[index] ?? 0) >= candidates(index).length ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/80">
              <ImageOff className="h-7 w-7" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-brand-200">
              {slide.tag}
            </span>
            <p className="max-w-md text-lg font-bold leading-snug text-white sm:text-xl">
              {slide.title}
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={srcFor(index)}
            alt={slide.title}
            className={imgClass}
            onError={markFailed}
          />
        )}

        {/* Mobile overlay: headline, supporting text + search bar */}
        {isMobile && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/75"
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-end pb-24 sm:pb-20 lg:pb-24">
              <div className="px-5 sm:px-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {slide.tag}
                </span>
                <h1 className="mt-3 max-w-xl text-[26px] font-extrabold leading-tight text-white sm:text-4xl">
                  {slide.title}
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                  {slide.subtitle}
                </p>
                {search && <div className="pointer-events-auto mt-5 w-full max-w-xl">{search}</div>}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="পূর্ববর্তী ছবি"
        className={`absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-11 sm:w-11 sm:left-5 ${
          isMobile ? 'hidden sm:flex' : ''
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="পরবর্তী ছবি"
        className={`absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-11 sm:w-11 sm:right-5 ${
          isMobile ? 'hidden sm:flex' : ''
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-1.5">
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`স্লাইড ${i + 1}`}
            aria-current={i === index}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
}