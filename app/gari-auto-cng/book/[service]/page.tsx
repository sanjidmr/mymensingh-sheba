import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import VehicleBookingPageClient from '@/components/vehicle-booking/VehicleBookingPageClient';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type BookingService = 'car' | 'auto' | 'cng';

export const metadata: Metadata = {
  title: 'গাড়ি, অটো ও CNG ভাড়া — ময়মনসিংহ শেবা',
  description: 'ময়মনসিংহে গাড়ি, অটো বা CNG ভাড়ার জন্য যাত্রার অনুরোধ পাঠান।',
  robots: { index: false, follow: true },
};

export function generateStaticParams() {
  return [{ service: 'car' }, { service: 'auto' }, { service: 'cng' }];
}

export default async function VehicleBookingPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  if (service !== 'car' && service !== 'auto' && service !== 'cng') notFound();

  return (
    <ErrorBoundary>
      <VehicleBookingPageClient service={service} />
    </ErrorBoundary>
  );
}
