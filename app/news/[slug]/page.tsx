import { use } from 'react';
import type { Metadata } from 'next';
import NewsDetail from './NewsDetail';
import { getPublicPostStaticParams } from '@/lib/static-route-params';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'ময়মনসিংহের খবর — ময়মনসিংহ শেবা',
    description: 'ময়মনসিংহের স্থানীয় সংবাদ ও তথ্য — অ্যাডমিন অনুমোদনের পর প্রকাশিত সদস্য পোস্ট।',
    alternates: { canonical: '/news/' + slug },
    openGraph: {
      title: 'ময়মনসিংহের খবর — ময়মনসিংহ শেবা',
      description: 'ময়মনসিংহের স্থানীয় সংবাদ ও তথ্য — অ্যাডমিন অনুমোদনের পর প্রকাশিত সদস্য পোস্ট।',
      url: '/news/' + slug,
      type: 'article',
    },
  };
}

export function generateStaticParams() {
  return getPublicPostStaticParams('news');
}

export default function Page({ params }: Params) {
  const { slug } = use(params);
  return <NewsDetail slug={slug} />;
}