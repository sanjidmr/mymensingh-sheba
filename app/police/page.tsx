import { Suspense } from 'react';
import type { Metadata } from 'next';
import PoliceEmergency from './PoliceEmergency';
import { EMERGENCY_UI } from '@/lib/catalog-types';

const ui = EMERGENCY_UI.police;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description:
    'ময়মনসিংহের থানা ও নিরাপত্তা সেবার তালিকা। থানার নাম বা এলাকা লিখে খুঁজুন, ঠিকানা ও ফোন নম্বর দেখুন।',
  alternates: { canonical: '/police' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: 'ময়মনসিংহের অ্যাডমিন-যাচাইকৃত থানা ও নিরাপত্তা সেবার তালিকা।',
    url: '/police',
    type: 'website',
  },
};

export default function PolicePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <PoliceEmergency />
    </Suspense>
  );
}
