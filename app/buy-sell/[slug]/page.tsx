import { use } from 'react';
import type { Metadata } from 'next';
import MarketDetail from './MarketDetail';

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: 'ক্রয়-বিক্রয় — ময়মনসিংহ শেবা',
    description: 'ময়মনসিংহে ব্যবহৃত ও নতুন পণ্য কেনাবেচার তালিকা — দাম, অবস্থা ও এলাকা সহ।',
    alternates: { canonical: '/buy-sell/' + slug },
    openGraph: {
      title: 'ক্রয়-বিক্রয় — ময়মনসিংহ শেবা',
      description: 'ময়মনসিংহে ব্যবহৃত ও নতুন পণ্য কেনাবেচার তালিকা — দাম, অবস্থা ও এলাকা সহ।',
      url: '/buy-sell/' + slug,
      type: 'article',
    },
  };
}

export default function Page({ params }: Params) {
  const { slug } = use(params);
  return <MarketDetail slug={slug} />;
}