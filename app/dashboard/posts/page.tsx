import { Suspense } from 'react';
import type { Metadata } from 'next';
import DashboardPosts from './DashboardPosts';

export const metadata: Metadata = {
  title: 'আমার পোস্ট — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-mist-100" />}>
      <DashboardPosts />
    </Suspense>
  );
}
