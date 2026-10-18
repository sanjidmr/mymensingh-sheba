import type { Metadata } from 'next';
import ServiceListingEditor from '../../../ServiceListingEditor';

export const metadata: Metadata = { title: 'WiFi প্রদানকারী সম্পাদনা — ময়মনসিংহ শেবা', robots: { index: false, follow: false } };

export default async function EditWifiListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServiceListingEditor category="wifi" listingId={id} />;
}
