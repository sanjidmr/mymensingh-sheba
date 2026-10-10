import type { Metadata } from 'next';
import CustomerMessages from './CustomerMessages';

export const metadata: Metadata = {
  title: 'সাপোর্ট বার্তা — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <CustomerMessages />;
}
