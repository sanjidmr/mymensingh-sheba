import type { Metadata } from 'next';
import SupportCenter from '@/components/support/SupportCenter';

export const metadata: Metadata = {
  title: 'অভিযোগ — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SupportCenter mode="complaints" />;
}
