import { Flag, Layers } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE_DARK } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const DISTRICTS = ['ময়মনসিংহ', 'জামালপুর', 'শেরপুর', 'নেত্রকোনা'];

/**
 * Division2015 — the birth of the division, treated as its own chapter.
 * A single oversized year carries the weight instead of extra decoration.
 */
export default function Division2015() {
  return (
    <CitySection labelledBy="city-2015-heading" id="city-2015" className="bg-brand-950">
      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-14">
        <Reveal className="lg:text-right">
          <p
            aria-hidden="true"
            className="text-[4rem] font-extrabold leading-none tracking-tight text-accent-400 sm:text-[6rem]"
          >
            {toBengaliDigits(2015)}
          </p>
          <p className="mt-1 text-xs font-bold text-brand-300">
            <span className="sr-only">{toBengaliDigits(2015)} সাল · </span>
            বাংলাদেশের অষ্টম প্রশাসনিক বিভাগ
          </p>
        </Reveal>

        <div>
          <Reveal delay={70}>
            <CityLabel index="০৬" tone="dark">
              একটি নতুন অধ্যায়
            </CityLabel>
            <h2 id="city-2015-heading" className={`mt-3 ${TITLE_DARK}`}>
              ময়মনসিংহ বিভাগের জন্ম
            </h2>
            <div className="mt-4 space-y-3.5 text-[15px] leading-relaxed text-brand-100/85">
              <p>
                {toBengaliDigits(2015)} সালে ময়মনসিংহ, জামালপুর, শেরপুর ও নেত্রকোনা
                জেলা নিয়ে গঠিত হয় ময়মনসিংহ বিভাগ — বাংলাদেশের অষ্টম প্রশাসনিক বিভাগ।
              </p>
              <p>
                এর আগে এই অঞ্চলটি ছিল ঢাকা বিভাগের অংশ। অর্থনৈতিক দিক থেকে ঢাকার
                সঙ্গে ঘনিষ্ঠ যুক্তি থাকলেও প্রশাসনিক দূরত্ব বাড়ছিল — আর সেই
                ফলাফলই একটি আলাদা বিভাগ।
              </p>
            </div>
          </Reveal>

          <Reveal delay={130}>
            <ul className="mt-6 flex flex-wrap gap-2">
              {DISTRICTS.map((district) => (
                <li
                  key={district}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-700 bg-brand-900 px-3.5 py-2 text-sm font-bold text-white"
                >
                  <Flag className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
                  {district}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={180}>
            <p className="mt-5 flex items-start gap-2.5 rounded-xl border border-brand-800 bg-brand-900/60 p-4 text-[13px] leading-relaxed text-brand-200/90">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" aria-hidden="true" />
              <span>
                মনে রাখা দরকার — আজকের <strong className="text-white">ময়মনসিংহ
                জেলা</strong> আর ২০১৫ সালের <strong className="text-white">ময়মনসিংহ
                বিভাগ</strong> এক জিনিস নয়। বিভাগটি চারটি জেলা নিয়ে গঠিত।
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </CitySection>
  );
}
