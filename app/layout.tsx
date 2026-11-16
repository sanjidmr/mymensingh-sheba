import type { Metadata, Viewport } from 'next';
import '@fontsource/noto-sans-bengali/300.css';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/500.css';
import '@fontsource/noto-sans-bengali/600.css';
import '@fontsource/noto-sans-bengali/700.css';
import '@fontsource/noto-sans-bengali/800.css';
import '@fontsource/noto-serif-bengali/400.css';
import '@fontsource/noto-serif-bengali/600.css';
import '@fontsource/noto-serif-bengali/700.css';
import '@fontsource/noto-serif-bengali/900.css';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import SitePreloader from '@/components/site/SitePreloader';
import { NativePageTransition } from '@/components/NativePageTransition';
import { getSiteContentOverrides } from '@/lib/site-content-server';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#faf8f2',
};

const DEFAULT_SITE_TITLE = 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়';
const DEFAULT_SITE_DESCRIPTION = 'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = (await getSiteContentOverrides()).seo;
    const title = seo?.title?.trim() || DEFAULT_SITE_TITLE;
    const description = seo?.description?.trim() || DEFAULT_SITE_DESCRIPTION;
    const image = seo?.ogImage?.trim();
    return {
      metadataBase: new URL('https://mymensinghsheba.com'),
      alternates: {
        canonical: '/',
      },
      title: {
        default: title,
        template: '%s | Mymensingh Sheba',
      },
      description,
      icons: {
        icon: '/favicon.png',
        shortcut: '/favicon.png',
        apple: '/favicon.png',
      },
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'bn_BD',
        url: 'https://mymensinghsheba.com',
        ...(image ? { images: [image] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
      other: {
        google: 'notranslate',
      },
    };
  } catch {
    return {
      metadataBase: new URL('https://mymensinghsheba.com'),
      alternates: {
        canonical: '/',
      },
      title: {
        default: DEFAULT_SITE_TITLE,
        template: '%s | Mymensingh Sheba',
      },
      description: DEFAULT_SITE_DESCRIPTION,
      openGraph: {
        title: DEFAULT_SITE_TITLE,
        description: DEFAULT_SITE_DESCRIPTION,
        type: 'website',
        locale: 'bn_BD',
        url: 'https://mymensinghsheba.com',
      },
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Mymensingh Sheba',
    url: 'https://mymensinghsheba.com',
    logo: 'https://mymensinghsheba.com/favicon.png',
    sameAs: [
      'https://www.facebook.com',
    ],
    areaServed: 'Mymensingh, Bangladesh',
    description: 'ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায় — বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও রক্তদাতা।',
  };

  return (
    <html lang="bn" translate="no" className="scroll-smooth">
      <body data-mobile-bottom-nav="true" className="min-h-screen bg-white text-slate-900 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <SitePreloader />
        <PageViewTracker />
        <ClientProviders>
          <NativePageTransition>{children}</NativePageTransition>
          <MobileBottomNav />
        </ClientProviders>
      </body>
    </html>
  );
}
