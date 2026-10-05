import { Suspense } from 'react';
import type { Metadata } from 'next';
import MarketplaceBrowser from '@/components/buy-sell/MarketplaceBrowser';

export const metadata: Metadata = {
  title: 'কেনা-বেচা — ময়মনসিংহ শেবা',
  description:
    'ময়মনসিংহে কেনাকাটা ও বিক্রি এক জায়গায়। মোবাইল, ল্যাপটপ, ইলেকট্রনিক্স, আসবাবপত্র, বাইক, গাড়ি, বই ও বাসার জিনিসপত্র ক্যাটাগরি, অবস্থা, এলাকা ও দাম অনুযায়ী খুঁজুন, অথবা নিজের পণ্যের বিজ্ঞাপন দিন।',
  alternates: { canonical: '/buy-sell' },
  openGraph: {
    title: 'কেনা-বেচা — ময়মনসিংহ শেবা',
    description:
      'ময়মনসিংহে কেনাকাটা ও বিক্রি এক জায়গায় — মোবাইল, ল্যাপটপ, আসবাবপত্র, বাইক, গাড়ি, বই ও আরও।',
    url: '/buy-sell',
    type: 'website',
  },
};

export default function BuySellPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <MarketplaceBrowser />
    </Suspense>
  );
}