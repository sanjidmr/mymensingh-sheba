import { Suspense } from 'react';
import type { Metadata } from 'next';
import FireEmergency from './FireEmergency';
import { EMERGENCY_UI } from '@/lib/catalog-types';

const ui = EMERGENCY_UI.fire_service;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description:
    'ময়মনসিংহের ফায়ার ইউনিট ও অগ্নিনির্বাপণ সেবার তালিকা। নিকটস্থ ইউনিট খুঁজে ফোন নম্বর সংরক্ষণ করুন।',
  alternates: { canonical: '/fire-service' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: 'ময়মনসিংহের অ্যাডমিন-যাচাইকৃত ফায়ার সার্ভিস তালিকা ও নম্বর।',
    url: '/fire-service',
    type: 'website',
  },
};

export default function FireServicePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <FireEmergency />
    </Suspense>
  );
}
