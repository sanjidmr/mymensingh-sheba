import type { Metadata } from 'next';
import DashboardNotifications from './DashboardNotifications';

export const metadata: Metadata = {
  title: 'নোটিফিকেশন — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DashboardNotifications />;
}
