import Image from 'next/image';
import { Quote } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';

const FOUNDER = {
  name: 'Mushfiqur Rahman Sanjid',
  role: 'Founder & Creator, Mymensingh Sheba',
  /**
   * Portrait slot. Drop a real photo at `public/founder.jpg` (or change this
   * value to any path inside /public) and it renders automatically — until
   * then a typographic monogram keeps the composition intact.
   */
  image: null as string | null,
  alt: 'Mymensingh Sheba-এর প্রতিষ্ঠাকারী মুশফিকুর রহমান সানজিদ',
};

/**
 * FounderSection — sits directly after the story, by design.
 *
 * Personal rather than corporate: portrait, name, role, the reason it started,
 * and one short quote. Mobile order is portrait → name → role → story → quote.
 */
export default function FounderSection() {
  return (
    <AboutSection labelledBy="about-founder-heading" className="bg-white">
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-14">
        <Reveal>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-brand-900">
            {FOUNDER.image ? (
              <Image
                src={FOUNDER.image}
                alt={FOUNDER.alt}
                fill
                sizes="(max-width: 1023px) 92vw, 38vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-900 px-6 text-center">
                <span
                  aria-hidden="true"
                  className="text-5xl font-extrabold leading-none text-brand-600 sm:text-6xl"
                >
                  MS
                </span>
                <span className="text-xs font-semibold text-brand-400">
                  Founder, Mymensingh Sheba
                </span>
              </div>
            )}
          </div>
        </Reveal>

        <div>
          <Reveal>
            <SectionLabel>যিনি শুরু করেছিলেন</SectionLabel>
            <h2
              id="about-founder-heading"
              className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
            >
              Mymensingh-এর একজন মানুষ হিসেবে শুরু
            </h2>
          </Reveal>

          <Reveal delay={70}>
            <div className="mt-4">
              <p className="text-lg font-extrabold text-brand-800 sm:text-xl">
                {FOUNDER.name}
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink-500">{FOUNDER.role}</p>
            </div>
          </Reveal>

          <Reveal delay={130}>
            <div className="mt-4 space-y-3.5 text-[15px] leading-relaxed text-ink-600">
              <p>
                আমি ময়মনসিংহেই বড় হয়েছি। তাই চরপাড়ার একটা সমস্যা, বাসার একটা ঝামেলা
                কিংবা একজন প্রয়োজনীয় মানুষ খুঁজে না পাওয়ার কষ্ট — এগুলো আমার কাছে
                শুনুম নয়, নিজে উপস্থিত থাকে।
              </p>
              <p>
                একদিন ভাবলাম, এত ছোট ছোট প্রয়োজনের জন্য যদি একটি নির্ভরযোগ্য জায়গা
                থাকত, তাহলে মানুষের অনেক সময় ও ঝামেলা কমে যেত। তখনই Mymensingh
                Sheba-এর কাজ শুরু হয়।
              </p>
              <p>
                এটি কোনো বড় কোম্পানির প্রজন্দের পরিকল্পনা নয় — এটি একজন স্থানীয়
                মানুষের প্রয়োজন থেকে, নিজের শহরের জন্য বানানো একটি ছোট প্রচেষ্টা।
              </p>
            </div>
          </Reveal>

          <Reveal delay={190}>
            <blockquote className="mt-6 rounded-2xl bg-mist-100 p-5">
              <Quote className="h-5 w-5 text-accent-500" aria-hidden="true" />
              <p className="mt-2 text-[15px] font-bold leading-relaxed text-ink-900">
                প্রযুক্তি তখনই সবচেয়ে মূল্যবান, যখন সেটি মানুষের বাস্তব জীবনের কোনো
                একটি সমস্যাকে সহজ করে দেয়।
              </p>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </AboutSection>
  );
}
