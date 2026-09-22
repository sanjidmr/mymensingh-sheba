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
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [searchQuery, setSearchQuery] = useState<string>('');

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
              className="group flex flex-col justify-between p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-700/40 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  {service.tagBadge && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-100 text-emerald-900">
                      {service.tagBadge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                  {service.nameBn}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {service.shortDesc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-xs text-slate-500">
                  {service.categoryType === 'admin_managed'
                    ? 'অ্যাডমিন পরিচালিত'
                    : service.categoryType === 'user_profile'
                    ? 'ভেরিফাইড প্রোফাইল'
                    : 'স্বেচ্ছাসেবী'}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 group-hover:translate-x-0.5 transition-transform">
                  <span>প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
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
