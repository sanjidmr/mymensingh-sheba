import { Suspense } from 'react';
import type { Metadata } from 'next';
import NewsDirectory from './NewsDirectory';

export const metadata: Metadata = {
  title: 'সংবাদ — ময়মনসিংহ শেবা',
  description:
    'ময়মনসিংহ ও আশপাশের এলাকার খবর, স্থানীয় সংবাদ ও তথ্য। সদস্যদের পোস্ট অ্যাডমিন অনুমোদনের পর প্রকাশিত হয়।',
  alternates: { canonical: '/news' },
  openGraph: {
    title: 'সংবাদ — ময়মনসিংহ শেবা',
    description: 'ময়মনসিংহের স্থানীয় সংবাদ ও তথ্য।',
    url: '/news',
    type: 'website',
  },
};

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <NewsDirectory />
    </Suspense>
  );
}
