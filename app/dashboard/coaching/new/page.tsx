import type { Metadata } from 'next';
import ServiceListingEditor from '../../ServiceListingEditor';

export const metadata: Metadata = { title: 'কোচিং সেন্টার জমা দিন — ময়মনসিংহ শেবা', robots: { index: false, follow: false } };

export default function NewCoachingListingPage() {
  return <ServiceListingEditor category="coaching" />;
}
