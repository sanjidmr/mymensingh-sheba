'use client';

import React from 'react';
import Link from 'next/link';
import {
  Heart,
  ShieldCheck,
  FileText,
  Lock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function EmergencyBloodSection() {
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <section className="py-14 sm:py-20 bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 text-white relative overflow-hidden">
      {/* Background glow & subtle motif */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Human Emotional Copy & Privacy Principles */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold mb-4">
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>জরুরি মানবকল্যাণ সেবা</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
              রক্ত দরকার?
            </h2>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed max-w-2xl mb-6">
              হাসপাতালে কোনো স্বজনের হঠাৎ রক্তের প্রয়োজন হলে আমরা ময়মনসিংহের স্বেচ্ছাসেবী রক্তদাতাদের সাথে দ্রুত সমন্বয়ে সহায়তা করি। কোনো বাণিজ্যিক উদ্দেশ্য নয়, সম্পূর্ণ মানবিক উদ্যোগে এই নেটওয়ার্ক পরিচালিত।
            </p>

            {/* Strict Privacy & Humanity Protocol */}
            <div className="space-y-3 mb-8 text-sm text-emerald-100/80">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-semibold">সম্পূর্ণ গোপনীয়তা:</strong> রক্তদাতার ব্যক্তিগত মোবাইল নম্বর উন্মুক্ত করা হয় না। অযাচিত কল বা হয়রানি রোধ করাই আমাদের প্রধান অগ্রাধিকার।
                </span>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-semibold">প্রেসক্রিপশন যাচাই:</strong> রোগীর সঠিক রিকুইজিশন ও হাসপাতাল স্লিপ অ্যাডমিন টিম কর্তৃক নিশ্চিতকরণের পরই কেবল স্বেচ্ছাসেবী রক্তদাতার সাথে যোগাযোগ করিয়ে দেওয়া হয়।
                </span>
              </div>

              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white font-semibold">রক্ত কেনাবেচা নিষিদ্ধ:</strong> রক্ত কোনো পণ্য নয়। রক্ত ক্রয়-বিক্রয় আইনত দণ্ডনীয় এবং আমাদের প্ল্যাটফর্মে কঠোরভাবে নিষিদ্ধ।
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/blood-donor"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-base transition-colors shadow-sm cursor-pointer"
              >
                <Heart className="w-5 h-5 fill-white" />
                <span>রক্তদাতা খুঁজুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/profile/blood-donor/setup"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm sm:text-base transition-colors border border-white/15"
              >
                <span>রক্তদাতা হিসেবে নিবন্ধন করুন</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Blood Group Selector preview & Local Assurance */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-semibold">
                  রক্তের গ্রুপ অনুযায়ী খুঁজুন
                </span>
                <span className="text-xs text-emerald-300">ময়মনসিংহ মেডিকেল ও আশেপাশের এলাকা</span>
              </div>

              {/* Blood group pills */}
              <div className="grid grid-cols-4 gap-2.5 mb-6">
                {bloodGroups.map((grp) => (
                  <Link
                    key={grp}
                    href={`/blood-donor?group=${encodeURIComponent(grp)}`}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/10 hover:bg-rose-600/30 border border-white/10 hover:border-rose-400/50 text-white transition-all text-center group cursor-pointer"
                  >
                    <span className="text-lg font-black tracking-wide text-white group-hover:scale-105 transition-transform">
                      {grp}
                    </span>
                    <span className="text-[10px] text-emerald-200/80">রক্তদাতা</span>
                  </Link>
                ))}
              </div>

              {/* Local Area Medical Context */}
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/10 text-xs text-emerald-100/80 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>জরুরি সহায়তায় সক্রিয় টিম</span>
                </div>
                <p>
                  ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল (MMCH), সিবিএমসিবি (CBMCB) ও শহরের যেকোনো ক্লিনিকের প্রয়োজনে জরুরি রিকুইজিশন জমা দিন।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
