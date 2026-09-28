'use client';

import { ShieldCheck, Users, Search, BadgeCheck, HeartHandshake, MapPin, Layers, Sparkles, Star } from 'lucide-react';
import Reveal from '@/components/home/Reveal';

const WHY_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'অ্যাডমিন-যাচাইকৃত প্রোফাইল',
    text: 'প্রত্যেক সেবাদাতা ও গৃহকর্মীর প্রোফাইল প্রকাশের আগে অ্যাডমিন টিম যাচাই করে। কোনো ফলস বা ভুয়া প্রোফাইল না।',
  },
  {
    icon: Users,
    title: 'যাচাইয়ের মাধ্যমে নিরাপদ যোগাযোগ',
    text: 'ব্যক্তিগত নম্বর সবার সামনে প্রকাশ করা হয় না — অসুবিধাজনক কল ও হয়রানি প্রতিরোধে নিরাপদ ব্যবস্থা।',
  },
  {
    icon: Search,
    title: 'এলাকা-ভিত্তিক সূক্ষ্ম খোঁজ',
    text: 'ময়মনসিংহ সিটি কর্পোরেশন এলাকার ভেতরে এলাকা, বাজেট ও প্রয়োজন অনুযায়ী আগে-থেকে ফিল্টার করে সহজে বেছে নিন।',
  },
  {
    icon: HeartHandshake,
    title: 'জরুরি রক্তদান সহায়তা',
    text: 'জরুরি প্রয়োজনে স্বেচ্ছাসেবী রক্তদাতার সাথে দ্রুত ও নিরাপদ সমন্বয় — নাম ও ঠিকানা সম্পূর্ণ গোপন থাকে।',
  },
  {
    icon: ShieldCheck,
    title: 'গোপনীয়তা ও তথ্য সুরক্ষা',
    text: 'আপনার ব্যক্তিগত তথ্য আইনগতভাবে সুরক্ষিত; অপ্রয়োজনে কোনো তথ্য প্রকাশ বা বিক্রয় করা হয় না।',
  },
  {
    icon: Sparkles,
    title: '১০০% বিশ্বস্ত',
    text: 'স্বচ্ছ নীতিমালা, অ্যাডমিন যাচাই ও ব্যবহারকারীদের রিভিউ — তাই প্রতিটি প্রোফাইলে আস্থা রাখতে পারেন।',
  },
];

const POINTS = [
  {
    icon: MapPin,
    title: 'ময়মনসিংহ সিটি কর্পোরেশন এলাকার ভেতরে',
    text: 'লোকাল সেবা, লোকাল মানুষের জন্য',
  },
  {
    icon: Layers,
    title: 'বিভিন্ন এলাকায়',
    text: 'ওয়ার্ডভিত্তিক তালিকা ও সেবাদাতা',
  },
];

/**
 * WhySection — "কেন Mymensingh Sheba?" ভিত্তিক চারটি যুক্তি + তিনটি পয়েন্ট
 * এবং একটি "আপনার রিভিউ দিন" কার্ড (রিভিউ মোডাল খোলে)।
 */
export default function WhySection() {
  return (
    <section id="about" className="scroll-mt-24 bg-white py-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-600 sm:text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
              কেন Mymensingh Sheba?
            </span>
            <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
              নিছক তালিকা নয় — আস্থা ও যাচাই-কর্মীর নিশ্চয়তা
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-[15px]">
              প্রতিটি প্রোফাইল ও বিজ্ঞাপন অ্যাডমিন দল যাচাই করার পরই প্রকাশ পায়। ফলে আপনি যা দেখছেন,
              তা নির্ভরযোগ্য।
            </p>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {WHY_ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <div className="group h-full rounded-2xl border border-brand-100 bg-mist-50/50 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-lg hover:shadow-brand-900/5 sm:p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm transition-colors group-hover:bg-brand-800 sm:h-11 sm:w-11">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-ink-900">{item.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Points + review invite */}
        <Reveal delay={120}>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {POINTS.map((point) => (
              <div
                key={point.title}
                className="flex h-full flex-col rounded-2xl border border-brand-100 bg-white p-4 sm:p-5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:h-11 sm:w-11">
                  <point.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold leading-snug text-ink-900">
                  {point.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{point.text}</p>
              </div>
            ))}

            {/* Review — opens the shared review modal */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('mms:open-review'))}
              className="group flex h-full flex-col rounded-2xl border border-accent-400/70 bg-accent-400/10 p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:bg-accent-400/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-400 text-brand-900 shadow-sm sm:h-11 sm:w-11">
                <Star className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-[15px] font-bold text-ink-900">আপনার রিভিউ দিন</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                কোন সেবা নিয়েছেন, অভিজ্ঞতা কেমন — সবার জানান।
              </p>
              <span className="mt-auto pt-3 text-xs font-bold text-brand-800">
                রিভিউ ফর্ম খুলুন
              </span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
