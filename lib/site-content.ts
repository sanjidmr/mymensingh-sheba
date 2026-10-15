import type { HomepageCategory } from './homepage-catalog';
import { DAILY_CATEGORY, EMERGENCY_CATEGORY, SHOP_TRAVEL_CATEGORY } from './homepage-catalog';
import type { ServiceCategory } from './services-data';
import { LAUNCH_SERVICES } from './services-data';
import type { SocialLink } from './site-contact';
import { SITE_CONTACT } from './site-contact';

export interface SiteContentOverrides {
  homepage_sections?: Record<string, boolean>;
  launch_services?: ServiceOverride[];
  site_contact?: {
    phone?: string | null;
    email?: string | null;
    officeAddress?: string | null;
    serviceAreaBn?: string | null;
    hoursBn?: string | null;
    socials?: Array<{ icon: SocialLink['icon']; labelBn: string; href: string | null }>;
  };
  announcement?: {
    enabled: boolean;
    title: string;
    body: string;
    href: string | null;
    linkLabel: string | null;
  };
  about_content?: { heading: string; intro: string };
  faq_content?: Array<{ question: string; answer: string }>;
  footer_content?: {
    description: string;
    companyLinks: Array<{ label: string; href: string }>;
    supportLinks: Array<{ label: string; href: string }>;
  };
  seo?: { title: string; description: string; ogImage: string | null };
}

export const DEFAULT_ABOUT_CONTENT = {
  heading: 'ময়মনসিংহের মানুষের জন্য, ময়মনসিংহেই তৈরি',
  intro:
    'বাসা ভাড়া, কাজের বুয়া, ইলেক্ট্রিশিয়ান, গৃহশিক্ষক কিংবা জরুরি রক্তদাতা — দৈনন্দিন জীবনের প্রয়োজনীয় প্রতিটি কাজের জন্য আলাদা আলাদা জায়গায় ছুঁতে হয়। Mymensingh Sheba তৈরি হয়েছে ঠিক এই সমস্যাটি সমাধান করার জন্য।',
};

export const DEFAULT_FAQ_CONTENT = [
  {
    question: 'Mymensingh Sheba কোন কোন এলাকায় সেবা দেয়?',
    answer: 'আমরা শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন (MCC) এলাকার ভেতরে সেবা পরিচালনা করি।',
  },
  {
    question: 'বাসা ভাড়ার ক্ষেত্রে প্ল্যাটফর্ম ফি কীভাবে নির্ধারিত হয়?',
    answer:
      'মেস বা সিট ভাড়ার ক্ষেত্রে প্ল্যাটফর্ম ফি ৳৫০। বাসা ভাড়ার ক্ষেত্রে: ১০,০০০ টাকা পর্যন্ত ৳১০০, ১০,০০১ থেকে ২০,০০০ টাকা পর্যন্ত ৳২০০ এবং ২০,০০০ টাকার ঊর্ধ্বে ৳৪০০। এই ফি তালিকা ও রসিদে সম্পূর্ণ স্বচ্ছভাবে প্রদর্শিত হয়।',
  },
  {
    question: 'কাজের বুয়া ও ইলেক্ট্রিশিয়ান সেবা কারা পরিচালনা করেন?',
    answer:
      'কাজের বুয়া, ইলেক্ট্রিশিয়ান, প্লাম্বার ও বাসা পাল্টানো সেবা প্ল্যাটফর্মের অ্যাডমিন টিম সরাসরি যাচাই ও পরিচালনা করে থাকেন।',
  },
  {
    question: 'রক্তদাতার ফোন নম্বর কীভাবে দেখা যায়?',
    answer:
      'রক্তদাতার ফোন নম্বর কোথাও লেখা হিসেবে দেখানো হয় না। অনুমোদিত রক্তদাতার কার্ড বা “কল করুন” বাটনে চাপ দিলে সরাসরি সেই রক্তদাতার নম্বরে কল চলে যায় — আগে কোনো অনুরোধ পাঠাতে হয় না। রক্ত ক্রয়-বিক্রয় কঠোরভাবে নিষিদ্ধ।',
  },
];

export const DEFAULT_FOOTER_CONTENT = {
  description:
    'ময়মনসিংহ সিটি কর্পোরেশন এলাকার অধিবাসীদের জন্য একটি বিশ্বস্ত স্থানীয় সেবা প্ল্যাটফর্ম — বাসা ভাড়া, গৃহকর্মী, মেরামত, গৃহশিক্ষক ও জরুরি রক্তদান এক জায়গায়।',
  companyLinks: [
    { label: 'ময়মনসিংহ পরিচিতি', href: '/mymensingh' },
    { label: 'আমাদের সম্পর্কে', href: '/about' },
    { label: 'কিভাবে কাজ করে', href: '/#how-it-works' },
    { label: 'যোগাযোগ ও ফিডব্যাক', href: '/contact' },
    { label: 'নিরাপত্তা নীতি', href: '/safety' },
  ],
  supportLinks: [
    { label: 'সাহায্য ও জিজ্ঞাসা', href: '/help' },
    { label: 'প্রাইভেসি পলিসি', href: '/safety' },
    { label: 'ব্যবহারের শর্তাবলী', href: '/safety' },
    { label: 'ইউজার প্রোফাইল', href: '/profile' },
    { label: 'আমার রিকোয়েস্ট', href: '/profile/requests' },
  ],
};

export interface ServiceOverride {
  slug: string;
  hidden?: boolean;
  nameBn?: string;
  nameEn?: string;
  shortDesc?: string;
  coverImage?: string;
  sort_order?: number;
}

export const HOMEPAGE_SECTIONS = [
  { key: 'hero', label: 'হিরো ক্যারোসেল' },
  { key: 'search', label: 'সার্চ সেকশন' },
  { key: 'category_daily', label: 'দৈনন্দিন সেবা' },
  { key: 'category_shop', label: 'কেনাকাটা ও যাতায়াত' },
  { key: 'category_emergency', label: 'জরুরি সেবা' },
  { key: 'row_tolet', label: 'বাসা ভাড়া' },
  { key: 'row_tutor', label: 'গৃহশিক্ষক' },
  { key: 'row_gari', label: 'গাড়ি / অটো / CNG' },
  { key: 'community', label: 'কমিউনিটি' },
  { key: 'row_donor', label: 'রক্তদাতা' },
  { key: 'row_kenabecha', label: 'কেনাবেচা' },
  { key: 'row_news', label: 'স্থানীয় খবর' },
  { key: 'steps', label: 'কিভাবে কাজ করে' },
  { key: 'testimonials', label: 'টেস্টিমোনিয়াল' },
  { key: 'why', label: 'কেন আমরা' },
  { key: 'reviews', label: 'রিভিউ' },
  { key: 'final_cta', label: 'শেষ CTA' },
] as const;

export function mergeSiteContact(overrides?: SiteContentOverrides): {
  phone: string | null;
  email: string;
  officeAddress: string | null;
  serviceAreaBn: string;
  hoursBn: string;
  socials: SocialLink[];
} {
  const defaultContact = {
    phone: SITE_CONTACT.phone,
    email: SITE_CONTACT.email,
    officeAddress: SITE_CONTACT.officeAddress,
    serviceAreaBn: SITE_CONTACT.serviceAreaBn,
    hoursBn: SITE_CONTACT.hoursBn,
    socials: [...SITE_CONTACT.socials],
  };

  const override = overrides?.site_contact;
  if (!override) return defaultContact;

  return {
    phone: override.phone ?? defaultContact.phone,
    email: override.email ?? defaultContact.email,
    officeAddress: override.officeAddress ?? defaultContact.officeAddress,
    serviceAreaBn: override.serviceAreaBn ?? defaultContact.serviceAreaBn,
    hoursBn: override.hoursBn ?? defaultContact.hoursBn,
    socials:
      override.socials && override.socials.length > 0
        ? override.socials.map((item) => ({
            icon: (item.icon === 'messenger' ? 'messenger' : 'facebook') as SocialLink['icon'],
            labelBn: item.labelBn,
            href: item.href ?? null,
          }))
        : defaultContact.socials,
  };
}

export function mergeLaunchServices(
  defaultServices: ServiceCategory[] = LAUNCH_SERVICES,
  overrides?: ServiceOverride[]
): ServiceCategory[] {
  const overrideMap = new Map((overrides ?? []).map((item) => [item.slug, item]));

  return [...defaultServices]
    .map((service) => {
      const override = overrideMap.get(service.slug);
      if (!override) return service;

      return {
        ...service,
        nameBn: override.nameBn ?? service.nameBn,
        nameEn: override.nameEn ?? service.nameEn,
        shortDesc: override.shortDesc ?? service.shortDesc,
        coverImage: override.coverImage ?? service.coverImage,
        sortOrder:
          typeof override.sort_order === 'number' ? override.sort_order : service.sortOrder,
      };
    })
    .filter((service) => !(overrideMap.get(service.slug)?.hidden))
    .sort((a, b) => {
      const aOrder = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });
}

export function mergeHomepageCategories(overrides?: SiteContentOverrides): {
  daily: HomepageCategory;
  shopTravel: HomepageCategory;
  emergency: HomepageCategory;
} {
  return {
    daily: DAILY_CATEGORY,
    shopTravel: SHOP_TRAVEL_CATEGORY,
    emergency: EMERGENCY_CATEGORY,
  };
}

export function isHomepageSectionVisible(
  key: string,
  overrides?: SiteContentOverrides
): boolean {
  const override = overrides?.homepage_sections?.[key];
  return override === undefined ? true : Boolean(override);
}
