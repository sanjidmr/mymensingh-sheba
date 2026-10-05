'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * HeroCarousel — a premium, calm homepage banner.
 *
 * One image slides horizontally out while the next enters seamlessly from the
 * side (a behind-the-scenes cloned-track loop, so there is never a wrap snap).
 * Every source file is 1672×941 (~16:9) and the frame is locked to 16:9 at
 * every breakpoint, so each picture fills the box edge to edge: nothing is
 * cropped and no side matting is ever visible.
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
  // Must start false on both server and client. Reading `matchMedia` in the
  // state initialiser would make the first client render disagree with the
  // server HTML for anyone who has reduced motion on, and the transition style
  // below depends on this value.
  //
  // `useSyncExternalStore` gives that for free: the media query *is* an
  // external store, the browser already manages the subscription, and the
  // server snapshot is `false`. The previous version subscribed by hand and
  // called `setReduced(mq.matches)` in the effect body — a synchronous setState
  // on every mount, which cascades a render before first paint for no reason,
  // and duplicated change-listener bookkeeping the browser already does.
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {};
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
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
      <div className="mx-auto w-full max-w-none px-0 pb-0 pt-0 sm:max-w-7xl sm:px-6 sm:pb-2 sm:pt-3 lg:px-8 lg:pb-3 lg:pt-4">
        <div
          className="group/carousel relative overflow-hidden rounded-none bg-brand-950 shadow-none ring-0 sm:rounded-2xl sm:shadow-xl sm:shadow-brand-900/15 sm:ring-1 sm:ring-brand-900/10 lg:rounded-3xl"
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
                className="relative aspect-[16/9] w-full shrink-0"
              >
                {/* The four `/sheba*.png` files are 1672×941 (~16:9), and the
                    frame is locked to 16:9 at every breakpoint, so the picture
                    fills the box edge to edge — no side matting, and `cover`
                    trims at most a sub-pixel sliver. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  loading={i === 1 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-950/70 via-brand-950/20 to-transparent sm:h-32"
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