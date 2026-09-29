import { Building, Castle, House, Landmark, TreePine } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import ArchivePhoto from './ArchivePhoto';
import { CityHeading, CitySection } from './CityBits';

const SITES = [
  {
    icon: Castle,
    name: 'সাস্তা রাজবাড়ি',
    place: 'জামালপুর জেলা',
    note: 'ভাগাভাগির আগে এই অঞ্চলের প্রথা ও প্রশাসনের কেন্দ্র ছিল জামালপুর; বর্তমানে সেই বাড়ি জামালপুর জেলার অধীনে।',
  },
  {
    icon: Building,
    name: 'সদর উপজেলার স্থাপত্য নিদর্শন',
    place: 'ময়মনসিংহ শহর',
    note: 'জেলা ও শহরের প্রাচীন কেন্দ্রে সদর অফিস, কোর্ট ও আমলাতান্দ্র জাতীয় ভবন।',
  },
  {
    icon: TreePine,
    name: 'উদ্ভতিশালা বন ও পুরনো মৌজা',
    place: 'ময়মনসিংহ অঞ্চল',
    note: 'প্রাক্তিন দেওয়ান-জমিদারি ভূমি ব্যবস্থার নিদর্শন; জমিদারি আইন বাতিলের পর ভূমির মালিকানা ও শ্রেণি বদলেছে।',
  },
  {
    icon: House,
    name: 'জামিলা ও পাঁচালি ঘরবাড়ি',
    place: 'গ্রামাঞ্চল',
    note: 'খালি, মাটির ও নীচু দেওয়ালের ঘর — কম দেওয়ানি, কিন্তু বাংলার ঐতিহ্যবাহী স্থাপত্যের অংশ।',
  },
  {
    icon: Landmark,
    name: 'মন্দির ও মসজিদ — ধর্মীয় ঐতিহ্য',
    place: 'একাধিক স্থানে',
    note: 'সম্প্রদায় ভেদে স্থানীয় ধর্মীয় ভবনগুলো একটি বহুসংস্কৃতি অঞ্চলের প্রমাণ।',
  },
];

/**
 * ZamindariHeritage — architecture and the land system, kept together on
 * purpose: the buildings and the revenue system were two faces of the same
 * colonial order.
 */
export default function ZamindariHeritage() {
  return (
    <CitySection labelledBy="city-zamindari-heading" id="city-zamindari" className="bg-mist-50">
      <CityHeading
        id="city-zamindari-heading"
        index="১২"
        eyebrow="ভূমি ও স্থাপত্য"
        title="দেওয়ান, জমিদার আর তাদের ছাপ"
        intro="উনিশশো শতকের দ্বিতীয়ার্ধে সারা বাংলা ভাগাভাগির সঙ্গে পরগণা ও জমিদারি ব্যবস্থা এই অঞ্চলের জীবনকে আকার দেয়। জমিদারি আইন বাতিল ও ভূমি সংস্কারের পর এই কাঠামো বদলে গেছে — কিন্তু তার চিহ্ন এখনও টিকে আছে।"
      />

      <div className="mt-8 grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <Reveal delay={50}>
            <ul className="mt-6 divide-y divide-brand-100 border-y border-brand-100">
              {SITES.map((site) => {
                const Icon = site.icon;
                return (
                  <li key={site.name} className="flex gap-3.5 py-4">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-bronze-300 bg-bronze-100 text-bronze-700">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15px] font-extrabold text-ink-900">
                          {site.name}
                        </h3>
                        <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold text-brand-700">
                          {site.place}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-ink-600">
                        {site.note}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Reveal>

        <Reveal delay={110}>
          <ArchivePhoto
            src="/muktagacha.jpg"
            alt="জামিলা ধাঁচের ঐতিহ্যবাহী বাড়ির ভবিষ্যৎ-অতীত চিত্র"
            slotNote="ঐতিহ্যবাহী স্থাপত্যের আর্কাইভাল ছবির স্থান"
            className="aspect-[4/5] w-full rounded-2xl"
            sizes="(max-width: 1023px) 100vw, 40vw"
          />
          <p className="mt-2.5 text-[11px] leading-relaxed text-ink-500">
            যাচাই করা আর্কাইভাল ছবি ও লাইসেন্স যুক্ত হলে এখানে দেখা যাবে; ততক্ষণ
            নিজস্ব নকশায় একটি স্থানচিহ্ন রাখা হয়েছে।
          </p>
        </Reveal>
      </div>
    </CitySection>
  );
}
