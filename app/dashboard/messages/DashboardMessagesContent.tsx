'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SupportCenter from '@/components/support/SupportCenter';

export default function DashboardMessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isComplaint = searchParams.get('subject') === 'complaint';

  useEffect(() => {
    if (isComplaint) router.replace('/dashboard/complaints');
  }, [isComplaint, router]);

  return isComplaint ? null : <SupportCenter mode="messages" />;
}
