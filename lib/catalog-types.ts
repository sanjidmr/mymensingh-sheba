/**
 * Shared types + per-category configuration for the newer service pages.
 *
 * Two families live here:
 *
 *  1. `ServiceListing` — the ADMIN-curated directories (coaching, wifi, bus,
 *     vehicle). One table, one CRUD path, four category configs. Only admins
 *     write these; everyone else reads and filters.
 *  2. `CommunityPost` — the USER-authored content (news, jobs, buy-sell).
 *     Authors manage their own rows; they land in `pending` and an admin
 *     approves them.
 *
 * Everything else in this file is configuration: the copy, the taxonomy and
 * the card layout each page needs. Keeping it declarative is what stops eight
 * new pages from drifting into eight different-looking templates.
 *
 * HONESTY RULE (applies to every category below): the taxonomy here is
 * vocabulary (class names, subject names, area names, job types) — NOT
 * businesses, prices or phone numbers. Any real provider, price or local
 * number only ever comes from the database, entered by an admin. Nothing in
 * this file is seeded into the UI as content.
 */
import { getAllMCCAreas } from './locations';

// ---------------------------------------------------------------------------
// Admin-curated listings
// ---------------------------------------------------------------------------

export type ServiceCategory = 'coaching' | 'wifi' | 'bus' | 'vehicle';

export interface ServiceListing {
  id: string;
  category: ServiceCategory;
  slug: string;
  titleBn: string;
  subtitleBn?: string;
  summaryBn?: string;
  descriptionBn?: string;
  imageUrl?: string;
  logoUrl?: string;
  areaIds: string[];
  tags: string[];
  monthlyFeeMin?: number;
  monthlyFeeMax?: number;
  priceMin?: number;
  priceMax?: number;
  speedMbps?: number;
  fareMin?: number;
  fareMax?: number;
  originBn?: string;
  destinationBn?: string;
  seatCount?: number;
  contactPhonePrivate?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

/** The write-side shape an admin form produces. */
export type ServiceListingInput = Omit<
  ServiceListing,
  'id' | 'createdAt' | 'updatedAt'
>;

export type VehicleKind = 'গাড়ি' | 'অটো' | 'CNG';

export const VEHICLE_KINDS: VehicleKind[] = ['গাড়ি', 'অটো', 'CNG'];

// ---------------------------------------------------------------------------
// User-authored posts
// ---------------------------------------------------------------------------

export type PostKind = 'news' | 'job' | 'buy_sell';
export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface CommunityPost {
  id: string;
  kind: PostKind;
  slug: string;
  authorId: string;
  authorName?: string;
  authorPhone?: string;
  titleBn: string;
  summaryBn?: string;
  bodyBn?: string;
  coverImageUrl?: string;
  category?: string;
  areaId?: string;
  tags: string[];
  salaryMin?: number;
  salaryMax?: number;
  price?: number;
  jobType?: string;
  deadline?: string;
  conditionLabel?: string;
  status: PostStatus;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type CommunityPostInput = Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Emergency directory
// ---------------------------------------------------------------------------

export type EmergencyService = 'doctor' | 'police' | 'ambulance' | 'fire_service';

export interface EmergencyContact {
  id: string;
  service: EmergencyService;
  nameBn: string;
  organizationBn?: string;
  areaId?: string;
  addressBn?: string;
  phone: string;
  sourceNote?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type EmergencyContactInput = Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// Vehicle rental requests
// ---------------------------------------------------------------------------

export type VehicleRequestStatus = 'new' | 'contacted' | 'closed';

export interface VehicleRequest {
  id: string;
  vehicleListingId?: string;
  vehicleKind: VehicleKind;
  vehicleName?: string;
  customerId?: string;
  contactName: string;
  contactPhone: string;
  pickupAreaId?: string;
  destinationAreaId?: string;
  travelDate?: string;
  travelTime?: string;
  notes?: string;
  status: VehicleRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRequestInput {
  vehicleListingId?: string;
  vehicleKind: VehicleKind;
  vehicleName?: string;
  contactName: string;
  contactPhone: string;
  pickupAreaId?: string;
  destinationAreaId?: string;
  travelDate?: string;
  travelTime?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Taxonomy — vocabulary only, never content
// ---------------------------------------------------------------------------

/** Classes a coaching centre can teach. */
export const COACHING_CLASSES: { id: string; labelBn: string }[] = [
  { id: 'primary', labelBn: 'প্রাথমিক' },
  { id: 'secondary', labelBn: 'মাধ্যমিক' },
  { id: 'higher-secondary', labelBn: 'উচ্চ মাধ্যমিক' },
  { id: 'hsc', labelBn: 'এইচএসসি' },
  { id: 'alim', labelBn: 'আলিম' },
  { id: 'university-admission', labelBn: 'বিশ্ববিদ্যালয় ভর্তি' },
  { id: 'competitive', labelBn: 'প্রতিযোগিতা' },
];

/** Subjects a coaching centre can offer. */
export const COACHING_SUBJECTS: { id: string; labelBn: string }[] = [
  { id: 'math', labelBn: 'গণিত' },
  { id: 'physics', labelBn: 'পদার্থবিজ্ঞান' },
  { id: 'chemistry', labelBn: 'রসায়ন' },
  { id: 'biology', labelBn: 'জীববিজ্ঞান' },
  { id: 'english', labelBn: 'ইংরেজি' },
  { id: 'bangla', labelBn: 'বাংলা' },
  { id: 'ict', labelBn: 'আইসিটি' },
];

/** Coaching centre types. */
export const COACHING_CATEGORIES: { id: string; labelBn: string }[] = [
  { id: 'general', labelBn: 'জেনারেল' },
  { id: 'hsc', labelBn: 'এইচএসসি' },
  { id: 'admission', labelBn: 'ভর্তি কোচিং' },
  { id: 'university', labelBn: 'বিশ্ববিদ্যালয়' },
  { id: 'government', labelBn: 'সরকারি চাকরি প্রস্তুতি' },
];

/** Bus body/category types. */
export const BUS_TYPES: { id: string; labelBn: string }[] = [
  { id: 'ac', labelBn: 'এসি' },
  { id: 'non-ac', labelBn: 'নন-এসি' },
  { id: 'luxury', labelBn: 'লাক্সারি' },
  { id: 'double-decker', labelBn: 'ডাবল ডেকার' },
];

/** News desk categories. */
export const NEWS_CATEGORIES: { id: string; labelBn: string }[] = [
  { id: 'mymensingh', labelBn: 'ময়মনসিংহ' },
  { id: 'local', labelBn: 'স্থানীয়' },
  { id: 'education', labelBn: 'শিক্ষা' },
  { id: 'jobs', labelBn: 'চাকরি' },
  { id: 'business', labelBn: 'ব্যবসা' },
  { id: 'service', labelBn: 'সেবা' },
  { id: 'others', labelBn: 'অন্যান্য' },
];

/** Job portal types. */
export const JOB_TYPES: { id: string; labelBn: string }[] = [
  { id: 'full-time', labelBn: 'ফুল টাইম' },
  { id: 'part-time', labelBn: 'পার্ট টাইম' },
  { id: 'contract', labelBn: 'কন্ট্রাক্ট' },
  { id: 'internship', labelBn: 'ইন্টার্নশিপ' },
  { id: 'govt', labelBn: 'সরকারি চাকরি' },
];

/** Job experience bands. */
export const JOB_EXPERIENCE: { id: string; labelBn: string }[] = [
  { id: 'fresher', labelBn: 'ফ্রেশার' },
  { id: '1-2', labelBn: '১–২ বছর' },
  { id: '3-5', labelBn: '৩–৫ বছর' },
  { id: '5+', labelBn: '৫+ বছর' },
];

/** Job education bands. */
export const JOB_EDUCATION: { id: string; labelBn: string }[] = [
  { id: 'ssc', labelBn: 'এসএসসি' },
  { id: 'hsc', labelBn: 'এইচএসসি' },
  { id: 'graduation', labelBn: 'স্নাতক' },
  { id: 'post-graduation', labelBn: 'স্নাতকোত্তর' },
  { id: 'any', labelBn: 'যেকোনো' },
];

/** Buy-sell item categories. */
export const MARKET_CATEGORIES: { id: string; labelBn: string }[] = [
  { id: 'mobile', labelBn: 'মোবাইল' },
  { id: 'laptop', labelBn: 'ল্যাপটপ / কম্পিউটার' },
  { id: 'electronics', labelBn: 'ইলেকট্রনিক্স' },
  { id: 'furniture', labelBn: 'ফার্নিচার' },
  { id: 'books', labelBn: 'বই' },
  { id: 'vehicle', labelBn: 'বাইক / গাড়ি' },
  { id: 'clothing', labelBn: 'পোশাক' },
  { id: 'other', labelBn: 'অন্যান্য' },
];

/** Buy-sell condition bands. */
export const MARKET_CONDITIONS: { id: string; labelBn: string }[] = [
  { id: 'new', labelBn: 'নতুন' },
  { id: 'like-new', labelBn: 'নতুনের মতো' },
  { id: 'good', labelBn: 'ভালো' },
  { id: 'used', labelBn: 'ব্যবহৃত' },
];

// ---------------------------------------------------------------------------
// Fee / price bands used by the "range" filters
// ---------------------------------------------------------------------------

/**
 * A numeric band for the shared "range" filter group.
 *
 * `min` is optional because the open-ended ends are the common case: a reader
 * choosing "৫০০ টাকার কম" wants a ceiling and a reader choosing "৩০০০ টাকার বেশি"
 * wants a floor. Omitting the missing bound is what expresses that, and it
 * keeps the single shape usable for the matcher, which defaults a missing `min`
 * to 0.
 */
export type PriceBand = { id: string; labelBn: string; min?: number; max?: number };

/** Monthly coaching fee, in taka. */
export const COACHING_FEE_BANDS: PriceBand[] = [
  { id: 'f0', labelBn: '৫০০ টাকার কম', max: 500 },
  { id: 'f1', labelBn: '৫০০ – ১০০০', min: 500, max: 1000 },
  { id: 'f2', labelBn: '১০০০ – ২০০০', min: 1000, max: 2000 },
  { id: 'f3', labelBn: '২০০০ – ৩০০০', min: 2000, max: 3000 },
  { id: 'f4', labelBn: '৩০০০ টাকার বেশি', min: 3000 },
];

/** Monthly WiFi price, in taka. */
export const WIFI_PRICE_BANDS: PriceBand[] = [
  { id: 'p0', labelBn: '৫০০ টাকার কম', max: 500 },
  { id: 'p1', labelBn: '৫০০ – ১০০০', min: 500, max: 1000 },
  { id: 'p2', labelBn: '১০০০ – ১৫০০', min: 1000, max: 1500 },
  { id: 'p3', labelBn: '১৫০০ – ২০০০', min: 1500, max: 2000 },
  { id: 'p4', labelBn: '২০০০ টাকার বেশি', min: 2000 },
];

/** WiFi speed bands, in Mbps. */
export const WIFI_SPEED_BANDS: PriceBand[] = [
  { id: 's0', labelBn: '১০ Mbps পর্যন্ত', max: 10 },
  { id: 's1', labelBn: '১১ – ২০ Mbps', min: 11, max: 20 },
  { id: 's2', labelBn: '২১ – ৫০ Mbps', min: 21, max: 50 },
  { id: 's3', labelBn: '৫০ Mbps-এর বেশি', min: 51 },
];

/** Bus fare bands, one way, in taka. */
export const BUS_FARE_BANDS: PriceBand[] = [
  { id: 't0', labelBn: '২০০ টাকার কম', max: 200 },
  { id: 't1', labelBn: '২০০ – ৩০০', min: 200, max: 300 },
  { id: 't2', labelBn: '৩০০ – ৪০০', min: 300, max: 400 },
  { id: 't3', labelBn: '৪০০ – ৫০০', min: 400, max: 500 },
  { id: 't4', labelBn: '৫০০ টাকার বেশি', min: 500 },
];

/** Buy-sell price bands, in taka. */
export const MARKET_PRICE_BANDS: PriceBand[] = [
  { id: 'm0', labelBn: '১০০০ টাকার কম', max: 1000 },
  { id: 'm1', labelBn: '১০০০ – ৫০০০', min: 1000, max: 5000 },
  { id: 'm2', labelBn: '৫০০০ – ১৫০০০', min: 5000, max: 15000 },
  { id: 'm3', labelBn: '১৫০০০ – ৫০০০০', min: 15000, max: 50000 },
  { id: 'm4', labelBn: '৫০০০০ টাকার বেশি', min: 50000 },
];

// ---------------------------------------------------------------------------
// Page configuration
// ---------------------------------------------------------------------------

/**
 * Card layout per category. This is the one place that encodes the
 * "how many cards per row" rule so a page cannot get it wrong.
 */
export type GridColumns = 1 | 2 | 3 | 4 | 5;

export interface CategoryUiConfig {
  category: ServiceCategory;
  route: string;
  title: string;
  subtitle: string;
  /** Meta description for the page's `metadata` export. */
  seoDescription: string;
  placeholder: string;
  /** Noun used in the result count and the empty state. */
  noun: string;
  searchNoun: string;
  /** Trust chips under the title. */
  highlights: string[];
  /** Mobile / desktop cards per row. */
  mobileCols: GridColumns;
  desktopCols: GridColumns;
  /** Whether the empty state should invite an admin to add the first row. */
  adminOwned: boolean;
}

export const CATEGORY_UI: Record<ServiceCategory, CategoryUiConfig> = {
  coaching: {
    category: 'coaching',
    route: '/coaching',
    title: 'কোচিং সেন্টার',
    subtitle:
      'ময়মনসিংহের অ্যাডমিন-যাচাইকৃত কোচিং সেন্টারগুলো — ক্লাস, বিষয়, এলাকা ও মাসিক ফি অনুযায়ী খুঁজুন।',
    placeholder: 'কোচিং সেন্টার, এলাকা বা বিষয় লিখে খুঁজুন...',
    seoDescription:
      'ময়মনসিংহের অ্যাডমিন-যাচাইকৃত কোচিং সেন্টার তালিকা। ক্লাস, বিষয়, এলাকা ও মাসিক ফি অনুযায়ী খুঁজে সরাসরি যোগাযোগ করুন।',
    noun: 'কোচিং',
    searchNoun: 'কোচিং সেন্টার',
    highlights: ['অ্যাডমিন যাচাইকৃত', 'মাসিক ফি স্পষ্ট', 'সরাসরি যোগাযোগ'],
    mobileCols: 1,
    desktopCols: 2,
    adminOwned: true,
  },
  wifi: {
    category: 'wifi',
    route: '/wifi',
    title: 'ওয়াইফাই ও ইন্টারনেট',
    subtitle:
      'ময়মনসিংহের লোকাল ইন্টারনেট প্রদানকারীদের স্পিড, মাসিক দাম ও সার্ভিস এলাকা একসঙ্গে দেখুন।',
    placeholder: 'প্রোভাইডার, প্যাকেজ বা এলাকা লিখে খুঁজুন...',
    seoDescription:
      'ময়মনসিংহের লোকাল ওয়াইফাই ও ইন্টারনেট প্রদানকারীদের স্পিড, মাসিক দাম ও সার্ভিস এলাকা দেখুন, তারপর সঠিক প্যাকেজ বেছে নিন।',
    noun: 'প্রোভাইডার',
    searchNoun: 'ইন্টারনেট প্রদানকারী',
    highlights: ['স্পিড ও দাম স্পষ্ট', 'সার্ভিস এলাকা', 'অ্যাডমিন তালিকাভুক্ত'],
    mobileCols: 1,
    desktopCols: 2,
    adminOwned: true,
  },
  bus: {
    category: 'bus',
    route: '/bus-ticket',
    title: 'বাস টিকিট',
    subtitle:
      'ময়মনসিংহ থেকে বাইরে যাওয়ার বাসের তালিকা — গন্তব্য, ধরন ও ভাড়া অনুযায়ী খুঁজুন।',
    placeholder: 'গন্তব্য বা বাসের নাম লিখে খুঁজুন...',
    seoDescription:
      'ময়মনসিংহ থেকে বাইরে যাওয়ার বাসের তালিকা। গন্তব্য, বাসের ধরন ও এক-ওয়ে ভাড়া অনুযায়ী খুঁজুন।',
    noun: 'বাস',
    searchNoun: 'বাস',
    highlights: ['অ্যাডমিন তালিকাভুক্ত', 'ভাড়া স্পষ্ট', 'গন্তব্য অনুযায়ী খোঁজা'],
    mobileCols: 2,
    desktopCols: 4,
    adminOwned: true,
  },
  vehicle: {
    category: 'vehicle',
    route: '/gari-auto-cng',
    title: 'গাড়ী, অটো ও CNG',
    subtitle:
      'ময়মনসিংহে ভাড়ায় পাওয়া যাচ্ছে এমন গাড়ি, অটো ও CNG দেখুন এবং সরাসরি অনুরোধ পাঠান।',
    placeholder: 'গাড়ির ধরন, মডেল বা এলাকা লিখে খুঁজুন...',
    seoDescription:
      'ময়মনসিংহে ভাড়ায় পাওয়া যাচ্ছে এমন গাড়ি, অটো ও CNG-এর তালিকা। সক্ষমতা ও ফিচার দেখে সরাসরি ভাড়ার অনুরোধ পাঠান।',
    noun: 'যান',
    searchNoun: 'যান',
    highlights: ['ভাড়ার অনুরোধ পাঠান', 'সক্ষমতা ও ফিচার', 'অ্যাডমিন তালিকাভুক্ত'],
    mobileCols: 2,
    desktopCols: 4,
    adminOwned: true,
  },
};

/** Tailwind grid class for a category's card layout. */
export function categoryGridClass(ui: CategoryUiConfig): string {
  const mobile: Record<GridColumns, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2',
    4: 'grid-cols-2',
    5: 'grid-cols-2',
  };
  const desktop: Record<GridColumns, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
  };
  return `grid gap-2.5 sm:gap-3 ${mobile[ui.mobileCols]} md:grid-cols-3 ${desktop[ui.desktopCols]}`;
}

/** Emergency page configuration. */
export interface EmergencyUiConfig {
  service: EmergencyService;
  route: string;
  title: string;
  subtitle: string;
  noun: string;
  placeholder: string;
  highlights: string[];
  /**
   * Shown under the list on every emergency page.
   *
   * The point is to stop a reader treating a curated directory as a guarantee:
   * a station's published line can be busy, and a real emergency may need the
   * national control room. This states that plainly instead of leaving the
   * reader to assume the first number they see is the only option.
   */
  disclaimer: string;
}

export const EMERGENCY_UI: Record<EmergencyService, EmergencyUiConfig> = {
  doctor: {
    service: 'doctor',
    route: '/doctor',
    title: 'ডাক্তার',
    subtitle:
      'ময়মনসিংহে চিকিৎসা সেবা দেওয়া প্রতিষ্ঠান ও চিকিৎসকদের তালিকা — যোগাযোগের তথ্য সরাসরি।',
    noun: 'চিকিৎসক',
    placeholder: 'ডাক্তার, প্রতিষ্ঠান বা এলাকা লিখে খুঁজুন...',
    highlights: ['অ্যাডমিন যাচাইকৃত তথ্য', 'সরাসরি যোগাযোগ', 'এলাকাভিত্তিক তালিকা'],
    disclaimer:
      'জরুরি অবস্থায় প্রথমে নিকটস্থ হাসপাতালের জরুরি বিভাগে যোগাযোগ করুন। জীবনঘাতী জরুরি ক্ষেত্রে জাতীয় জরুরি নম্বর ৯৯৯-এ কল করুন।',
  },
  police: {
    service: 'police',
    route: '/police',
    title: 'পুলিশ',
    subtitle: 'ময়মনসিংহের থানা ও নিরাপত্তা সেবার তালিকা — ঠিকানা ও ফোন নম্বর সহ।',
    noun: 'থানা',
    placeholder: 'থানা বা এলাকা লিখে খুঁজুন...',
    highlights: ['অ্যাডমিন যাচাইকৃত তথ্য', 'সরাসরি যোগাযোগ', 'এলাকাভিত্তিক তালিকা'],
    disclaimer:
      'জরুরি অবস্থায় প্রথমে নিকটস্থ থানায় যোগাযোগ করুন। প্রাণঘাতী বা বড় ঝুঁকির পরিস্থিতিতে জাতীয় নিয়ন্ত্রণ কক্ষে কল করুন।',
  },
  ambulance: {
    service: 'ambulance',
    route: '/ambulance',
    title: 'অ্যাম্বুলেন্স',
    subtitle: 'ময়মনসিংহে রোগী পরিবহন সেবা দেওয়া প্রতিষ্ঠানের তালিকা।',
    noun: 'অ্যাম্বুলেন্স সেবা',
    placeholder: 'সেবা, প্রতিষ্ঠান বা এলাকা লিখে খুঁজুন...',
    highlights: ['অ্যাডমিন যাচাইকৃত তথ্য', 'সরাসরি যোগাযোগ', 'এলাকাভিত্তিক তালিকা'],
    disclaimer:
      'রোগী পরিবহনের জন্য প্রথমে স্থানীয় সেবা প্রদানকারীকে কল করুন। সেবা না পেলে জাতীয় জরুরি সেবা নম্বরে কল করুন।',
  },
  fire_service: {
    service: 'fire_service',
    route: '/fire-service',
    title: 'ফায়ার সার্ভিস',
    subtitle: 'ময়মনসিংহে অগ্নিনির্বাপণ ও উদ্ধার সেবার তালিকা।',
    noun: 'ফায়ার ইউনিট',
    placeholder: 'ফায়ার ইউনিট বা এলাকা লিখে খুঁজুন...',
    highlights: ['অ্যাডমিন যাচাইকৃত তথ্য', 'সরাসরি যোগাযোগ', 'এলাকাভিত্তিক তালিকা'],
    disclaimer:
      'অগ্নিকাণ্ড বা উদ্ধারের প্রয়োজনে প্রথমে নিকটস্থ ফায়ার ইউনিটে কল করুন, সঙ্গে সঙ্গে নিকটস্থ থানায়ও জানান।',
  },
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

/**
 * Bangla numerals.
 *
 * Deliberately hand-rolled instead of `toLocaleString('bn-BD')`: Node and the
 * browser ship different ICU data, so Intl output is a hydration mismatch.
 */
export function toBn(value: string | number): string {
  return String(value).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** `৳১,২০০` — thousands-separated Bangla taka. */
export function bnTaka(value?: number): string {
  if (value == null || Number.isNaN(value)) return '';
  const grouped = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `৳${toBn(grouped)}`;
}

/** A taka range, collapsed when both ends are equal. */
export function bnTakaRange(min?: number, max?: number): string | undefined {
  if (min == null && max == null) return undefined;
  if (min != null && max != null) {
    return min === max ? bnTaka(min) : `${bnTaka(min)} – ${bnTaka(max)}`;
  }
  if (min != null) return `${bnTaka(min)}+`;
  return `${bnTaka(max)}`;
}

/** Bangla month names, indexed 0-11. */
const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

/**
 * `YYYY-MM-DD` → `১৫ জানুয়ারি ২০২৬`.
 *
 * The string is split by hand rather than run through `new Date(...)`: parsing a
 * bare date as UTC and formatting it in a local zone shifts the day backwards for
 * anyone west of Greenwich, and `Intl` output differs between Node and the
 * browser. Returns `undefined` for anything that is not a real calendar date, so
 * a bad stored value shows as a missing fact rather than a wrong one.
 */
export function bnDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11) return undefined;
  if (day < 1 || day > 31) return undefined;
  return `${toBn(day)} ${BN_MONTHS[month]} ${toBn(year)}`;
}

/** Human label for a set of area ids, e.g. "চরপাড়া, টাউন হল". */
export function areaNames(areaIds: string[]): string {
  if (!areaIds || areaIds.length === 0) return '';
  const byId = new Map(getAllMCCAreas().map((a) => [a.id, a.nameBn]));
  const names = areaIds
    .map((id) => byId.get(id))
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return '';
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${toBn(names.length - 2)}টি`;
}

/**
 * A minimal, readable, URL-safe slug from Bangla or English text.
 *
 * Bangla has no usable Latin transliteration here, so the Bangla characters are
 * dropped and the result may be empty. Callers must therefore guarantee a
 * unique suffix rather than trusting the title to produce a slug.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

/** Guarantees a non-empty, unique-enough slug even for all-Bangla titles. */
export function uniqueSlug(input: string, fallback: string): string {
  const base = slugify(input);
  const seed = base || slugify(fallback) || 'item';
  return `${seed}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Tag vocabulary resolution
// ---------------------------------------------------------------------------

/**
 * Every taxonomy id above, flattened into one lookup.
 *
 * `service_listings.tags` is a single `TEXT[]` shared by every curated
 * category, and the curated facets (a coaching centre's class and subject) have
 * to match against it. Storing the taxonomy *slug* in that array is what makes
 * those facets work; the Bangla label lives here so the UI never has to print
 * a raw slug at a reader.
 *
 * A slug can legitimately appear in more than one taxonomy (`hsc` is both a
 * class and a centre type). They agree on the label, and first-wins keeps the
 * map deterministic.
 */
const TAG_LABELS: Map<string, string> = (() => {
  const map = new Map<string, string>();
  const taxonomies: { id: string; labelBn: string }[][] = [
    COACHING_CLASSES,
    COACHING_SUBJECTS,
    COACHING_CATEGORIES,
    BUS_TYPES,
    JOB_TYPES,
    JOB_EXPERIENCE,
    JOB_EDUCATION,
    MARKET_CATEGORIES,
    MARKET_CONDITIONS,
  ];
  for (const taxonomy of taxonomies) {
    for (const entry of taxonomy) {
      if (!map.has(entry.id)) map.set(entry.id, entry.labelBn);
    }
  }
  return map;
})();

/**
 * Resolves a stored tag to something displayable and searchable.
 *
 * Unknown values pass through unchanged on purpose: admins may add a free-text
 * tag ("ঈদ ভাড়া", "ভরী ক্যাম্প"), and hiding or mangling that would be worse than
 * showing it verbatim.
 */
export function tagLabel(tag: string): string {
  return TAG_LABELS.get(tag) ?? tag;
}

/** A listing's tags, resolved for display and for the search index. */
export function tagLabels(tags?: string[] | null): string[] {
  return (tags ?? []).filter(Boolean).map(tagLabel);
}
