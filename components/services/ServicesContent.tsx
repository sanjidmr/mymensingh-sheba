'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, MapPin, PhoneCall, Search } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import CommunityBandSection from '@/components/services/CommunityBandSection';
import { getAllMCCAreas } from '@/lib/locations';
import type { ServiceCategory } from '@/lib/services-data';

/**
 * The public services directory.
 *
 * `services` arrives already merged with the admin's overrides from the server
 * component in `app/services/page.tsx`, so this component stays a pure
 * presentational client component: it filters and renders, and never has to
 * know that an admin panel exists.
 */
export default function ServicesContent({ services }: { services: ServiceCategory[] }) {
  const searchParams = useSearchParams();
  const initialArea = searchParams.get('area') || '';
  const initialQuery = searchParams.get('q') || '';
  const [selectedArea, setSelectedArea] = useState<string>(initialArea);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

  const mccAreas = getAllMCCAreas();

  const filteredServices = services.filter((service) => {
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
      title="সেবা সমূহ"
      subtitle="বাসা ভাড়া থেকে জরুরি সেবা — ময়মনসিংহের প্রয়োজনীয় সব সেবা এক জায়গায়।"
      categoryBadge="সেবা ক্যাটাগরি"
      breadcrumbs={[{ label: 'সেবা সমূহ' }]}
      compact
    >
      {/* Filter & Search Bar */}
      <div className="mb-8 rounded-2xl border border-brand-100/90 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7">
            <label className="mb-1 block text-xs font-semibold text-ink-700">
              কী খুঁজছেন?
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="যেমন: বাসা ভাড়া, ইলেকট্রিশিয়ান, ডাক্তার, চাকরি, বাস টিকিট..."
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
                <option value="">ময়মনসিংহ সিটি কর্পোরেশনের সব এলাকা</option>
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
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {filteredServices.map((service) => {
          const href = selectedArea
            ? `/${service.slug}?area=${selectedArea}`
            : `/${service.slug}`;

          const cardClass =
            'group flex h-full flex-col overflow-hidden rounded-lg border border-brand-100/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:rounded-xl';

          const media = (
            <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-mist-100 sm:aspect-square">
              {service.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.coverImage}
                  alt={service.nameBn}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-mist-50">
                  <span className="select-none text-3xl font-black leading-none text-brand-100/90 transition-transform duration-500 group-hover:scale-110 sm:text-5xl">
                    {service.nameBn.charAt(0)}
                  </span>
                </div>
              )}
              {service.tagBadge && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center rounded bg-white/90 px-1 py-px text-[9px] font-bold text-brand-800 ring-1 ring-brand-100 sm:left-2.5 sm:top-2.5 sm:rounded-md sm:px-2 sm:py-0.5 sm:text-[10px]">
                  {service.tagBadge}
                </span>
              )}
            </div>
          );

          return service.dial ? (
            <a key={service.id} href={service.dial} className={cardClass}>
              {media}
              <div className="flex flex-1 flex-col p-1.5 sm:p-3">
                <h3 className="line-clamp-2 text-[10.5px] font-bold leading-tight text-ink-900 sm:line-clamp-1 sm:text-[13px] sm:leading-snug">
                  {service.nameBn}
                </h3>
                <p className="mt-0.5 hidden line-clamp-2 text-[11px] leading-relaxed text-ink-500 sm:mt-1 sm:block">
                  {service.shortDesc}
                </p>
                <div className="mt-auto flex pt-1.5 sm:pt-2">
                  <span className="inline-flex w-full items-center justify-center gap-0.5 rounded-md bg-accent-400 px-1 py-1 text-[9.5px] font-bold text-brand-900 transition-colors duration-300 group-hover:bg-accent-500 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs">
                    <PhoneCall className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                    কল করুন
                    {service.number ? (
                      <>
                        <span className="hidden sm:inline"> {service.number}</span>
                        <span className="sm:hidden"> {service.number?.replace(/\D/g, '').slice(-3)}</span>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            </a>
          ) : (
            <Link key={service.id} href={href} className={cardClass}>
              {media}
              <div className="flex flex-1 flex-col p-1.5 sm:p-3">
                <h3 className="line-clamp-2 text-[10.5px] font-bold leading-tight text-ink-900 sm:line-clamp-1 sm:text-[13px] sm:leading-snug">
                  {service.nameBn}
                </h3>
                <p className="mt-0.5 hidden line-clamp-2 text-[11px] leading-relaxed text-ink-500 sm:mt-1 sm:block">
                  {service.shortDesc}
                </p>
                <div className="mt-auto flex pt-1.5 sm:pt-2">
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700 transition-colors duration-300 group-hover:text-brand-800 sm:gap-1 sm:text-xs">
                    বিস্তারিত দেখুন
                    <ArrowRight className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5 sm:h-3.5 sm:w-3.5" />
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