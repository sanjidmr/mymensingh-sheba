'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Home,
  Sparkles,
  Zap,
  Wrench,
  Truck,
  GraduationCap,
  HeartHandshake,
  ArrowRight,
  MapPin,
  Search,
} from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { LAUNCH_SERVICES } from '@/lib/services-data';
import { getAllMCCAreas } from '@/lib/locations';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Sparkles,
  Zap,
  Wrench,
  Truck,
  GraduationCap,
  HeartHandshake,
};

function ServicesContent() {
  const searchParams = useSearchParams();
  const initialArea = searchParams.get('area') || '';
  const initialQuery = searchParams.get('q') || '';
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  const mccAreas = getAllMCCAreas();

  const filteredServices = LAUNCH_SERVICES.filter((service) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      service.nameBn.toLowerCase().includes(q) ||
      service.nameEn.toLowerCase().includes(q) ||
      service.shortDesc.toLowerCase().includes(q)
    );
  });

  return (
    <RoutePlaceholderShell
      title="সকল সেবাসমূহ"
      subtitle="ময়মনসিংহ সিটি কর্পোরেশন এলাকার জন্য আমাদের নির্ধারিত সেবা তালিকা থেকে আপনার প্রয়োজনীয় সেবাটি নির্বাচন করুন।"
      categoryBadge="সেবা ক্যাটালগ"
      breadcrumbs={[{ label: 'সেবাসমূহ' }]}
    >
      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              সার্ভিস খুঁজুন:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="যেমন: বাসা ভাড়া, কাজের বুয়া, প্লাম্বার..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
              />
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              এলাকা নির্বাচন:
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white appearance-none"
              >
                <option value="">সম্পূর্ণ ময়মনসিংহ সিটি কর্পোরেশন</option>
                {mccAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nameBn} (ওয়ার্ড {area.wardNo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => {
          const Icon = ICON_MAP[service.iconName] || Home;
          const href = selectedArea
            ? `/${service.slug}?area=${selectedArea}`
            : `/${service.slug}`;

          return (
            <Link
              key={service.id}
              href={href}
              className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-800">
                {service.coverImage && (
                  <img
                    src={service.coverImage}
                    alt={service.nameBn}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
                />
                {service.tagBadge && (
                  <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-accent-400 px-2.5 py-1 text-[11px] font-bold text-brand-900 shadow-sm">
                    {service.tagBadge}
                  </span>
                )}
                <span className="absolute bottom-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white shadow-md">
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist-50 text-brand-700 transition-colors group-hover:bg-brand-700 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink-900 transition-colors group-hover:text-brand-800">
                    {service.nameBn}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink-500">
                  {service.shortDesc}
                </p>

                <div className="mt-5 flex items-center justify-between border-t border-brand-100 pt-4 text-sm">
                  <span className="text-xs font-medium text-ink-500">
                    {service.categoryType === 'admin_managed'
                      ? 'অ্যাডমিন পরিচালিত'
                      : service.categoryType === 'user_profile'
                        ? 'ভেরিফাইড প্রোফাইল'
                        : 'স্বেচ্ছাসেবী'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-brand-700 transition-transform group-hover:translate-x-0.5">
                    <span>প্রবেশ করুন</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </RoutePlaceholderShell>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">লোড হচ্ছে...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
