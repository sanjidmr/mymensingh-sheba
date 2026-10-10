import { Suspense } from 'react';
import type { Metadata } from 'next';
import DoctorEmergency from '@/app/doctor/DoctorEmergency';
import { EMERGENCY_UI } from '@/lib/catalog-types';

const ui = EMERGENCY_UI.doctor;

export const metadata: Metadata = {
  title: `${ui.title} — ময়মনসিংহ শেবা`,
  description: 'ময়মনসিংহের চিকিৎসক ও চিকিৎসা প্রতিষ্ঠানের যাচাইকৃত যোগাযোগের তালিকা।',
  alternates: { canonical: '/doctors' },
};

export default function DoctorsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <DoctorEmergency />
    </Suspense>
  );
}
