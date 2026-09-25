'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import HeroSearchBar from '@/components/home/HeroSearchBar';

export interface HeroSlide {
  src: string;
  tag: string;
  title: string;
  subtitle: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  interval?: number;
}

/**
 * Hero — a section of its own, always below the sticky navbar (never behind it).
 *
 * Desktop (lg+): the /sheba1…4 carousel fills the full hero width (cinematic
 * image only — arrows + small indicators overlay). Below the hero sits a
 * clean, centered intro block with the eyebrow/tag, headline, subtitle and the
 * search bar, so the hero itself stays image-pure.
 *
 * Mobile/tablet: an intentional app-like stack — headline block → swipeable
 * rounded photo card (dots overlay) → the search band comes right after as its
 * own section.
 *
 * Images probe `.png` → `.jpg`, then return a branded fallback panel.
 */
export default function HeroCarousel({ slides, interval = 4800 }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState<number[]>(() => slides.map(() => 0));
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchX = useRef<number | null>(null);

  const total = slides.length;
  const slide = slides[index];

  const candidates = useCallback(
    (i: number): string[] => {
      const base = slides[i].src.replace(/\.(jpg|png)$/i, '');
      const other = slides[i].src.endsWith('.png') ? '.jpg' : '.png';
      return [slides[i].src, `${base}${other}`];
    },
    [slides]
  );

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

  const pauseHandlers = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: () => setPaused(false),
  };

  const failed = (attempt[index] ?? 0) >= candidates(index).length;

  const photoMarkup = failed ? (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-brand-800 px-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/80">
        <ImageOff className="h-7 w-7" />
      </span>
      <span className="text-[11px] font-bold uppercase tracking-widest text-accent-300">
        {slide.tag}
      </span>
      <p className="max-w-md text-base font-bold leading-snug text-white sm:text-lg">{slide.title}</p>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={srcFor(index)}
      src={srcFor(index)}
      alt={slide.title}
      className="absolute inset-0 h-full w-full object-cover"
      onError={markFailed}
    />
  );

  const dots = (
    <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5">
      <div
        className="flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-0.5"
        role="group"
        aria-label="স্লাইড নিয়ন্ত্রণ"
      >
        {slides.map((s, i) => (
          <button
            key={s.src}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex(i);
            }}
            aria-label={`স্লাইড ${i + 1}`}
            aria-current={i === index}
            className="grid h-6 w-7 place-items-center rounded-full"
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-5 bg-accent-400' : 'w-2 bg-white/70'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const arrows = (
    <>
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="পূর্ববর্তী ছবি"
        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="পরবর্তী ছবি"
        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </>
  );

  const eyebrow = (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
        ময়মনসিংহ সেবা
      </span>
      <span className="inline-flex items-center rounded-full bg-accent-400 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
        {slide.tag}
      </span>
    </div>
  );

  return (
    <section className="bg-white lg:bg-brand-950" aria-label="প্রধান সেবার হাইলাইট">
      {/* ——— Desktop: full-width image carousel only (no overlay text) ——— */}
      <div
        className="relative hidden aspect-[17/9] w-full max-h-[calc(100vh-4.5rem)] overflow-hidden bg-brand-950 lg:block"
        {...pauseHandlers}
      >
        {photoMarkup}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/30 to-transparent"
        />
        {arrows}
        {dots}
      </div>

      {/* ——— Desktop: intro block with headline + search, below the hero ——— */}
      <div className="hidden border-b border-brand-100 bg-white lg:block">
        <div className="mx-auto w-full max-w-7xl px-6 py-12 xl:px-8 xl:py-14">
          <div className="mx-auto max-w-3xl text-center">
            {eyebrow}
            <h1
              key={`di-${index}`}
              className="mt-3 text-balance text-3xl font-extrabold leading-[1.2] tracking-tight text-ink-900 xl:text-[42px]"
            >
              {slide.title}
            </h1>
            <p
              key={`dp-${index}`}
              className="mt-3 text-balance text-base leading-relaxed text-ink-500"
            >
              {slide.subtitle}
            </p>

            <div className="mx-auto mt-7 max-w-xl">
              <HeroSearchBar />
            </div>
          </div>
        </div>
      </div>

      {/* ——— Mobile / tablet: compact app-like stack ——— */}
      <div className="border-b border-brand-100 bg-white py-6 lg:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
            ময়মনসিংহ সেবা
          </span>
          <span className="inline-flex items-center rounded-full bg-accent-400 px-2.5 py-0.5 text-[11px] font-bold text-brand-800">
            {slide.tag}
          </span>
        </div>
        <h1
          key={`mh-${index}`}
          className="mt-2.5 text-balance text-[24px] font-extrabold leading-[1.25] tracking-tight text-ink-900 sm:text-[28px]"
        >
          {slide.title}
        </h1>
        <p
          key={`mp-${index}`}
          className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-ink-500 sm:text-[15px]"
        >
          {slide.subtitle}
        </p>

        <div
          className="relative mt-4 aspect-video overflow-hidden rounded-2xl bg-brand-950 shadow-sm"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          {...pauseHandlers}
        >
          {photoMarkup}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent"
          />
          {dots}
        </div>
      </div>
    </section>
  );
}