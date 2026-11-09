import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import DirectoryShell from '@/components/directory/DirectoryShell';
import VehicleBookingForm from '@/components/vehicle-booking/VehicleBookingForm';

type BookingService = 'auto' | 'cng';

const TITLES: Record<BookingService, string> = {
  auto: 'অটো ভাড়া করুন',
  cng: 'CNG ভাড়া করুন',
};

export const metadata: Metadata = {
  title: 'অটো ও CNG ভাড়া — ময়মনসিংহ শেবা',
  description: 'ময়মনসিংহে অটো বা CNG ভাড়ার জন্য যাত্রার অনুরোধ পাঠান।',
  robots: { index: false, follow: true },
};

export default async function VehicleBookingPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service } = await params;
  if (service !== 'auto' && service !== 'cng') notFound();

  return (
    <DirectoryShell
      title={TITLES[service]}
      subtitle="যাত্রার তথ্য পূরণ করে আপনার বুকিং অনুরোধ পাঠান।"
      breadcrumbs={[
        { label: 'গাড়ি, অটো ও CNG', href: '/gari-auto-cng' },
        { label: TITLES[service] },
      ]}
    >
      <VehicleBookingForm service={service} />
    </DirectoryShell>
  );
}
