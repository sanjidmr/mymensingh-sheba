import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, ShoppingBag, Briefcase } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export const metadata: Metadata = {
  title: 'নতুন পোস্ট করুন — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

const SERVICES = [
  { href: '/profile/tolet/new', icon: Home, label: 'বাসা ভাড়া', hint: 'ফ্ল্যাট, রুম, সাবলেট, মেস' },
  { href: '/buy-sell/create', icon: ShoppingBag, label: 'কেনা-বেচা', hint: 'পুরনো বা নতুন পণ্য' },
  { href: '/jobs/create', icon: Briefcase, label: 'চাকরি', hint: 'নিয়োগ বিজ্ঞপ্তি দিন' },
];

export default function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-ink-900">নতুন পোস্ট করুন</h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">কোন ধরনের পোস্ট করতে চান বেছে নিন। প্রতিটি পোস্ট অ্যাডমিন অনুমোদনের পর প্রকাশিত হবে।</p>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SERVICES.map((s, index) => {
          const Icon = s.icon;
          return (
            <li key={s.href}>
              <Link href={s.href} className={`group flex min-h-[92px] items-center gap-3 rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${index === 0 ? 'border-brand-300 bg-brand-50/60 ring-1 ring-brand-100' : 'border-brand-100 hover:border-brand-300'} ${LIGHT_FOCUS}`}>
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${index === 0 ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700'}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-base font-extrabold ${index === 0 ? 'text-brand-800' : 'text-ink-900'}`}>{s.label}</span>
                  <span className="mt-1 block truncate text-xs text-ink-500">{s.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="rounded-xl border border-brand-100 bg-white px-3.5 py-3 text-[12px] leading-relaxed text-ink-500">ভুল তথ্য বা অন্যের ছবি দেবেন না — যাচাইয়ে বাতিল হতে পারে। বাতিল হলে কারণসহ নোটিফিকেশন পাবেন।</p>
    </div>
  );
}
