import type { Metadata } from 'next';
import { getServiceSeoEntry } from '@/lib/site-content-server';

export type ServiceSeoDefaults = {
  title: string;
  description: string;
  canonical: string;
  image?: string | null;
  type?: 'website' | 'article';
};

export async function resolveServiceMetadata(
  slug: string,
  defaults: ServiceSeoDefaults
): Promise<Metadata> {
  const seo = await getServiceSeoEntry(slug);
  const title = seo?.seoTitle?.trim() || seo?.ogTitle?.trim() || defaults.title;
  const description = seo?.metaDescription?.trim() || seo?.seoDescription?.trim() || defaults.description;
  const canonical = seo?.canonicalUrl?.trim() || defaults.canonical;
  const ogTitle = seo?.ogTitle?.trim() || title;
  const ogDescription = seo?.ogDescription?.trim() || description;
  const twitterTitle = seo?.twitterTitle?.trim() || title;
  const twitterDescription = seo?.twitterDescription?.trim() || description;
  const robots = seo?.index === false ? { index: false, follow: true } : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      type: defaults.type ?? 'website',
      ...(defaults.image ? { images: [defaults.image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: twitterTitle,
      description: twitterDescription,
      ...(defaults.image ? { images: [defaults.image] } : {}),
    },
  };
}
