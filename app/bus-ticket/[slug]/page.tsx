import { use } from 'react';
import type { Metadata } from 'next';
import BusDetail from './BusDetail';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.bus;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    alternates: { canonical: `/bus-ticket/${slug}` },
    openGraph: {
      title: `${ui.title} — ময়মনসিংহ শেবা`,
      description: ui.seoDescription,
      url: `/bus-ticket/${slug}`,
      type: 'website',
    },
  };
}

export default function BusDetailPage({ params }: Params) {
  const { slug } = use(params);
  return <BusDetail slug={slug} />;
}
