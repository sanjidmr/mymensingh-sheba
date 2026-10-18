import type { Metadata } from 'next';
import ServiceListingEditor from '../../ServiceListingEditor';

export const metadata: Metadata = { title: 'WiFi প্রদানকারী জমা দিন — ময়মনসিংহ শেবা', robots: { index: false, follow: false } };

export default function NewWifiListingPage() {
  return <ServiceListingEditor category="wifi" />;
}
