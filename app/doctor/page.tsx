import { Suspense } from 'react';
import type { Metadata } from 'next';
import DoctorEmergency from './DoctorEmergency';
import { EMERGENCY_UI } from '@/lib/catalog-types';

const ui = EMERGENCY_UI.doctor;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description:
    'ময়মনসিংহের চিকিৎসক, ডায়াগনস্টিক সেন্টার ও হাসপাতালের তালিকা। এলাকা অথবা প্রতিষ্ঠানের নাম লিখে খুঁজুন এবং সরাসরি যোগাযোগ নম্বর দেখুন।',
  alternates: { canonical: '/doctor' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description:
      'ময়মনসিংহের অ্যাডমিন-যাচাইকৃত চিকিৎসা সেবার তালিকা ও সরাসরি যোগাযোগ নম্বর।',
    url: '/doctor',
    type: 'website',
  },
};

export default function DoctorPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <DoctorEmergency />
    </Suspense>
  );
}
