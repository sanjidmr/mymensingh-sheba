import type { Metadata } from 'next';
import { Suspense } from 'react';
import DirectoryPageClient from '@/components/directory/DirectoryPageClient';
import { KAJER_BUA_WORK_TYPES, KAJER_BUA_TIME_SLOTS } from '@/lib/filter-definitions';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';

export const metadata: Metadata = {
  title: 'কাজের বুয়া (গৃহকর্মী) — Mymensingh Sheba',
  description:
    'ময়মনসিংহে অ্যাডমিন-যাচাইকৃত কাজের বুয়া ও গৃহকর্মী খুঁজুন। এলাকা, কাজের ধরন ও সময় অনুযায়ী ফিল্টার করুন।',
};

// The controller reads filter state from the URL, which Next requires to sit
// inside a Suspense boundary or prerendering fails.
const DIRECTORY_FALLBACK = (
  <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
    <div className="rounded-xl border border-brand-100 bg-white p-6">
      <p className="text-sm text-ink-500">লোড হচ্ছে…</p>
    </div>
  </div>
);

export default function KajerBuaPage() {
  return (
    <Suspense fallback={DIRECTORY_FALLBACK}>
    <DirectoryPageClient
      serviceKey="kajer-bua"
      title={STAFF_SERVICE_UI['kajer-bua'].heroTitle}
      subtitle={STAFF_SERVICE_UI['kajer-bua'].heroSubtitle}
      breadcrumbs={[{ label: 'কাজের বুয়া' }]}
      placeholder={STAFF_SERVICE_UI['kajer-bua'].supportsSearchPlaceholder}
      workTypes={KAJER_BUA_WORK_TYPES.filter((o) => o.id !== 'all')}
      timeSlots={KAJER_BUA_TIME_SLOTS.filter((o) => o.id !== 'all')}
      variant="profile"
      imageless
      highlights={['অ্যাডমিন পরিচালিত', 'ফোন নম্বর গোপন', 'সরাসরি অনুরোধ']}
    />
    </Suspense>
  );
}
