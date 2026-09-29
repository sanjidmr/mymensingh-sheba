import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, MapPin } from 'lucide-react';
import { DARK_FOCUS } from './AboutSectionBits';

const HERO_POINTS = [
  'ময়মনসিংহ সিটি কর্পোরেশন এলাকা',
  'স্থানীয় মানুষের জন্য তৈরি',
  'স্বচ্ছ ও সহজ প্রক্রিয়া',
];

/**
 * AboutHero — the opening statement of the page.
 *
 * Deep-forest surface with a single faint locality mark, a strong two-line
 * heading and two clear next steps. Motion is limited to a short staggered
 * rise (the shared `mms-fade-up` utility, which respects reduced motion).
 */
export default function AboutHero() {
  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative overflow-hidden bg-brand-950 text-brand-100"
    >
      {/* Mobile only — the /sheba1.png photograph sits behind the hero on
          phones, where the plain forest surface left a lot of dead space. The
          dark scrim keeps the gold CTA and white heading readable on top, and
          `lg:hidden` leaves the desktop treatment exactly as it was. */}
      <div aria-hidden="true" className="absolute inset-0 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sheba1.png"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-950/92 via-brand-950/88 to-brand-950/95" />
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-16 hidden h-[28rem] w-[28rem] text-brand-800/70 lg:block"
      >
        <MapPin className="h-full w-full" strokeWidth={0.5} />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-9 text-center sm:px-6 sm:pb-14 sm:pt-12 sm:text-left lg:px-8 lg:pb-16 lg:pt-16">
        <p className="mms-fade-up inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-900 px-3 py-1.5 text-[11px] font-bold text-accent-300 sm:text-xs">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          আমাদের সম্পর্কে
        </p>

        <h1
          id="about-hero-heading"
          className="mms-fade-up mx-auto mt-4 max-w-3xl text-[1.7rem] font-extrabold leading-[1.28] tracking-tight text-white sm:mx-0 sm:text-4xl lg:text-[2.75rem]"
          style={{ animationDelay: '80ms' }}
        >
          ময়মনসিংহের মানুষের জন্য,
          <span className="mt-1.5 block text-accent-300">ময়মনসিংহেই তৈরি</span>
        </h1>

        <p
          className="mms-fade-up mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-brand-100/85 sm:mx-0 sm:text-base"
          style={{ animationDelay: '160ms' }}
        >
          বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, গৃহশিক্ষক কিংবা জরুরি রক্তদাতা — দৈনন্দিন
          জীবনের প্রয়োজনীয় প্রতিটি কাজের জন্য আলাদা আলাদা জায়গায় ছুঁতে হয়।
          Mymensingh Sheba তৈরি হয়েছে ঠিক এই সমস্যাটি সমাধান করার জন্য।
        </p>

        <div
          className="mms-fade-up mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center"
          style={{ animationDelay: '240ms' }}
        >
          <Link
            href="/services"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-5 text-sm font-extrabold text-brand-950 transition-colors hover:bg-accent-300 sm:w-auto ${DARK_FOCUS}`}
          >
            সেবা খুঁজুন
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/how-it-works"
            className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-brand-600 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-900 sm:w-auto ${DARK_FOCUS}`}
          >
            কীভাবে কাজ করে
          </Link>
        </div>

        <ul
          className="mms-fade-up mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-2 border-t border-brand-800 pt-5 sm:justify-start lg:mx-0"
          style={{ animationDelay: '320ms' }}
        >
          {HERO_POINTS.map((point) => (
            <li
              key={point}
              className="flex items-center gap-2 text-xs font-medium text-brand-200/90 sm:text-[13px]"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-accent-400" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <p className="mt-6 hidden items-center gap-2 text-[11px] font-semibold text-brand-400 sm:flex">
          <span aria-hidden="true" className="h-px w-8 bg-brand-700" />
          আরও পড়ুন
          <ChevronDown
            className="h-4 w-4 animate-bounce motion-reduce:animate-none"
            aria-hidden="true"
          />
        </p>
      </div>
    </section>
  );
}
