import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

const notoBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mymensinghsheba.com'),
  title: {
    default: 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়',
    template: '%s | Mymensingh Sheba',
  },
  description: 'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।',
  openGraph: {
    title: 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়',
    description: 'ময়মনসিংহ সিটি কর্পোরেশনের বিশ্বস্ত স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়',
    description: 'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় নির্ভরযোগ্য সেবা প্ল্যাটফর্ম।',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className={`${notoBengali.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white text-ink-900 antialiased font-sans selection:bg-brand-100 selection:text-brand-900">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
