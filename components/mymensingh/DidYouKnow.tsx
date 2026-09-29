import { Compass, HelpCircle, Lightbulb } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityHeading, CitySection } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const MYTHS = [
  {
    myth: '“ময়মনসিংহ শহর ১৭৮৭ সালে প্রতিষ্ঠিত হয়।”',
    fact: `${toBengaliDigits(1787)} সালে প্রতিষ্ঠিত হয়েছে জেলা। আধুনিক শহরের সঙ্গে যুক্ত হয় আলাদা ঘটনা — ${toBengaliDigits(1811)} সালে, রাঘুনন্দন আচার্যের সঙ্গে এই প্রসঙ্গ সাধারণভাবে উল্লেখিত হয়।`,
  },
  {
    myth: '“ময়মনসিংহ শুধু একটি জেলার নাম।”',
    fact: `${toBengaliDigits(2015)} সাল থেকে ময়মনসিংহ একটি বিভাগ — ময়মনসিংহ, জামালপুর, শেরপুর ও নেত্রকোনা জেলা নিয়ে। জেলা আর বিভাগ এক জিনিস নয়।`,
  },
  {
    myth: '“প্রতিটি প্রখ্যাত মানুষ এখানে জন্মগ্রহণ করেছেন।”',
    fact: `জয়নুল আবেদিনের জন্মস্থান কাশিয়ানী — আজকের কিশোরগঞ্জ জেলায়, যা ${toBengaliDigits(1984)}-এর আগে ময়মনসিংহ জেলার অংশ ছিল। তাঁর শৈশব ও কর্মজীবন ময়মনসিংহে, জন্মস্থান নয়।`,
  },
  {
    myth: '“ব্রহ্মপুত্র এখনও এই শহরের মাঝখান দিয়ে বয়ে যায়।”',
    fact: `নদীর পুরোনো গতিপথ বদলেছে। আজকের ময়মনসিংহের পাশ দিয়ে যে জলপথ প্রবাহিত হয়, তা পুরোনো ব্রহ্মপুত্রের সঙ্গে আংশিকভাবে সম্পর্কিত ও পরিবর্তিত।`,
  },
];

const CURIOSITIES = [
  'শহরের নাম নিয়ে কয়েকটি ব্যাখ্যা প্রচলিত আছে — তার মধ্যে ব্রহ্মপুত্রের সঙ্গে জড়িত একটি ব্যাখ্যাও আছে, তবে সবগুলো সমানভাবে প্রমাণিত নয়।',
  'দেশের অনেক প্রখ্যাত মানুষ এই অঞ্চল থেকে এসেছেন — তাই স্থানীয় গর্বের বিষয়।',
  'এলাকার নকশীকাঁথার কাজ বাণিজ্যিকভাবে পরিচিত এবং চলতে থাকায় ঐতিহ্য টিকে আছে।',
  'ভাগাভাগির পর ছড়িয়ে-ছিটিয়ে যাওয়া পরগণাটি আজ চারটি জেলা ও একটি বিভাগ — এটিই ময়মনসিংহের সবচেয়ে অনন্য বৈশিষ্ট্য।',
];

/**
 * DidYouKnow — myth-busting plus curiosities. Written as question → correction
 * so the corrections are memorable instead of just assertions.
 */
export default function DidYouKnow() {
  return (
    <CitySection labelledBy="city-myths-heading" id="city-myths" className="bg-mist-50">
      <CityHeading
        id="city-myths-heading"
        index="১৬"
        eyebrow="সংশোধিত ধারণা"
        title="যেসব ধারণা প্রায়ই ভুল বোঝা হয়"
        intro="ইতিহাসে বিভ্রান্তি খুবই স্বাভাবিক। নিচে সবচেয়ে বেশি শোনা কয়েকটি ভুল ধারণা ও সঠিক ব্যাখ্যা দেওয়া হলো।"
      />

      <ul className="mt-8 space-y-4">
        {MYTHS.map((item, index) => (
          <Reveal as="li" key={item.myth} delay={index * 60}>
            <div className="grid gap-4 rounded-2xl border border-brand-100 bg-white p-5 sm:grid-cols-2 sm:gap-6">
              <div className="flex gap-3">
                <HelpCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-red-600">
                    ভুল ধারণা
                  </p>
                  <p className="mt-1 text-sm font-bold leading-relaxed text-ink-800 line-through decoration-red-300">
                    {item.myth}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Compass
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-700"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                    সঠিক তথ্য
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-700">{item.fact}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </ul>

      <Reveal delay={60}>
        <div className="mt-6 rounded-2xl border border-accent-300 bg-accent-100/50 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-ink-900">
            <Lightbulb className="h-4 w-4 text-accent-600" aria-hidden="true" />
            আরও কিছু জানার থাকে
          </p>
          <ul className="mt-3 space-y-2">
            {CURIOSITIES.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </CitySection>
  );
}
