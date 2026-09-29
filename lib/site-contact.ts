/**
 * Mymensingh Sheba — single source of truth for public contact details.
 *
 * Honesty contract (same policy the /about and /mymensingh pages follow):
 * nothing here is invented to fill a layout. Every optional channel is `null`
 * until a real, verified value exists, and the Contact page renders an honest
 * "not published yet" state that still offers a working alternative action
 * (the message form) instead of a dead link or a made-up number/address.
 *
 * To publish a channel: fill the value here — every page that shows contact
 * details (Contact, and anything importing this module) updates at once.
 */

export interface SocialLink {
  /** lucide-react icon name, resolved by the consuming component. */
  icon: 'facebook' | 'messenger';
  labelBn: string;
  href: string | null;
}

export interface SiteContact {
  /** E.164 for the tel: link, e.g. '+8801XXXXXXXXX'. */
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
  phone: null,
  phonePendingBn: 'সরাসরি সেবা নম্বর এখনো প্রকাশ করা হয়নি।',
  email: 'help@mymensinghsheba.com',
  socials: [
    { icon: 'facebook', labelBn: 'Facebook পেজ', href: null },
    { icon: 'messenger', labelBn: 'Messenger', href: null },
  ],
  officeAddress: null,
  officeAddressPendingBn:
    'এখনো কোনো স্থায়ী ভূমিকস্থ অফিস ঠিকানা প্রকাশ করা হয়নি। ঠিকানা প্রকাশিত হলে এখানেই তা যুক্ত হবে।',
  serviceAreaBn: 'ময়মনসিংহ সিটি কর্পোরেশনের ৩৩টি ওয়ার্ড',
  serviceAreaMapUrl: 'https://www.google.com/maps/search/?api=1&query=Mymensingh+City+Corporation',
  hoursBn: 'সপ্তাহের ৭ দিন',
};

/** Id of the contact form section — used as a no-JS anchor target by the channel cards. */
export const CONTACT_FORM_ANCHOR = 'contact-form';
