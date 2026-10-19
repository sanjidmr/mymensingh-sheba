'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Clock,
  Package,
  Phone,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MovingRequestWizard from '@/components/home-moving/MovingRequestWizard';

export default function HomeMovingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      {/* Hero CTA */}
      <section className="w-full border-b border-brand-100 bg-white text-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>অ্যাডমিন পরিচালিত শিফটিং সার্ভিস</span>
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight text-slate-900 sm:text-4xl md:text-5xl">
            বাসা পাল্টাতে সাহায্য লাগবে?
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            ময়মনসিংহ সিটির ভেতরে নিরাপদ, ঝামেলাহীন বাসা স্থানান্তর। পিকআপ/ভ্যান, দক্ষ শ্রমিক দল এবং
            সাবধানে মালামাল লোডিং-আনলোডিং — অ্যাডমিন টিম আপনাকে শুরু থেকে শেষ পর্যন্ত গাইড করবে।
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="#moving-request"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-7 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-800 sm:w-auto"
            >
              অনুরোধ ফর্ম পূরণ করুন
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 px-7 py-3.5 text-sm font-semibold text-brand-800 transition-colors hover:bg-brand-50 sm:w-auto"
            >
              কীভাবে কাজ করে?
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: MapPin, text: 'শুধু MCC এলাকার ভেতরে', sub: 'সিটি কর্পোরেশনের মধ্যে' },
              { icon: ShieldCheck, text: 'নিরাপদ পরিচালনা', sub: 'তথ্য গোপন রাখা হয়' },
              { icon: Clock, text: 'নির্ধারিত সময়', sub: 'সময়মতো শিডিউলিং' },
              { icon: Package, text: 'মালামাল সুরক্ষা', sub: 'সতর্ক লোড-আনলোড' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="rounded-2xl border border-brand-100 bg-mist-50 p-4 text-left"
                >
                  <Icon className="mb-2 h-5 w-5 text-brand-600" />
                  <div className="text-xs font-bold leading-tight text-slate-900">{b.text}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">{b.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pb-16">
        {/* Moving Request wizard */}
        <section id="moving-request" className="scroll-mt-24 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              আপনার বাসা পাল্টানোর রিকোয়েস্ট
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            এক পাতার ফর্মে কোথা থেকে কোথায়, কবে এবং কী কী মালামাল—সব তথ্য দিন। আমাদের অ্যাডমিন টিম
            শিফটিং খরচের আনুমানিক হিসাব জানিয়ে সময় চূড়ান্ত করবে।
          </p>
          <MovingRequestWizard />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-24 py-8 border-t border-slate-200">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 text-center">
            কীভাবে কাজ করে?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: Phone,
                title: 'রিকোয়েস্ট পাঠান',
                desc: 'এক পাতার ফর্মে স্থানান্তরের তথ্য দিন। নম্বর ও ঠিকানা শুধু অ্যাডমিন দেখবেন।',
              },
              {
                icon: CheckCircle2,
                title: 'অ্যাডমিন যাচাই',
                desc: 'অ্যাডমিন রিকোয়েস্ট পর্যালোচনা করে ফোনে খরচের আনুমানিক হিসাব ও সময় জানিয়ে দেবেন।',
              },
              {
                icon: Truck,
                title: 'শিফটিং সম্পন্ন',
                desc: 'নির্ধারিত দিনে পিকআপ/ভ্যান ও শ্রমিক দল উপস্থিত হয়ে নিরাপদে মালামাল স্থানান্তর করবে।',
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:border-emerald-700/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">
                    ধাপ {i + 1}: {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}