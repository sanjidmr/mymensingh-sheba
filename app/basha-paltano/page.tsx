import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
const RequestServicePage = dynamic(() => import('@/components/directory/RequestServicePage'));
import Link from 'next/link';
import { ChevronRight, Truck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'বাসা পাল্টানো (House Moving) — Mymensingh Sheba',
  description:
    'ময়মনসিংহে বাসা পাল্টানো, ফার্নিচার ও মালামাল ওঠানো-নামানোর অনুরোধ পাঠান। ভাড়ার গাড়ি, লেবার ও প্যাকিং অর্গানাইজড।',
};

const MOVING_SERVICE_TYPES = [
  { id: 'full_move', labelBn: 'পুরো বাসা পাল্টানো' },
  { id: 'small_items', labelBn: 'অল্প মালামাল' },
  { id: 'furniture_only', labelBn: 'শুধু ফার্নিচার' },
  { id: 'pickup_only', labelBn: 'শুধু ওঠানো' },
  { id: 'loading', labelBn: 'লোডিং সহায়তা' },
  { id: 'storage', labelBn: 'স্টোরেজ' },
];

export default function BashaPaltanoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center text-sm text-ink-500">
          বাসা পাল্টানো সার্ভিস লোড হচ্ছে…
        </div>
      }
    >
      <RequestServicePage
        serviceSlug="basha-paltano"
        title="বাসা পাল্টানো"
        subtitle="গাড়ি থেকে ফার্নিচার বস্তু সব নিরাপদে ওঠানো-নামানো — ভাড়ার গাড়ি, লেবার ও প্যাকিং একসাথে অর্গানাইজ করা হয়।"
        breadcrumbs={[{ label: 'বাসা পাল্টানো' }]}
        serviceTypes={MOVING_SERVICE_TYPES}
        serviceTypesLabel="সেবার ধরন"
        placeholder="কোন এলাকা থেকে কোন এলাকায়, কী কী আছে, কত ফ্লোর…"
        placeholderDetails="প্রায় কতগুলো ফার্নিচার, কোনগুলো ভাঙা লাগবে, নতুন ঠিকানায় লিফট আছে কি না"
        showPhoto
        highlights={['ভাড়ার গাড়ি সাপ্লাই', 'লেবার সাপ্লাই', 'ফার্নিচার ভাঙা-জোড়া']}
        points={[
          'ওঠানোর আগে ফ্লোর, লিফট ও ভবনের প্রবেশপথের ধাপের সংখ্যা জানালে সঠিক লেবার ও দাম হিসাব হয়।',
          'বাসার দেওয়ানার অনুমতি নেওয়ার দায়িত্ব আপনার — আমরা লিখিত অনুমতি নিয়ে কাজ করি।',
          'কাচের ফ্রিজ, আয়না বা ভারী যন্ত্রাংশের জন্য আগে থেকে জানালে বাড়তি সতর্কতা নেওয়া হয়।',
          'কাজ শেষে পুরোনো ঠিকানা পরিষ্কার করা হয়।',
        ]}
      />
    </Suspense>
  );
}
