'use client';

import { useState } from 'react';
import DirectoryShell from '@/components/directory/DirectoryShell';
import SubmissionSuccess from '@/components/service-request/SubmissionSuccess';
import type { ServiceRequestSuccessData } from '@/components/service-request/SubmissionSuccess';
import VehicleBookingForm from '@/components/vehicle-booking/VehicleBookingForm';

type BookingService = 'car' | 'auto' | 'cng';

const TITLES: Record<BookingService, string> = {
  car: 'গাড়ি ভাড়া করুন',
  auto: 'অটো ভাড়া করুন',
  cng: 'সিএনজি ভাড়া করুন',
};

export default function VehicleBookingPageClient({ service }: { service: BookingService }) {
  const [submission, setSubmission] = useState<ServiceRequestSuccessData | null>(null);

  if (submission) {
    return (
      <main className="min-h-screen bg-mist-50">
        <SubmissionSuccess
          serviceTitle={TITLES[service]}
          serviceMessage={`আপনার ${TITLES[service]}-এর বুকিং অনুরোধটি সংরক্ষণ করা হয়েছে। টিম যাত্রার তথ্য যাচাই করে আপনার দেওয়া মোবাইল নম্বরে যোগাযোগ করবে।`}
          submission={submission}
        />
      </main>
    );
  }

  return (
    <DirectoryShell
      title={TITLES[service]}
      subtitle="যাত্রার তথ্য পূরণ করে আপনার বুকিং অনুরোধ পাঠান।"
      breadcrumbs={[
        { label: 'গাড়ি, অটো ও সিএনজি', href: '/gari-auto-cng' },
        { label: TITLES[service] },
      ]}
    >
      <VehicleBookingForm service={service} onSubmitted={setSubmission} />
    </DirectoryShell>
  );
}
