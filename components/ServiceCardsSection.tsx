'use client';

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Sparkles,
  Zap,
  Wrench,
  Truck,
  GraduationCap,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { LAUNCH_SERVICES, ServiceCategory } from '@/lib/services-data';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Sparkles,
  Zap,
  Wrench,
  Truck,
  GraduationCap,
  HeartHandshake,
};

export default function ServiceCardsSection() {
  return (
    <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="max-w-2xl mx-auto text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            প্রয়োজনীয় সেবাসমূহ
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            ময়মনসিংহ সিটি কর্পোরেশনের যে কোনো এলাকার জন্য সহজে সার্ভিস নির্বাচন করুন
          </p>
        </div>

        {/* 7 Cohesive Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {LAUNCH_SERVICES.map((service, index) => {
            const Icon = ICON_MAP[service.iconName] || Home;
            const isTolet = service.id === 'tolet';
            const isBlood = service.id === 'blood-donor';

            return (
              <Link
                key={service.id}
                href={`/${service.slug}`}
                className={`group relative flex flex-col justify-between p-5 sm:p-6 bg-white rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                  isTolet
                    ? 'border-emerald-700/30 ring-1 ring-emerald-600/10 sm:col-span-2 lg:col-span-2 xl:col-span-1'
                    : isBlood
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Badge & Icon Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        isBlood
                          ? 'bg-rose-50 text-rose-700 group-hover:bg-rose-100'
                          : isTolet
                          ? 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
                          : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {service.tagBadge && (
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          isBlood
                            ? 'bg-rose-100 text-rose-800'
                            : isTolet
                            ? 'bg-emerald-100 text-emerald-900 font-semibold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {service.tagBadge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {service.nameBn}
                  </h3>

                  {/* Short Bengali Description */}
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {service.shortDesc}
                  </p>
                </div>

                {/* Card Footer: Management model indicator & Action Link */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-500 font-normal">
                    {service.categoryType === 'admin_managed'
                      ? 'অ্যাডমিন পরিচালিত'
                      : service.categoryType === 'user_profile'
                      ? 'ভেরিফাইড প্রোফাইল'
                      : 'স্বেচ্ছাসেবী নেটওয়ার্ক'}
                  </span>

                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                    <span>দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
