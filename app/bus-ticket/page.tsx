import { Suspense } from 'react';
import type { Metadata } from 'next';
import BusDirectory from './BusDirectory';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.bus;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description: ui.seoDescription,
  alternates: { canonical: '/bus-ticket' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    url: '/bus-ticket',
    type: 'website',
  },
};

export default function BusTicketPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <BusDirectory />
    </Suspense>
  );
}
