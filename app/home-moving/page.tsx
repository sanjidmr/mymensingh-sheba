'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
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
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      {/* Hero CTA */}
      <section className="w-full bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>অ্যাডমিন পরিচালিত শিফটিং সার্ভিস</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4">
            বাসা পাল্টাতে সাহায্য লাগবে?
          </h1>
          <p className="text-sm sm:text-base text-emerald-50/90 max-w-2xl mx-auto leading-relaxed mb-8">
            ময়মনসিংহ সিটির ভেতরে নিরাপদ, ঝামেলাহীন বাসা স্থানান্তর। পিকআপ/ভ্যান, দক্ষ শ্রমিক দল এবং
            সাবধানে মালামাল লোডিং-আনলোডিং — অ্যাডমিন টিম আপনাকে শুরু থেকে শেষ পর্যন্ত গাইড করবে।
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="#moving-request"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-emerald-900 text-sm font-bold shadow-md hover:bg-emerald-50 transition-colors w-full sm:w-auto"
            >
              Moving Request করুন
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors w-full sm:w-auto"
            >
              কীভাবে কাজ করে?
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {[
              { icon: MapPin, text: 'শুধু MCC এলাকার ভেতরে', sub: 'সিটি ভেরিফায়েড রুট' },
              { icon: ShieldCheck, text: 'নিরাপদ পরিচালনা', sub: 'তথ্য গোপন রাখা হয়' },
              { icon: Clock, text: 'নির্ধারিত সময়', sub: 'টাইমলি শিডিউলিং' },
              { icon: Package, text: 'মালামাল সুরক্ষা', sub: 'সতর্ক লোড-আনলোড' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="bg-white/10 border border-white/10 rounded-2xl p-4 text-left backdrop-blur-sm"
                >
                  <Icon className="w-5 h-5 text-emerald-200 mb-2" />
                  <div className="text-xs font-bold leading-tight">{b.text}</div>
                  <div className="text-[10px] text-emerald-100/70 mt-0.5">{b.sub}</div>
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
            ৭টি সহজ ধাপে তথ্য দিন — কোথা থেকে কোথায়, কবে, কী কী মালামাল। আমাদের অ্যাডমিন টিম
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
                desc: 'উপরের ফর্ম ৭ ধাপ পূরণ করুন। নম্বর ও ঠিকানা শুধুমাত্র অ্যাডমিন দেখবে।',
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