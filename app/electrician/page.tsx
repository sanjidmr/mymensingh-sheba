import type { Metadata } from 'next';
import ServiceRequestPage from '@/components/service-request/ServiceRequestPage';
import { SERVICE_REQUEST_PAGES } from '@/lib/service-request-pages';
import { getServiceRequestPageConfig } from '@/lib/service-request-pages.server';
import { resolveServiceMetadata } from '@/lib/service-seo';

const config = SERVICE_REQUEST_PAGES.electrician;

export async function generateMetadata(): Promise<Metadata> {
  return resolveServiceMetadata('electrician', {
    title: config.metaTitle,
    description: config.metaDescription,
    canonical: '/electrician',
  });
}

export default async function ElectricianRequestPage() {
  return <ServiceRequestPage config={await getServiceRequestPageConfig('electrician')} />;
}