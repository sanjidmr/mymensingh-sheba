import { BookMarked, Library, Palette, PenLine } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityHeading, CitySection } from './CityBits';

const PILLARS = [
  {
    icon: Library,
    title: 'শিক্ষার ঐতিহ্য',
    body: 'জেলা বোর্ড, সূর্যকান্ত লাইব্রেরি ও একাধিক বিশ্ববিদ্যালয় — একটি ছোট জেলার মধ্যেই বড় শিক্ষাপ্রতিষ্ঠানের ঐতিহ্য গড়ে উঠেছে।',
  },
  {
    icon: PenLine,
    title: 'সাহিত্যচর্চা',
    body: 'স্থানীয় সাহিত্য চর্চা, কবিতা ও গদ্যচর্চার একটি ধারা এখানে দীর্ঘদিন ধরে চলছে।',
  },
  {
    icon: BookMarked,
    title: 'বুদ্ধিবৃত্তিক আলোচনা',
    body: 'সংবাদপত্র ও সাময়িক লেখার চর্চা এখানে দীর্ঘ প্রথা হিসেবে রয়েছে।',
  },
  {
    icon: Palette,
    title: 'শিল্পচর্চা',
    body: 'নকশীকাঁথা, নকশিকাঁথার নকশা কাটিং ও পোড়ামাটির শিল্প — বাণিজ্যিক পর্যায়ে এখানো কার্যকর।',
  },
];

/**
 * EducationAndArts — with a dedicated block for জয়নুল আবেদিন.
 *
 * The historic-vs-current district distinction is spelled out here: his
 * birthplace is in today's Kishoreganj district, which until ১৯৮৪ ছিল ময়মনসিংহ
 * জেলার অংশ.
 */
export default function EducationAndArts() {
  return (
    <CitySection labelledBy="city-education-heading" id="city-education" className="bg-mist-100">
      <CityHeading
        id="city-education-heading"
        index="০৯"
        eyebrow="শিক্ষা, সাহিত্য ও শিল্প"
        title="শিক্ষা, সাহিত্য ও শিল্পের এক উর্বর ভূমি"
      />

      <div className="mt-7 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <li
                  key={pillar.title}
                  className="rounded-2xl border border-brand-100 bg-white p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-3 text-[15px] font-extrabold text-ink-900">
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    {pillar.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </Reveal>

        <Reveal delay={90}>
          <article className="h-full overflow-hidden rounded-2xl border border-brand-200 bg-brand-950 text-brand-100">
            <div className="border-b border-brand-800 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-300">
                শিল্পাচার্য
              </p>
              <h3 className="mt-1 text-lg font-extrabold text-white">জয়নুল আবেদিন</h3>
            </div>
            <div className="space-y-3.5 px-5 py-5 text-sm leading-relaxed text-brand-100/85">
              <p>
                জয়নুল আবেদিনকে সময়সীমায় চিরহরি মনে রাখা হয় তাঁর দুই চোখের জন্য।
                তিনি এমন এক শিল্পী যার আঁকা নদী, মাছ ও গ্রামীণ জীবন সাধারণ
                বাংলা দর্শকের কাছেও সবার চেনা জিনিস হয়ে উঠেছে।
              </p>
              <p>
                শৈশবে তিনি ময়মনসিংহ জেলার স্কুলে পড়াশোনা করেন এবং পরে গিয়ে এই শহরেই
                থেকে চিত্রকর্ম ও জীবনযাপন করেন। পুরাতন ব্রহ্মপুত্র, নৌকা আর চরাঞ্চলের
                জীবন তাঁর অনেক চিত্রের মূল বিষয় হয়ে উঠেছিল।
              </p>
              <p className="rounded-xl border border-brand-800 bg-brand-900/60 p-4 text-[13px] text-brand-200/90">
                <strong className="text-white">ঐতিহাসিক প্রেক্ষাপট:</strong> তাঁর জন্মস্থান
                কাশিয়ানী — যা আজকের কিশোরগঞ্জ জেলার অংশ। ১৯৮৪ সালের আগে এই অঞ্চলটি
                ময়মনসিংহ জেলার অধীনে ছিল, তাই ইতিহাসে তাঁকে “বৃহত্তর ময়মনসিংহ”-এর
                সঙ্গে যুক্ত করা হয়।
              </p>
            </div>
          </article>
        </Reveal>
      </div>
    </CitySection>
  );
}
