import 'server-only';
import type { SocialLink } from './site-contact';

export const SITE_CONTACT_PHONE =
  process.env.SITE_CONTACT_PHONE ?? '01408489418';
export const SITE_CONTACT_EMAIL = 'help@mymensinghsheba.com';
export const SITE_CONTACT_SOCIALS: SocialLink[] = [
  { icon: 'facebook', labelBn: 'Facebook পেজ', href: 'https://www.facebook.com/share/1YTmXUL8FU/' },
  { icon: 'messenger', labelBn: 'Messenger', href: 'https://www.facebook.com/share/1YTmXUL8FU/' },
];
