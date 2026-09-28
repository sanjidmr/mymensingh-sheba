'use client';

import { useState } from 'react';
import { Feather, Map, ScrollText, Sparkles } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE, LIGHT_FOCUS } from './CityBits';

const THEORIES = [
  {
    id: 'momensahi',
    icon: ScrollText,
    label: 'নথিভুক্ত ধারা',
    claim: '‘মোমেনশাহী’ পরগণা থেকে',
    body: 'মোগল আমলের নথিতে মোমিন শাহের পরগণাকে ‘মোমেনশাহী’ বলা হতো। আইন-ই-আকবরির ইংরেজ অনুবাদে (জারেট) নামটি ‘Momensingh’ আকারে পাওয়া যায়, যা ধীরে ধীরে ‘ময়মনসিংহ’ রূপ পায়। ১৭৮৭ সালের কালেক্টরেট এই নামেই প্রতিষ্ঠিত হয়েছিল।',
    weight: 'এই ধারাটিকে অনেকে নামের সবচেয়ে প্রামাণ্য উৎস বলেন।',
  },
  {
    id: 'nasirabad',
    icon: Map,
    label: 'ঐতিহাসিক সম্পর্ক',
    claim: 'নাসিরাবাদ / নসরতশাহীর সঙ্গে',
    body: 'ষোড়শ শতাব্দীতে এ অঞ্চলের সঙ্গে নাসির উদ্দিন নসরত শাহের নাম যুক্ত করা হয় — ‘নাসিরাবাদ’ ও ‘নসরতশাহী’ নামে। ঐতিহাসিক নথিতে এ নামগুলোর উল্লেখ পাওয়া যায়, যা পরগণার নামের সঙ্গে সম্পর্কিত বিতর্ককেই সমৃদ্ধ করে।',
    weight: 'নামের পরিবর্তন ঘটলেও অঞ্চলের সঙ্গে ঐতিহাসিক সম্পর্ক অটুট ছিল।',
  },
  {
    id: 'folk',
    icon: Feather,
    label: 'লোককথা',
    claim: 'গল্পের ধারা',
    body: 'মুখে মুখে প্রচলিত আছে ‘ময়নসিংহ’ নামটি এসেছে রাজা ময়নসিংহের গল্প থেকে। ময়নামতী, ময়নাবতী — নানা রূপে এই ধারাটি গ্রাম-বাংলার মনে গেঁথে আছে।',
    weight: 'লোককথা হিসেবে এটি সমৃদ্ধ, তবে নথিভুক্ত প্রমাণ নয়।',
  },
  {
    id: 'documents',
    icon: Sparkles,
    label: 'নথি ও মানচিত্র',
    claim: 'বিভিন্ন সময়ে বিভিন্ন রূপ',
    body: 'ঐতিহাসিক নথি ও মানচিত্রে সময়ের সঙ্গে নামের বিভিন্ন রূপ পাওয়া যায় — মোমেনশাহী, মমিনশাহী, মোমেনশাহী, ময়মনসিংহ। বানান ও উচ্চারণ বদলানোর সঙ্গে স্থানীয় ব্যবহারও বদলেছে।',
    weight: 'তাই “চূড়ান্ত সত্য” বলে একটি মতকেই আঁকড়ে ধরা ঠিক নয়।',
  },
];

/**
 * NameOrigins — interactive "name origins" chapter.
 *
 * Historical opinion about the origin of the name genuinely differs, so this
 * section presents the theories side by side instead of declaring one "the"
 * truth. Inline chips on desktop, a stacked switcher on mobile — both drive the
 * same state and the same detail panel, so the wording is never duplicated.
 */
export default function NameOrigins() {
  const [active, setActive] = useState(THEORIES[0].id);
  const current = THEORIES.find((t) => t.id === active) ?? THEORIES[0];

  return (
    <CitySection labelledBy="city-name-heading" id="city-name" className="bg-white">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <Reveal>
          <CityLabel index="০২">নামের উৎপত্তি</CityLabel>
          <h2 id="city-name-heading" className={`mt-3 ${TITLE}`}>
            ময়মনসিংহ নামটি এলো কোথা থেকে?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            ময়মনসিংহ নামের উৎপত্তি নিয়ে ইতিহাসে একাধিক মত রয়েছে। কোনো একটি ধারাকে
            চূড়ান্ত সত্য হিসেবে উপস্থাপন করা ইতিহাসবিদের মতে সঠিক হবে না — তাই
            প্রতিটি ধারা আলাদা করে, নিজ নিজ ভাষায় তুলে ধরা হলো।
          </p>

          {/* Desktop / tablet: switcher */}
          <div
            role="group"
            aria-label="নামের উৎপত্তি সংক্রান্ত মত বেছে নিন"
            className="mt-6 hidden flex-wrap gap-2 sm:flex"
          >
            {THEORIES.map((theory) => {
              const Icon = theory.icon;
              const selected = theory.id === active;
              return (
                <button
                  key={theory.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(theory.id)}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
                    selected
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-brand-200 bg-white text-ink-700 hover:bg-mist-100'
                  } ${LIGHT_FOCUS}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {theory.label}
                </button>
              );
            })}
          </div>

          {/* Mobile: switcher list — the detail panel below stays the single
              source of detail on every screen, so nothing is duplicated. */}
          <div
            role="group"
            aria-label="নামের উৎপত্তি সংক্রান্ত মত বেছে নিন"
            className="mt-6 space-y-2 sm:hidden"
          >
            {THEORIES.map((theory) => {
              const Icon = theory.icon;
              const selected = theory.id === active;
              return (
                <button
                  key={theory.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(theory.id)}
                  className={`flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border px-3.5 text-left text-sm font-bold ${
                    selected
                      ? 'border-brand-700 bg-brand-700 text-white'
                      : 'border-brand-200 bg-white text-ink-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {theory.label}
                  <span className="ml-auto text-xs opacity-70">{theory.claim}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Detail panel — shared by both layouts, announced on change */}
        <Reveal delay={90}>
          <div
            aria-live="polite"
            className="relative overflow-hidden rounded-2xl border border-bronze-200 bg-bronze-50 p-5 sm:p-7"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-4 -top-6 select-none text-[7rem] font-extrabold leading-none text-bronze-200/70"
            >
              নাম
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-bronze-600">
              {current.label}
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-ink-900 sm:text-xl">
              {current.claim}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-700">{current.body}</p>
            <p className="mt-4 border-t border-bronze-200 pt-3 text-sm font-semibold text-brand-700">
              {current.weight}
            </p>
          </div>
        </Reveal>
      </div>
    </CitySection>
  );
}
