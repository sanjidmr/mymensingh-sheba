'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LayoutGrid, Search } from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import CategoryTile from '@/components/home/CategoryTile';
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

          return (
            <CategoryTile
              key={service.id}
              compact
              item={{
                id: service.id,
                name: service.nameBn,
                text: service.shortDesc,
                href,
                image: service.coverImage,
                cta: 'দেখুন',
                icon: LayoutGrid,
              }}
            />
          );
        })}
      </div>

      {/* Community band — before footer, unique to the services directory */}
      <CommunityBandSection />
    </RoutePlaceholderShell>
  );
}