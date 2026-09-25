'use client';

import HeroSearchBar from '@/components/home/HeroSearchBar';

/**
 * Mobile-only search band, placed right after the hero (and before the service
 * shortcut pills) so the app flow reads: Navbar → Hero → Search → Shortcuts →
 * Services. Desktop hides it — search lives in the hero's left column.
 */
export default function HeroSearchSection() {
  return (
    <section className="bg-white pb-5 lg:hidden" aria-label="সেবা খুঁজুন">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <HeroSearchBar />
      </div>
    </section>
  );
}