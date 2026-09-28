'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink, Info, ShieldCheck } from 'lucide-react';
import { CityLabel, SCROLL_MT } from './CityBits';

type Source = {
  id: string;
  title: string;
  body: string;
  kind: 'সরকারি' | 'আর্কাইভ' | 'তথ্যসম্পদ';
  what: string;
};

const SOURCES: Source[] = [
  {
    id: 'bangladesh-govt',
    title: 'বাংলাদেশ সরকারের প্রশাসনিক তথ্য',
    kind: 'সরকারি',
    body: 'জেলা ও বিভাগ গঠন, প্রশাসনিক সীমানা পরিবর্তন এবং সরকারি নথি সম্পর্কিত তথ্য যাচাইয়ের প্রাথমিক ভিত্তি।',
    what: 'জেলা প্রতিষ্ঠা · বিভাগ গঠন · সীমানা পরিবর্তন',
  },
  {
    id: 'banglapedia',
    title: 'বাংলাপিডিয়া — ময়মনসিংহ',
    kind: 'তথ্যসম্পদ',
    body: 'জেলার ইতিহাস, শহরের প্রতিষ্ঠা, লোকসংস্কৃতি ও ব্যক্তিত্ব সম্পর্কিত ধারাবাহিক নিবন্ধ।',
    what: 'ইতিহাস · সংস্কৃতি · ব্যক্তিত্ব',
  },
  {
    id: 'mymensingh-gitiká',
    title: 'ময়মনসিংহ গীতিকা',
    kind: 'আর্কাইভ',
    body: 'আধুনিক বাংলা লোকসাহিত্যের অন্যতম বড় নিদর্শন। লোকসংস্কৃতি সম্পর্কিত দাবিগুলোর প্রধান নথি।',
    what: 'লোকসংগীত · সাহিত্য',
  },
  {
    id: 'mymensingh-archive',
    title: 'জেলা আর্কাইভ ও স্থানীয় সংগ্রহ',
    kind: 'আর্কাইভ',
    body: 'আড়াই শতাব্দীর আর্কাইভাল নথি, স্থানচিহ্ন ও পরিবারিক সংগ্রহ — ঐতিহাসিক দাবিগুলোর ক্ষেত্রে প্রাথমিক নথি।',
    what: 'প্রাচীন যুগ · ভূমি ও স্থাপত্য',
  },
  {
    id: 'image-licensing',
    title: 'ছবির উৎস ও লাইসেন্স',
    kind: 'আর্কাইভ',
    body: 'প্রতিটি ছবির উৎস ও লাইসেন্স প্রকাশ্য বা উচিত অনুমতি নিশ্চিত করে যুক্ত করা হবে। যাচাই না হওয়া ছবি ইতিহাসের প্রমাণ হিসেবে ব্যবহার করা হয়নি।',
    what: 'ছবির অধিকার · কৃতজ্ঞতা',
  },
];

/**
 * Sources — expandable reference list.
 *
 * Deliberately generic about where a fact came from rather than linking to URLs
 * we have not verified. Each entry states *what kind* of source it is and which
 * claims it backs, so readers can judge reliability, and the whole thing stays
 * honest about what still needs verification.
 */
export default function Sources() {
  const [openId, setOpenId] = useState<string | null>(SOURCES[0].id);

  return (
    <section
      aria-labelledby="city-sources-heading"
      id="city-sources"
      className={`${SCROLL_MT} border-t border-brand-100 bg-white`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-2xl">
          <CityLabel index="১৮">তথ্যসূত্র</CityLabel>
          <h2 id="city-sources-heading" className="mt-3 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
            তথ্য যেখান থেকে এসেছে
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            ইতিহাসের তথ্য যাচাই না করে উপস্থাপন করা ঠিক হয় না। নিচে কোন ধরনের
            উৎসের সাহায্যে কোন তথ্যগুলো সাজানো হয়েছে তা খোলা যায়।
          </p>
          <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-mist-50 p-4 text-[13px] leading-relaxed text-ink-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
            <span>
              যেসব তথ্য নথিভিত্তিকভাবে নিশ্চিত করা যায়নি, সেগুলো পাতায় উল্লেখ করা
              হয়েছে — সেগুলোর মধ্যে সবচেয়ে বেশি ধাপ পড়ার দরকার।
            </span>
          </p>
        </div>

        <ul className="mt-7 divide-y divide-brand-100 overflow-hidden rounded-2xl border border-brand-100">
          {SOURCES.map((source) => {
            const open = openId === source.id;
            return (
              <li key={source.id} className="bg-white">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : source.id)}
                    aria-expanded={open}
                    aria-controls={`src-${source.id}`}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-mist-50 sm:px-5"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-extrabold text-ink-900">
                        {source.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-500">
                        {source.what}
                      </span>
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-brand-200 bg-mist-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 sm:inline-block">
                      {source.kind}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-brand-600 transition-transform ${
                        open ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {open ? (
                  <div
                    id={`src-${source.id}`}
                    className="flex items-start gap-2.5 px-4 pb-4 sm:px-5"
                  >
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
                    <p className="text-sm leading-relaxed text-ink-600">{source.body}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="mt-5 flex items-start gap-2 text-[12px] leading-relaxed text-ink-500">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          নির্দিষ্ট লিংক বা নথির উদ্ধৃতি যোগ করা হবে যখন সেগুলো যাচাই করা হবে — অযাচাইকৃত
          লিংক দেখিয়ে নিজের নামে ব্যবহার করা হবে না।
        </p>
      </div>
    </section>
  );
}
