'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HeroCarousel — a premium, calm homepage banner.
 *
 * One image slides horizontally out while the next enters seamlessly from the
 * side (a behind-the-scenes cloned-track loop, so there is never a wrap snap).
 * Gentle autoplay, pause on hover/focus, ghost arrows (desktop) and small dots.
 * Respects `prefers-reduced-motion` (autoplay off, no transitions).
 *
 * Imagery: the four existing `/sheba*.png` files — replace the file paths below.
 */
const SLIDES = [
  { image: '/sheba1.png', caption: 'প্রতিদিনের সেবা, এক জায়গায়' },
  { image: '/sheba2.png', caption: 'বাসা থেকে মেরামত — সবই স্থানীয়' },
  { image: '/sheba3.png', caption: 'ময়মনসিংহের মানুষের হাতেই গড়া' },
  { image: '/sheba4.png', caption: 'জরুরি সেবা, সঠিক নম্বরে' },
];

const AUTOPLAY_MS = 5500;
const EASE = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function HeroCarousel() {
  const N = SLIDES.length;
  // Cloned track: [last, ...slides, first] — lets the loop wrap invisibly.
  const track = [SLIDES[N - 1], ...SLIDES, SLIDES[0]];

  // `real` is the position in the cloned track (1..N are the "real" slides).
  const [real, setReal] = useState(1);
  const [noAnim, setNoAnim] = useState(false);
  const [paused, setPaused] = useState(false);
  const realRef = useRef(real);
  useEffect(() => {
    realRef.current = real;
  }, [real]);
  const reduced = usePrefersReducedMotion();

  const animateTo = useCallback((target: number) => {
    setNoAnim(false);
    setReal(target);
  }, []);

  const next = useCallback(() => {
    // Reduced motion → no transitions, so never enter the clone track.
    if (reduced) {
      animateTo(realRef.current === N ? 1 : realRef.current + 1);
      return;
    }
    if (realRef.current === N) animateTo(N + 1);
    else animateTo(realRef.current + 1);
  }, [N, animateTo, reduced]);

  const prev = useCallback(() => {
    if (reduced) {
      animateTo(realRef.current === 1 ? N : realRef.current - 1);
      return;
    }
    if (realRef.current === 1) animateTo(0);
    else animateTo(realRef.current - 1);
  }, [N, animateTo, reduced]);

  const goTo = useCallback(
    (displayIndex: number) => animateTo(displayIndex + 1),
    [animateTo]
  );

  useEffect(() => {
    if (reduced || paused) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [reduced, paused, next]);

  // When a cloned edge slide settles, snap back invisibly to the real slide.
  const onTransitionEnd = () => {
    if (real === N + 1) {
      setNoAnim(true);
      setReal(1);
    } else if (real === 0) {
      setNoAnim(true);
      setReal(N);
    }
  };

  const displayIndex = real === 0 ? N - 1 : real === N + 1 ? 0 : real - 1;

  return (
    <section className="bg-mist-50" aria-label="বৈশিষ্ট্যযুক্ত সেবা">
      <div className="mx-auto w-full max-w-7xl px-4 pb-1 pt-5 sm:px-6 sm:pb-3 sm:pt-7 lg:px-8 lg:pb-4 lg:pt-8">
        <div
          className="group/carousel relative overflow-hidden rounded-2xl bg-brand-950 shadow-xl shadow-brand-900/15 ring-1 ring-brand-900/10 lg:rounded-3xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Sliding track */}
          <div
            className="flex w-full"
            style={{
              transform: `translateX(-${real * 100}%)`,
              transition: noAnim || reduced ? 'none' : EASE,
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {track.map((s, i) => (
              <div
                key={`${s.image}-${i}`}
                className="relative aspect-[4/3] w-full shrink-0 sm:aspect-[16/9] lg:aspect-[21/9]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  loading={i === 1 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-950/75 via-brand-950/20 to-transparent"
                />
                <span className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-brand-800 ring-1 ring-brand-100 backdrop-blur-sm sm:text-[13px]">
                    {s.caption}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Prev / Next — ghost controls, desktop only */}
          <button
            type="button"
            onClick={prev}
            aria-label="আগের স্লাইড"
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-800 shadow-md ring-1 ring-brand-100 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 sm:flex lg:left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="পরের স্লাইড"
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-800 shadow-md ring-1 ring-brand-100 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 sm:flex lg:right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots — small, quiet */}
          <div className="absolute bottom-5 right-4 flex items-center gap-1.5 sm:bottom-6 sm:right-6">
            {SLIDES.map((s, i) => (
              <button
                key={s.image}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`স্লাইড ${i + 1} দেখুন`}
                aria-current={i === displayIndex}
                className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${
                  i === displayIndex ? 'w-6 bg-accent-400' : 'w-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}