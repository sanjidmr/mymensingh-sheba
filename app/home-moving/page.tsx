import type { Metadata } from 'next';
import HomeMovingPageClient from '@/components/home-moving/HomeMovingPageClient';
import { getServiceRequestPageConfig } from '@/lib/service-request-pages.server';

export const metadata: Metadata = {
  title: 'বাসা পাল্টানো — ময়মনসিংহ শেবা',
  description: 'ময়মনসিংহে বাসা স্থানান্তরের জন্য অনুরোধ পাঠান।',
};

export default async function HomeMovingPage() {
  const config = await getServiceRequestPageConfig('basha-paltano');
  return <HomeMovingPageClient coverImage={config.image.src} />;
}
