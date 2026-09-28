import { Landmark, Mountain, ScrollText, Ship, Sparkles, Crown } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityLabel, CitySection, TITLE } from './CityBits';

const CHAPTERS = [
  {
    icon: Mountain,
    era: 'প্রাচীন যুগ',
    title: 'মধুপুর গড় ও লালমাটির অঞ্চল',
    body: 'প্রাচীন বাংলার ভূতাত্ত্বিক ধারার সঙ্গে এই অঞ্চলের সম্পর্ক গড়ে ওঠেছে। মধুপুর গড়ের চারপাশে জঙ্গল ও লালমাটির ভূমি — মানুষের বাসস্থান, কৃষি ও পশুপালনের প্রথম কেন্দ্রগুলো এখানে গড়ে উঠেছিল।',
  },
  {
    icon: Crown,
    era: 'প্রাচীন বাংলা',
    title: 'বাংগরাজ্যের আলোচনায় অঞ্চল',
    body: 'প্রাচীন বাংলার রাজনৈতিক ইতিহাসে এখানকার অঞ্চল নিয়ে আলোচনা পাওয়া যায়। মৌর্য, গুপ্ত, পাল ও সেন শাসনের প্রভাব এই ভূমিতে প্রসারিত ছিল বলে ধরা হয় — তবে প্রতিটি রাজবংশের সঙ্গে সরাসরি প্রশাসনিক নথি নিশ্চিত নয়।',
  },
  {
    icon: Landmark,
    era: 'মুসলিম শাসন',
    title: 'সুলতানি ও মুঘল যুগ',
    body: 'দিল্লি সুলতানি ও মুঘল যুগে এ অঞ্চল প্রাদেশিক শাসনের অংশ হয়ে ওঠে। নদীনির্ভর বাণিজ্য, কুটিরশিল্প ও স্থানীয় প্রশাসনের ধারা এই সময়ে গড়ে ওঠে — যার ছাপ আজও টিকে আছে।',
  },
  {
    icon: Crown,
    era: 'নবাবি ও কোম্পানি শাসন',
    title: 'অন্যতম প্রথা ও পারগণা ব্যবস্থা',
    body: 'মুঘল শাসনোত্তর এ অঞ্চল নবাবি শাসন ও এরপর ইস্ট ইন্ডিয়া কোম্পানির হাতে চলে যায়। দেওয়ান পরগণা, জমিদারি প্রথা ও নদীপথের বাণিজ্য — এই সময়ের কাঠামো থেকেই আধুনিক ময়মনসিংহের প্রশাসনিক গঠন।',
  },
  {
    icon: Ship,
    era: 'বাংলা নদীর যুগ',
    title: 'নদী বদলে গড়ে ওঠা বাণিজ্য',
    body: 'ব্রহ্মপুত্রের তীরে সমুদ্রগামী নৌকা ও মাঝির ধারায় একটি ব্যবসায়িক কেন্দ্র তৈরি হয়। চরাঞ্চলের বাজার, মাটির পণ্য আর দেশি-বিদেশি বাণিজ্য — এই সৌমাগ্র্য এখানকার মানুষের জীবনযাত্রার অংশ হয়ে ওঠে।',
  },
  {
    icon: Sparkles,
    era: 'আধুনিক শুরু',
    title: 'কালেক্টরেট থেকে সিটি',
    body: 'এই দীর্ঘ যাত্রার পর এলো ১৭৮৭ সালের জেলা প্রতিষ্ঠা, ১৮৬৯-এর পৌরসভা, ১৮৮৬-এর রেলপথ — আর এক শতাব্দী পরে ২০১৫ সালের বিভাগ।',
  },
];

/**
 * AncientMymensingh — the long historical background, split into short visual
 * chapters instead of long paragraphs. Vertical rail on mobile, alternating
 * editorial track on desktop.
 */
export default function AncientMymensingh() {
  return (
    <CitySection labelledBy="city-ancient-heading" id="city-ancient" className="border-y border-brand-100 bg-mist-100">
      <div className="max-w-3xl">
        <Reveal>
          <CityLabel index="০৩">প্রাচীন জনপদ</CityLabel>
          <h2 id="city-ancient-heading" className={`mt-3 ${TITLE}`}>
            ময়মনসিংহের ইতিহাস এক দিনে তৈরি হয়নি
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            প্রাচীন বাংলা থেকে শুরু করে কোম্পানি শাসন পর্যন্ত — যুগে যুগে এই অঞ্চলের
            চেহারা বদলেছে। নিচে ছয়টি ধাপে সেই বদলামটি দেখা যাচ্ছে।
          </p>
        </Reveal>
      </div>

      {/* Mobile: vertical rail */}
      <ol className="mt-8 space-y-1 lg:hidden">
        {CHAPTERS.map((chapter, index) => {
          const Icon = chapter.icon;
          const isLast = index === CHAPTERS.length - 1;
          return (
            <Reveal as="li" key={chapter.title} delay={index * 50} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-300 bg-white text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {!isLast ? (
                  <span aria-hidden="true" className="my-1 w-px flex-1 bg-brand-200" />
                ) : null}
              </div>
              <div className={`min-w-0 ${isLast ? '' : 'pb-6'}`}>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent-700">
                  {chapter.era}
                </p>
                <h3 className="mt-1 text-base font-extrabold text-ink-900">{chapter.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{chapter.body}</p>
              </div>
            </Reveal>
          );
        })}
      </ol>

      {/* Desktop: alternating editorial track */}
      <ol className="mt-10 hidden lg:block">
        <li aria-hidden="true" className="relative h-px bg-brand-200" />
        {CHAPTERS.map((chapter, index) => {
          const Icon = chapter.icon;
          const flip = index % 2 === 1;
          return (
            <Reveal
              as="li"
              key={chapter.title}
              delay={index * 40}
              className="relative grid grid-cols-[1fr_auto_1fr] items-start gap-8 py-7"
            >
              <div className={flip ? 'col-start-3' : 'col-start-1'}>
                <div className={flip ? 'text-left' : 'text-right'}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-700">
                    {chapter.era}
                  </p>
                  <h3 className="mt-1.5 text-lg font-extrabold text-ink-900">
                    {chapter.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-600">
                    {chapter.body}
                  </p>
                </div>
              </div>
              <span
                aria-hidden="true"
                className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-brand-300 bg-mist-100 text-brand-700"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className={flip ? 'col-start-1' : 'col-start-3'} aria-hidden="true" />
            </Reveal>
          );
        })}
      </ol>

      <Reveal delay={60}>
        <p className="mt-8 flex items-start gap-2.5 rounded-xl border border-bronze-200 bg-bronze-50 p-4 text-[13px] leading-relaxed text-ink-700">
          <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-bronze-600" aria-hidden="true" />
          <span>
            প্রাচীন যুগের বর্ণনায় যেখানে নির্দিষ্ট নথির সরাসরি প্রমাণ পাওয়া যায়নি,
            সেখানে ধারণাগুলো “ধরা হয়” বা “আলোচিত” হিসেবে উল্লেখ করা হয়েছে — নিশ্চিত
            তথ্য হিসেবে উপস্থাপন করা হয়নি।
          </span>
        </p>
      </Reveal>
    </CitySection>
  );
}
