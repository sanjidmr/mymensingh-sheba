import type { Metadata } from 'next';
import DashboardProfile from './DashboardProfile2';

export const metadata: Metadata = {
  title: 'আমার প্রোফাইল — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <DashboardProfile />;
}
