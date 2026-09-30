import { use } from 'react';
import type { Metadata } from 'next';
import VehicleDetail from './VehicleDetail';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.vehicle;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    alternates: { canonical: `/gari-auto-cng/${slug}` },
    openGraph: {
      title: `${ui.title} — ময়মনসিংহ শেবা`,
      description: ui.seoDescription,
      url: `/gari-auto-cng/${slug}`,
      type: 'website',
    },
  };
}

export default function VehicleDetailPage({ params }: Params) {
  const { slug } = use(params);
  return <VehicleDetail slug={slug} />;
}
