import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'আমার পোস্ট — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect('/dashboard/posts');
}
