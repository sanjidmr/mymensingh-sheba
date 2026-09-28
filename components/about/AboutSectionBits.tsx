import React from 'react';

/**
 * Small shared building blocks for the About page so every section keeps the
 * same vertical rhythm and label treatment without duplicating wrappers.
 */

export function SectionLabel({
  children,
  tone = 'light',
}: {
  children: React.ReactNode;
  tone?: 'light' | 'dark';
}) {
  return (
    <p
      className={`flex items-center gap-2.5 text-xs font-bold sm:text-[13px] ${
        tone === 'dark' ? 'text-accent-300' : 'text-brand-600'
      }`}
    >
      <span aria-hidden="true" className="h-1 w-7 shrink-0 rounded-full bg-accent-400" />
      {children}
    </p>
  );
}

export function AboutSection({
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
      className={`py-8 sm:py-12 ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/** Focus ring used by every dark-surface CTA so keyboard users can see focus. */
export const DARK_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950';

/** Focus ring used by every light-surface CTA. */
export const LIGHT_FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
