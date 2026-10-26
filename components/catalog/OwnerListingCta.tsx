'use client';

/**
 * OwnerListingCta — the "add your own listing" callout on the coaching / wifi
 * directories.
 *
 * A signed-in provider is sent straight to the create form; a signed-out
 * visitor is sent to /login with a `next` that returns them here-to-there, the
 * same pattern the marketplace browser uses. The link target is computed from
 * the session rather than shown to everyone, so a signed-out reader never lands
 * on a dashboard route that only bounces them back.
 */
import React from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import type { CustomerServiceCategory } from '@/lib/catalog-types';

const LABEL: Record<CustomerServiceCategory, string> = {
  coaching: 'কোচিং সেন্টার',
  wifi: 'WiFi / ইন্টারনেট',
};

export default function OwnerListingCta({ category }: { category: CustomerServiceCategory }) {
  const { user } = useAuth();
  const createHref = `/dashboard/${category}/new`;
  const href = user ? createHref : `/login?next=${encodeURIComponent(createHref)}`;

  return (
    <Link
      href={href}
      aria-label={`${LABEL[category]} প্রতিষ্ঠান যোগ করুন`}
      className={`inline-flex min-h-10 w-full items-center justify-center gap-1 rounded-lg border border-brand-200 bg-white px-2 text-[11px] font-extrabold text-brand-800 transition-colors hover:bg-brand-50 sm:min-h-[42px] sm:w-auto sm:px-3 sm:text-xs ${LIGHT_FOCUS}`}
    >
      <PlusCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      প্রতিষ্ঠান যোগ করুন
    </Link>
  );
}
