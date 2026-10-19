'use client';

import Link from 'next/link';
import {
  Megaphone,
  MapPin,
  Layers,
  PenSquare,
  MessageCircle,
  Workflow,
  Star,
  Landmark,
  BookOpen,
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
 * একটি পরিষ্কার, কেন্দ্রীভূত সংযোগ-বার্ণ: স্থানীয় পরিচয়, উপকারিতা, চারটি
 * পথ (তথ্য যোগ · উপায় · রিভিউ · যোগাযোগ) এবং ময়মনসিংহ পরিচিতির ছোট
 * কল-আউট। শুধু শেষের পুনরাবৃত্তিমূলক সহায়ক লাইনটি বাদ দেওয়া হয়েছে।
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

      <div className="relative mx-auto w-full max-w-4xl px-4 py-10 text-center max-sm:py-6 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white max-sm:hidden sm:text-xs">
            <span className="h-2 w-2 rounded-full bg-accent-400" />
            ময়মনসিংহ কমিউনিটির জন্য
          </span>

          <h2
            id="community-heading"
            className="mx-auto mt-4 max-w-2xl text-xl font-extrabold leading-snug tracking-tight text-white max-sm:mt-2 sm:text-2xl lg:text-3xl"
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

          <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-white/90 max-sm:mt-2.5 max-sm:text-[12px] sm:text-[15px]">
            ময়মনসিংহ সিটি কর্পোরেশন এলাকার মানুষের জন্য তৈরি এই প্ল্যাটফর্মে আপনার
            প্রয়োজনের সেবাটি খুঁজে নিন, আর আপনার নিজের সেবা বা তথ্য সহজেই সবার সামনে
            তুলে ধরুন — ছোট-বড় সব প্রয়োজনে আমরা পাশে।
          </p>

          {/* উপকারিতা */}
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 max-sm:mt-3 max-sm:gap-1.5 sm:gap-2.5">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <li
                  key={benefit.label}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 max-sm:min-h-9 max-sm:gap-1.5 max-sm:px-2"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-brand-700">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-white max-sm:text-[11px]">{benefit.label}</span>
                </li>
              );
            })}
          </ul>

          {/* পথ — তথ্য যোগ · উপায় · রিভিউ · যোগাযোগ */}
          <div className="mt-6 flex flex-col items-center justify-center gap-2.5 max-sm:mt-4 max-sm:flex-row max-sm:flex-wrap max-sm:gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link
              href="/register"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-800 shadow-sm transition-colors duration-150 hover:bg-mist-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 max-sm:w-[calc(50%-0.25rem)] max-sm:px-2 max-sm:text-xs sm:w-auto"
            >
              <PenSquare className="h-4 w-4 shrink-0" />
              আপনার তথ্য / সেবা যোগ করুন
            </Link>

            <Link
              href="/how-it-works"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-accent-400 px-5 py-2.5 text-sm font-bold text-brand-900 shadow-sm transition-colors duration-150 hover:bg-accent-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 max-sm:w-[calc(50%-0.25rem)] max-sm:px-2 max-sm:text-xs sm:w-auto"
            >
              <Workflow className="h-4 w-4 shrink-0" />
              সেবা নেওয়া ও দেওয়ার উপায় দেখুন
            </Link>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('mms:open-review'))}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 max-sm:w-[calc(50%-0.25rem)] max-sm:px-2 max-sm:text-xs sm:w-auto"
            >
              <Star className="h-4 w-4 shrink-0" />
              আপনার রিভিউ দিন
            </button>

            <Link
              href="/contact"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 max-sm:w-[calc(50%-0.25rem)] max-sm:px-2 max-sm:text-xs sm:w-auto"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              আমাদের সাথে যোগাযোগ
            </Link>
          </div>

          {/* ময়মনসিংহের ইতিহাস — পরিচিতি পেজের কল-আউট */}
          <div className="mx-auto mt-7 max-w-2xl rounded-2xl border border-white/30 bg-white/12 p-4 text-left shadow-lg shadow-brand-900/15 backdrop-blur-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-accent-300 ring-1 ring-white/20 sm:flex">
                <Landmark className="h-6 w-6" />
              </span>

              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-400/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand-900">
                  ইতিহাস · ঐতিহ্য · সংস্কৃতি
                </span>
                <h3 className="mt-2 text-base font-extrabold leading-snug text-white sm:text-lg">
                  ময়মনসিংহের ইতিহাস জানুন
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/85">
                  ষোড়শ শতকের মোমেনশাহী থেকে আজকের চারটি জেলা — নামের উৎপত্তি, ব্রহ্মপুত্রের
                  গল্প, জমিদারি ঐতিহ্য আর মুক্তিযুদ্ধের স্মৃতি এক জায়গায়।
                </p>
              </div>

              <Link
                href="/mymensingh"
                className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 self-stretch rounded-xl bg-brand-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-brand-950/30 ring-1 ring-white/15 transition-all duration-150 hover:bg-brand-800 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 sm:self-center"
              >
                <BookOpen className="h-4 w-4 shrink-0" />
                ময়মনসিংহ পরিচিতি
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
