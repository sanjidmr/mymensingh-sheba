'use client';

import React from 'react';
import {
  ShieldCheck,
  MapPin,
  Eye,
  Send,
  Lock,
  PhoneOff,
} from 'lucide-react';

export default function TrustSection() {
  const trustPoints = [
    {
      icon: ShieldCheck,
      title: 'ভেরিফাইড প্রোফাইল',
      description:
        'বাসা মালিক, গৃহশিক্ষক ও সেবা প্রদানকারীদের প্রয়োজনীয় জাতীয় পরিচয়পত্র বা মৌলিক তথ্য যাচাই করে প্রোফাইল অনুমোদন করা হয়।',
    },
    {
      icon: Eye,
      title: 'স্বচ্ছ তথ্য ও সঠিক ভাড়া',
      description:
        'কোনো অস্পষ্ট চার্জ নেই। বাসা ভাড়া, কাজের ধরন ও প্ল্যাটফর্ম ফি আগে থেকেই স্পষ্টভাবে উল্লেখ থাকে।',
    },
    {
      icon: MapPin,
      title: 'শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন',
      description:
        'আমরা বাইরের কোনো অবাস্তব সার্ভিস দেখাই না। ময়মনসিংহ সিটি কর্পোরেশনের নিবন্ধিত এলাকা ও ওয়ার্ডের স্থানীয় চাহিদার জন্যই এটি তৈরি।',
    },
    {
      icon: Send,
      title: 'সহজ অনুরোধ প্রক্রিয়া',
      description:
        'অপ্রয়োজনীয় ফোন কল বা দালালের ঝামেলা ছাড়া সরাসরি প্ল্যাটফর্ম থেকে রিকোয়েস্ট পাঠান ও স্ট্যাটাস ট্র্যাক করুন।',
    },
    {
      icon: Lock,
      title: 'গোপনীয়তা ও নিরাপত্তা',
      description:
        'আপনার কিংবা রক্তদাতার ব্যক্তিগত মোবাইল নম্বর উন্মুক্ত থাকে না। রিকোয়েস্ট যাচাই ও সম্মতি সাপেক্ষেই যোগাযোগ স্থাপিত হয়।',
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-slate-50/80 border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <span className="text-emerald-800 font-semibold text-xs sm:text-sm tracking-wide uppercase">
            আমাদের দৃষ্টিভঙ্গি
          </span>
          <h2 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            ময়মনসিংহের মানুষের জন্য নিরাপদ ও নির্ভরযোগ্য সেবা
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            ময়মনসিংহে বাসা খোঁজা বা বিশ্বস্ত টেকনিশিয়ান পাওয়া প্রায়ই ঝামেলাপূর্ণ হয়। Mymensingh Sheba-র লক্ষ্য হলো সুস্পষ্ট তথ্য, গোপনীয়তা সুরক্ষা ও সহজ সমন্বয়ের মাধ্যমে নাগরিক জীবনকে একটু সহজ করা।
          </p>
        </div>

        {/* 5 Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}

          {/* Local Community Note */}
          <div className="bg-emerald-800 text-white p-6 rounded-2xl border border-emerald-700 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-white/10 text-emerald-200 flex items-center justify-center mb-4">
                <PhoneOff className="w-5 h-5 text-emerald-300" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                স্প্যাম ও হয়রানিমুক্ত অভিজ্ঞতা
              </h3>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                পাবলিক ফোরামে নম্বর ছড়ালে নানা অবাঞ্ছিত কল আসে। আমরা সরাসরি সিস্টেমে রিকোয়েস্ট তৈরি করে নিরাপদ যোগাযোগ নিশ্চিত করি।
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-xs text-emerald-200 font-medium">
              সততা ও স্থানীয় সেবাই আমাদের অঙ্গীকার
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
