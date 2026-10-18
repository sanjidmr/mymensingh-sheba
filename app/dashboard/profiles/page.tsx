import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap, Heart, School, Wifi } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export const metadata: Metadata = {
  title: 'প্রোফাইল ব্যবস্থাপনা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

const PROFILE_LINKS = [
  {
    href: '/profile/home-tutor',
    icon: GraduationCap,
    title: 'গৃহশিক্ষক',
    description: 'আপনার শিক্ষক প্রোফাইল তৈরি, দেখা ও হালনাগাদ করুন।',
    action: 'প্রোফাইল দেখুন বা খুলুন',
  },
  {
    href: '/profile/blood-donor',
    icon: Heart,
    title: 'রক্তদাতা',
    description: 'রক্তদাতা হিসেবে নিবন্ধন করুন বা তথ্য পরিচালনা করুন।',
    action: 'প্রোফাইল দেখুন বা খুলুন',
  },
  {
    href: '/dashboard/wifi/new',
    icon: Wifi,
    title: 'WiFi',
    description: 'আপনার WiFi ইন্টারনেট সেবার তথ্য ও প্যাকেজ জমা দিন।',
    action: 'WiFi তথ্য যোগ করুন',
  },
  {
    href: '/dashboard/coaching/new',
    icon: School,
    title: 'কোচিং সেন্টার',
    description: 'আপনার কোচিং সেন্টারের ঠিকানা ও ফি জমা দিন।',
    action: 'কোচিং তথ্য যোগ করুন',
  },
] as const;

export default function ProfileManagementPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-extrabold text-ink-900">প্রোফাইল ব্যবস্থাপনা</h1>
        <p className="mt-1 text-sm text-ink-500">
          সেবা-প্রোফাইল ও প্রতিষ্ঠানের তালিকা এখানে তৈরি ও পরিচালনা করুন। সাধারণ পোস্ট আলাদা
          <Link href="/dashboard/new" className="ml-1 font-bold text-brand-700 underline">
            নতুন পোস্ট
          </Link>
          পেজে তৈরি হবে।
        </p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {PROFILE_LINKS.map(({ href, icon: Icon, title, description, action }) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex min-h-32 items-start gap-3 rounded-xl border border-brand-100 bg-white p-4 transition-colors hover:border-brand-300 ${LIGHT_FOCUS}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-extrabold text-ink-900">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-500">{description}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
                  {action}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/service-listings"
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-800 ${LIGHT_FOCUS}`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          WiFi ও কোচিং তালিকা পরিচালনা
        </Link>
        <Link
          href="/dashboard/profile"
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-800 ${LIGHT_FOCUS}`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          ব্যক্তিগত তথ্য ও অ্যাকাউন্ট সেটিংস
        </Link>
      </div>
    </div>
  );
}
