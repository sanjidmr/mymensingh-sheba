import { Suspense } from 'react';
import type { Metadata } from 'next';
import MarketDirectory from './MarketDirectory';

export const metadata: Metadata = {
  title: 'ক্রয়-বিক্রয় — ময়মনসিংহ শেবা',
  description:
    'ময়মনসিংহে ব্যবহৃত ও নতুন পণ্য কেনাবেচার তালিকা। ক্যাটাগরি, অবস্থা ও দাম অনুযায়ী খুঁজুন এবং নিজের পণ্যের পোস্ট দিন।',
  alternates: { canonical: '/buy-sell' },
  openGraph: {
    title: 'ক্রয়-বিক্রয় — ময়মনসিংহ শেবা',
    description: 'ময়মনসিংহে কেনাবেচার তালিকা — মোবাইল, ল্যাপটপ, ফার্নিচার, বই ও আরও।',
    url: '/buy-sell',
    type: 'website',
  },
};

export default function BuySellPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <MarketDirectory />
    </Suspense>
  );
}
