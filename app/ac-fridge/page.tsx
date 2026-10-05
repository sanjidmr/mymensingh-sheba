import type { Metadata } from 'next';
import ServiceRequestPage from '@/components/service-request/ServiceRequestPage';
import { SERVICE_REQUEST_PAGES } from '@/lib/service-request-pages';

const config = SERVICE_REQUEST_PAGES['ac-fridge'];

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
};

export default function AcFridgeRequestPage() {
  return <ServiceRequestPage config={config} />;
}