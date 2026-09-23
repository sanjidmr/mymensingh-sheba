'use client';

import Link from 'next/link';
import { HeartHandshake, ArrowRight } from 'lucide-react';
import Reveal from '@/components/home/Reveal';

export default function FinalCtaSection() {
  return (
    <section className="bg-white pb-14 sm:pb-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-900 px-6 py-12 text-center shadow-2xl shadow-brand-900/20 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-300/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-emerald-200/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-50 backdrop-blur-sm">
                <HeartHandshake className="h-4 w-4" />
                জরুরি রক্তদান সম্পূর্ণ বিনামূল্যে
              </span>
              <h2 className="mt-5 text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
                আজই খুঁজে নিন আপনার প্রয়োজনীয় সেবা
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-emerald-50/90 sm:text-[15px]">
                সেবা নিতে চান, নাকি সেবাদাতা হিসেবে যুক্ত হতে চান? দুটোই সম্ভব — কয়েকটি ধাপে শুরু করুন।
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/services"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-800 shadow-md transition-transform hover:-translate-y-0.5 sm:w-auto"
                >
                  সেবা খুঁজুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  সেবাদাতা হিসেবে যুক্ত হন
                </Link>
              </div>

              <p className="mt-5 text-xs text-emerald-50/70">
                যে-কোনো প্রশ্নে অ্যাডমিন টিম প্রস্তুত — যোগাযোগ করতে ভিজিট করুন আমাদের{' '}
                <Link href="/contact" className="font-semibold text-white underline underline-offset-4 hover:text-emerald-100">
                  যোগাযোগ পাতায়
                </Link>
                ।
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}