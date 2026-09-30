import { Suspense } from 'react';
import type { Metadata } from 'next';
import WifiDirectory from './WifiDirectory';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.wifi;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description: ui.seoDescription,
  alternates: { canonical: '/wifi' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    url: '/wifi',
    type: 'website',
  },
};

export default function WifiPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <WifiDirectory />
    </Suspense>
  );
}
