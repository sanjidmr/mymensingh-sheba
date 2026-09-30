import { use } from 'react';
import type { Metadata } from 'next';
import CoachingDetail from './CoachingDetail';
import { CATEGORY_UI } from '@/lib/catalog-types';

const ui = CATEGORY_UI.coaching;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${ui.title} — ময়মনসিংহ শেবা`,
    description: ui.seoDescription,
    // Slugs are unique per row, so a per-listing canonical is correct here.
    alternates: { canonical: `/coaching/${slug}` },
    openGraph: {
      title: `${ui.title} — ময়মনসিংহ শেবা`,
      description: ui.seoDescription,
      url: `/coaching/${slug}`,
      type: 'website',
    },
  };
}

export default function CoachingDetailPage({ params }: Params) {
  const { slug } = use(params);
  return <CoachingDetail slug={slug} />;
}
