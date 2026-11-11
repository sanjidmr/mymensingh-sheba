import type { Metadata } from 'next';
import { Suspense } from 'react';
import SupportCenter from '@/components/support/SupportCenter';
import DashboardMessagesContent from './DashboardMessagesContent';

export const metadata: Metadata = {
  title: 'বার্তা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<SupportCenter mode="messages" />}>
      <DashboardMessagesContent />
    </Suspense>
  );
}
