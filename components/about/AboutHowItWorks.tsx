import { CheckCircle2, ClipboardList, PhoneCall, Search } from 'lucide-react';
import Link from 'next/link';
import Reveal from '@/components/home/Reveal';
import { AboutSection, SectionLabel, LIGHT_FOCUS } from './AboutSectionBits';

const STEPS = [
  {
    icon: Search,
    title: 'আপনার প্রয়োজন খুঁজুন',
    text: 'কী লাগবে জানা নেই? সেবা, এলাকা বা কাজের ধরন লিখে খুঁজুন — অথবা সব সেবা ঘুরে দেখুন।',
  },
  {
    icon: ClipboardList,
    title: 'সঠিক সেবা ও তথ্য দেখুন',
    text: 'প্রতিটি প্রোফাইলে কী কাজ হয়, কোন এলাকায়, কী তথ্য আছে — সবকিছু আগে দেখে নিন।',
  },
  {
    icon: PhoneCall,
    title: 'যোগাযোগ করুন',
    text: 'কার্ড থেকেই অনুরোধ পাঠান। সরাসরি ফোন নম্বর প্রকাশ না করে নিরাপদ অনুরোধ প্রক্রিয়া ব্যবহার করুন।',
  },
  {
    icon: CheckCircle2,
    title: 'আপনার প্রয়োজনীয় সেবা নিন',
    text: 'সময়মতো কাজ সম্পন্ন হলে রিভিউ দিন — এতে পরের মানুষটি সহজেই সঠিক মানুষ খুঁজে পায়।',
  },
];

/**
 * AboutHowItWorks — four steps.
 *
 * Two genuinely different layouts: a vertical rail with numbered nodes on
 * mobile (no horizontal scrolling), and a four-column editorial track on
 * desktop with a hairline connector.
 */
export default function AboutHowItWorks() {
  return (
    <AboutSection labelledBy="about-how-heading" className="border-y border-brand-100 bg-mist-50">
      <Reveal>
        <SectionLabel>কীভাবে কাজ করে</SectionLabel>
        <h2
          id="about-how-heading"
          className="mt-3 max-w-2xl text-2xl font-extrabold leading-snug tracking-tight text-ink-900 sm:text-3xl"
        >
          চারটি সহজ ধাপে প্রয়োজন থেকে সেবা
        </h2>
      </Reveal>

      {/* Mobile / tablet — vertical rail */}
      <ol className="mt-7 space-y-1 sm:max-w-2xl lg:hidden">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === STEPS.length - 1;
          return (
            <li key={step.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-extrabold text-white">
                  {index + 1}
                </span>
                {!isLast && (
                  <span aria-hidden="true" className="my-1 w-px flex-1 bg-brand-200" />
                )}
              </div>
              <div className={`min-w-0 ${isLast ? 'pb-0' : 'pb-6'}`}>
                <h3 className="flex items-center gap-2 text-base font-extrabold text-ink-900">
                  <Icon className="h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Desktop — four-column track */}
      <ol className="mt-8 hidden lg:grid lg:grid-cols-4 lg:gap-8">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="border-t-2 border-brand-200 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-accent-700">
                  {['০১', '০২', '০৩', '০৪'][index]}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-3 text-base font-extrabold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{step.text}</p>
            </li>
          );
        })}
      </ol>

      <Reveal delay={80} className="mt-8">
        <Link
          href="/how-it-works"
          className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
        >
          বিস্তারিত জানুন
        </Link>
      </Reveal>
    </AboutSection>
  );
}
