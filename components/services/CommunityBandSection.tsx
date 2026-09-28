'use client';

import Link from 'next/link';
import { PenSquare, Workflow, MessageCircle, ArrowRight } from 'lucide-react';

const COMMUNITY_ITEMS = [
  { label: 'পোস্ট করুন', icon: PenSquare, href: '/register' },
  { label: 'কীভাবে কাজ করে', icon: Workflow, href: '/how-it-works' },
  { label: 'যোগাযোগ করুন', icon: MessageCircle, href: '/contact' },
];

/**
 * CommunityBandSection — `/services` ডিরেক্টরির শেষে কমিউনিটি ব্যান্ড।
 *
 * হোমপেজের "আপনার সেবা, আপনার তথ্য" ব্যান্ডের মতোই সবুজ কমিউনিটি ব্যান্ড,
 * তবে একটু ভিন্ন কপি ও লেআউট — কারণ এখানে দর্শক আগে থেকেই সেবার তালিকা দেখেছেন।
 */
export default function CommunityBandSection() {
  return (
    <section
      aria-labelledby="services-community-heading"
      className="mt-6 overflow-hidden rounded-2xl bg-brand-500 px-4 py-7 text-center sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-accent-400" />
          ময়মনসিংহের জন্য
        </span>

        <h2
          id="services-community-heading"
          className="mt-4 text-lg font-extrabold leading-snug text-white sm:text-xl"
        >
          আপনার শহর, আপনার সেবা —{' '}
          <span className="relative inline-block">
            পৌঁছে দিন সবার কাছে
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent-400"
            />
          </span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-white/90 sm:text-sm">
          শহরের বাসিন্দা হিসেবে আপনার কাছে থাকা তথ্য বা দক্ষতা অন্যদের কাজে লাগতে পারে।
          পোস্ট করে সবার সামনে তুলে ধরুন, অথবা যোগাযোগ করে সরাসরি সেবা নিন।
        </p>

        <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
          {COMMUNITY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/60 bg-transparent px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 hover:bg-white/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-500 sm:w-auto"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-brand-700">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
