'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, MapPin, PhoneCall, Search } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import CommunityBandSection from '@/components/services/CommunityBandSection';
import { LAUNCH_SERVICES } from '@/lib/services-data';
import { getAllMCCAreas } from '@/lib/locations';

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
      compact
    >
      {/* Filter & Search Bar */}
      <div className="mb-8 rounded-2xl border border-brand-100/90 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label className="mb-1 block text-xs font-semibold text-ink-700">
              সার্ভিস খুঁজুন:
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="যেমন: বাসা ভাড়া, কাজের বুয়া, প্লাম্বার..."
                className="w-full rounded-xl border border-brand-100 bg-mist-50 py-2.5 pl-10 pr-4 text-sm text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="mb-1 block text-xs font-semibold text-ink-700">
              এলাকা নির্বাচন:
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full appearance-none rounded-xl border border-brand-100 bg-mist-50 py-2.5 pl-10 pr-8 text-sm text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">সম্পূর্ণ ময়মনসিংহ সিটি কর্পোরেশন</option>
                {mccAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nameBn} (ওয়ার্ড {area.wardNo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid — same compact card size as the homepage */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {filteredServices.map((service) => {
          const href = selectedArea
            ? `/${service.slug}?area=${selectedArea}`
            : `/${service.slug}`;

          const cardClass =
            'group flex h-full flex-col overflow-hidden rounded-xl border border-brand-100/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

          const media = (
            <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-mist-100">
              {service.coverImage ? (
                <img
                  src={service.coverImage}
                  alt={service.nameBn}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist-50">
                  <span className="select-none text-5xl font-black leading-none text-brand-100/90 transition-transform duration-500 group-hover:scale-110">
                    {service.nameBn.charAt(0)}
                  </span>
                </div>
              )}
              {service.tagBadge && (
                <span className="absolute left-2.5 top-2.5 inline-flex items-center rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold text-brand-800 ring-1 ring-brand-100">
                  {service.tagBadge}
                </span>
              )}
            </div>
          );

          return service.dial ? (
            <a key={service.id} href={service.dial} className={cardClass}>
              {media}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-1 text-[13px] font-bold leading-snug text-ink-900">
                  {service.nameBn}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-500">
                  {service.shortDesc}
                </p>
                <div className="mt-auto flex pt-2">
                  <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-400 px-3 py-1.5 text-xs font-bold text-brand-900 transition-colors duration-300 group-hover:bg-accent-500">
                    <PhoneCall className="h-3.5 w-3.5" />
                    কল করুন
                    {service.number ? ` ${service.number}` : ''}
                  </span>
                </div>
              </div>
            </a>
          ) : (
            <Link key={service.id} href={href} className={cardClass}>
              {media}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="line-clamp-1 text-[13px] font-bold leading-snug text-ink-900">
                  {service.nameBn}
                </h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-500">
                  {service.shortDesc}
                </p>
                <div className="mt-auto flex pt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 transition-colors duration-300 group-hover:text-brand-800">
                    প্রবেশ করুন
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Community band — before footer, unique to the services directory */}
      <CommunityBandSection />
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