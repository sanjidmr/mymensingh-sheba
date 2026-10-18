import type { Metadata } from 'next';
import ServiceListingEditor from '../../../ServiceListingEditor';

export const metadata: Metadata = { title: 'কোচিং সেন্টার সম্পাদনা — ময়মনসিংহ শেবা', robots: { index: false, follow: false } };

export default async function EditCoachingListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ServiceListingEditor category="coaching" listingId={id} />;
}
