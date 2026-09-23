'use client';

import Link from 'next/link';
import {
  Home,
  Zap,
  Wrench,
  Sparkles,
  Truck,
  GraduationCap,
  HeartHandshake,
  LayoutGrid,
} from 'lucide-react';
import Reveal from '@/components/home/Reveal';

interface CategoryItem {
  id: string;
  name: string;
  sub: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'tolet', name: 'বাসা ভাড়া (To-Let)', sub: 'আবাসন', href: '/services/toilet', icon: Home },
  { id: 'electrician', name: 'Electrician', sub: 'মেরামত', href: '/services/electrician', icon: Zap },
  { id: 'plumber', name: 'Plumber', sub: 'মেরামত', href: '/services/plumber', icon: Wrench },
  { id: 'maid', name: 'কাজের বুয়া', sub: 'গৃহকর্মী', href: '/services/maid', icon: Sparkles },
  { id: 'home-moving', name: 'বাসা পাল্টানো', sub: 'শিফটিং', href: '/services/home-moving', icon: Truck },
  { id: 'home-tutor', name: 'গৃহশিক্ষক', sub: 'শিক্ষা', href: '/services/tutor', icon: GraduationCap },
  { id: 'blood-donor', name: 'রক্তদাতা', sub: 'জরুরি', href: '/services/blood-donor', icon: HeartHandshake },
];

/**
 * Service category bar directly below the hero.
 * Floating white card that overlaps the hero edge; each category links to its
 * service page (`/services/<slug>` alias → canonical route).
 */
export default function ServiceCategoryBar() {
  return (
    <section aria-label="সেবা বিভাগ" className="relative z-10 -mt-9 px-4 pb-8 sm:-mt-11 sm:px-6 sm:pb-10 lg:px-8">
      <Reveal>
        <div className="mx-auto max-w-7xl rounded-3xl border border-brand-100 bg-white p-4 shadow-2xl shadow-brand-900/10 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <h2 className="inline-flex items-center gap-2 text-sm font-extrabold text-ink-900 sm:text-base">
              <LayoutGrid className="h-4 w-4 text-brand-600" />
              সেবা বিভাগ
            </h2>
            <span className="rounded-full bg-mist-50 px-2.5 py-1 text-[11px] font-semibold text-ink-500">
              {CATEGORIES.length}টি বিভাগ
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-7">
            {CATEGORIES.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-mist-50 hover:shadow-md hover:shadow-brand-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors duration-200 group-hover:bg-brand-700 group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="text-[12px] font-bold leading-tight text-ink-900 sm:text-[13px]">
                  {item.name}
                </span>
                <span className="hidden text-[10px] font-medium text-ink-400 lg:block">
                  {item.sub}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}