import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, GraduationCap, ShoppingBag, Briefcase, Heart, Newspaper, ArrowRight } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export const metadata: Metadata = {
  title: 'নতুন পোস্ট করুন — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

const SERVICES = [
  { href: '/profile/tolet/new', icon: Home, label: 'বাসা ভাড়া', hint: 'ফ্ল্যাট, রুম, সাবলেট, মেস' },
  { href: '/profile/home-tutor/setup', icon: GraduationCap, label: 'গৃহশিক্ষক', hint: 'টিউশন প্রোফাইল খুলুন' },
  { href: '/buy-sell/create', icon: ShoppingBag, label: 'কেনাবেচা', hint: 'পুরনো বা নতুন পণ্য' },
  { href: '/jobs/create', icon: Briefcase, label: 'চাকরি', hint: 'নিয়োগ বিজ্ঞপ্তি দিন' },
  { href: '/profile/blood-donor/setup', icon: Heart, label: 'রক্তদাতা', hint: 'রক্তদাতা হিসেবে যুক্ত হোন' },
  { href: '/news/create', icon: Newspaper, label: 'সংবাদ', hint: 'স্থানীয় খবর জানান' },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900">নতুন পোস্ট করুন</h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">কোন ধরনের পোস্ট করতে চান বেছে নিন। প্রতিটি পোস্ট অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.href}>
              <Link href={s.href} className={`group flex min-h-[72px] items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3.5 transition-colors hover:border-brand-300 ${LIGHT_FOCUS}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-extrabold text-ink-900">{s.label}</span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-ink-400">{s.hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-brand-300 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="rounded-xl border border-brand-100 bg-white px-3.5 py-3 text-[12px] leading-relaxed text-ink-500">ভুল তথ্য বা অন্যের ছবি দেবেন না — যাচাইয়ে বাতিল হতে পারে। বাতিল হলে কারণসহ নোটিফিকেশন পাবেন।</p>
    </div>
  );
}
