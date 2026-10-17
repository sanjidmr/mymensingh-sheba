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
import { PlusCircle, Store } from 'lucide-react';
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
    <div className="flex flex-col gap-2 rounded-xl border border-brand-100 bg-mist-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-600">
        <Store className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
        <span>
          আপনার {LABEL[category]} পরিচালনা করেন? নিজেই তথ্য যোগ করুন — অ্যাডমিন
          অনুমোদনের পর এখানে দেখা যাবে।
        </span>
      </p>
      <Link
        href={href}
        className={`inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3.5 text-[12.5px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
      >
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
        প্রতিষ্ঠান যোগ করুন
      </Link>
    </div>
  );
}
