import { Suspense } from 'react';
import type { Metadata } from 'next';
import CoachingDirectory from './CoachingDirectory';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.coaching;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description: ui.seoDescription,
  alternates: { canonical: '/coaching' },
  openGraph: {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    url: '/coaching',
    type: 'website',
  },
};

export default function CoachingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <CoachingDirectory />
    </Suspense>
  );
}
