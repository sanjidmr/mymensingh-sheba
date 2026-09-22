'use client';

import React from 'react';
import { Search, MapPin, FileCheck2, CheckCircle2 } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'সেবা খুঁজুন',
      desc: 'বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক বা রক্তদাতা থেকে আপনার কাঙ্ক্ষিত সেবাটি নির্বাচন করুন।',
      icon: Search,
    },
    {
      number: '02',
      title: 'আপনার এলাকা বেছে নিন',
      desc: 'ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ড ও স্থানীয় এলাকাগুলোর মধ্যে আপনি যেখানে সেবা চান তা বেছে নিন।',
      icon: MapPin,
    },
    {
      number: '03',
      title: 'বিস্তারিত দেখুন / রিকোয়েস্ট করুন',
      desc: 'ভাড়া, সুবিধাসমূহ ও কাজের পরিধি যাচাই করে সরাসরি রিকোয়েস্ট পাঠান। আপনার রিকোয়েস্ট তাৎক্ষণিক সিস্টেমে নথিভুক্ত হবে।',
      icon: FileCheck2,
    },
    {
      number: '04',
      title: 'কাজ সম্পন্ন করুন',
      desc: 'অনুমোদিত ভেরিফায়েড প্রতিনিধি বা সার্ভিসদাতার সাথে নিরাপদ সমন্বয়ে আপনার কাজটি সুচারুভাবে সম্পন্ন করুন।',
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-emerald-800 font-semibold text-xs sm:text-sm tracking-wide uppercase">
            সহজ প্রক্রিয়া
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            কীভাবে কাজ করে ময়মনসিংহ সেবা?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            মাত্র ৪টি সহজ ধাপে আপনার প্রয়োজনীয় সেবা খুঁজে নিন ও বুক করুন
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-slate-50 rounded-2xl p-6 border border-slate-200/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-emerald-800/50 font-mono">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-emerald-800 flex items-center justify-center shadow-2xs">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200/60 text-xs font-medium text-emerald-800 flex items-center gap-1">
                  <span>ধাপ {step.number}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
