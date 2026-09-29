'use client';

import { useState } from 'react';
import { ArrowRight, Building2, Landmark, MapPin, Sprout, Users } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import ArchivePhoto from './ArchivePhoto';
import { CityHeading, CitySection } from './CityBits';

type District = {
  id: string;
  name: string;
  role: string;
  summary: string;
  highlights: string[];
  facts: { label: string; value: string }[];
  src: string;
  alt: string;
  slotNote: string;
};

const DISTRICTS: District[] = [
  {
    id: 'mymensingh',
    name: 'ময়মনসিংহ',
    role: 'বিভাগের কেন্দ্র',
    summary:
      'বিভাগের প্রশাসনিক ও সাংস্কৃতিক কেন্দ্র। এখানে বিশ্ববিদ্যালয়, জেলা প্রশাসন, জাদুঘর ও লোকসংস্কৃতির ঐতিহ্য একত্রে বিদ্যমান।',
    highlights: ['জেলা ও বিভাগের প্রশাসনিক কেন্দ্র', 'শিক্ষা ও সংস্কৃতির প্রধান কেন্দ্র', 'লোকসঙ্গীত ও লোকশিল্পের ঐতিহ্য'],
    facts: [
      { label: 'ভূমিকা', value: 'বিভাগের কেন্দ্র' },
      { label: 'অবস্থান', value: 'ব্রহ্মপুত্র অঞ্চল' },
    ],
    src: '/sarkithouse.jpg',
    alt: 'ময়মনসিংহ জেলার আর্কাইভাল দৃশ্যের ছবির স্থান',
    slotNote: 'ময়মনসিংহ জেলার আর্কাইভাল দৃশ্যের ছবির স্থান',
  },
  {
    id: 'jamalpur',
    name: 'জামালপুর',
    role: 'সাস্তা ও সংস্কৃতির ঐতিহ্য',
    summary:
      'ভাগাভাগির আগে এ অঞ্চলের প্রথা ও প্রশাসনের কেন্দ্র ছিল জামালপুর। সাস্তা রাজবাড়ি, ঘোষপাড়ার ঐতিহ্য ও স্থানীয় খেলার কেন্দ্র হিসেবে পরিচিত।',
    highlights: ['সাস্তা রাজবাড়ি', 'ঐতিহাসিক ঘোষপাড়ার ধারা', 'ঐতিহ্যবাহী খেলা ও সংস্কৃতি'],
    facts: [
      { label: 'ঐতিহাসিক ভূমিকা', value: 'প্রাক্তিন প্রশাসনকেন্দ্র' },
      { label: 'সম্পর্ক', value: 'বিভাগের অন্যতম পুরোনো জেলা' },
    ],
    src: '/jamalpur.jpg',
    alt: 'জামালপুর জেলার ঐতিহাসিক স্থাপত্যের চিত্র',
    slotNote: 'জামালপুর জেলার আর্কাইভাল দৃশ্যের ছবির স্থান',
  },
  {
    id: 'sherpur',
    name: 'শেরপুর',
    role: 'ধর্মীয় ও ঐতিহাসিক কেন্দ্র',
    summary:
      'ঐতিহাসিক নির্দর্শন ও পুরোনো স্থাপত্যের জন্য পরিচিত। স্থানীয় কীর্তন ও ধর্মীয় ঐতিহ্য এখানে জীবন্ত।',
    highlights: ['ঐতিহাসিক নির্দর্শনস্থল', 'কীর্তন ও সংগীতের ধারা', 'পুরোনো জামিলা ভবনের নিদর্শন'],
    facts: [
      { label: 'পরিচিতি', value: 'ঐতিহাসিক নির্দর্শন' },
      { label: 'ভূমিকা', value: 'ধর্মীয় ঐতিহ্য কেন্দ্র' },
    ],
    src: '/sherpur.jpg',
    alt: 'শেরপুর জেলার ঐতিহাসিক নির্দর্শনের চিত্র',
    slotNote: 'শেরপুর জেলার আর্কাইভাল দৃশ্যের ছবির স্থান',
  },
  {
    id: 'netrokona',
    name: 'নেত্রকোণা',
    role: 'প্রকৃতি ও কৃষি',
    summary:
      'হাওর, জলাভূমি ও কৃষিভূমির জন্য পরিচিত। বন্ধু প্রাণী, কৃষি ও প্রাকৃতিক ঝুঁকি নিয়ে আলোচিত হয়।',
    highlights: ['হাওর ও জলাভূমি', 'কৃষিভূমি ও চাষের ঐতিহ্য', 'বন্ধু প্রাণীর আবাসিক্ষেত্র'],
    facts: [
      { label: 'পরিচিতি', value: 'হাওর ও কৃষি' },
      { label: 'সম্পর্ক', value: 'বিভাগের উত্তরের জেলা' },
    ],
    src: '/netrokona.jpg',
    alt: 'নেত্রকোণা জেলার হাওর ও জলাভূমির চিত্র',
    slotNote: 'নেত্রকোণা জেলার আর্কাইভাল দৃশ্যের ছবির স্থান',
  },
];

const QUICK = [
  { icon: Building2, label: 'জেলা', value: 'চারটি' },
  { icon: Landmark, label: 'বিভাগ', value: 'অষ্টম' },
  { icon: MapPin, label: 'কেন্দ্র', value: 'ময়মনসিংহ' },
  { icon: Users, label: 'স্থানীয় ইতিহাস', value: 'অঞ্চলভিত্তিক' },
];

/**
 * TodayDashboard — interactive district explorer.
 *
 * Tabs on desktop, accordion on mobile, one shared detail panel driven by the
 * same state. Tapping a district never navigates away, so the chapter stays
 * readable as one experience.
 */
export default function TodayDashboard() {
  const [active, setActive] = useState(DISTRICTS[0].id);
  const current = DISTRICTS.find((d) => d.id === active) ?? DISTRICTS[0];

  return (
    <CitySection labelledBy="city-today-heading" id="city-today" className="border-b border-brand-100 bg-white">
      <CityHeading
        id="city-today-heading"
        index="১৫"
        eyebrow="আজকের বিভাগ"
        title="ময়মনসিংহ বিভাগের চারটি জেলা"
        intro="বিভাগটি আসলে চারটি আলাদা চারিত্রের জেলার সমষ্টি। যেকোনো একটি বেছে নিলে নিচে তার ভূমিকা ও পরিচিতি খুলে যাবে।"
      />

      <Reveal delay={50} className="mt-5">
        <ul className="flex flex-wrap justify-center gap-2">
          {QUICK.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-mist-50 px-3 py-1.5 text-[11px] font-bold text-ink-700"
              >
                <Icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                {item.label}
                <span className="text-brand-700">{item.value}</span>
              </li>
            );
          })}
        </ul>
      </Reveal>

      {/* Mobile: accordion switcher */}
      <ul className="mt-7 space-y-2 lg:hidden">
        {DISTRICTS.map((district) => {
          const expanded = district.id === active;
          return (
            <li
              key={district.id}
              className={`overflow-hidden rounded-xl border ${
                expanded ? 'border-brand-700 bg-mist-50' : 'border-brand-100 bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setActive(district.id)}
                aria-expanded={expanded}
                aria-controls={`mms-district-${district.id}`}
                className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-extrabold text-ink-900">
                    {district.name}
                  </span>
                  <span className="block text-[11px] font-semibold text-ink-500">
                    {district.role}
                  </span>
                </span>
                <ArrowRight
                  className={`h-4 w-4 shrink-0 text-brand-600 transition-transform ${
                    expanded ? 'rotate-90' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
              {expanded ? (
                <p
                  id={`mms-district-${district.id}`}
                  className="px-4 pb-4 text-sm leading-relaxed text-ink-600"
                >
                  {district.summary}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop: tab switcher */}
      <div
        role="group"
        aria-label="বিভাগের জেলা বেছে নিন"
        className="mt-7 hidden flex-wrap gap-2 lg:flex"
      >
        {DISTRICTS.map((district) => {
          const selected = district.id === active;
          return (
            <button
              key={district.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setActive(district.id)}
              className={`inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border px-4 text-sm font-extrabold transition-colors ${
                selected
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-brand-200 bg-white text-ink-700 hover:bg-mist-50'
              }`}
            >
              <Sprout
                className={`h-4 w-4 ${selected ? 'text-accent-300' : 'text-brand-600'}`}
                aria-hidden="true"
              />
              {district.name}
            </button>
          );
        })}
      </div>

      {/* Shared detail */}
      <div
        aria-live="polite"
        className="mt-6 grid gap-5 rounded-2xl border border-brand-100 bg-mist-50 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8"
      >
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-700">
            {current.role}
          </p>
          <h3 className="mt-1.5 text-xl font-extrabold text-ink-900">{current.name}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{current.summary}</p>

          <dl className="mt-4 flex flex-wrap gap-2">
            {current.facts.map((fact) => (
              <div
                key={fact.label}
                className="rounded-lg border border-brand-200 bg-white px-3 py-2"
              >
                <dt className="text-[10px] font-bold uppercase tracking-wide text-ink-500">
                  {fact.label}
                </dt>
                <dd className="text-[13px] font-extrabold text-brand-800">{fact.value}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 space-y-2">
            {current.highlights.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink-700">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ArchivePhoto
            src={current.src}
            alt={current.alt}
            slotNote={current.slotNote}
            className="aspect-[4/3] w-full rounded-2xl"
            sizes="(max-width: 1023px) 100vw, 34vw"
          />
          <p className="mt-2.5 text-center text-sm font-extrabold text-white">
            {current.name}
          </p>
        </div>
      </div>
    </CitySection>
  );
}
