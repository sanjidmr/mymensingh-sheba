import { Suspense } from 'react';
import type { Metadata } from 'next';
import AmbulanceEmergency from './AmbulanceEmergency';
import { EMERGENCY_UI } from '@/lib/catalog-types';

const ui = EMERGENCY_UI.ambulance;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description:
    'ময়মনসিংহে রোগী পরিবহন সেবা দেওয়া প্রতিষ্ঠানের তালিকা। এলাকা বা সেবার নাম লিখে খুঁজে সরাসরি কল করুন।',
  alternates: { canonical: '/ambulance' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: 'ময়মনসিংহের অ্যাডমিন-যাচাইকৃত অ্যাম্বুলেন্স সেবার তালিকা ও নম্বর।',
    url: '/ambulance',
    type: 'website',
  },
};

export default function AmbulancePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <AmbulanceEmergency />
    </Suspense>
  );
}
