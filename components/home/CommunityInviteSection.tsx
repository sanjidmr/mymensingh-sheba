'use client';

import Link from 'next/link';
import {
  Home,
  GraduationCap,
  HeartHandshake,
  ShoppingBag,
  Briefcase,
  PenLine,
  Newspaper,
  Wrench,
  Store,
  PenSquare,
  MessageCircle,
  Sparkles,
  Megaphone,
  MapPin,
  Layers,
  Plus,
} from 'lucide-react';
import Reveal from '@/components/home/Reveal';

const COMMUNITY_ITEMS = [
  { label: 'বাসা / মেস / হোস্টেল', icon: Home },
  { label: 'গৃহশিক্ষক', icon: GraduationCap },
  { label: 'রক্তদাতা', icon: HeartHandshake },
  { label: 'কেনাবেচা', icon: ShoppingBag },
  { label: 'চাকরি', icon: Briefcase },
  { label: 'কোচিং সেন্টার', icon: PenLine },
  { label: 'স্থানীয় সংবাদ', icon: Newspaper },
  { label: 'স্থানীয় সেবা', icon: Wrench },
  { label: 'ব্যবসা / প্রতিষ্ঠান', icon: Store },
];

const BENEFITS = [
  { icon: Megaphone, label: 'শহরের মানুষের কাছে সরাসরি' },
  { icon: MapPin, label: 'স্থানীয়, আপ-টু-ডেট তথ্য' },
  { icon: Layers, label: 'দরকারি সব সেবা এক জায়গায়' },
];

const tileClasses =
  'flex flex-col items-center justify-center gap-1 rounded-xl border border-brand-100 bg-white px-2 py-2.5 text-center shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-bronze-200/80 hover:bg-mist-50 hover:shadow-sm sm:py-3';

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

      <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-9">
        <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Left — copy + benefits + CTAs */}
          <Reveal className="order-1">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-accent-400" />
                ময়মনসিংহ কমিউনিটির জন্য
              </span>

              <h2
                id="community-heading"
                className="mt-3 text-xl font-extrabold leading-snug tracking-tight text-white sm:text-2xl lg:text-3xl"
              >
                আপনার সেবা, আপনার তথ্য —{' '}
                <span className="relative inline-block text-white">
                  পৌঁছে দিন পুরো ময়মনসিংহে
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent-400"
                  />
                </span>
              </h2>

              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/90 sm:text-sm">
                আপনার কোনো সেবা, ব্যবসা, প্রতিষ্ঠান, প্রয়োজনীয় তথ্য বা সুযোগ
                আছে? Mymensingh Sheba-এর মাধ্যমে সেটি ময়মনসিংহের মানুষের কাছে
                তুলে ধরুন।
              </p>

              {/* Benefit chips */}
              <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
                {BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li
                      key={benefit.label}
                      className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-1.5 shadow-2xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-semibold text-ink-800">
                        {benefit.label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* Friendly community message */}
              <div className="mt-4 max-w-xl rounded-xl border border-white/20 bg-white p-3.5 shadow-2xs sm:p-4">
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-300/25 text-brand-800">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <p className="text-xs leading-relaxed text-ink-800 sm:text-sm">
                    আপনার প্রয়োজনীয় সেবা বা তথ্য এখানে খুঁজে পাওয়ার পাশাপাশি,
                    আপনিও চাইলে আপনার সেবা বা তথ্য অন্যদের কাছে পৌঁছে দিতে
                    পারেন।
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-brand-800 shadow-sm transition-colors duration-150 hover:bg-mist-50 active:scale-[0.98] active:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
                >
                  <PenSquare className="h-4.5 w-4.5 shrink-0" />
                  আপনার তথ্য / সেবা যোগ করুন
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] active:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500"
                >
                  <MessageCircle className="h-4.5 w-4.5 shrink-0" />
                  আমাদের সাথে যোগাযোগ করুন
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Right — community board card */}
          <Reveal delay={120} className="order-2">
            <div className="rounded-xl border border-white/30 bg-white p-4 shadow-sm sm:p-5">
              {/* Board header */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold tracking-tight text-ink-900 sm:text-lg">
                    কমিউনিটি বোর্ড
                  </h3>
                  <p className="mt-0.5 text-[11px] text-ink-600 sm:text-xs">
                    প্রতিদিনের দরকারি ৯টি বিষয় এক নজরে
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-400 px-2.5 py-1 text-[10px] font-bold text-brand-950 sm:text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-950/70" />
                  ৯টি বিষয়
                </span>
              </div>

              {/* Mosaic */}
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-2.5">
                {COMMUNITY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={tileClasses}
                      title={item.label}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 sm:h-9 sm:w-9">
                        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                      </span>
                      <span className="text-[10px] font-semibold leading-tight text-ink-700 sm:text-[11px]">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Board footer link */}
              <div className="mt-4 border-t border-brand-100 pt-3">
                <Link
                  href="/register"
                  className="group inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-mist-50 px-4 py-2 text-[13px] font-bold text-brand-700 transition-colors duration-150 hover:border-brand-300 hover:bg-brand-50"
                >
                  <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90" />
                  আপনার বিষয় যোগ করুন
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}