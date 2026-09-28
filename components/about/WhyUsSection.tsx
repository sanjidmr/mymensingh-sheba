import { Layers, MapPin, Search, ShieldCheck, Smartphone } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';

const REASONS = [
  {
    icon: MapPin,
    title: 'স্থানীয়ভাবে তৈরি',
    text: 'জাতীয় বা বাইরের কোনো ছকের চেষ্টা নয় — ময়মনসিংহের মানুষের প্রয়োজনকে সামনে রেখেই পুরো প্ল্যাটফর্মটি সাজানো।',
  },
  {
    icon: Smartphone,
    title: 'সহজ ব্যবহার',
    text: 'যেকোনো বয়সের মানুষ সহজে ব্যবহার করতে পারেন — সাধারণ বাংলায়, সরল ধাপে, বাড়তি কারিগরি জ্ঞান ছাড়াই।',
  },
  {
    icon: Layers,
    title: 'প্রয়োজনীয় সেবা এক জায়গায়',
    text: 'বাসা থেকে ইলেক্ট্রিশিয়ান, গৃহশিক্ষক থেকে রক্তদাতা — দৈনন্দিন জীবনের ভিন্ন ভিন্ন সেবা একই জায়গায়।',
  },
  {
    icon: Search,
    title: 'সহজে খুঁজে পাওয়া',
    text: 'সেবা, এলাকা ও অন্যান্য তথ্য দেখে সঠিক প্রয়োজনের দিকে এগোনো যায়, হোঁচাবেচি কম।',
  },
  {
    icon: ShieldCheck,
    title: 'বিশ্বাস ও দায়িত্বশীলতা',
    text: 'সঠিক তথ্য, স্বচ্ছ উপস্থাপন এবং দায়িত্বশীল সেবা অভিজ্ঞতার উপর আমাদের সবচেয়ে বেশি নজর।',
  },
];

/**
 * WhyUsSection — "কেন Mymensingh Sheba?"
 *
 * Deliberately not five identical cards: a short editorial intro sits beside a
 * numbered, hairline-divided list so the page keeps a varied rhythm.
 */
export default function WhyUsSection() {
  return (
    <AboutSection labelledBy="about-why-heading" className="border-y border-brand-100 bg-mist-100">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <Reveal>
          <SectionLabel>কেন Mymensingh Sheba?</SectionLabel>
          <h2
            id="about-why-heading"
            className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
          >
            সহজ, স্থানীয় এবং উত্তরদায়িত্বপূর্ণ
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
            শহরের মানুষ যখন সঠিক তথ্য ও সঠিক মানুষের কাছে পৌঁছাতে পারে, তখনই একটি
            সেবা প্ল্যাটফর্ম আসল কাজে দেয়।
          </p>
        </Reveal>

        <ol className="divide-y divide-brand-200 border-t border-brand-200">
          {REASONS.map((reason, index) => {
            const Icon = reason.icon;
            return (
              <Reveal
                as="li"
                key={reason.title}
                delay={index * 60}
                className="flex gap-4 py-4 sm:gap-5 sm:py-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-ink-900">
                    <span className="mr-2 text-xs font-bold text-accent-700">
                      {['০১', '০২', '০৩', '০৪', '০৫'][index]}
                    </span>
                    {reason.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    {reason.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </AboutSection>
  );
}
