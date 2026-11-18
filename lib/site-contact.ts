/**
 * Mymensingh Sheba — single source of truth for public contact details.
 *
 * The public phone and Facebook page are fixed site-wide. Other optional
 * channels remain unpublished until a real, verified value exists.
 *
 * Private email and social-contact values stay server-only; never put them in
 * this client-safe module.
 */

export const PUBLIC_PHONE = '01408489418';
export const PUBLIC_PHONE_TEL = '+8801408489418';
export const FACEBOOK_PAGE_URL = 'https://facebook.com/mymensinghsheba';

export interface SocialLink {
  /** lucide-react icon name, resolved by the consuming component. */
  icon: 'facebook' | 'messenger';
  labelBn: string;
  href: string | null;
}

export interface SiteContact {
  /** Public phone number in the local format shown to visitors. */
  phone: string | null;
  /** What to show when no number is published yet. */
  phonePendingBn: string;
  email: string;
  socials: SocialLink[];
  /**
   * Real walk-in office address. Deliberately `null` — Mymensingh Sheba has no
   * published physical office, so no street address is fabricated on the page.
   * When one exists, set it here and the Contact page renders it automatically.
   */
  officeAddress: string | null;
  /** Shown in place of the address until a real one is published. */
  officeAddressPendingBn: string;
  /** The honest geographic claim we can actually stand behind. */
  serviceAreaBn: string;
  serviceAreaMapUrl: string;
  hoursBn: string;
}

export const SITE_CONTACT: SiteContact = {
  phone: PUBLIC_PHONE,
  phonePendingBn: 'সরাসরি সেবা নম্বর এখনো প্রকাশ করা হয়নি।',
  email: '',
  socials: [],
  officeAddress: null,
  officeAddressPendingBn:
    'এখনো কোনো স্থায়ী ভূমিকস্থ অফিস ঠিকানা প্রকাশ করা হয়নি। ঠিকানা প্রকাশিত হলে এখানেই তা যুক্ত হবে।',
  serviceAreaBn: 'ময়মনসিংহ সিটি কর্পোরেশন এলাকা',
  serviceAreaMapUrl: 'https://www.google.com/maps/search/?api=1&query=Mymensingh+City+Corporation',
  hoursBn: 'সপ্তাহের ৭ দিন',
};

/** Id of the contact form section — used as a no-JS anchor target by the channel cards. */
export const CONTACT_FORM_ANCHOR = 'contact-form';
