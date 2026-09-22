'use client';

import React from 'react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { ShieldCheck, MapPin, Users, Heart } from 'lucide-react';

export default function AboutPage() {
  return (
    <RoutePlaceholderShell
      title="আমাদের সম্পর্কে — Mymensingh Sheba"
      subtitle="ময়মনসিংহ সিটি কর্পোরেশন এলাকার নাগরিকদের জন্য স্থানীয়, নির্ভরযোগ্য ও স্বচ্ছ সেবা প্ল্যাটফর্ম।"
      categoryBadge="আমাদের সম্পর্কে"
      breadcrumbs={[{ label: 'আমাদের সম্পর্কে' }]}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
            ময়মনসিংহের স্থানীয় প্রয়োজন মেটাতে আমাদের প্রয়াস
          </h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            Mymensingh Sheba কোনো বহিরাগত বা জাতীয় পর্যায়ের জটিল মার্কেটপ্লেস নয়; এটি সম্পূর্ণ ময়মনসিংহ শহরের স্থানীয় বাস্তবতাকে কেন্দ্র করে গড়ে তোলা একটি প্ল্যাটফর্ম। শহরের চরপাড়া, সানকিপাড়া, কাঁচিঝুলি, গাঙ্গিনারপাড় কিংবা নতুন বাজারে বাসা খোঁজা, গৃহকর্মী পাওয়া কিংবা জরুরি রক্তদাতা সমন্বয়ের ভোগান্তি দূর করাই আমাদের উদ্দেশ্য।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
            <MapPin className="w-6 h-6 text-emerald-700 mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">১০০% স্থানীয় কেন্দ্রিক</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ডে আমাদের সেবার পরিধি সীমাবদ্ধ। কোনো অস্পষ্ট বা বাইরের এলাকা নেই।
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-6 h-6 text-emerald-700 mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">গোপনীয়তা ও নিরাপত্তা</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              পাবলিক ফোরামে ব্যক্তিগত ফোন নম্বর ছড়িয়ে হয়রানি নয়। স্বচ্ছ রিকোয়েস্ট সিস্টেমের মাধ্যমে নিরাপদ সংযোগ।
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
            <Heart className="w-6 h-6 text-rose-600 mb-3" />
            <h3 className="font-bold text-slate-900 mb-1">মানবিক রক্ত নেটওয়ার্ক</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              মেডিকেল ও শহরের রোগীদের প্রয়োজনে স্বেচ্ছাসেবী রক্তদাতাদের সাথে দ্রুত ও নিরাপদ সমন্বয়। রক্ত কেনাবেচা সম্পূর্ণ নিষিদ্ধ।
            </p>
          </div>
        </div>
      </div>
    </RoutePlaceholderShell>
  );
}
