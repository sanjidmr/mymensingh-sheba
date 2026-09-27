'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Compass,
  ScrollText,
  Feather,
  Search,
  Waves,
  GraduationCap,
  HeartPulse,
  Building2,
  Library,
  School,
  Palette,
  Utensils,
  Music,
  Landmark,
  ArrowRight,
  HeartHandshake,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import CityPhoto from '@/components/mymensingh/CityPhoto';
import Reveal from '@/components/home/Reveal';

function Eyebrow({ children, onDark = false }: { children: React.ReactNode; onDark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] ${
        onDark ? 'text-brand-200' : 'text-brand-600'
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
      {children}
    </p>
  );
}

const TIMELINE = [
  {
    era: 'ষোড়শ শতক',
    tag: 'পরগণা',
    title: '‘মোমেনশাহী’র উল্লেখ',
    body: 'মোগল আমলের নথিতে মোমিন শাহের জমিদারি অঞ্চলকে ‘মোমেনশাহী পরগণা’ বলা হতো। ইংরেজ শাসনের শুরুতে আইন-ই-আকবরির অনুবাদে (জারেট) নামটি ‘Momensingh’ আকারে পাওয়া যায় — নাম নিয়ে আলোচনার সূচনা এখান থেকেই।',
  },
  {
    era: '১৭৮৭',
    tag: 'জেলা',
    title: 'ময়মনসিংহ কালেক্টরেট',
    body: 'কোম্পানি শাসনের সময় ঢাকা থেকে আলাদা করে ‘ময়মনসিংহ পার্গনার ডিগার’ স্থাপিত হয় — নিজস্ব কালেক্টরের অধীনে একটি প্রশাসনিক জেলা। পরগণার নামেই স্থানটির নাম।',
  },
  {
    era: '১৮শ শতকের শেষ ভাগ',
    tag: 'নদী',
    title: 'ব্রহ্মপুত্রের স্রোত বদল',
    body: 'এই শতকেই ব্রহ্মপুত্রের মূল ধারা পশ্চিমে সরল হয়ে আজকের যমুনা হয়ে ওঠে। পুরাতন ব্রহ্মপুত্রের তীরে গড়ে ওঠা সমুদ্রগামী জাহাজের বন্দর শহর হিসেবে ময়মনসিংহের বাণিজ্যিক পদমর্যাদা ক্রমে বদলে যায়।',
  },
  {
    era: '১৮৯৭',
    tag: 'ভূমিকম্প',
    title: 'রঙমহল ক্ষতিগ্রস্ত',
    body: '১৮৯৭-এর ভূমিকম্পে মুক্তাগাছা রাজপরিবারের রাজবাড়ির কাচের রঙমহল (‘রাঙ্গামহল’) ধ্বংস হয়। এরই ধারাবাহিকতায় পরবর্তী প্রজন্ম গড়ে তোলে আজকের ঐতিহাসিক প্রাসাদগুলো।',
  },
  {
    era: '১৯০৫',
    tag: 'স্থাপত্য',
    title: 'শশী লজ নির্মাণ',
    body: 'মহারাজা শশীকান্ত আচার্য চৌধুরীর বাসভবন শশী লজ পুরাতন ব্রহ্মপুত্রের তীরেই গড়ে ওঠে। আজ এটি শহরের সবচেয়ে পরিচিত ঐতিহ্যবাহী স্থাপনা।',
  },
  {
    era: '১৯৬১',
    tag: 'শিক্ষা',
    title: 'কৃষি বিশ্ববিদ্যালয়',
    body: '১৭ আগস্ট ১৯৬১ সালে পূর্ব পাকিস্তান কৃষি বিশ্ববিদ্যালয় নামে প্রতিষ্ঠিত, পরে ১৯৭২ সালে বাংলাদেশ কৃষি বিশ্ববিদ্যালয় নামে পরিচিত হয় — দেশের তৃতীয় প্রাচীনতম বিশ্ববিদ্যালয়।',
  },
  {
    era: '১৯৬৯',
    tag: 'জাদুঘর',
    title: 'ময়মনসিংহ জাদুঘর',
    body: 'শহরের লোকজীবন, ইতিহাস আর শিল্পের নিদর্শন ধরে রাখার কাজ শুরু হয় ময়মনসিংহ জাদুঘরের মাধ্যমে।',
  },
  {
    era: '১৯৭১',
    tag: 'মুক্তিযুদ্ধ',
    title: 'মুক্তিযুদ্ধের সেক্টর ১১',
    body: 'ময়মনসিংহ–টাঙ্গাইল ও পার্শ্ববর্তী অঞ্চল ছিল মুক্তিযুদ্ধের সেক্টর ১১-এর আওতায়। শহরজুড়ে আছে শহীদদের স্মরণে গড়ে ওঠা স্মৃতিস্তম্ভ।',
  },
  {
    era: '১৯৭৫',
    tag: 'সংস্কৃতি',
    title: 'জয়নুল সংগ্রহশালা',
    body: '১৫ এপ্রিল ১৯৭৫ সালে শিল্পী জয়নুল আবেদিনের শৈশব-তারুণ্যের স্মৃতিধন্য ময়মনসিংহে চালু হয় তাঁর নামে সংগ্রহশালা।',
  },
  {
    era: '২০১৫',
    tag: 'সংরক্ষণ',
    title: 'শশী লজ হস্তান্তর',
    body: '৪ এপ্রিল ২০১৫ সালে শশী লজ প্রত্নতত্ত্ব অধিদপ্তরের কাছে হস্তান্তরিত হয় একটি জাদুঘর প্রতিষ্ঠার উদ্দেশ্যে — জাতীয় ঐতিহ্যের স্বীকৃতির নতুন অধ্যায়।',
  },
];

const NAME_THEORIES = [
  {
    icon: ScrollText,
    label: 'নথিভুক্ত ধারা',
    title: '‘মোমেনশাহী’ পরগণা থেকে',
    body: 'মোগল আমলের নথিতে মোমিন শাহের পরগণা ‘মোমেনশাহী’; আইন-ই-আকবরির অনুবাদে বানান ‘Momensingh’; ১৭৮৭-এর কালেক্টরেট এই নামেই প্রতিষ্ঠিত। একে অনেকেই নামের প্রামাণ্য উৎস বলেন।',
  },
  {
    icon: Feather,
    label: 'লোককথা',
    title: 'রাজা ময়নসিংহের গল্প',
    body: 'মুখে মুখে প্রচলিত গল্পে বলা হয়, ‘ময়নসিংহ’ এসেছে রাজা ময়নসিংহ বা মহিষ নিয়ে কাহিনি থেকে। ময়নামতী, ময়নাবতী — নানা রূপে এই লোককথা গ্রাম-বাংলার মনে গেঁথে আছে।',
  },
  {
    icon: Search,
    label: 'বিতর্কিত মত',
    title: 'নানা ব্যাখ্যা',
    body: 'কেউ কেউ বলেন নামটি এসেছে দ্বিগুণ রাজস্ব দাবির ইতিহাস থেকে (আলাপসিংহ-বৃত্তান্ত); আবার কেউ কেউ ভাবেন, পরগণার তালিকায় আগে পড়া নামটিই কালেক্টরেটের নাম হয়ে গেছে। ঐতিহাসিকরা সব মত নিশ্চিত করে বলতে পারেননি — তাই আলাদা করে রাখা হলো।',
  },
];

export default function MymensinghCityPage() {
  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative flex min-h-[88dvh] items-end overflow-hidden bg-brand-950 sm:min-h-[92vh]">
          <CityPhoto
            src="/mymensingh/hero-river.jpg"
            alt="বিকেলে পুরাতন ব্রহ্মপুত্রের তীর"
            className="absolute inset-0"
            eager
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-brand-950/20" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-brand-950 to-transparent" />

          <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
            <Reveal>
              <Eyebrow onDark>ময়মনসিংহ · একটি পরিচিতি</Eyebrow>
              <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                ইতিহাস, ঐতিহ্য
                <br />
                <span className="text-accent-300">নদী আর মানুষের</span> শহর
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
                একবার যার সৌন্দর্য দেখেছে, সে আর ভুলতে পারে না — এই প্রবাদটি যেন ময়মনসিংহ নিয়েই গড়া।
                পুরাতন ব্রহ্মপুত্রের তীরে গড়ে ওঠা এই শহর জেলা থেকে বিশ্ববিদ্যালয়, লোকগীতিকা থেকে জাতীয়
                স্মৃতিস্তম্ভ — সবকিছুর এক অনন্য সংমিশ্রণ।
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2.5 text-xs font-semibold text-brand-100/90">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2">
                  <MapPin className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                  ১৭৮৭ · জেলা হিসেবে আত্মপ্রকাশ
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2">
                  <MapPin className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                  পুরাতন ব্রহ্মপুত্রের তীর
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2">
                  <MapPin className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                  মুক্তিযুদ্ধে সেক্টর ১১
                </span>
              </div>
            </Reveal>
          </div>

          <p className="absolute bottom-2.5 right-4 text-[10px] text-brand-100/50 sm:right-8">
            ছবি: পুরাতন ব্রহ্মপুত্রের সৈকত — Rupon Das (CC BY-SA 4.0) · Wikimedia Commons
          </p>
        </section>

        {/* ০১ · পরিচয় */}
        <section className="bg-mist-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <Reveal>
                  <Eyebrow>০১ · পরিচয়</Eyebrow>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                    নদীর শহর, মানুষের শহর
                  </h2>
                  <div className="mt-6 space-y-5 text-base leading-relaxed text-ink-600">
                    <p>
                      ময়মনসিংহ জেলা মূলত গড়ে উঠেছে পুরাতন ব্রহ্মপুত্রের তীর ঘিরে। ব্রহ্মপুত্রের মূল
                      স্রোত যখন যমুনায় স্থানান্তরিত হলো, তখনও শহরের জীবনের সঙ্গে নদী অঙ্গাঙ্গিভাবে
                      জড়িয়ে রইল — নৌকা, মাঝি, চরাঞ্চলের সবজির বাজার, বিকেলের সৈকতে মানুষের আড্ডা।
                    </p>
                    <p>
                      আজকের ময়মনসিংহ সিটি কর্পোরেশন এলাকায় ছড়িয়ে আছে ৩৩টি ওয়ার্ড। চরপাড়া,
                      সানকিপাড়া, কাঁচিঝুলি, গাঙ্গিনারপাড় — প্রতিটি মহল্লার নিজস্ব চরিত্র। দিন দিন এটি
                      দেশের অন্যতম কমনীয় ‘শিক্ষা নগরী’ হিসেবে পরিচিতি পাচ্ছে।
                    </p>
                    <p>
                      এ যেন এক ছোট্ট বাংলা — জাদুঘর, বিশ্ববিদ্যালয়, রাজবাড়ি, নদী আর মানুষের গল্প,
                      সব মিলিয়ে এক সুন্দর সমাহার।
                    </p>
                  </div>
                </Reveal>
              </div>

              <div className="lg:col-span-5">
                <Reveal delay={100}>
                  <div className="overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
                    <div className="border-b border-brand-100 bg-brand-50 px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
                        এক নজরে
                      </p>
                    </div>
                    <ul className="divide-y divide-brand-100">
                      {[
                        ['প্রতিষ্ঠা', '১৭৮৭ (কোম্পানি শাসনামলে জেলা)'],
                        ['পূর্ব নাম', 'নাসিরাবাদ (ঐতিহাসিক উল্লেখ)'],
                        ['অবস্থান', 'পুরাতন ব্রহ্মপুত্রের তীরে'],
                        ['ডাকনাম', 'শিক্ষা নগরী'],
                        ['মুক্তিযুদ্ধ', 'সেক্টর ১১ (ময়মনসিংহ–টাঙ্গাইল)'],
                        ['নদী-কথা', 'মূল ধারা ১৮শ শতকের শেষে যমুনায়'],
                      ].map(([k, v]) => (
                        <li key={k} className="flex items-baseline gap-3 px-5 py-3.5">
                          <span className="w-24 shrink-0 text-xs font-bold text-brand-700">{k}</span>
                          <span className="text-sm leading-snug text-ink-600">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ০২ · ইতিহাস */}
        <section className="bg-brand-950">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow onDark>০২ · ইতিহাসের সময়রেখা</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                একটি জেলার গল্প, যুগে যুগে
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-100/75">
                পরগণা থেকে শুরু করে স্বাধীন রাষ্ট্রের অঙ্গ — ময়মনসিংহের পথচলা কয়েকটি ধাপে। সময়রেখার
                তথ্যগুলো উইকিপিডিয়া ও বাংলাপিডিয়ার নথির ওপর ভিত্তি করে রাখা হয়েছে।
              </p>
            </Reveal>

            <div className="relative mt-14 space-y-10 lg:space-y-14">
              <span
                className="absolute inset-y-0 left-[7px] w-px bg-white/15 lg:left-1/2"
                aria-hidden="true"
              />
              {TIMELINE.map((item, i) => (
                <Reveal key={i} delay={i * 40}>
                  <div className="relative grid gap-3 pl-9 lg:grid-cols-2 lg:gap-16 lg:pl-0">
                    <span
                      className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full border-2 border-accent-400 bg-brand-950 lg:left-1/2 lg:-translate-x-1/2"
                      aria-hidden="true"
                    />
                    <div className="lg:col-start-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full border border-accent-400/40 bg-accent-400/10 px-3 py-1 text-xs font-bold text-accent-300">
                          {item.era}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-extrabold tracking-tight text-white sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-100/75">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ০৩ · নামের ইতিহাস */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow>০৩ · নামের ইতিহাস</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                ‘ময়মনসিংহ’ নামটি এলো কীভাবে?
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-600">
                নাম নিয়ে একাধিক মত আছে — কোনোটি নথিতে গেঁথে আছে, কোনোটি লোকমুখে। সততার খাতিরে তিনটি
                ধারাই এখানে আলাদা করে বলা হলো।
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {NAME_THEORIES.map((t, i) => {
                const Icon = t.icon;
                return (
                  <Reveal key={t.label} delay={i * 90}>
                    <div className="flex h-full flex-col rounded-xl border border-brand-100 bg-mist-50 p-6">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-700">
                          <Icon className="h-5 w-5 text-accent-300" aria-hidden="true" />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                          {t.label}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink-900">
                        {t.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-600">{t.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ০৪ · প্রকৃতি ও ব্রহ্মপুত্র */}
        <section className="bg-mist-100">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow>০৪ · প্রকৃতি ও ব্রহ্মপুত্র</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                ব্রহ্মপুত্রের পালে ভর করে বেঁচে থাকা এক শহর
              </h2>
            </Reveal>

            <Reveal delay={80}>
              <CityPhoto
                src="/mymensingh/brahmaputra-boats.jpg"
                alt="পুরাতন ব্রহ্মপুত্রে পালতোলা নৌকা"
                className="mt-10 aspect-[4/3] sm:aspect-[16/9]"
                caption="পুরাতন ব্রহ্মপুত্র — বর্ণিল পালতোলা নৌকা · ছবি: Ibrahim Husain Meraj (CC BY-SA 3.0)"
              />
            </Reveal>

            <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <p className="text-base leading-relaxed text-ink-700">
                  ব্রহ্মপুত্রের মূল ধারা পশ্চিমে সরিয়ে ফেলার বহু বছর পরও পুরাতন ব্রহ্মপুত্র ময়মনসিংহের
                  প্রাণ হয়ে রইল। নদীর ওপর দিয়ে এখনো ওঠানামা করে নৌকা ও লঞ্চ; তীর ঘেঁষে বসে সবজির হাট,
                  লেগে থাকে নানা বয়সের মানুষের বিকেল। বর্ষায় নদীর রূপ অন্য রকম — দূর থেকে দেখলে মনে
                  হয়, যেন সাগরের এক টুকরো নেমে এসেছে শহরের বুকে।
                </p>
                <p className="mt-4 text-base leading-relaxed text-ink-700">
                  শহরের চরপাড়া, সানকিপাড়া, কাঁচিঝুলি — এসব নামের ভেতরেই মিশে আছে নদীজীবনের স্মৃতি।
                  নদী শুধু দৃশ্য নয়; এ শহরের মানুষের রুটি-রুজি, উৎসব আর রোম্যান্সেরও সাক্ষী।
                </p>
              </div>
              <div className="lg:col-span-5">
                <CityPhoto
                  src="/mymensingh/zainul-park-boat.jpg"
                  alt="জয়নুল আবেদিন পার্কের পাশে ব্রহ্মপুত্রে নৌকা"
                  className="aspect-[4/3]"
                  caption="জয়নুল আবেদিন পার্কের কাছে নৌকা · ছবি: Rupon Das (CC BY-SA 4.0)"
                />
                <p className="mt-6 flex items-start gap-3 rounded-xl border border-brand-100 bg-white p-5">
                  <Waves className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                  <span className="text-sm leading-relaxed text-ink-600">
                    নদীর গুরুত্ব বুঝতেই শিল্পী জয়নুল আবেদিনের ছবিতে বারবার ফিরে এসেছে নৌকা ও নদীর
                    স্কেচ — সেই ভালোবাসারই ছোঁয়া আছে এ শহরের ভেতরে।
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ০৫ · শিক্ষা */}
        <section className="bg-brand-950">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow onDark>০৫ · শিক্ষা ও জ্ঞান</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                শুধু একটি শহর নয়, একটি ‘শিক্ষা নগরী’
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-100/75">
                কৃষি, চিকিৎসা, প্রকৌশল, বিজ্ঞান ও কলা — সব শাখার শিক্ষা এ শহরকে ঘিরে। প্রতিদিন বিপুল
                সংখ্যক শিক্ষার্থী শিক্ষার্থীর প্রাণোচ্ছ্বলে মুখর থাকে পুরো ময়মনসিংহ।
              </p>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: GraduationCap,
                  year: '১৯৬১',
                  name: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়',
                  body: 'দেশের তৃতীয় প্রাচীনতম বিশ্ববিদ্যালয়। পুরাতন ব্রহ্মপুত্রের পশ্চিম পাড়ে প্রায় ১২০০ একর ক্যাম্পাস; প্রাঙ্গণে ভাষা আন্দোলন ও বিজয় ’৭১ স্মৃতিস্তম্ভ।',
                },
                {
                  icon: HeartPulse,
                  year: '১৯৬২',
                  name: 'ময়মনসিংহ মেডিকেল কলেজ',
                  body: 'অঞ্চলের চিকিৎসা শিক্ষার অন্যতম কেন্দ্র; ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল মানুষের স্বাস্থ্যসেবার মেরুদণ্ড।',
                },
                {
                  icon: Building2,
                  year: '২০০৭',
                  name: 'ময়মনসিংহ ইঞ্জিনিয়ারিং কলেজ',
                  body: 'ঢাকা বিশ্ববিদ্যালয়ের অধিভুক্ত এই প্রতিষ্ঠানটি ‘মুয়েট’ — ময়মনসিংহ প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়ে রূপ নেওয়ার পরিকল্পনায়।',
                },
                {
                  icon: School,
                  year: '১৯০৮',
                  name: 'আনন্দ মোহন কলেজ',
                  body: '১৮৮০-এর দশকে গড়ে ওঠা প্রতিষ্ঠানের উত্তরসূরি; ১৯০৮ সালে কলেজরোডে ‘আনন্দ মোহন কলেজ’ নামে নামকরণ, ১৯৬৪ সালে জাতীয়করণ।',
                },
                {
                  icon: Library,
                  year: '২০০৬',
                  name: 'জাতীয় কবি কাজী নজরুল ইসলাম বিশ্ববিদ্যালয়',
                  body: 'ত্রিশালে ২০০৬ সালে স্থাপিত এই সরকারি বিশ্ববিদ্যালয় জেলা জুড়ে উচ্চশিক্ষার দ্বার উন্মুক্ত করেছে।',
                },
              ].map((e, i) => {
                  const Icon = e.icon;
                  return (
                    <Reveal key={e.name} delay={i * 80}>
                      <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-6">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                            <Icon className="h-5 w-5 text-accent-300" aria-hidden="true" />
                          </span>
                          <span className="text-xs font-bold text-brand-200">{e.year}</span>
                        </div>
                        <h3 className="mt-4 text-lg font-extrabold tracking-tight text-white">
                          {e.name}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-brand-100/75">{e.body}</p>
                      </div>
                    </Reveal>
                  );
                })}
            </div>

            <Reveal delay={120}>
              <div className="mt-10 flex items-start gap-4 rounded-xl border border-accent-400/30 bg-accent-400/10 p-5">
                <Waves className="mt-0.5 h-5 w-5 shrink-0 text-accent-300" aria-hidden="true" />
                <p className="text-sm leading-relaxed text-brand-100/85">
                  দেশের অন্যতম জনপ্রিয় শিক্ষা কেন্দ্র হিসেবে ময়মনসিংহ পরিচিত। মুক্তাগাছা, ত্রিশাল,
                  গৌরীপুর — জেলার প্রতিটি উপজেলায় ছড়িয়ে আছে প্রতিষ্ঠান আর প্রতিভা।
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ০৬ · সাহিত্য ও সংস্কৃতি */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow>০৬ · সাহিত্য ও সংস্কৃতি</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                গীতিকা থেকে গ্যালারি, মণ্ডা থেকে মেলা
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Reveal delay={60}>
                <article className="flex h-full flex-col rounded-xl border border-brand-100 bg-mist-50 p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700">
                      <ScrollText className="h-5 w-5 text-accent-300" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
                      মৈমনসিংহ গীতিকা
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
                    বাংলা লোকসাহিত্যের অহংকার
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    দীনেশচন্দ্র সেন সারা বাংলা ঘুরে যে গীতিগুলো সংগ্রহ ও সম্পাদনা করেছিলেন, সেগুলোর
                    সিংহভাগই এই অঞ্চলের। ১৯২৩ সাল থেকে কলকাতা বিশ্ববিদ্যালয় থেকে প্রকাশিত
                    ‘মৈমনসিংহ গীতিকা’র ‘মাহুয়া’ — আজও পাঠকের মনে গেঁথে থাকা প্রেমকাহিনি। এতে
                    ময়মনসিংহের গ্রামীণ জীবন, বিরহ আর বীরত্ব যেন কাগজে জমে আছে।
                  </p>
                </article>
              </Reveal>

              <Reveal delay={140}>
                <article className="flex h-full flex-col rounded-xl border border-brand-100 bg-mist-50 p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700">
                      <Palette className="h-5 w-5 text-accent-300" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
                      শিল্প ও জাদুঘর
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
                    শিল্প ও জাদুঘরের শহর
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    শিল্পাচার্য জয়নুল আবেদিনের শৈশব-তারুণ্যের একাংশ কেটেছে এই শহরে। পুরাতন
                    ব্রহ্মপুত্রের তীরে ১৯৭৫ সালে চালু হয় তাঁর নামে সংগ্রহশালা; ১৯৬৯-এ প্রতিষ্ঠিত
                    ময়মনসিংহ জাদুঘরও অঞ্চলের নথিপত্র, শিল্প ও লোকজীবনের নিদর্শন ধরে রেখেছে।
                  </p>
                </article>
              </Reveal>

              <Reveal delay={220}>
                <article className="flex h-full flex-col rounded-xl border border-brand-100 bg-mist-50 p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700">
                      <Music className="h-5 w-5 text-accent-300" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
                      সংগীত ও উৎসব
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
                    নদীতীরের স্মৃতি ও সংগীত
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    রবীন্দ্রনাথ ঠাকুরের সঙ্গে ময়মনসিংহের যোগ রয়েছে — তবে সাবধানে বলতে হয়, এ কথা তাঁর
                    সফরের ঐতিহাসিক নথির আলোকে। চৈত্র মাসের বিচিত্রা উৎসব, নদীতীরের মেলা, আর কাজী নজরুল
                    ইসলামের স্মৃতি মেশানো পুরনো কলেজ-ক্যাম্পাসের গল্প — এ শহরের সাংস্কৃতিক পরম্পরা
                    বহুমাত্রিক।
                  </p>
                </article>
              </Reveal>

              <Reveal delay={300}>
                <article className="flex h-full flex-col rounded-xl border border-brand-100 bg-mist-50 p-7">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-700">
                      <Utensils className="h-5 w-5 text-accent-300" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
                      ঐতিহ্যবাহী রসদ
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
                    মুক্তাগাছার মণ্ডা
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    মিঠাই মানেই ময়মনসিংহের ঐতিহ্য — বিশেষ করে মুক্তাগাছার মণ্ডা। উপজেলা জুড়ে ছড়িয়ে
                    থাকা মিষ্টির দোকান থেকে ‘মণ্ডা’ ভাষার শব্দই যেন সবার মুখে মুখে। অতিথি আপ্যায়নের
                    শুরু হোক মণ্ডা দিয়েই, এমনই ধারা।
                  </p>
                </article>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ০৭ · ঐতিহাসিক ও দর্শনীয় স্থান */}
        <section className="bg-mist-50">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow>০৭ · ঐতিহাসিক ও দর্শনীয় স্থান</Eyebrow>
              <h2 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                ঘুরে দেখার মতো ধারাবাহিক ঐতিহ্য
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Reveal delay={60}>
                <article className="overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm lg:h-full">
                  <CityPhoto
                    src="/mymensingh/shashi-lodge.jpg"
                    alt="শশী লজ — ময়মনসিংহের ঐতিহ্যবাহী প্রাসাদ"
                    className="aspect-[4/3]"
                    caption="শশী লজ · ছবি: Topu Saha (CC BY-SA 3.0)"
                  />
                  <div className="p-7">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-extrabold text-brand-700">০১</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600">
                        শশী লজ
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-extrabold tracking-tight text-ink-900">
                      ১৯০৫-এ গড়া রাজপ্রাসাদ, আজকের জাদুঘর
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">
                      মহারাজা শশীকান্ত আচার্য চৌধুরীর বাসভবন হিসেবে পুরাতন ব্রহ্মপুত্রের তীরে ১৯০৫
                      সালে গড়া হয়। ১৯৫২ সাল থেকে এখানে চলে মহিলা শিক্ষক প্রশিক্ষণ কলেজ; ২০১৫ সালে
                      প্রত্নতত্ত্ব অধিদপ্তর এটি গ্রহণ করে। জাতীয় ঐতিহ্যের স্মৃতিস্তম্ভ হিসেবে
                      সংরক্ষণের কাজ চলছে।
                    </p>
                  </div>
                </article>
              </Reveal>

              <div className="grid gap-6">
                {[
                  {
                    n: '০২',
                    name: 'আলেকজান্ডার ক্যাসেল (লোহার কুঠি)',
                    body: '১৯০৫-এর ভূমিকম্প-পরবর্তী যুগে গড়া এই প্রাসাদ ‘লোহার কুঠি’ নামেই বেশি পরিচিত। সূর্যকান্ত আচার্য চৌধুরীর প্রচেষ্টায় গড়া এই স্থানে রবীন্দ্রনাথ ঠাকুর এক নাগরিক সমাবেশে যোগ দেন — এমন ঐতিহাসিক নথি আছে।',
                  },
                  {
                    n: '০৩',
                    name: 'ময়মনসিংহ জাদুঘর',
                    body: '১৯৬৯ সালে প্রতিষ্ঠিত এই জাদুঘরে রাখা আছে ময়মনসিংহের ঐতিহাসিক নথি, ভাস্কর্য ও লোকজীবনের নানা নিদর্শন।',
                  },
                  {
                    n: '০৪',
                    name: 'জয়নুল আবেদিন সংগ্রহশালা',
                    body: 'শিল্পাচার্যের ~৭০টি শিল্পকর্ম নিয়ে ১৯৭৫ সালের ১৫ এপ্রিল পুরাতন ব্রহ্মপুত্রের তীরে যাত্রা শুরু করেছিল এই সংগ্রহশালাটি।',
                  },
                  {
                    n: '০৫',
                    name: 'মুক্তাগাছা রাজবাড়ি (আটআনি)',
                    body: 'শহর থেকে প্রায় ১৭ কিমি পশ্চিমে মুক্তাগাছায় অবস্থিত আচার্য চৌধুরী জমিদারি। বিশাল গেট, দরবার হল, আর এককালের ‘ঘোরানো মঞ্চ’ মিলিয়ে এটি লোকজ স্মৃতির এক মহীরুহ।',
                  },
                  {
                    n: '০৬',
                    name: 'গৌরীপুর রাজবাড়ি',
                    body: 'গৌরীপুর উপজেলার (ময়মনসিংহ জেলা) রয় চৌধুরী জমিদারি। এর উত্তরাধিকারী রাজেন্দ্রকিশোর রয় চৌধুরী বাংলা ফটোগ্রাফির অন্যতম পথিকৃৎ — ছবির অভিলেখ আছে বাংলাপিডিয়ায়।',
                  },
                ].map((p, i) => (
                  <Reveal key={p.name} delay={i * 60}>
                    <article className="flex h-full flex-col rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-brand-700">{p.n}</span>
                        <h3 className="text-base font-extrabold tracking-tight text-ink-900">
                          {p.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.body}</p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={80}>
              <p className="mt-10 flex items-start gap-3 rounded-xl border border-brand-100 bg-white p-5 text-sm leading-relaxed text-ink-600">
                <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden="true" />
                এই তালিকা সম্পূর্ণ নয় — রাজবাড়ির পাশে আছে আলেকজান্ডার ক্যাসেলের ছোঁয়া, শহীদদের
                ময়মনসিংহ-১৯৭১ স্মৃতিস্তম্ভ, আর বহু অজানা পুরাকীর্তি। সময় নিয়ে ঘুরে দেখার মতো শহর।
              </p>
            </Reveal>
          </div>
        </section>

        {/* ০৮ · আমাদের ময়মনসিংহ */}
        <section className="bg-brand-950">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <Reveal>
              <Eyebrow onDark>০৮ · আমাদের ময়মনসিংহ</Eyebrow>
              <h2 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                ইতিহাস যত পুরনো, জীবন ততই সজীব — শহরের কথাই শহরের পরিচয়
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-brand-100/80">
                নদী, জাদুঘর আর বিশ্ববিদ্যালয়ের পাশাপাশি এ শহর প্রতিদিন বেঁচে থাকে তার মানুষের
                হাসি-কান্নায়। আজকের আবহাওয়া আর নামাজের সময় হোক বা বাসা ভাড়া, গৃহকর্মী, গৃহশিক্ষক —
                শহরের প্রয়োজনগুলোই আমাদের দৈনন্দিন সেবার কথা। পৃষ্ঠার একদম উপরের ‘লাইভ’ বারটি দেখায়
                আজকের ময়মনসিংহের চলমান রূপ — পুরোটাই লাইভ তথ্যের ভিত্তিতে।
              </p>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: Compass,
                  title: 'প্রতিদিনের সেবা',
                  body: 'বাসা ভাড়া থেকে গৃহকর্মী, মেরামত থেকে গৃহশিক্ষক — সব স্থানীয় সেবা এক জায়গায়।',
                  href: '/services',
                  cta: 'সেবা দেখুন',
                },
                {
                  icon: HeartHandshake,
                  title: 'জরুরি প্রয়োজনে',
                  body: 'রক্তদান, জরুরি হেল্পলাইন — প্রয়োজনের মুহূর্তে পাশে থাকার চেষ্টা আমাদের।',
                  href: '/contact',
                  cta: 'যোগাযোগ করুন',
                },
                {
                  icon: Landmark,
                  title: 'শহরকে জানুন',
                  body: 'এই পরিচিতি পৃষ্ঠাটি ক্রমে বাড়বে — নতুন ঐতিহ্য, স্মৃতি আর গল্প যোগ হবে।',
                  href: '/mymensingh',
                  cta: 'আরও পড়ুন',
                },
              ].map((c, i) => {
                const Icon = c.icon;
                return (
                  <Reveal key={c.title} delay={i * 90}>
                    <Link
                      href={c.href}
                      className="group flex h-full flex-col rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-accent-400/40 hover:bg-white/[0.08]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                        <Icon className="h-5 w-5 text-accent-300" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-white">
                        {c.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-brand-100/75">{c.body}</p>
                      <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-bold text-accent-300">
                        {c.cta}
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* সূত্র ও কৃতিত্ব */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="border-t border-brand-100 pt-6 text-xs leading-relaxed text-ink-500">
              <p className="font-bold uppercase tracking-[0.18em] text-ink-400">তথ্যসূত্র ও ছবির কৃতিত্ব</p>
              <p className="mt-3 max-w-4xl">
                তথ্য: উইকিপিডিয়া ও বাংলাপিডিয়ার নথিভুক্ত উৎস থেকে সংযোজিত; লোককথা ও বিতর্কিত মতামত
                ‘নামের ইতিহাস’ অংশে আলাদা করে চিহ্নিত করা হয়েছে। ছবি: উইকিমিডিয়া কমন্স থেকে CC
                BY-SA ৩.০/৪.০ লাইসেন্সে নেওয়া — পালতোলা নৌকা: Ibrahim Husain Meraj; ব্রহ্মপুত্রের
                সৈকত ও জয়নুল পার্কের নৌকা: Rupon Das; শশী লজ: Topu Saha। কোনো সংযোজন-বিয়োজনে ভুল
                গেলে এখানে সংশোধন করা হবে।
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}