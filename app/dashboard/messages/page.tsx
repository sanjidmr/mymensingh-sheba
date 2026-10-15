import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import SupportCenter from '@/components/support/SupportCenter';

export const metadata: Metadata = {
  title: 'বার্তা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  // Older links and bookmarks pointed complaints at the shared messages page.
  // Complaints now have their own home, so send those visitors to the right place.
  const { subject } = await searchParams;
  if (subject === 'complaint') redirect('/dashboard/complaints');

  return <SupportCenter mode="messages" />;
}
