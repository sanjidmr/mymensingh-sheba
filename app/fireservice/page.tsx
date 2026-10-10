import { Suspense } from 'react';
import type { Metadata } from 'next';
import FireEmergency from '@/app/fire-service/FireEmergency';
import { EMERGENCY_UI } from '@/lib/catalog-types';

const ui = EMERGENCY_UI.fire_service;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description: 'ময়মনসিংহের ফায়ার সার্ভিস ও উদ্ধার ইউনিটের যাচাইকৃত যোগাযোগের তালিকা।',
  alternates: { canonical: '/fireservice' },
};

export default function FireServiceAliasPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <FireEmergency />
    </Suspense>
  );
}
