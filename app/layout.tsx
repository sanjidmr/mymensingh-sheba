import type { Metadata, Viewport } from 'next';
import '@fontsource/hind-siliguri/400.css';
import '@fontsource/hind-siliguri/500.css';
import '@fontsource/hind-siliguri/600.css';
import '@fontsource/hind-siliguri/700.css';
import '@fontsource/noto-serif-bengali/400.css';
import '@fontsource/noto-serif-bengali/600.css';
import '@fontsource/noto-serif-bengali/700.css';
import '@fontsource/noto-serif-bengali/900.css';
import './globals.css';
import { ClientProviders } from '@/components/ClientProviders';
import PageViewTracker from '@/components/analytics/PageViewTracker';
import { AppShell } from '@/components/layout/AppShell';
import SitePreloader from '@/components/site/SitePreloader';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/components/ui/ToastProvider';
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
      title: {
        default: DEFAULT_SITE_TITLE,
        template: '%s | Mymensingh Sheba',
      },
      description: DEFAULT_SITE_DESCRIPTION,
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" translate="no" className="scroll-smooth">
      <body className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)] antialiased font-sans selection:bg-[var(--ui-accent)]/30 selection:text-[var(--ui-primary-strong)]">
        <ThemeProvider>
          <SitePreloader />
          <PageViewTracker />
          <ClientProviders>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
