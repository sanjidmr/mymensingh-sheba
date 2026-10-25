'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import CommunityBandSection from '@/components/services/CommunityBandSection';
import type { ServiceCategory } from '@/lib/services-data';

const EMERGENCY_ROUTES: Record<string, string> = {
  doctor: '/doctors',
  police: '/police',
  ambulance: '/ambulance',
  'fire-service': '/fireservice',
};

/**
 * Community categories whose catalog slug is not their route.
 *
 * `buysell` is the catalog id but the public listing page is `/buy-sell`;
 * without this map the tile linked to `/buysell` and 404'd. Jobs and news are
 * kept explicit too, so each tile opens the directory that queries ONLY its own
 * post kind instead of the mixed `/posts` feed.
 */
const COMMUNITY_ROUTES: Record<string, string> = {
  buysell: '/buy-sell',
  jobs: '/jobs',
  news: '/news',
  wifi: '/wifi',
  coaching: '/coaching',
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
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);

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
      <div className="mb-5 rounded-xl border border-brand-100 bg-white p-3 shadow-sm sm:mb-8 sm:rounded-2xl sm:p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold text-ink-800">সেবা ক্যাটাগরি</h2>
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">কী খুঁজছেন?</span>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কী খুঁজছেন?"
              className="min-h-10 w-full rounded-lg border border-brand-100 bg-mist-50 py-2 pl-9 pr-3 text-sm text-ink-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {filteredServices.map((service) => {
          const route =
            EMERGENCY_ROUTES[service.slug] ??
            COMMUNITY_ROUTES[service.slug] ??
            `/${service.slug}`;
          const href = route;

          const cardClass =
            'group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-brand-100/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-bronze-300/70 hover:shadow-lg hover:shadow-brand-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:rounded-xl';

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
              <div className="flex flex-1 flex-col p-2.5 sm:p-3">
                <h3 className="line-clamp-2 break-words text-[12px] font-bold leading-snug text-ink-900 sm:line-clamp-1 sm:text-[13px]">
                  {service.nameBn}
                </h3>
                <p className="mt-1 line-clamp-2 break-words text-[10.5px] leading-snug text-ink-500 sm:text-[11px]">
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