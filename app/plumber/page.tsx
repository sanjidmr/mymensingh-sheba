import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
const RequestServicePage = dynamic(() => import('@/components/directory/RequestServicePage'));
import { PLUMBING_SERVICE_TYPES } from '@/lib/filter-definitions';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';

export const metadata: Metadata = {
  title: 'Plumber (প্লাম্বার) — Mymensingh Sheba',
  description:
    'ময়মনসিংহে পাইপ লিক, মোটর-পাম্প, বাথরুমের স্যানিটারি ও ড্রেন পরিষ্কারের অনুরোধ পাঠান।',
};

export default function PlumberPage() {
  const ui = STAFF_SERVICE_UI.plumber;
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center text-sm text-ink-500">
          Plumber সার্ভিস লোড হচ্ছে…
        </div>
      }
    >
      <RequestServicePage
        serviceSlug="plumber"
        title={ui.heroTitle}
        subtitle={ui.heroSubtitle}
        breadcrumbs={[{ label: 'Plumber' }]}
        serviceTypes={PLUMBING_SERVICE_TYPES.filter((o) => o.id !== 'all')}
        serviceTypesLabel="প্লাম্বিং সমস্যার ধরন"
        placeholder={ui.supportsSearchPlaceholder}
        placeholderDetails="লিক কোথায়, কতদিন ধরে, পানি চাপ কেমন — ছবি দিলে দ্রুত বুঝতে পারে"
        showPhoto
        highlights={['যাচাই করা মíst্রি', 'ছবিসহ অনুরোধ', 'জরুরি সেবা']}
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
