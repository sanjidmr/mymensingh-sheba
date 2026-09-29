import { Flag, Flame, Landmark, Megaphone } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityHeading, CitySection } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

const WAVES = [
  {
    icon: Megaphone,
    year: 1952,
    title: 'ভাষা আন্দোলন',
    body: `${toBengaliDigits(1952)} সালের ২১শে ফেব্রুয়ারি সারা দেশে ভাষার জন্য গণআন্দোলনে এ অঞ্চলের তরুণ সমাজ সক্রিয় ভূমিকা রাখে। ২৩শে ফেব্রুয়ারি প্রতিষ্ঠিত সালে মুখার্শদান ও প্রতিরোধ অনুষ্ঠানের স্মৃতি স্থানীয়ভাবে গুরুত্বপূর্ণ।`,
  },
  {
    icon: Flame,
    year: 1969,
    title: 'গণআন্দোলন ও সরকার পতন',
    body: `${toBengaliDigits(1969)}-এর গণআন্দোলনে দেশব্যাপী গণতন্ত্র প্রতিষ্ঠার দাবি তুলে ওঠে। এর একটি ধারাবাহিক ফলাফল হিসেবে সেই বছরই টাঙ্গাইল জেলা আলাদা হয়।`,
  },
  {
    icon: Flag,
    year: 1971,
    title: 'মুক্তিযুদ্ধ',
    body: `${toBengaliDigits(1971)} সালের মুক্তিযুদ্ধে এ অঞ্চল সেক্টর ১১-এর আওতায় ছিল। নদীপারের প্রতিরোধ, স্থানীয় প্রতিরোধক দলগুলোর ভূমিকা এবং বরিখালী ও মুন্সিগঞ্জ ক্যাম্প — এই স্মৃতি স্থানীয় ইতিহাসে গুরুত্বপূর্ণ। এ অঞ্চলে প্রচুর মানুষ দেশবন্দী হয়ে পুরো মুক্তিযুদ্ধে অবদান রেখেছেন।`,
  },
  {
    icon: Landmark,
    year: null,
    title: 'স্মৃতি ও সংরক্ষণ',
    body: 'স্থানীয় স্মৃতি ও প্রতিরোধের খাতগুলো ছড়িয়ে আছে পারিবারিক ও আর্কাইভাল সংগ্রহে। মুক্তিযুদ্ধের চারটি জাতীয় স্মারকস্তম্ভের একটি এই বিভাগে অবস্থিত হওয়ায় এই স্মৃতির প্রাতিষ্ঠানিক ঠিকানাও রয়েছে।',
  },
];

const IMPACT = [
  'ভাষা আন্দোলন থেকে শুরু করে স্বাধীনতা যুদ্ধ পর্যন্ত — এ অঞ্চলের জনগণের সংগ্রামের ধারা',
  'সীমান্তবর্তী অঞ্চল হওয়ায় প্রতিরোধের ইতিহাসে এই জেলার নাম বিশেষভাবে উল্লেখযোগ্য',
  'মুক্তিযুদ্ধোত্তর দশকে এলাকায় শিক্ষা, স্বাস্থ্য ও অবকাঠামো উন্নয়নের নতুন ধারা শুরু হয়',
];

/**
 * MovementsAndWar — the civic-memory chapter, written as a dated sequence with
 * an explicit "what came after" so the section does not read as pure nostalgia.
 */
export default function MovementsAndWar() {
  return (
    <CitySection labelledBy="city-movements-heading" id="city-movements" className="border-y border-brand-100 bg-white">
      <CityHeading
        id="city-movements-heading"
        index="১৩"
        eyebrow="আন্দোলন ও মুক্তিযুদ্ধ"
        title="ভাষা আন্দোলন থেকে মুক্তিযুদ্ধ"
        intro="আধুনিক বাংলার সবচেয়ে গুরুত্বপূর্ণ আন্দোলনগুলোর সঙ্গে এই অঞ্চলের নাম জড়িয়ে আছে।"
      />

      <ol className="mt-8 space-y-5 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
        {WAVES.map((wave, index) => {
          const Icon = wave.icon;
          return (
            <Reveal as="li" key={wave.title} delay={index * 60}>
              <div className="flex h-full gap-4 rounded-2xl border border-brand-100 bg-mist-50 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-accent-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  {wave.year ? (
                    <p className="text-xs font-extrabold tabular-nums text-accent-700">
                      {toBengaliDigits(wave.year)}
                    </p>
                  ) : null}
                  <h3 className="mt-0.5 text-[15px] font-extrabold text-ink-900">
                    {wave.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{wave.body}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </ol>

      <Reveal delay={60}>
        <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-950 p-5 text-brand-100">
          <h3 className="text-sm font-extrabold text-white">এর ধারাবাহিক প্রভাব</h3>
          <ul className="mt-3 space-y-2">
            {IMPACT.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-brand-100/85">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400"
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
