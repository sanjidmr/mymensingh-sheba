import React from 'react';

/**
 * Shared building blocks for the "ময়মনসিংহ পরিচিতি" page.
 *
 * The page is long (nineteen chapters), so the wrapper, the section label and
 * the two focus-ring recipes live here to keep every chapter rhythmically
 * identical without duplicating wrappers nineteen times.
 */

export function CityLabel({
  children,
  tone = 'light',
  index,
}: {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
  index?: string;
}) {
  return (
    <p
      className={`flex items-center gap-2.5 text-xs font-bold sm:text-[13px] ${
        tone === 'dark' ? 'text-accent-300' : 'text-brand-600'
      }`}
    >
      <span aria-hidden="true" className="h-1 w-7 shrink-0 rounded-full bg-accent-400" />
      {index ? <span className="tabular-nums">{index}</span> : null}
      {children}
    </p>
  );
}

/**
 * Anchor offset: the sticky Navbar (64px / 72px) plus the sticky chapter rail
 * (~52px) sit above every section, so a plain `scroll-mt-24` would tuck the
 * chapter heading underneath them.
 */
export const SCROLL_MT = 'scroll-mt-[7.75rem]';

export function CitySection({
  children,
  className = '',
  id,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  labelledBy: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${SCROLL_MT} py-9 sm:py-14 ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** Focus ring for CTAs sitting on a dark surface. */
export const DARK_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950';

/** Focus ring for CTAs sitting on a light surface. */
export const LIGHT_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

/** Standard chapter heading sizes — deliberately not oversized on mobile. */
export const TITLE = 'text-[1.45rem] font-extrabold leading-snug tracking-tight sm:text-3xl';
export const TITLE_DARK = 'text-[1.45rem] font-extrabold leading-snug tracking-tight text-white sm:text-3xl';
