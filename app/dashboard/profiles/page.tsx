import type { Metadata } from 'next';
import ProfileManager from './ProfileManager';

export const metadata: Metadata = {
  title: 'সেবা প্রোফাইল — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function ProfileManagementPage() {
  return <ProfileManager />;
}
