'use client';

import React from 'react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { ShieldCheck, Lock, Eye, AlertTriangle } from 'lucide-react';

export default function SafetyPage() {
  return (
    <RoutePlaceholderShell
      title="নিরাপত্তা, গোপনীয়তা ও প্ল্যাটফর্ম নীতি"
      subtitle="Mymensingh Sheba-তে ব্যবহারকারীদের ব্যক্তিগত তথ্য সুরক্ষা ও নিরাপদ লেনদেনের অঙ্গীকার।"
      categoryBadge="নিরাপত্তা নীতি"
      breadcrumbs={[{ label: 'নিরাপত্তা' }]}
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-6 max-w-4xl mx-auto text-slate-700 text-sm sm:text-base leading-relaxed">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-200">
          <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">১. ব্যক্তিগত মোবাইল নম্বরের সুরক্ষা</h3>
            <p className="text-xs sm:text-sm text-emerald-900 mt-1">
              বাসা মালিকদের ফোন নম্বর কখনই ওয়েবসাইটে উন্মুক্ত রাখা হয় না; গ্রাহকের রিকোয়েস্ট নিশ্চিতকরণ ও উভয় পক্ষের সম্মতির মাধ্যমেই যোগাযোগ করিয়ে দেওয়া হয়। রক্তদাতার ক্ষেত্রে নম্বর কোথাও লেখা হিসেবে দেখানো হয় না — অনুমোদিত রক্তদাতার কার্ডে সরাসরি কল করা যায়।
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">২. স্বচ্ছ ভাড়া ও প্ল্যাটফর্ম ফি নীতি</h3>
          <p className="text-slate-600 text-sm">
            বাসা ভাড়ার প্রতিটি বিজ্ঞাপনে মূল ভাড়ার সাথে নির্ধারিত প্ল্যাটফর্ম ফি স্বচ্ছভাবে আলাদা করে দেখানো হয়। কোনো ধরনের গোপন কমিশন বা অপ্রত্যাশিত চার্জ গ্রাহকের উপর চাপানো হয় না।
          </p>

          <h3 className="text-lg font-bold text-slate-900">৩. রক্তদান নীতিমালা</h3>
          <p className="text-slate-600 text-sm">
            রক্তদান সম্পূর্ণ মানবিক ও নিঃস্বার্থ সেবা। আমাদের প্ল্যাটফর্মে রক্ত কেনাবেচা সংক্রান্ত কোনো কার্যক্রম সহ্য করা হয় না। অনুমোদিত রক্তদাতার কার্ড থেকে নির্ধারিত যোগাযোগ নম্বরে সরাসরি কল করা যায়।
          </p>

          <h3 className="text-lg font-bold text-slate-900">৪. স্থানীয় সীমা</h3>
          <p className="text-slate-600 text-sm">
            আমাদের সকল সার্ভিস কেবলমাত্র ময়মনসিংহ সিটি কর্পোরেশন সীমানার ভেতরে সীমাবদ্ধ। এর বাইরের কোনো এলাকা অন্তর্ভুক্ত করা হয় না।
          </p>
        </div>
      </div>
    </RoutePlaceholderShell>
  );
}
