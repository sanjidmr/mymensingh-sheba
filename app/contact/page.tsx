'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <RoutePlaceholderShell
      title="যোগাযোগ ও ফিডব্যাক"
      subtitle="ময়মনসিংহ সেবা প্ল্যাটফর্ম সম্পর্কে যেকোনো পরামর্শ, অভিযোগ বা সহায়তার জন্য আমাদের টিমের সাথে যোগাযোগ করুন।"
      categoryBadge="সহায়তা"
      breadcrumbs={[{ label: 'যোগাযোগ' }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <h3 className="text-xl font-bold text-slate-900">স্থানীয় সাপোর্ট অফিস</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            ময়মনসিংহ সিটি কর্পোরেশনের যে কোনো এলাকার নাগরিক ও সার্ভিস পার্টনারদের জন্য আমাদের সাপোর্ট টিম সক্রিয়।
          </p>

          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <span>গাঙ্গিনারপাড় ও টাউন হল সংলগ্ন, ময়মনসিংহ সিটি কর্পোরেশন।</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>support@mymensinghsheba.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>সকাল ৯:০০ - রাত ৯:০০ (সপ্তাহের ৭ দিন)</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-2">বার্তা বা মতামত পাঠান</h3>
          {submitted ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto mb-2" />
              <div className="font-bold text-base">বার্তা সফলভাবে পাঠানো হয়েছে!</div>
              <p className="text-sm text-emerald-800 mt-1">আমাদের প্রতিনিধি দ্রুত আপনার সাথে যোগাযোগ করবে।</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার নাম:</label>
                <input required placeholder="আপনার পূর্ণ নাম" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর:</label>
                <input required placeholder="01XXXXXXXXX" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার বার্তা বা অনুসন্ধান:</label>
                <textarea rows={4} required placeholder="বিস্তারিত লিখুন..." className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm" />
              </div>
              <button type="submit" className="py-2.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm flex items-center gap-2">
                <Send className="w-4 h-4" />
                <span>বার্তা পাঠান</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </RoutePlaceholderShell>
  );
}
