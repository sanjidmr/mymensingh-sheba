import { Building2, CalendarCheck, Flag, Landmark, MapPinned, TrainFront } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityHeading, CitySection } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

type Fact = {
  icon: LucideIcon;
  year: number;
  title: string;
  text: string;
  note: string;
  /** Count rather than a year — render a unit next to the number. */
  plain?: boolean;
};

const FACTS: Fact[] = [
  {
    icon: CalendarCheck,
    year: 1787,
    title: 'জেলা প্রতিষ্ঠা',
    text: `${toBengaliDigits(1787)} সালের ১ মে, কোম্পানি শাসনামলে ময়মনসিংহ জেলা হিসেবে আত্মপ্রকাশ পায়।`,
    note: 'জেলা প্রতিষ্ঠা',
  },
  {
    icon: MapPinned,
    year: 1811,
    title: 'শহরের প্রতিষ্ঠা',
    text: `${toBengaliDigits(1811)} সালে আধুনিক ময়মনসিংহ শহরের সঙ্গে জুক্ত হয় একটি স্থানচিহ্ন ও জমির সঙ্গে — রাঘুনন্দন আচার্যের সঙ্গে এই প্রসঙ্গটি সাধারণভাবে উল্লেখিত হয়।`,
    note: 'শহর প্রতিষ্ঠা · জেলা থেকে আলাদা',
  },
  {
    icon: Landmark,
    year: 1869,
    title: 'পৌরসভা প্রতিষ্ঠা',
    text: `${toBengaliDigits(1869)} সালে ময়মনসিংহ পৌরসভা গঠিত হয় — শহরের প্রশাসনিক ও আইনি কাঠামো তখন থেকেই পাকা হতে শুরু করে।`,
    note: 'পৌরসভা',
  },
  {
    icon: TrainFront,
    year: 1886,
    title: 'রেলপথ চালু',
    text: `${toBengaliDigits(1886)} সালে ঢাকা–ময়মনসিংহ রেলপথ চালু হয়। রেল সংযোগ শহরটিকে দেশের বাণিজ্যিক মানচিত্রে তুলে আনে।`,
    note: 'ঢাকা–ময়মনসিংহ রেলপথ',
  },
  {
    icon: Flag,
    year: 2015,
    title: 'বিভাগের জন্ম',
    text: `${toBengaliDigits(2015)} সালে ময়মনসিংহ বিভাগ গঠিত হয় — বাংলাদেশের অষ্টম প্রশাসনিক বিভাগ।`,
    note: 'বর্তমান বিভাগ',
  },
  {
    icon: Building2,
    year: 4,
    title: 'বিভাগে জেলা',
    text: 'ময়মনসিংহ, জামালপুর, শেরপুর ও নেত্রকোনা — চারটি জেলা নিয়ে গঠিত বর্তমান বিভাগ।',
    note: 'বর্তমান বিভাগে জেলা',
    plain: true,
  },
];

/**
 * CityQuickFacts — "এক নজরে ময়মনসিংহ".
 *
 * জেলা প্রতিষ্ঠা (১৭৮৭) and শহর প্রতিষ্ঠা (১৮১১) are deliberately kept as two
 * separate cards, because they are two different events and are very often
 * confused.
 */
export default function CityQuickFacts() {
  return (
    <CitySection labelledBy="city-facts-heading" id="city-facts" className="border-b border-brand-100 bg-mist-50">
      <CityHeading
        id="city-facts-heading"
        index="০১"
        eyebrow="এক নজরে"
        title="এক নজরে ময়মনসিংহ"
      />

      <ul className="mt-7 grid gap-px overflow-hidden rounded-2xl border border-brand-100 bg-brand-100 sm:grid-cols-2 lg:grid-cols-3">
        {FACTS.map((fact, index) => {
          const Icon = fact.icon;
          return (
            <Reveal
              as="li"
              key={fact.title}
              delay={index * 50}
              className="flex flex-col bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-2xl font-extrabold tabular-nums leading-none text-brand-800">
                  {toBengaliDigits(fact.year)}
                  {fact.plain ? (
                    <span className="ml-1 text-sm font-bold text-ink-500">টি</span>
                  ) : null}
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-extrabold text-ink-900">{fact.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{fact.text}</p>
              <p className="mt-3 text-[11px] font-bold text-brand-600">{fact.note}</p>
            </Reveal>
          );
        })}
      </ul>
    </CitySection>
  );
}
