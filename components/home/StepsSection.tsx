'use client';

import { ArrowRight, MousePointerClick, PhoneCall, BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import Reveal from '@/components/home/Reveal';

const STEPS = [
  {
    icon: MousePointerClick,
    step: 'ঝুঁজুন',
    title: 'সেবা বেছে নিন',
    text: 'ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা, গৃহশিক্ষক, গৃহকর্মী কিংবা রক্তদাতা — এলাকা ও বাজেট অনুযায়ী প্রোফাইল দেখুন।',
  },
  {
    icon: PhoneCall,
    step: 'অনুরোধ',
    title: 'অনুরোধ জমা দিন',
    text: 'আপনার প্রয়োজন ও সময় জানান। অ্যাডমিন টিম অনুরোধটি যাচাই করে সঠিক সেবাদাতার সঙ্গে সংযুক্ত করে।',
  },
  {
    icon: BadgeCheck,
    step: 'সম্পন্ন',
    title: 'যাচাই-কৃত যোগাযোগ',
    text: 'সরাসরি সেবাদাতার সঙ্গে নিরাপদে যোগাযোগ করুন। গোপন নম্বর ছাড়াই কাজ সম্পন্ন করুন।',
  },
];

/**
 * Useful local information — কিভাবে কাজ করে।
 * Three clear steps with restrained accents and a connecting line on desktop.
 */
export default function StepsSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-b border-brand-100/70 bg-mist-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
            জানার জন্য
          </span>
          <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-3xl">
            সেবা পাওয়া যত সহজ, তিন ধাপেই
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500 sm:text-[15px]">
            জটিল কিছু নয় — খুঁজুন, অনুরোধ জানান, নিরাপদে কাজ সম্পন্ন করুন।
          </p>
        </div>

        <ol className="relative mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {/* Connector (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-9 hidden h-px border-t border-dashed border-brand-200 sm:block"
          />
          {STEPS.map((item, i) => (
            <Reveal key={item.step} delay={i * 80} as="li">
              <div className="relative h-full rounded-xl border border-brand-100 bg-white p-5 transition-shadow duration-300 hover:shadow-md hover:shadow-brand-900/5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 sm:h-14 sm:w-14">
                    <item.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-accent-500">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 text-[15px] font-bold text-ink-900">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal delay={200}>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/services"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-800"
            >
              সেবা সমূহ দেখুন
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-brand-700 px-6 py-3 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50"
            >
              কোন সেবায় পোস্ট করা যায়?
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}