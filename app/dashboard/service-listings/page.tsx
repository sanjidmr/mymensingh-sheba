import type { Metadata } from 'next';
import MyServiceListings from './MyServiceListings';

export const metadata: Metadata = {
  title: 'আমার কোচিং ও WiFi তালিকা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function ServiceListingsPage() {
  return <MyServiceListings />;
}
