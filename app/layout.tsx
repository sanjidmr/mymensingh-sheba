import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import { getSiteContentOverrides } from '@/lib/site-content-server';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#faf8f2',
};

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const DEFAULT_SITE_TITLE = 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়';
const DEFAULT_SITE_DESCRIPTION = 'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।';

export async function generateMetadata(): Promise<Metadata> {
  const seo = (await getSiteContentOverrides()).seo;
  const title = seo?.title?.trim() || DEFAULT_SITE_TITLE;
  const description = seo?.description?.trim() || DEFAULT_SITE_DESCRIPTION;
  const image = seo?.ogImage?.trim();
  return {
  metadataBase: new URL('https://mymensinghsheba.com'),
  title: {
    default: title,
    template: '%s | Mymensingh Sheba',
  },
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'bn_BD',
    ...(image ? { images: [image] } : {}),
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    ...(image ? { images: [image] } : {}),
  },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${notoBengali.variable} scroll-smooth`}>
      <body className="min-h-screen bg-mist-50 text-ink-900 antialiased font-sans selection:bg-accent-200 selection:text-brand-800">
        <ClientProviders>
          {children}
          <MobileBottomNav />
        </ClientProviders>
      </body>
    </html>
  );
}
