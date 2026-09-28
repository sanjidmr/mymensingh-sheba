import { Boxes, Globe, Search, ShieldCheck, UserCheck } from 'lucide-react';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel } from './AboutSectionBits';

const VISION_ITEMS = [
  {
    icon: Boxes,
    title: 'আরও সেবা ক্যাটাগরি',
    text: 'শহরের মানুষের প্রয়োজন অনুযায়ী ক্যাটাগরি আরও সমৃদ্ধ করা।',
  },
  {
    icon: Search,
    title: 'আরও সহজ খোঁজার পদ্ধতি',
    text: 'এলাকা, সেবা ও সময় অনুযায়ী দ্রুত ও সহজ সার্চ।',
  },
  {
    icon: UserCheck,
    title: 'সেবাদাতাদের জন্য ভালো অভিজ্ঞতা',
    text: 'যারা সেবা দেন, তাদের জন্য পোস্ট ও অনুরোধ ব্যবস্থাপনা উন্নত করা।',
  },
  {
    icon: ShieldCheck,
    title: 'উন্নত যাচাই ও মান ব্যবস্থা',
    text: 'ধাপে ধাপে যাচাই ও মান নিশ্চিত করার ব্যবস্থা কঠোর করা।',
  },
  {
    icon: Globe,
    title: 'স্থানীয় ডিজিটাল ইকোসিস্টেমে অবদান',
    text: 'ময়মনসিংহের ছোট ব্যবসা ও মানুষকে ডিজিটাল সুযোগের সাথে যুক্ত করা।',
  },
];

/**
 * MissionVisionSection — the two statements that explain direction.
 *
 * Mission is a dark, high-whitespace statement; Vision is a light editorial
 * list of where the platform wants to go next.
 */
export default function MissionVisionSection() {
  return (
    <>
      <AboutSection labelledBy="about-mission-heading" className="bg-brand-950">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionLabel tone="dark">আমাদের মিশন</SectionLabel>
          </div>
          <h2
            id="about-mission-heading"
            className="mt-4 text-xl font-extrabold leading-[1.35] tracking-tight text-white sm:text-2xl lg:text-[2rem]"
          >
            ময়মনসিংহের মানুষের প্রয়োজনীয় স্থানীয় সেবাকে আরও সহজ, দ্রুত এবং
            accessible করে তোলা।
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-brand-100/80">
            শহরের যে কেউ যেন তার প্রয়োজনের সেবা খুঁজতে বারবার ছুঁতে না হয় — একটি
            পরিষ্কার, নির্ভরযোগ্য ও সহজবোধ্য জায়গা থেকেই সবকিছু শুরু হোক।
          </p>
        </Reveal>
      </AboutSection>

      <AboutSection labelledBy="about-vision-heading" className="bg-white">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal>
            <SectionLabel>আমাদের ভিশন</SectionLabel>
            <h2
              id="about-vision-heading"
              className="mt-3 text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
            >
              ময়মনসিংহের দৈনন্দিন প্রয়োজনের জন্য একটি বিশ্বস্ত ডিজিটাল ঠিকানা
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-600">
              ভবিষ্যতে আমরা যে দিকে যেতে চাই —
            </p>
          </Reveal>

          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {VISION_ITEMS.map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal
                  as="li"
                  key={item.title}
                  delay={index * 60}
                  className="border-t border-brand-200 pt-4"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="mt-2.5 text-[15px] font-extrabold text-ink-900">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {item.text}
                  </p>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </AboutSection>
    </>
  );
}
