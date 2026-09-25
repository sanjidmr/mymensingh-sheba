'use client';

import { MousePointerClick, PhoneCall, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import Reveal from '@/components/home/Reveal';

const STEPS = [
  {
    icon: MousePointerClick,
    step: '১',
    title: 'সেবা বেছে নিন',
    text: 'ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা, গৃহশিক্ষক, গৃহকর্মী কিংবা রক্তদাতা — এলাকা ও বাজেট অনুযায়ী প্রোফাইল দেখুন।',
  },
  {
    icon: PhoneCall,
    step: '২',
    title: 'অনুরোধ জমা দিন',
    text: 'আপনার প্রয়োজন ও সময় জানান। অ্যাডমিন টিম অনুরোধটি যাচাই করে সঠিক সেবাদাতার সঙ্গে সংযুক্ত করে।',
  },
  {
    icon: BadgeCheck,
    step: '৩',
    title: 'যাচাই-কৃত যোগাযোগ',
    text: 'সরাসরি সেবাদাতার সঙ্গে নিরাপদে যোগাযোগ করুন। গোপন নম্বর ছাড়াই কাজ সম্পন্ন করুন।',
  },
];

export default function StepsSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 bg-mist-50 py-9 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
              কিভাবে কাজ করে
            </span>
            <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
              মাত্র ৩টি ধাপে সেবা বুক করুন
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-[15px]">
              জটিল কিছু নয় — খুঁজুন, অনুরোধ জানান, নিরাপদে কাজ সম্পন্ন করুন।
            </p>
          </div>
        </Reveal>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((item, i) => (
            <Reveal key={item.step} delay={i * 80} as="li">
              <div className="relative h-full rounded-2xl border border-brand-100 bg-white p-5 text-center shadow-sm sm:p-6">
                <span className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-white">
                  {item.step}
                </span>
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 sm:h-14 sm:w-14">
                  <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-ink-900 sm:mt-4">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-800"
            >
              সেবা সমূহ দেখুন
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}