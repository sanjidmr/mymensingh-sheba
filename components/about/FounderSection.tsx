import Image from 'next/image';
import { Quote } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';
import {
  DEFAULT_FOUNDER_CONTENT,
  type SiteContentOverrides,
} from '@/lib/site-content';

/**
 * FounderSection — sits directly after the story, by design.
 *
 * Personal rather than corporate: portrait, name, role, the reason it started,
 * and one short quote.
 *
 * Phone order is heading → name → role → portrait → story → quote, so the
 * reader meets the name before the photograph. The desktop two-column split
 * (portrait left, text right) is expressed with explicit `lg:col-start` /
 * `lg:row-start` placements, so re-ordering the four grid children on small
 * screens leaves the large-screen composition untouched.
 */
export default function FounderSection({
  content = DEFAULT_FOUNDER_CONTENT,
}: {
  content?: SiteContentOverrides['founder_content'];
}) {
  const founder = { ...DEFAULT_FOUNDER_CONTENT, ...content };
  return (
    <AboutSection labelledBy="about-founder-heading" className="bg-white">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-x-14 lg:gap-y-0">
        {/* 1 — heading (first on phones) */}
        <Reveal className="order-1 lg:order-none lg:col-start-2 lg:row-start-1">
          <SectionLabel>যিনি শুরু করেছিলেন</SectionLabel>
          <h2
            id="about-founder-heading"
            className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
          >
            {founder.sectionHeading}
          </h2>
        </Reveal>

        {/* 2 — name & role */}
        <Reveal
          delay={70}
          className="order-2 lg:order-none lg:col-start-2 lg:row-start-2 lg:mt-4"
        >
          <div>
            <p className="text-lg font-extrabold text-brand-800 sm:text-xl">
              {founder.name}
            </p>
            <p className="mt-0.5 text-sm font-medium text-ink-500">{founder.designation}</p>
          </div>
        </Reveal>

        {/* 3 — portrait (third on phones, left column on desktop) */}
        <Reveal className="order-3 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-mist-100 sm:aspect-[4/5]">
            {founder.imageUrl ? (
              <Image
                src={founder.imageUrl}
                alt={`${founder.name} — Mymensingh Sheba-এর প্রতিষ্ঠাতা`}
                fill
                sizes="(max-width: 1023px) 92vw, 38vw"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-mist-100 px-6 text-center">
                <span
                  aria-hidden="true"
                  className="text-5xl font-extrabold leading-none text-ink-500 sm:text-6xl"
                >
                  MS
                </span>
                <span className="text-xs font-semibold text-ink-500">
                  Founder, Mymensingh Sheba
                </span>
              </div>
            )}
          </div>
        </Reveal>

        {/* 4 — story */}
        <Reveal
          delay={130}
          className="order-4 lg:order-none lg:col-start-2 lg:row-start-3 lg:mt-4"
        >
          <div className="space-y-3.5 text-[15px] leading-relaxed text-ink-600">
            {founder.story.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        </Reveal>

        {/* 5 — quote */}
        <Reveal
          delay={190}
          className="order-5 lg:order-none lg:col-start-2 lg:row-start-4 lg:mt-6"
        >
          <blockquote className="rounded-2xl bg-mist-100 p-5">
            <Quote className="h-5 w-5 text-accent-500" aria-hidden="true" />
            <p className="mt-2 text-[15px] font-bold leading-relaxed text-ink-900">
              {founder.quote}
            </p>
          </blockquote>
        </Reveal>
      </div>
    </AboutSection>
  );
}
