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
}

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
