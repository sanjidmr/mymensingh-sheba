import { use } from 'react';
import type { Metadata } from 'next';
import WifiDetail from './WifiDetail';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.wifi;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    alternates: { canonical: `/wifi/${slug}` },
    openGraph: {
      title: `${ui.title} — ময়মনসিংহ শেবা`,
      description: ui.seoDescription,
      url: `/wifi/${slug}`,
      type: 'website',
    },
  };
}

export default function WifiDetailPage({ params }: Params) {
  const { slug } = use(params);
  return <WifiDetail slug={slug} />;
}
