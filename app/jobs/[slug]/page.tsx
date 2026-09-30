import { use } from 'react';
import type { Metadata } from 'next';
import JobDetail from './JobDetail';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'চাকরির খবর — ময়মনসিংহ শেবা',
    description: 'ময়মনসিংহের চাকরি ও ফ্রিল্যান্স কাজের খবর — বেতন, যোগ্যতা ও যোগাযোগের তথ্য সহ।',
    alternates: { canonical: '/jobs/' + slug },
    openGraph: {
      title: 'চাকরির খবর — ময়মনসিংহ শেবা',
      description: 'ময়মনসিংহের চাকরি ও ফ্রিল্যান্স কাজের খবর — বেতন, যোগ্যতা ও যোগাযোগের তথ্য সহ।',
      url: '/jobs/' + slug,
      type: 'article',
    },
  };
}

export default function Page({ params }: Params) {
  const { slug } = use(params);
  return <JobDetail slug={slug} />;
}