'use client';

import Link from 'next/link';
import { HeartHandshake, ArrowRight } from 'lucide-react';
import Reveal from '@/components/home/Reveal';

export default function FinalCtaSection() {
  return (
    <section className="bg-mist-50 pb-14 pt-2 sm:pb-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-brand-800 px-6 py-12 text-center sm:px-12 sm:py-16">
            <div className="mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-600 bg-brand-700 px-4 py-1.5 text-xs font-semibold text-accent-300">
                <HeartHandshake className="h-4 w-4" />
                জরুরি রক্তদান সম্পূর্ণ বিনামূল্যে
              </span>
              <h2 className="mt-5 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                আজই খুঁজে নিন আপনার প্রয়োজনীয় সেবা
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 sm:text-[15px]">
                সেবা নিতে চান, নাকি সেবাদাতা হিসেবে যুক্ত হতে চান? দুটোই সম্ভব — কয়েকটি ধাপে শুরু করুন।
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/services"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-6 py-3 text-sm font-bold text-brand-800 transition-all hover:bg-accent-500 active:scale-[0.98] sm:w-auto"
                >
                  সেবা খুঁজুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-transparent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
                >
                  সেবাদাতা হিসেবে যুক্ত হন
                </Link>
              </div>

              <p className="mt-5 text-xs text-white/70">
                যে-কোনো প্রশ্নে অ্যাডমিন টিম প্রস্তুত — যোগাযোগ করতে ভিজিট করুন আমাদের{' '}
                <Link href="/contact" className="font-semibold text-accent-300 underline underline-offset-4 hover:text-accent-200">
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