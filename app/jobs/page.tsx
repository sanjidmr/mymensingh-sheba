import { Suspense } from 'react';
import type { Metadata } from 'next';
import JobDirectory from './JobDirectory';

export const metadata: Metadata = {
  title: 'চাকরির খবর — ময়মনসিংহ শেবা',
  description:
    'ময়মনসিংহে চাকরি ও ফ্রিল্যান্স কাজের খবর। বেতন, যোগ্যতা ও এলাকা অনুযায়ী খুঁজুন এবং নিজের খবরও দিন।',
  alternates: { canonical: '/jobs' },
  openGraph: {
    title: 'চাকরির খবর — ময়মনসিংহ শেবা',
    description: 'ময়মনসিংহের চাকরির খবর ও ফ্রিল্যান্স কাজের তালিকা।',
    url: '/jobs',
    type: 'website',
  },
};

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-3 py-6" />}>
      <JobDirectory />
    </Suspense>
  );
}
