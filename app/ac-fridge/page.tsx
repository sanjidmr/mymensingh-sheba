import type { Metadata } from 'next';
import ServiceRequestPage from '@/components/service-request/ServiceRequestPage';
import { SERVICE_REQUEST_PAGES } from '@/lib/service-request-pages';
import { getServiceRequestPageConfig } from '@/lib/service-request-pages.server';
import { resolveServiceMetadata } from '@/lib/service-seo';

const config = SERVICE_REQUEST_PAGES['ac-fridge'];

export async function generateMetadata(): Promise<Metadata> {
  return resolveServiceMetadata('ac-fridge', {
    title: config.metaTitle,
    description: config.metaDescription,
    canonical: '/ac-fridge',
  });
}

export default async function AcFridgeRequestPage() {
  return <ServiceRequestPage config={await getServiceRequestPageConfig('ac-fridge')} />;
}