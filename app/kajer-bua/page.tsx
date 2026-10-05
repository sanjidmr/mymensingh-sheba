import type { Metadata } from 'next';
import ServiceRequestPage from '@/components/service-request/ServiceRequestPage';
import { SERVICE_REQUEST_PAGES } from '@/lib/service-request-pages';

const config = SERVICE_REQUEST_PAGES['kajer-bua'];

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
};

export default function KajerBuaRequestPage() {
  return <ServiceRequestPage config={config} />;
}