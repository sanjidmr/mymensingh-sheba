import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { PLUMBING_SERVICE_TYPES } from '@/lib/filter-definitions';

export const metadata: Metadata = {
  title: 'Plumber (প্লাম্বার) — Mymensingh Sheba',
  description:
    'ময়মনসিংহে পাইপ লিক, মোটর-পাম্প, বাথরুমের স্যানিটারি ও ড্রেন পরিষ্কারের অনুরোধ পাঠান।',
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

export default function PlumberPage() {
  const ui = STAFF_SERVICE_UI.plumber;
  return (
    <Suspense fallback={REQUEST_FALLBACK}>
    <RequestServicePage
      serviceSlug="plumber"
      title={ui.heroTitle}
      subtitle={ui.heroSubtitle}
      breadcrumbs={[{ label: 'Plumber' }]}
      serviceTypes={PLUMBING_SERVICE_TYPES.filter((o) => o.id !== 'all')}
      serviceTypesLabel="প্লাম্বিং সমস্যার ধরন"
      placeholder={ui.supportsSearchPlaceholder}
      placeholderDetails="লিক কোথায়, কতদিন ধরে, পানি চাপ কেমন — ছবি থাকলে সমস্যাটি বুঝতে সহজ হয়"
      showPhoto
      highlights={['অভিজ্ঞ প্লাম্বার', 'ছবিসহ অনুরোধ', 'জরুরি সেবা']}
      points={[
        'পাইপ লিক বা পাম্প বন্ধ হলে ছবি তুলে রাখুন — অনুরোধে যুক্ত করলে দ্রুত সমাধান হয়।',
        'অ্যাডমিন আগে কারণ ও আনুমানিক দাম জানাবেন, তারপর কাজ শুরু হবে।',
        'জরুরি অবস্থা উল্লেখ করলে প্রাথমিক যাচাইয়ের পর যোগাযোগ করা হয়।',
        'কাজ শেষে লিক টেস্ট করে দেখানো হয়।',
      ]}
    />
    </Suspense>
  );
}