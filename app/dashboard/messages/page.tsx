import type { Metadata } from 'next';
import CustomerMessages from './CustomerMessages';

export const metadata: Metadata = {
  title: 'সাপোর্ট বার্তা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const initialSubject = subject === 'complaint' ? 'complaint' : 'general';
  return <CustomerMessages key={initialSubject} initialSubject={initialSubject} />;
}
