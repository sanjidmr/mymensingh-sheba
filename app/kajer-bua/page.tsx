import type { Metadata } from 'next';
import ServiceRequestPage from '@/components/service-request/ServiceRequestPage';
import { SERVICE_REQUEST_PAGES } from '@/lib/service-request-pages';
import { getServiceRequestPageConfig } from '@/lib/service-request-pages.server';
import { resolveServiceMetadata } from '@/lib/service-seo';

const config = SERVICE_REQUEST_PAGES['kajer-bua'];

export async function generateMetadata(): Promise<Metadata> {
  return resolveServiceMetadata('kajer-bua', {
    title: config.metaTitle,
    description: config.metaDescription,
    canonical: '/kajer-bua',
  });
}

export default async function KajerBuaRequestPage() {
  return <ServiceRequestPage config={await getServiceRequestPageConfig('kajer-bua')} />;
}