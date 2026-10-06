import Link from 'next/link';
import type { HomepageService } from '@/lib/homepage-catalog';

/**
 * CategoryTile — one item in a homepage category grid.
 *
 * Deliberately Server Component (no 'use client'): the tile renders
 * `item.icon` directly, and a Lucide component is a function. If this were a
 * client component the icon would have to be serialised across the RSC
 * boundary as a prop, which React refuses to do.
 *
 * The tile carries exactly two things — the service image and the service
 * name. No card body, no description, no chips, no "সেবা দেখুন →" row, no dial
 * button: just the picture and the label under it, the way a service/app
 * category screen is laid out. Every affordance lives on the tile itself, so
 * the whole square stays tappable.
 *
 * The photo is the focal point. It is always square, always the same size for
 * every service in every category, and the name is centred directly beneath it
 * at a clamped two lines so nothing is ever cut off mid-word.
 */
export default function CategoryTile({ item }: { item: HomepageService }) {
  const red = item.tone === 'red';

  /**
   * Every catalog service ships a photo, but a tile that lost its image must
   * still read as designed rather than broken — so it falls back to the
   * service's own glyph on a soft brand-tinted square.
   */
  const media = item.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.image}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.06]"
      style={item.objectPosition ? { objectPosition: item.objectPosition } : undefined}
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center bg-brand-50 text-brand-700">
      <item.icon aria-hidden="true" className="h-1/3 w-1/3" />
    </span>
  );

  const content = (
    <>
      {/* The photo is decorative here — the service name right below it is the
          label, so the tile's accessible name is the name and nothing else. */}
      <span
        aria-hidden="true"
        className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-mist-100 ring-1 ring-brand-900/[0.07] motion-safe:group-hover:ring-brand-900/[0.14]"
      >
        {media}
      </span>
      <span
        className={`mt-2.5 line-clamp-2 break-words text-center text-[12.5px] font-semibold leading-[1.35] tracking-tight transition-colors sm:text-sm lg:text-[15px] ${
          red ? 'text-red-700 group-hover:text-red-800' : 'text-ink-900 group-hover:text-brand-700'
        }`}
      >
        {item.name}
      </span>
    </>
  );

  const rootClass =
    'group flex w-full flex-col items-center rounded-2xl outline-none transition-transform motion-safe:duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 lg:max-w-[10rem]';

  // Emergency services keep their existing one-tap dial target, unchanged.
  if (item.dial) {
    return (
      <a href={item.dial} className={`mx-auto ${rootClass}`}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href ?? '/services'} className={`mx-auto ${rootClass}`}>
      {content}
    </Link>
  );
}
