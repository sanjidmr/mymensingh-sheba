import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { ELECTRICIAN_SERVICE_TYPES } from '@/lib/filter-definitions';

export const metadata: Metadata = {
  title: 'Electrician (ইলেক্ট্রিশিয়ান) — Mymensingh Sheba',
  description:
    'ময়মনসিংহে শর্ট সার্কিট, ফ্যান-লাইট, ওয়্যারিং ও সুইচবোর্ড মেরামতের জন্য অনুরোধ পাঠান। ছবি দিয়ে অনুরোধ দিলে দ্রুত সমাধান হয়।',
};

const RequestServicePage = dynamic(() => import('@/components/directory/RequestServicePage'));

// The page reads URL filters through useSearchParams, which Next requires to sit
// inside a Suspense boundary or prerendering fails.
const REQUEST_FALLBACK = (
  <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
    <div className="rounded-xl border border-brand-100 bg-white p-6">
      <p className="text-sm text-ink-500">লোড হচ্ছে…</p>
    </div>
  </div>
);

export default function ElectricianPage() {
  const ui = STAFF_SERVICE_UI.electrician;
  return (
    <Suspense fallback={REQUEST_FALLBACK}>
    <RequestServicePage
      serviceSlug="electrician"
      title={ui.heroTitle}
      subtitle={ui.heroSubtitle}
      breadcrumbs={[{ label: 'Electrician' }]}
      serviceTypes={ELECTRICIAN_SERVICE_TYPES.filter((o) => o.id !== 'all')}
      serviceTypesLabel="কাজ / সমস্যার ধরন"
      placeholder={ui.supportsSearchPlaceholder}
      placeholderDetails="কোন রুমে সমস্যা, কতদিন ধরে, সুইচবোর্ডে গন্ধ বা গরম লাগে কি না"
      showPhoto
      highlights={['যাচাই করা টেকনিশিয়ান', 'ছবিসহ অনুরোধ', 'দাম আগে জানানো হবে']}
      points={[
        'অনুরোধ পাঠানোর পর অ্যাডমিন আপনার নম্বরে কল করে সমস্যা বুঝে নেয়।',
        'কাজের দাম ঠিক করার আগে কোনো টাকা নেওয়া হয় না।',
        'জরুরি সমস্যা হলে ফর্মে “জরুরি” বেছে নিন — বাকি প্রক্রিয়া দ্রুত হয়।',
        'প্রতিটি কাজ শেষে আপনার সম্মতি নিয়ে বিল করা হয়।',
      ]}
    />
    </Suspense>
  );
}