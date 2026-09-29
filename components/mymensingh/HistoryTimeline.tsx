'use client';

import { useState } from 'react';
import { ChevronDown, Milestone } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityHeading, CitySection, DARK_FOCUS } from './CityBits';
import { toBengaliDigits } from '@/lib/bengali-numerals';

type Milestone = {
  year: number;
  tag: string;
  title: string;
  body: string;
};

const MILESTONES: Milestone[] = [
  {
    year: 1787,
    tag: 'প্রশাসন',
    title: 'ময়মনসিংহ জেলা প্রতিষ্ঠা',
    body: `${toBengaliDigits(1787)} সালের ১ মে কোম্পানি শাসনামলে ‘ময়মনসিংহ পার্গনার ডিগার’ প্রতিষ্ঠিত হয় — নিজস্ব কালেক্টরের অধীনে একটি আলাদা প্রশাসনিক জেলা। পরগণার নামেই এই অঞ্চলের জেলা নামকরণ হয়।`,
  },
  {
    year: 1811,
    tag: 'শহর',
    title: 'আধুনিক ময়মনসিংহ শহরের সঙ্গে',
    body: `${toBengaliDigits(1811)} সালে আধুনিক শহরের সঙ্গে জুক্ত হয় একটি স্থানচিহ্ন ও জমি — রাঘুনন্দন আচার্যের সঙ্গে এই প্রসঙ্গ সাধারণভাবে উল্লেখিত হয়। জেলা প্রতিষ্ঠা আর শহর প্রতিষ্ঠা দুটি আলাদা ঘটনা।`,
  },
  {
    year: 1869,
    tag: 'পৌরব্যবস্থা',
    title: 'ময়মনসিংহ পৌরসভা প্রতিষ্ঠা',
    body: `${toBengaliDigits(1869)} সালে পৌরসভা গঠিত হয়। এ থেকে শহরের রাস্তা, আলো, পানি ও পয়স্নাশনার মতো স্থানীয় সেবার কাঠামো তৈরি হতে শুরু করে।`,
  },
  {
    year: 1886,
    tag: 'রেল ও যোগাযোগ',
    title: 'ঢাকা–ময়মনসিংহ রেলপথ চালু',
    body: `${toBengaliDigits(1886)} সালে ঢাকা–ময়মনসিংহ রেলপথ চালু হয়। এক যুগে বন্ধ ছিল নদীপথের ওপর নির্ভরতা — নতুন রেলপথ শহরটিকে দেশের বাণিজ্যিক নেটওয়ার্কে তুলে আনে।`,
  },
  {
    year: 1887,
    tag: 'শিক্ষা',
    title: 'জেলা বোর্ড',
    body: `${toBengaliDigits(1887)} সালে জেলা বোর্ড প্রতিষ্ঠিত হয় — ময়মনসিংহের শিক্ষা ব্যবস্থার প্রাতিষ্ঠানিক ভিত্তি এখান থেকেই শক্তিশালী হতে শুরু করে।`,
  },
  {
    year: 1889,
    tag: 'জ্ঞানভান্ডার',
    title: 'সূর্যকান্ত লাইব্রেরি',
    body: `${toBengaliDigits(1889)} সালে সূর্যকান্ত লাইব্রেরি প্রতিষ্ঠিত হয়। এটি আজও এলাকার শিক্ষা ও সংস্কৃতি-চর্চার একটি গুরুত্বপূর্ণ কেন্দ্র।`,
  },
  {
    year: 1893,
    tag: 'জল',
    title: 'রাজ রাজেশ্বরী ওয়াটার ওয়ার্কস',
    body: `${toBengaliDigits(1893)} সালে রাজ রাজেশ্বরী ওয়াটার ওয়ার্কস চালু হয় — পুরো শহরের জলসরবরাহে একটি উল্লেখযোগ্য অবকাঠামো।`,
  },
  {
    year: 1899,
    tag: 'রেল',
    title: 'ময়মনসিংহ–জগন্নাথগঞ্জ রেলপথ',
    body: `${toBengaliDigits(1899)} সালে ময়মনসিংহ থেকে জগন্নাথগঞ্জ পর্যন্ত রেলপথ চালু হয়, উত্তরবঙ্গের সঙ্গে সরাসরি যোগাযোগ বাড়ে।`,
  },
  {
    year: 1905,
    tag: 'নামকরণ',
    title: 'ময়মনসিংহ নাম প্রতিষ্ঠিত হয়',
    body: `${toBengaliDigits(1905)} সালের দিকে নাসিরাবাদ নামের পরিবর্তে “ময়মনসিংহ” নাম ধারণাগতভাবে ব্যবহার হতে শুরু করে এবং ধীরে ধীরে প্রাতিষ্ঠানিক রূপ পায়।`,
  },
  {
    year: 1947,
    tag: 'ভাগাভাগি',
    title: 'ভারত বিভাজনের প্রভাব',
    body: `${toBengaliDigits(1947)} সালে ভারত বিভাজিত হলে নদীপথের অর্থনৈতিক কাঠামো, জনসংখ্যা ও বাণিজ্যে বড় পরিবর্তন আসে — যার প্রভাব দীর্ঘদিন থেকে গেছে।`,
  },
  {
    year: 1952,
    tag: 'ভাষা আন্দোলন',
    title: 'ভাষা আন্দোলনে অঞ্চলের ভূমিকা',
    body: `${toBengaliDigits(1952)} সালের ভাষা আন্দোলনে ময়মনসিংহ ও আশপাশের অঞ্চলের জনগণের ভূমিকা ঐতিহাসিক নথিতে উল্লেখিত। বাংলা ভাষা প্রতিষ্ঠা লাভের আন্দোলনে এই অঞ্চলের তরুণ সমাজ সক্রিয় ছিল।`,
  },
  {
    year: 1969,
    tag: 'জেলা বিভাজন',
    title: 'টাঙ্গাইল পৃথক জেলা',
    body: `${toBengaliDigits(1969)} সালে টাঙ্গাইল জেলা আলাদা হয়। ভাবে প্রাক্তন “বৃহত্তর ময়মনসিংহ” — যেখানে আজকের একাধিক জেলা একসাথে ছিল — ধীরে ধীরে ছোট হতে শুরু করে।`,
  },
  {
    year: 1971,
    tag: 'মুক্তিযুদ্ধ',
    title: 'মুক্তিযুদ্ধ ও প্রতিরোধ',
    body: `${toBengaliDigits(1971)} সালে দেশব্যাপী মুক্তিযুদ্ধে ময়মনসিংহ ও পার্শ্ববর্তী অঞ্চল সেক্টর ১১-এর আওতায় ছিল। নদীপারের অঞ্চলে প্রতিরোধের স্মৃতি আজও স্থানীয় পরিচয়ের অংশ।`,
  },
  {
    year: 1978,
    tag: 'জেলা বিভাজন',
    title: 'জামালপুর পৃথক জেলা',
    body: `${toBengaliDigits(1978)} সালে জামালপুর জেলা প্রতিষ্ঠিত হয়। স্থানীয় ইতিহাসে একটি গুরুত্বপূর্ণ পরিবর্তন — অনেক প্রখ্যাত মানুষের জন্মস্থান তখন থেকে আলাদা জেলার অধীনে পড়ে যায়।`,
  },
  {
    year: 1984,
    tag: 'জেলা বিভাজন',
    title: 'শেরপুর, নেত্রকোনা ও কিশোরগঞ্জ পৃথক জেলা',
    body: `${toBengaliDigits(1984)} সালে শেরপুর, নেত্রকোনা ও কিশোরগঞ্জ পৃথক জেলা হয়। এই পরিবর্তনের ফলে অনেক ঐতিহাসিক স্থান ও জনপদ আজকের জেলা-সীমানার বাইরে পড়ে যায়, যদিও তারা ঐতিহাসিকভাবে ময়মনসিংহ অঞ্চলের অংশ ছিল।`,
  },
  {
    year: 2015,
    tag: 'বিভাগ',
    title: 'ময়মনসিংহ বিভাগ গঠন',
    body: `${toBengaliDigits(2015)} সালে ময়মনসিংহ, জামালপুর, শেরপুর ও নেত্রকোনা জেলা নিয়ে বাংলাদেশের অষ্টম প্রশাসনিক বিভাগ হিসেবে ময়মনসিংহ বিভাগ গঠিত হয়।`,
  },
];

/**
 * HistoryTimeline — the central interactive feature.
 *
 * Mobile: a vertical accordion (one milestone open at a time, 44px+ touch
 * targets). Desktop: a horizontally scrollable year rail with snap points plus
 * a large detail panel. Both layouts are driven by the same state, so the
 * content is identical — only the composition differs.
 */
export default function HistoryTimeline() {
  const [activeYear, setActiveYear] = useState<number>(MILESTONES[0].year);
  const current =
    MILESTONES.find((m) => m.year === activeYear) ?? MILESTONES[0];

  return (
    <CitySection labelledBy="city-timeline-heading" id="city-timeline" className="bg-brand-950">
      <CityHeading
        id="city-timeline-heading"
        index="০৪"
        eyebrow="কেন্দ্রীয় সময়রেখা"
        title={`${toBengaliDigits(1787)} থেকে বর্তমান`}
        intro="যে সন বেছে নেবেন, নিচে সেই সময়ের ঘটনাটি খুলে যাবে। মোবাইলে তালিকাটি নিচে নামে, ডেস্কটপে সময়রেখাটি পাশাপাশি সাজানো।"
        tone="dark"
      />

      <Reveal delay={60} className="mt-5">
        <p className="mx-auto flex w-fit items-center gap-2 rounded-full border border-brand-800 px-3.5 py-2 text-xs font-bold text-brand-200">
          <Milestone className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
          মোট {toBengaliDigits(MILESTONES.length)}টি ধাপ
        </p>
      </Reveal>

      {/* Mobile: accordion */}
      <ol className="mt-7 space-y-2 lg:hidden">
        {MILESTONES.map((item) => {
          const expanded = item.year === activeYear;
          return (
            <li
              key={item.year}
              className={`overflow-hidden rounded-xl border ${
                expanded ? 'border-accent-400/50 bg-brand-900' : 'border-brand-800 bg-brand-950'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveYear(item.year)}
                aria-expanded={expanded}
                aria-controls={`mms-tl-${item.year}`}
                className={`flex min-h-[56px] w-full items-center gap-3 px-4 text-left ${
                  DARK_FOCUS
                }`}
              >
                <span className="text-lg font-extrabold tabular-nums text-accent-300">
                  {toBengaliDigits(item.year)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-extrabold text-white">
                    {item.title}
                  </span>
                  <span className="block text-[11px] font-semibold text-brand-300">
                    {item.tag}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-brand-300 transition-transform ${
                    expanded ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {expanded ? (
                <p
                  id={`mms-tl-${item.year}`}
                  className="px-4 pb-4 text-sm leading-relaxed text-brand-100/80"
                >
                  {item.body}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Desktop: year rail + detail */}
      <div className="mt-8 hidden lg:block">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {MILESTONES.map((item) => {
            const selected = item.year === activeYear;
            return (
              <button
                key={item.year}
                type="button"
                onClick={() => setActiveYear(item.year)}
                aria-pressed={selected}
                className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full border px-4 text-sm font-extrabold tabular-nums transition-colors ${DARK_FOCUS} ${
                  selected
                    ? 'border-accent-400 bg-accent-400 text-brand-950'
                    : 'border-brand-700 bg-brand-900 text-brand-100 hover:border-brand-500'
                }`}
              >
                {toBengaliDigits(item.year)}
              </button>
            );
          })}
        </div>

        <div
          aria-live="polite"
          className="mt-6 grid gap-6 rounded-2xl border border-brand-800 bg-brand-900/60 p-6 lg:grid-cols-[auto_1fr] lg:gap-10"
        >
          <div>
            <p className="text-4xl font-extrabold tabular-nums leading-none text-accent-300 lg:text-5xl">
              {toBengaliDigits(current.year)}
            </p>
            <p className="mt-2 inline-flex rounded-full border border-brand-700 px-3 py-1 text-[11px] font-bold text-brand-200">
              {current.tag}
            </p>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-extrabold text-white">{current.title}</h3>
            <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-brand-100/85">
              {current.body}
            </p>
          </div>
        </div>
      </div>
    </CitySection>
  );
}
