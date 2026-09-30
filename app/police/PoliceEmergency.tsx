'use client';

import { Suspense } from 'react';
import EmergencyDirectory from '@/components/catalog/EmergencyDirectory';

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-3 py-6" />}>
      <EmergencyDirectory service="police" />
    </Suspense>
  );
}