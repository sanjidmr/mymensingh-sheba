import type { Metadata } from 'next';
import ServiceRequestPage from '@/components/service-request/ServiceRequestPage';
import { SERVICE_REQUEST_PAGES } from '@/lib/service-request-pages';
import { getServiceRequestPageConfig } from '@/lib/service-request-pages.server';
import { resolveServiceMetadata } from '@/lib/service-seo';

const config = SERVICE_REQUEST_PAGES['basha-paltano'];

export async function generateMetadata(): Promise<Metadata> {
  return resolveServiceMetadata('home-moving', {
    title: config.metaTitle,
    description: config.metaDescription,
    canonical: '/basha-paltano',
  });
}

export default async function BashaPaltanoRequestPage() {
  return <ServiceRequestPage config={await getServiceRequestPageConfig('basha-paltano')} />;
}