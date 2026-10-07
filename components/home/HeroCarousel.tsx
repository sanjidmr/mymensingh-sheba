'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PublicHeroSlide } from '@/lib/hero-service';

/**
 * HeroCarousel — a premium, calm homepage banner.
 *
 * One image slides horizontally out while the next enters seamlessly from the
 * side. The track is rendered as `[clone(last), ...slides, clone(first)]`, so
 * the loop wraps by sliding onto a clone and then snapping back to the real
 * slide with the transition switched off — there is never a visible jump.
 *
 * Three things are guaranteed by construction:
 *
 *  1. NEVER A BLANK / GREEN FRAME. The loop position is normalised by the
 *     `transitionend` handler *and* by a timeout that fires regardless, so a
 *     backgrounded tab (where transitions do not run) can never leave the
 *     track parked one slide past the end. Every frame also paints its own
 *     picture as a CSS background behind the `<img>`, and the frame itself is
 *     backed by the first slide, so an image that has not painted yet still
 *     shows a photo rather than a colour block.
 *  2. NEVER A MISSING 4th IMAGE. Slides live in a horizontally translated
 *     track, which is exactly where `loading="lazy"` is unreliable — every
 *     slide loads eagerly and is decoded asynchronously, and a slide whose URL
 *     fails falls back to the built-in `/sheba1.png` … `/sheba4.png` art.
 *  3. NEVER STOPS. Autoplay is an interval keyed on the *current* position via
 *     a ref, so it keeps running for as long as the tab is open, without a
 *     refresh and without re-fetching an image.
 *
 * Gentle autoplay, pause on hover/focus, ghost arrows (desktop) and small dots.
 * Respects `prefers-reduced-motion` (autoplay off, no transitions: the track
 * then walks the real slides and never enters the clone edges).
 *
 * Imagery comes from the `hero_slides` table, which the admin panel manages.
 * `SLIDES` below is the fallback: it is what renders when the table is empty
 * (a fresh install) or the database cannot be reached, so the homepage always
 * has a hero and never a broken image.
 */
const SLIDES: PublicHeroSlide[] = [
  { image: '/sheba1.png', caption: 'প্রতিদিনের সেবা, এক জায়গায়' },
  { image: '/sheba2.png', caption: 'বাসা থেকে মেরামত — সবই স্থানীয়' },
  { image: '/sheba3.png', caption: 'ময়মনসিংহের মানুষের হাতেই গড়া' },
  { image: '/sheba4.png', caption: 'জরুরি সেবা, সঠিক নম্বরে' },
];

const AUTOPLAY_MS = 5500;
const EASE = 'transform 850ms cubic-bezier(0.22, 1, 0.36, 1)';
/**
 * EASE duration plus margin. The edge snap is normally driven by
 * `transitionend`; this timeout is the belt-and-braces path for the cases where
 * that event never arrives (transition interrupted, tab in the background), so
 * the track can never stay parked on a clone edge.
 */
const SNAP_MS = 1000;

/** `url("…")` with the quotes escaped for CSS, safe for any path. */
function cssUrl(src: string): string {
  return `url(${JSON.stringify(src)})`;
}

function usePrefersReducedMotion() {
  // Must start false on both server and client. Reading `matchMedia` in the
  // state initialiser would make the first client render disagree with the
  // server HTML for anyone who has reduced motion on, and the transition style
  // below depends on this value.
  //
  // `useSyncExternalStore` gives that for free: the media query *is* an
  // external store, the browser already manages the subscription, and the
  // server snapshot is `false`.
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

export default function HeroCarousel({
  slides,
}: {
  /**
   * Slides from the `hero_slides` table, fetched by the server component that
   * renders this carousel. When empty or omitted the built-in `SLIDES` array
   * is used, so a fresh install or an unreachable database still shows the
   * original homepage hero.
   */
  slides?: PublicHeroSlide[];
}) {
  // A row without an image would punch a permanent hole in the band, so it is
  // dropped before anything else derives an index from the list.
  const usable = (slides ?? []).filter((s) => typeof s?.image === 'string' && s.image.length > 0);
  const active = usable.length > 0 ? usable : SLIDES;
  const N = active.length;
  // Cloned track: [last, ...slides, first] — lets the loop wrap invisibly.
  // This array is what gets *rendered*; the transform below is a track index
  // where 0 and N+1 are the two clones.
  const track: PublicHeroSlide[] = [active[N - 1], ...active, active[0]];

  // `pos` is the position in the cloned track (1..N are the "real" slides).
  const [pos, setPos] = useState(1);
  const [noAnim, setNoAnim] = useState(false);
  const [paused, setPaused] = useState(false);
  const posRef = useRef(1);
  const snapTimerRef = useRef<number | null>(null);
  const reduced = usePrefersReducedMotion();

  const setPosBoth = useCallback((value: number) => {
    posRef.current = value;
    setPos(value);
  }, []);

  const clearSnap = useCallback(() => {
    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }, []);

  /** Jump — no transition — from a clone edge back onto its real slide. */
  const snap = useCallback(() => {
    clearSnap();
    const current = posRef.current;
    // Anywhere but an edge there is nothing to normalise: the transition
    // completed, and cancelling the pending timeout is the whole point.
    if (current !== 0 && current !== N + 1) return;
    // The flag has to land in the same commit as the position, or the browser
    // would happily animate the correction backwards across the whole strip.
    setNoAnim(true);
    setPosBoth(current === 0 ? N : 1);
  }, [N, clearSnap, setPosBoth]);

  const goToPos = useCallback(
    (target: number) => {
      clearSnap();
      setNoAnim(false);
      setPosBoth(target);
      snapTimerRef.current = window.setTimeout(snap, SNAP_MS);
    },
    [clearSnap, setPosBoth, snap]
  );

  const next = useCallback(() => {
    if (N < 2) return;
    const current = posRef.current;
    // Parked on an edge (only reachable if both the event and the timer were
    // missed): repair first, advance on the next tick.
    if (current === 0 || current === N + 1) {
      snap();
      return;
    }
    if (reduced) {
      // No transitions → never enter the clone edges.
      goToPos(current === N ? 1 : current + 1);
      return;
    }
    goToPos(current + 1);
  }, [N, reduced, goToPos, snap]);

  const prev = useCallback(() => {
    if (N < 2) return;
    const current = posRef.current;
    if (current === 0 || current === N + 1) {
      snap();
      return;
    }
    if (reduced) {
      goToPos(current === 1 ? N : current - 1);
      return;
    }
    goToPos(current - 1);
  }, [N, reduced, goToPos, snap]);

  const goTo = useCallback(
    (displayIndex: number) => {
      const current = posRef.current;
      if (current === 0 || current === N + 1) {
        // Land the jump on the real slide first, then animate on the next
        // frame so a dot tap never sweeps across the whole strip.
        snap();
        window.requestAnimationFrame(() => goToPos(displayIndex + 1));
        return;
      }
      goToPos(displayIndex + 1);
    },
    [N, goToPos, snap]
  );

  useEffect(() => {
    if (reduced || paused || N < 2) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused, N, next]);

  // Never leave a timer behind on unmount.
  useEffect(() => clearSnap, [clearSnap]);

  /**
   * When a clone edge settles, snap back invisibly to the real slide. Guarded
   * on the event target so a child transition (the image hover zoom) bubbling
   * up cannot cancel the pending snap of an in-flight slide.
   */
  const onTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    snap();
  };

  const displayIndex = pos === 0 ? N - 1 : pos === N + 1 ? 0 : pos - 1;
  const frameStyle = { backgroundImage: cssUrl(active[0].image) };

  return (
    <section className="bg-mist-50" aria-label="বৈশিষ্ট্যযুক্ত সেবা">
      <div className="mx-auto w-full max-w-none px-0 pb-0 pt-0 sm:max-w-7xl sm:px-6 sm:pb-2 sm:pt-3 lg:px-8 lg:pb-3 lg:pt-4">
        <div
          className="group/carousel relative overflow-hidden rounded-none bg-cover bg-center bg-mist-100 shadow-none ring-0 sm:rounded-2xl sm:shadow-xl sm:shadow-brand-900/15 sm:ring-1 sm:ring-brand-900/10 lg:rounded-3xl"
          style={frameStyle}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Sliding track — clones included, so `pos` may never run past it */}
          <div
            className="flex w-full"
            style={{
              transform: `translateX(-${pos * 100}%)`,
              transition: noAnim || reduced ? 'none' : EASE,
            }}
            onTransitionEnd={onTransitionEnd}
          >
            {track.map((s, i) => (
              <div
                key={`hero-${i}-${s.image}`}
                className="relative aspect-[16/9] w-full shrink-0 bg-cover bg-center lg:max-h-[520px] xl:max-h-[560px]"
                // The same picture painted behind the <img>: until the file
                // has decoded, the frame shows a photo instead of a colour.
                style={{ backgroundImage: cssUrl(s.image) }}
              >
                {/* The four `/sheba*.png` files are 1672×941 (~16:9), and the
                    frame is locked to 16:9 at every breakpoint, so the picture
                    fills the box edge to edge — no side matting, and `cover`
                    trims at most a sub-pixel sliver. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image}
                  alt=""
                  // Eager on purpose: these live in a translated track, which
                  // is exactly where lazy images sit outside the viewport and
                  // may never be asked to load — that is the "4th slide is
                  // blank" bug. Four files, one request each, cached for the
                  // life of the page: no refresh ever reloads them.
                  loading="eager"
                  decoding="async"
                  onError={(event) => {
                    const el = event.currentTarget;
                    if (el.dataset.fallback === '1') return;
                    // A slide whose stored URL is dead falls back to the
                    // built-in artwork instead of showing an empty frame.
                    const realIndex = i === 0 ? N - 1 : i === N + 1 ? 0 : i - 1;
                    const fallback = SLIDES[realIndex % SLIDES.length];
                    if (!fallback || fallback.image === s.image) return;
                    el.dataset.fallback = '1';
                    el.src = fallback.image;
                  }}
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
            {active.map((s, i) => (
              <button
                key={`dot-${i}-${s.image}`}
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
