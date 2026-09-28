'use client';

import Link from 'next/link';
import {
  Megaphone,
  MapPin,
  Layers,
  PenSquare,
  MessageCircle,
  Workflow,
  ArrowRight,
  Star,
} from 'lucide-react';
import Reveal from '@/components/home/Reveal';

const BENEFITS = [
  { icon: Megaphone, label: 'শহরের মানুষের কাছে সরাসরি' },
  { icon: MapPin, label: 'স্থানীয় ও আপ-টু-ডেট তথ্য' },
  { icon: Layers, label: 'দরকারি সব সেবা এক জায়গায়' },
];

/**
 * CommunityInviteSection — "ময়মনসিংহ কমিউনিটির জন্য" ব্যান্ড।
 *
 * একটি পরিষ্কার, কেন্দ্রীভূত সংযোগ-বার্ণ: স্থানীয় পরিচয়, উপকারিতা, তিনটি
 * পথ (তথ্য যোগ · কীভাবে কাজ করে · রিভিউ) এবং একটি ছোট সহায়ক লাইন।
 * আগের "কমিউনিটি বোর্ড" মোজাইক বাদ দেওয়া হয়েছে — এখন একটি কেন্দ্রীভূত,
 * পড়তে-সহজ লেখাই আছে।
 */
export default function CommunityInviteSection() {
  return (
    <section
      id="community"
      aria-labelledby="community-heading"
      className="relative overflow-hidden border-b border-brand-500 bg-brand-500"
    >
      {/* Soft decorative rings — desktop only, pointer-events-none */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 -top-28 hidden lg:block"
      >
        <div className="h-80 w-80 rounded-full bg-white/10" />
        <div className="absolute inset-10 rounded-full border border-white/20" />
        <div className="absolute inset-20 rounded-full border border-white/15" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 hidden h-56 w-56 rounded-full bg-white/10 lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 right-40 hidden h-16 w-16 rotate-12 rounded-xl bg-white/15 ring-1 ring-white/20 lg:block"
      />

      <div className="relative mx-auto w-full max-w-4xl px-4 py-8 text-center sm:px-6 sm:py-10 lg:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-accent-400" />
            ময়মনসিংহ কমিউনিটির জন্য
          </span>

          <h2
            id="community-heading"
            className="mx-auto mt-4 max-w-2xl text-xl font-extrabold leading-snug tracking-tight text-white sm:text-2xl lg:text-3xl"
          >
            আপনার সেবা, আপনার তথ্য —{' '}
            <span className="relative inline-block">
              পৌঁছে দিন পুরো ময়মনসিংহে
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent-400"
              />
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-white/90 sm:text-[15px]">
            ময়মনসিংহ সিটি কর্পোরেশন এলাকার মানুষের জন্য তৈরি এই প্ল্যাটফর্মে আপনার
            প্রয়োজনের সেবাটি খুঁজে নিন, আর আপনার নিজের সেবা বা তথ্য সহজেই সবার সামনে
            তুলে ধরুন — ছোট-বড় সব প্রয়োজনে আমরা পাশে।
          </p>

          {/* উপকারিতা */}
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li
                  key={benefit.label}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-brand-700">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-white">{benefit.label}</span>
                </li>
              );
            })}
          </ul>

          {/* পথ — তথ্য যোগ · কীভাবে কাজ করে · রিভিউ */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-800 shadow-sm transition-colors duration-150 hover:bg-mist-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 sm:w-auto"
            >
              <PenSquare className="h-4 w-4 shrink-0" />
              আপনার তথ্য / সেবা যোগ করুন
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-5 py-2.5 text-sm font-bold text-brand-900 shadow-sm transition-colors duration-150 hover:bg-accent-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 sm:w-auto"
            >
              <Workflow className="h-4 w-4 shrink-0" />
              সেবা নেওয়া ও দেওয়ার উপায় দেখুন
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('mms:open-review'))}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 sm:w-auto"
            >
              <Star className="h-4 w-4 shrink-0" />
              আপনার রিভিউ দিন
            </button>

            <Link
              href="/contact"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              আমাদের সাথে যোগাযোগ
            </Link>
          </div>

          {/* সহায়ক লাইন */}
          <p className="mx-auto mt-5 max-w-2xl text-xs leading-relaxed text-white/85 sm:text-[13px]">
            কোন সেবাগুলো নিজে পোস্ট করা যায়, কোনগুলোর জন্য অ্যাডমিনের সাথে যোগাযোগ করতে
            হয় এবং পুরো প্রক্রিয়াটি কীভাবে — সব বিস্তারিত এক পাতায় সাজানো হয়েছে।
          </p>
        </Reveal>
      </div>
    </section>
  );
}
