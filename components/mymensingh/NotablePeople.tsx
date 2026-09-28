import { Atom, Feather, Palette, Landmark, Users2 } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE } from './CityBits';

type Relation = 'জন্মস্থান' | 'শিক্ষা ও কর্মজীবন' | 'ঐতিহাসিক সম্পর্ক';

const GROUPS = [
  {
    icon: Palette,
    field: 'শিল্প',
    people: [
      {
        name: 'জয়নুল আবেদিন',
        relation: 'শিক্ষা ও কর্মজীবন' as Relation,
        note: 'জন্ম কাশিয়ানী (আজকের কিশোরগঞ্জ) — ১৯৮৪ সালের আগে ময়মনসিংহ জেলার অংশ। শৈশব ও কর্মজীবন ময়মনসিংহে।',
      },
    ],
  },
  {
    icon: Feather,
    field: 'সাহিত্য',
    people: [
      {
        name: 'সৈয়দ নজরুল ইসলাম',
        relation: 'জন্মস্থান' as Relation,
        note: 'জন্ম তৃশালে — সেই সময় ময়মনসিংহ জেলার অধীনে; আজ তৃশাল জামালপুর জেলায়।',
      },
      {
        name: 'আবুল মনসুর আহমেদ',
        relation: 'জন্মস্থান' as Relation,
        note: 'জন্ম গৌরগঞ্জ — আজ জামালপুর জেলার অঞ্চল; সেই সময়ে ময়মনসিংহ জেলা।',
      },
      {
        name: 'আবুল কালাম শামসুদ্দিন',
        relation: 'জন্মস্থান' as Relation,
        note: 'জন্ম কাশিপুর — আজ টাঙ্গাইল জেলার অঞ্চল; তখন ময়মনসিংহ জেলার অংশ।',
      },
      {
        name: 'হুমায়ূন আহমেদ',
        relation: 'জন্মস্থান' as Relation,
        note: 'জন্ম মোহান্গঞ্জ — আজ নেত্রকোনা জেলার অঞ্চল; তখন ময়মনসিংহ জেলার অংশ।',
      },
    ],
  },
  {
    icon: Atom,
    field: 'বিজ্ঞান',
    people: [
      {
        name: 'জগদীশ চন্দ্র বসু',
        relation: 'শিক্ষা ও কর্মজীবন' as Relation,
        note: 'জন্ম বরিশালে — ময়মনসিংহে নয়। তবে এখানে এসে জীবনের বড় অংশ কাটিয়েছেন, শিক্ষা ও গবেষণা করেছেন এবং এখানেই তাঁর মৃত্যু — তাঁর সঙ্গে ময়মনসিংহের সম্পর্ক কর্মজীবনের, জন্মের নয়।',
      },
    ],
  },
  {
    icon: Users2,
    field: 'রাজনীতি ও সমাজ',
    people: [
      {
        name: 'মুক্তিযুদ্ধ ও সামাজিক আন্দোলন',
        relation: 'ঐতিহাসিক সম্পর্ক' as Relation,
        note: 'ভাষা আন্দোলন, ৬৯-এর গণআন্দোলন ও ১৯৭১ সালে এ অঞ্চলের জনগণের অংশগ্রহণ স্থানীয় ইতিহাসে উল্লেখিত।',
      },
    ],
  },
];

const RELATION_STYLE: Record<Relation, string> = {
  'জন্মস্থান': 'border-brand-300 bg-brand-100 text-brand-800',
  'শিক্ষা ও কর্মজীবন': 'border-accent-400/50 bg-accent-100 text-accent-700',
  'ঐতিহাসিক সম্পর্ক': 'border-bronze-300 bg-bronze-100 text-bronze-700',
};

/**
 * NotablePeople — editorial list, not a card wall.
 *
 * Every entry states *how* the person is connected (born / studied & worked /
 * historical), because “জন্মগ্রহণ করেছেন” and “এখানে কর্মজীবন করেছেন” are very
 * different claims for this region. Where a birth district has changed hands
 * since, the current district is named as well.
 */
export default function NotablePeople() {
  return (
    <CitySection labelledBy="city-people-heading" id="city-people" className="bg-white">
      <Reveal className="max-w-2xl">
        <CityLabel index="১০">মানুষ</CityLabel>
        <h2 id="city-people-heading" className={`mt-3 ${TITLE}`}>
          ময়মনসিংহের বিখ্যাত মানুষ
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
          “ময়মনসিংহে জন্মগ্রহণ করেছেন” আর “ময়মনসিংহের সঙ্গে ঐতিহাসিকভাবে যুক্ত
          ছিলেন” — দুটি আলাদা কথা। নিচে প্রতিটি মানুষের সঙ্গে সম্পর্কের ধরনটি
          স্পষ্ট করে দেওয়া হয়েছে।
        </p>
      </Reveal>

      <div className="mt-8 space-y-8">
        {GROUPS.map((group, groupIndex) => {
          const Icon = group.icon;
          return (
            <Reveal key={group.field} delay={groupIndex * 60}>
              <section aria-labelledby={`people-${groupIndex}`}>
                <h3
                  id={`people-${groupIndex}`}
                  className="flex items-center gap-2.5 text-sm font-extrabold text-brand-800"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {group.field}
                </h3>

                <ul className="mt-3 divide-y divide-brand-100 border-y border-brand-100">
                  {group.people.map((person) => (
                    <li
                      key={person.name}
                      className="grid gap-2 py-4 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-extrabold text-ink-900">
                          {person.name}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                            RELATION_STYLE[person.relation]
                          }`}
                        >
                          {person.relation}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-ink-600">
                        {person.note}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          );
        })}
      </div>

      <Reveal delay={60}>
        <p className="mt-6 flex items-start gap-2.5 rounded-xl border border-bronze-200 bg-bronze-50 p-4 text-[13px] leading-relaxed text-ink-700">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-bronze-600" aria-hidden="true" />
          <span>
            সম্পর্ক যেখানে নিশ্চিত নয়, সেখানে কোনো দাবি করা হয়নি। জেলা সীমানা
            বদলানোর কারণে অনেক প্রখ্যাত মানুষের জন্মস্থান আজ আলাদা জেলার অধীনে
            পড়ে গেছে — তাই “ময়মনসিংহের বিখ্যাত মানুষ” বলতে ইতিহাসের বৃহত্তর
            ময়মনসিংহ বোঝা হয়েছে।
          </span>
        </p>
      </Reveal>
    </CitySection>
  );
}
