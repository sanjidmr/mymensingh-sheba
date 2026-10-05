import type { Metadata } from 'next';
import DashboardHome from './DashboardHome';

export const metadata: Metadata = {
  title: 'আমার ড্যাশবোর্ড — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DashboardHome />;
}
