'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Search } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import CommunityBandSection from '@/components/services/CommunityBandSection';
import { getAllMCCAreas } from '@/lib/locations';
import type { ServiceCategory } from '@/lib/services-data';

const EMERGENCY_ROUTES: Record<string, string> = {
  doctor: '/doctors',
  police: '/police',
  ambulance: '/ambulance',
  'fire-service': '/fireservice',
};

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
                    {area.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid — same compact card size as the homepage */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {filteredServices.map((service) => {
          const route = EMERGENCY_ROUTES[service.slug] ?? `/${service.slug}`;
          const href = selectedArea ? `${route}?area=${selectedArea}` : route;

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

            </div>
          );

          return (
            <Link key={service.id} href={href} className={cardClass}>
              {media}
              <div className="flex flex-1 flex-col p-2 sm:p-3">
                <h3 className="line-clamp-2 break-words text-[13px] font-bold leading-snug text-ink-900 sm:line-clamp-1 sm:text-[13px]">
                  {service.nameBn}
                </h3>
                <p className="mt-1 line-clamp-2 break-words text-[11.5px] leading-relaxed text-ink-500 sm:mt-1 sm:block sm:text-[11px]">
                  {service.shortDesc}
                </p>
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