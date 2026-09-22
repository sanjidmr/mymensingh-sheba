import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';

export const metadata: Metadata = {
  title: 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়',
  description: 'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।',
  openGraph: {
    title: 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়',
    description: 'ময়মনসিংহ সিটি কর্পোরেশনের বিশ্বস্ত স্থানীয় সেবা প্ল্যাটফর্ম। বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো, গৃহশিক্ষক ও জরুরি রক্তদাতা।',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mymensingh Sheba — ময়মনসিংহে প্রয়োজনীয় সেবা, এক জায়গায়',
    description: 'ময়মনসিংহ সিটি কর্পোরেশনের স্থানীয় নির্ভরযোগ্য সেবা প্ল্যাটফর্ম।',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="scroll-smooth">
      <body className="min-h-screen bg-[#FBFDFB] text-slate-900 antialiased font-sans selection:bg-emerald-100 selection:text-emerald-900">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
