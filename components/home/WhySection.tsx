'use client';

import { ShieldCheck, Users, Search, HeartHandshake, BadgeCheck, CandlestickChart } from 'lucide-react';
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
    text: 'ময়মনসিংহ সিটির ৩৩টি ওয়ার্ডের এলাকা, বাজেট ও প্রয়োজন অনুযায়ী আগে-থেকে ফিল্টার করে সহজে বেছে নিন।',
  },
  {
    icon: HeartHandshake,
    title: 'জরুরি রক্তদান, সম্পূর্ণ বিনামূল্যে',
    text: 'রক্তদান একটি মানবিক সেবা — পুরো প্রক্রিয়ায় কোনো ফি বা লেনদেন নেই, সংগঠিত হয় শুধুমাত্র মানবতার জন্য।',
  },
  {
    icon: ShieldCheck,
    title: 'গোপনীয়তা ও তথ্য সুরক্ষা',
    text: 'আপনার ব্যক্তিগত তথ্য আইনগতভাবে সুরক্ষিত; অপ্রয়োজনে কোনো তথ্য প্রকাশ বা বিক্রয় করা হয় না।',
  },
  {
    icon: CandlestickChart,
    title: 'কোনো গোপন চার্জ নেই',
    text: 'সেবার কোনো লুকানো ফি নেই — মালিক/সেবাদাতার সঙ্গে যোগাযোগ সম্পূর্ণ সরাসরি ও স্বচ্ছ।',
  },
];

const STATS = [
  { value: '৩৩', unit: 'টি', label: 'সিটির ওয়ার্ডজুড়ে সেবা', sub: 'ময়মনসিংহ সিটি কর্পোরেশন' },
  { value: '১০০+', unit: '', label: 'তালিকাভুক্ত বাসা ও প্রোফাইল', sub: 'বিভিন্ন এলাকায়' },
  { value: '৬', unit: 'টি', label: 'প্রধান সেবা বিভাগ', sub: 'নিয়মিতভাবে সম্প্রসারণ' },
  { value: '২৪/৭', unit: '', label: 'জরুরি রক্তদান সেবা', sub: 'অ্যাডমিন সহায়তায়' },
];

export default function WhySection() {
  return (
    <section id="about" className="scroll-mt-24 bg-white py-9 sm:py-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" aria-hidden="true" />
              কেন Mymensingh Sheba?
            </span>
            <h2 className="mt-1.5 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">
              নিছক তালিকা নয় — আস্থা ও যাচাই-কর্মীর নিশ্চয়তা
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 sm:text-[15px]">
              প্রতিটি প্রোফাইল ও বাসা-বিজ্ঞাপন অ্যাডমিন দল যাচাই করার পরই প্রকাশ পায়। ফলে আপনি যা দেখছেন,
              তা নির্ভরযোগ্য।
            </p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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

        {/* Stats strip */}
        <Reveal delay={120}>
          <div className="mt-8 grid grid-cols-2 gap-3 rounded-2xl border border-brand-100 bg-white p-5 sm:gap-4 sm:p-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center lg:px-4">
                <p className="text-[26px] font-extrabold tracking-tight text-brand-800 sm:text-4xl">
                  {stat.value}
                  {stat.unit && <span className="ml-0.5 text-lg font-bold text-brand-600">{stat.unit}</span>}
                </p>
                <p className="mt-1 text-[13px] font-bold text-ink-900 sm:text-sm">{stat.label}</p>
                <p className="mt-0.5 hidden text-xs text-ink-500 sm:block">{stat.sub}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}