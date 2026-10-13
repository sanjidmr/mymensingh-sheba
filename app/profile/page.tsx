import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'আমার প্রোফাইল — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  redirect('/dashboard');
}
