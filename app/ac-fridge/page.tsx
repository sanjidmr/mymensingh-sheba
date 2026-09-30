import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
const RequestServicePage = dynamic(() => import('@/components/directory/RequestServicePage'));

export const metadata: Metadata = {
  title: 'এসি ও ফ্রিজ সার্ভিসিং — Mymensingh Sheba',
  description:
    'ময়মনসিংহে এসি সার্ভিসিং, গ্যাস চার্জ, ফ্রিজ মেরামত ও ইনস্টলেশনের অনুরোধ পাঠান। ইউনিটের ছবি দিলে সমস্যা আগেই বোঝা যায়।',
};

const AC_SERVICE_TYPES = [
  { id: 'ac_servicing', labelBn: 'এসি সার্ভিসিং' },
  { id: 'ac_gas_charge', labelBn: 'গ্যাস চার্জিং' },
  { id: 'ac_not_cooling', labelBn: 'ঠান্ডা হয় না' },
  { id: 'ac_water_leak', labelBn: 'পানি পড়ে' },
  { id: 'ac_installation', labelBn: 'নতুন ইনস্টল' },
  { id: 'fridge_repair', labelBn: 'ফ্রিজ মেরামত' },
  { id: 'fridge_gas_charge', labelBn: 'ফ্রিজ গ্যাস চার্জ' },
  { id: 'deep_clean', labelBn: 'ডিপ ক্লিনিং' },
];

// The page reads URL filters through useSearchParams, which Next requires to sit
// inside a Suspense boundary or prerendering fails.
const REQUEST_FALLBACK = (
  <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
    <div className="rounded-xl border border-brand-100 bg-white p-6">
      <p className="text-sm text-ink-500">লোড হচ্ছে…</p>
    </div>
  </div>
);

export default function AcFridgePage() {
  return (
    <Suspense fallback={REQUEST_FALLBACK}>
    <RequestServicePage
      serviceSlug="ac-fridge"
      title="এসি ও ফ্রিজ সার্ভিসিং"
      subtitle="এসি সার্ভিসিং, গ্যাস চার্জ, ইনস্টলেশন ও ফ্রিজ মেরামতের অনুরোধ পাঠান। ইউনিটের ছবি ও সমস্যার বিবরণ দিলে দাম আগেই অনুমান করা হয়।"
      breadcrumbs={[{ label: 'এসি ও ফ্রিজ' }]}
      serviceTypes={AC_SERVICE_TYPES}
      serviceTypesLabel="কাজের ধরন"
      placeholder="এসি, ফ্রিজ, ঠান্ডা করা নয়, গ্যাস, ইনস্টল — লিখে খুঁজুন…"
      placeholderDetails="ব্র্যান্ড ও মডেল, কত বছরের, কোন তোয়গা, ইউনিট কোন ফ্লোরে"
      showPhoto
      highlights={['ছবিসহ অনুরোধ', 'দাম আগে জানানো হবে', 'ব্র্যান্ড সার্ভিস']}
      points={[
        'এসির কোন ধরন (উইন্ডো, স্প্লিট, ক্যাসেট) সেটিও লিখে দিন — দাম আলাদা।',
        'গ্যাস চার্জের ক্ষেত্রে ইউনিটের ছবি খুব সাহায্য করে।',
        'সার্ভিসিংয়ের পর গ্যাস ও বিদ্যুৎ ব্যবহারের পরামর্শও দেওয়া হয়।',
        'কোনো অতিরিক্ত যন্ত্রাংশ বদলালে আগে খরচ জানানো হয়।',
      ]}
    />
    </Suspense>
  );
}
