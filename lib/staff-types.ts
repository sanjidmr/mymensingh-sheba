/**
 * Admin-managed staff services (কাজের বুয়া / Electrician / Plumber) domain types.
 *
 * Privacy rules:
 *  - phonePrivate is ADMIN-ONLY. Public queries and maps MUST NOT return it.
 *  - Public users only ever see active (is_active) profiles.
 *  - No fake verification: isVerified is set only by Admin after real checks.
 */
import type { ServiceRequestStatus } from '@/lib/supabase/types';

export type StaffServiceKey = 'kajer-bua' | 'electrician' | 'plumber';

export const STAFF_SERVICE_KEYS: StaffServiceKey[] = ['kajer-bua', 'electrician', 'plumber'];

export type StaffAvailability = 'available' | 'limited' | 'busy';

export interface StaffProfile {
  id: string;
  serviceSlug: StaffServiceKey;
  nameBn: string;
  titleBn: string;
  imageUrl: string;
  areaIds: string[]; // MCC area ids (lib/locations.ts)
  workTypes: string[]; // ids: KAJER_BUA_WORK_TYPES | ELECTRICIAN_SERVICE_TYPES | PLUMBING_SERVICE_TYPES
  workMode?: string; // kajer-bua: full_time | part_time | live_in | day_based
  timeSlot?: string; // kajer-bua: morning | afternoon | full_time | live_in | any
  experienceYears: number;
  availability: StaffAvailability;
  isEmergency?: boolean; // electrician / plumber
  salaryMin?: number; // kajer-bua monthly expectation
  salaryMax?: number;
  rateLabel?: string; // human-friendly charge note (electrician / plumber + kajer-bua)
  aboutBn: string;
  isVerified: boolean;
  isActive: boolean;
  phonePrivate?: string; // ADMIN-ONLY private contact
  createdAt: string;
  updatedAt: string;
}

/** Payload used by Admin create/update forms (includes private phone). */
export type StaffProfileInput = Omit<
  StaffProfile,
  'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'isVerified'
> & {
  isActive: boolean;
  isVerified: boolean;
};

export interface StaffRequest {
  id: string;
  serviceSlug: StaffServiceKey;
  profileId?: string;
  profileTitleBn?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  areaId: string;
  addressLine: string;
  serviceType?: string; // work/problem type id
  description?: string;
  preferredDate?: string;
  preferredTime?: string;
  attachmentUrl?: string;
  status: ServiceRequestStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StaffReportStatus = 'open' | 'resolved' | 'dismissed';

export interface StaffReport {
  id: string;
  profileId: string;
  serviceSlug: StaffServiceKey;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
  status: StaffReportStatus;
  createdAt: string;
}

export const STAFF_REPORT_REASONS = ['ভুল তথ্য', 'Fake Profile', 'ভুল ছবি', 'অন্য সমস্যা'] as const;

export const STAFF_REQUEST_STATUS_INFO: Record<
  ServiceRequestStatus,
  { labelBn: string; badgeClass: string }
> = {
  new: { labelBn: 'নতুন', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200' },
  reviewing: { labelBn: 'পর্যালোচনাধীন', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200' },
  contacted: { labelBn: 'যোগাযোগ হয়েছে', badgeClass: 'bg-violet-50 text-violet-900 border-violet-200' },
  in_progress: { labelBn: 'কাজ চলছে', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  completed: { labelBn: 'সম্পন্ন', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  cancelled: { labelBn: 'বাতিল', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', badgeClass: 'bg-rose-50 text-rose-900 border-rose-200' },
  submitted: { labelBn: 'জমা দেওয়া হয়েছে', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200' },
  assigned: { labelBn: 'কর্মী নির্ধারিত হয়েছে', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200' },
};

export const STAFF_AVAILABILITY_LABELS: Record<StaffAvailability, string> = {
  available: 'ফ্রি / প্রস্তুত',
  limited: 'সীমিত সময়ে',
  busy: 'এই মুহূর্তে ব্যস্ত',
};

export const STAFF_WORK_MODE_LABELS: Record<string, string> = {
  full_time: 'ফুল-টাইম',
  part_time: 'পার্ট-টাইম',
  live_in: 'বাসায় থেকে',
  day_based: 'দিন ভিত্তিক',
  any: 'যে কোনো',
};

export const STAFF_PREFERRED_TIMES = [
  'সকাল (৯টা – ১২টা)',
  'দুপুর (১২টা – ৩টা)',
  'বিকেল (৩টা – ৬টা)',
  'সন্ধ্যা (৬টা – ৮টা)',
  'যেকোনো সময়',
];

/** Formats an experience number to natural Bangla. */
export function formatExperienceBn(years?: number): string {
  if (years == null || years < 0) return 'অভিজ্ঞতা উল্লেখ নেই';
  const n = Number(years);
  if (n <= 0) return 'নতুন / কোনো অভিজ্ঞতা নেই';
  if (n >= 5) return '৫+ বছরের অভিজ্ঞতা';
  return `${n} বছরের অভিজ্ঞতা`;
}

/** Formats a monthly salary band in Bangla numerals/currency. */
export function formatSalaryBn(min?: number, max?: number): string {
  if (min == null && max == null) return 'সম্মানী আলোচনা সাপেক্ষে';
  if (min != null && max != null) {
    return `৳${min.toLocaleString('bn-BD')} – ৳${max.toLocaleString('bn-BD')}/মাস`;
  }
  if (min != null) return `৳${min.toLocaleString('bn-BD')}+/মাস`;
  return `৳${max != null ? max.toLocaleString('bn-BD') : ''}/মাস`;
}

/**
 * Per-service UI & business configuration used across public pages, forms, filters and admin.
 * Distinct accent => visually distinct service pages while keeping one shared skeleton.
 */
export interface StaffServiceUiConfig {
  key: StaffServiceKey;
  route: string;
  nameBn: string;
  nameEn: string;
  heroTitle: string;
  heroSubtitle: string;
  categoryBadge: string;
  accent: 'emerald' | 'amber' | 'cyan';
  workTypeLabel: string; // label in list filters
  usesSalary: boolean; // kajer-bua only
  usesEmergency: boolean; // electrician / plumber
  hasPhotoOnRequest: boolean; // electrician / plumber
  supportsSearchPlaceholder: string;
}

export const STAFF_SERVICE_UI: Record<StaffServiceKey, StaffServiceUiConfig> = {
  'kajer-bua': {
    key: 'kajer-bua',
    route: '/kajer-bua',
    nameBn: 'কাজের বুয়া',
    nameEn: 'Domestic Helper',
    heroTitle: 'কাজের বুয়া (গৃহকর্মী) সেবা',
    heroSubtitle:
      'বাসার রান্না, ঘর মোছা, কাপড় ধোয়া ও বাচ্চা দেখাশোনায় অ্যাডমিন-যাচাইকৃত পার্ট-টাইম ও ফুল-টাইম গৃহকর্মী। প্রোফাইলে সরাসরি ফোন নম্বর প্রকাশ করা হয় না।',
    categoryBadge: 'অ্যাডমিন পরিচালিত • গৃহকর্মী',
    accent: 'emerald',
    workTypeLabel: 'কাজের ধরন',
    usesSalary: true,
    usesEmergency: false,
    hasPhotoOnRequest: false,
    supportsSearchPlaceholder: 'যেমন: রান্না, ঘর মোছা, সকাল শিফট...',
  },
  electrician: {
    key: 'electrician',
    route: '/electrician',
    nameBn: 'Electrician',
    nameEn: 'Electrician',
    heroTitle: 'Electrician (ইলেক্ট্রিশিয়ান) সেবা',
    heroSubtitle:
      'শর্ট সার্কিট, ফ্যান-লাইট, ওয়্যারিং, সুইচ-বোর্ড ও গিজারের মেরামতে অভিজ্ঞ অ্যাডমিন-যাচাইকৃত টেকনিশিয়ান। জরুরি অন-কল সাপোর্ট সহ।',
    categoryBadge: 'অ্যাডমিন পরিচালিত • মেরামত',
    accent: 'amber',
    workTypeLabel: 'কাজের ধরন / সমস্যা',
    usesSalary: false,
    usesEmergency: true,
    hasPhotoOnRequest: true,
    supportsSearchPlaceholder: 'যেমন: শর্ট সার্কিট, ফ্যান মেরামত...',
  },
  plumber: {
    key: 'plumber',
    route: '/plumber',
    nameBn: 'Plumber',
    nameEn: 'Plumber',
    heroTitle: 'Plumber (প্লাম্বার) সেবা',
    heroSubtitle:
      'পানির পাইপ লিক, মোটর-পাম্প মেরামত, বেসিন ও বাথরুমের স্যানিটারি ফিটিংসে অভিজ্ঞ অ্যাডমিন-যাচাইকৃত মিস্ত্রি। জরুরি সেবা সহ।',
    categoryBadge: 'অ্যাডমিন পরিচালিত • মেরামত',
    accent: 'cyan',
    workTypeLabel: 'প্লাম্বিং সমস্যার ধরন',
    usesSalary: false,
    usesEmergency: true,
    hasPhotoOnRequest: true,
    supportsSearchPlaceholder: 'যেমন: পাইপ লিক, মোটর পাম্প...',
  },
};