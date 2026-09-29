import {
  Building,
  GraduationCap,
  HeartPulse,
  Hospital,
  Landmark,
  MapPin,
  ShoppingBag,
  Trophy,
  Trees,
} from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { CityHeading, CitySection } from './CityBits';

const SPHERES = [
  {
    icon: GraduationCap,
    title: 'শিক্ষা',
    lead: 'জেলা বোর্ড, সূর্যকান্ত লাইব্রেরি ও একাধিক বিশ্ববিদ্যালয়',
    points: [
      'শিক্ষা ব্যবস্থায় এখানে দীর্ঘ ও ধারাবাহিক ঐতিহ্য রয়েছে',
      'স্থানীয় সাহিত্য চর্চা ও গবেষণার ক্ষেত্র হিসেবে ময়মনসিংহ পরিচিত',
    ],
  },
  {
    icon: HeartPulse,
    title: 'স্বাস্থ্যসেবা',
    lead: 'সরকারি ও বেসরকারি চিকিৎসা কেন্দ্র',
    points: [
      'জেলা সদর হাসপাতাল ও বিশেষায়িত চিকিৎসা কেন্দ্র এলাকার প্রধান সেবা কেন্দ্র',
      'এলাকাভিত্তিক প্রাথমিক স্বাস্থ্যসেবা কেন্দ্র গ্রামাঞ্চলে বিস্তৃত',
    ],
  },
  {
    icon: Trophy,
    title: 'খেলাধুলা',
    lead: 'ক্রিকেট, ফুটবল ও ঐতিহ্যবাহী খেলা',
    points: [
      'জেলাভিত্তিক খেলাধুলায় নিয়মিত অংশগ্রহণ ও সাফল্যের ইতিহাস',
      'এলাকার খেলাধুলা ও সামাজিক সংগঠনের কাঠামো পরিচিত',
    ],
  },
  {
    icon: Landmark,
    title: 'পর্যটন ও সংস্কৃতি',
    lead: 'ঐতিহাসিক স্থান, লোকসংগীত ও নকশীকাঁথা',
    points: [
      'অতীতের প্রশাসনিক ও ধর্মীয় স্থানগুলো পর্যটনের আকর্ষণ',
      'লোকসংগীত ও লোকশিল্পে বাংলাদেশের স্বীকৃত অবস্থান',
    ],
  },
  {
    icon: ShoppingBag,
    title: 'বাণিজ্য ও জীবিকা',
    lead: 'কৃষি, নদীপথ ও বাজার-কেন্দ্রিক অর্থনীতি',
    points: [
      'কৃষি ও কৃষিজাত পণ্যের বাণিজ্য এলাকার প্রধান অর্থনৈতিক কাজ',
      'নদীপথ ও বাজার কেন্দ্র হিসেবে কাঠামো ধরে রেখেছে',
    ],
  },
  {
    icon: Trees,
    title: 'প্রকৃতি ও পরিবেশ',
    lead: 'নদী, হাওর, বন ও চরাঞ্চল',
    points: [
      'নদীচর ও চরাঞ্চলে বন্ধু প্রাণীর আবাসিক্ষেত্র',
      'প্রাকৃতিক ঝুঁকি ও পরিবেশ রক্ষার স্থানীয় উদ্যোগ',
    ],
  },
];

const LANDMARKS = [
  { icon: Building, name: 'জেলা প্রশাসকের কার্যালয়', note: 'জেলা প্রশাসনের কেন্দ্র' },
  { icon: Landmark, name: 'সদর আদালত', note: 'আইনি বিচারের কেন্দ্র' },
  { icon: MapPin, name: 'মহানগর ভবিষ্যতের লক্ষ্য', note: 'ধারাবাহিক উন্নয়ন পরিকল্পনা' },
  { icon: Hospital, name: 'স্বাস্থ্যসেবা কেন্দ্র', note: 'চিকিৎসা সেবা' },
];

/**
 * PresentMymensingh — the city today, organised by life sphere rather than a
 * statistics wall. No population or percentage figures are stated because we do
 * not have a verified source for them; verified figures are left to the sources
 * chapter.
 */
export default function PresentMymensingh() {
  return (
    <CitySection labelledBy="city-present-heading" id="city-present" className="bg-mist-100">
      <CityHeading
        id="city-present-heading"
        index="১৪"
        eyebrow="বর্তমান"
        title="আজকের ময়মনসিংহ"
        intro="ইতিহাসের শহর আজ সমান্তরালভাবে বেড়ে উঠেছে — বিশ্ববিদ্যালয়, স্বাস্থ্যসেবা, খেলাধুলা, পর্যটন ও বাণিজ্যে। নিচে সেই আজকের জীবনের ছয়টি ক্ষেত্র দেওয়া হয়েছে।"
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SPHERES.map((sphere, index) => {
          const Icon = sphere.icon;
          return (
            <Reveal as="li" key={sphere.title} delay={index * 50}>
              <div className="flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-[15px] font-extrabold text-ink-900">
                  {sphere.title}
                </h3>
                <p className="mt-1 text-[13px] font-semibold text-brand-700">
                  {sphere.lead}
                </p>
                <ul className="mt-3 space-y-2">
                  {sphere.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2 text-[13px] leading-relaxed text-ink-600"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </ul>

      <Reveal delay={60}>
        <ul className="mt-6 flex flex-wrap gap-2">
          {LANDMARKS.map((place) => {
            const Icon = place.icon;
            return (
              <li
                key={place.name}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-2 text-xs font-bold text-ink-700"
              >
                <Icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                {place.name}
                <span className="font-semibold text-ink-500">· {place.note}</span>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </CitySection>
  );
}
