import { Suspense } from 'react';
import type { Metadata } from 'next';
import VehicleDirectory from './VehicleDirectory';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.vehicle;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description: ui.seoDescription,
  alternates: { canonical: '/gari-auto-cng' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    url: '/gari-auto-cng',
    type: 'website',
  },
};

export default function GariAutoCngPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <VehicleDirectory />
    </Suspense>
  );
}
