/**
 * To-Let System Domain Types
 */

export type ToletPropertyType =
  | 'flat'
  | 'room'
  | 'sublet'
  | 'family'
  | 'bachelor'
  | 'mess'
  | 'hostel'
  | 'seat';

export const TOLET_PROPERTY_TYPE_INFO: Record<
  ToletPropertyType,
  { labelBn: string; shortLabelBn: string; isMessLike: boolean }
> = {
  flat: { labelBn: 'স্ট্যান্ডার্ড ফ্ল্যাট', shortLabelBn: 'ফ্ল্যাট', isMessLike: false },
  room: { labelBn: 'আলাদা রুম', shortLabelBn: 'রুম', isMessLike: false },
  sublet: { labelBn: 'সাবলেট রুম', shortLabelBn: 'সাবলেট', isMessLike: false },
  family: { labelBn: 'ফ্যামিলি ফ্ল্যাট', shortLabelBn: 'ফ্যামিলি', isMessLike: false },
  bachelor: { labelBn: 'ব্যাচেলর বাসা', shortLabelBn: 'ব্যাচেলর', isMessLike: false },
  mess: { labelBn: 'মেস রুম', shortLabelBn: 'মেস', isMessLike: true },
  hostel: { labelBn: 'হোস্টেল সিট', shortLabelBn: 'হোস্টেল', isMessLike: true },
  seat: { labelBn: 'মেস সিট ভাড়া', shortLabelBn: 'সিট', isMessLike: true },
};

export type ToletListingStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'unavailable'
  | 'suspended'
  | 'archived';

export const TOLET_LISTING_STATUS_INFO: Record<
  ToletListingStatus,
  { labelBn: string; badgeClass: string }
> = {
  draft: { labelBn: 'খসড়া', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  pending_review: {
    labelBn: 'যাচাইয়ের অপেক্ষায়',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  approved: { labelBn: 'প্রকাশিত', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  rejected: { labelBn: 'প্রত্যাখ্যাত', badgeClass: 'bg-rose-50 text-rose-900 border-rose-200' },
  unavailable: { labelBn: 'অনুপলব্ধ', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
  suspended: { labelBn: 'স্থগিত', badgeClass: 'bg-orange-50 text-orange-900 border-orange-200' },
  archived: { labelBn: 'আর্কাইভ করা', badgeClass: 'bg-slate-100 text-slate-500 border-slate-200' },
};

/**
 * Extra, non-sensitive information about the person who posted a listing.
 * Optional: real listings usually leave it empty and the UI falls back to a
 * generic "বিজ্ঞাপনদাতা" label rather than inventing a bio.
 */
export interface ToletOwnerMeta {
  /** Two-letter avatar fallback, e.g. 'সা'. */
  initials: string;
  roleLabelBn: string;
  memberSinceBn: string;
  /** True for seeded demo content, so the UI can label it as a sample. */
  isDemo?: boolean;
}

export interface ToletListing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerVerified: boolean;
  ownerMeta?: ToletOwnerMeta;
  title: string;
  propertyType: ToletPropertyType;
  areaId: string;
  specificAddress: string;
  rentPrice: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  floor?: string;
  totalRooms?: number;
  availableFrom?: string;
  facilities: string[];
  /**
   * Facilities the owner explicitly says are NOT included. Rendered as a
   * separate "এই বাসায় যা নেই" panel so a tenant is not left guessing about
   * gas, lift or parking. Optional — most listings simply omit it.
   */
  unavailableFacilities?: string[];
  description: string;
  photos: string[];
  isVerified: boolean;
  status: ToletListingStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ToletListingInput {
  title: string;
  propertyType: ToletPropertyType;
  areaId: string;
  specificAddress: string;
  rentPrice: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  floor?: string;
  totalRooms?: number;
  availableFrom?: string;
  facilities: string[];
  unavailableFacilities?: string[];
  description: string;
  photos: string[];
}

// ---------------------------------------------------------------------------
// Contact / engagement tracking
// ---------------------------------------------------------------------------

/**
 * Every meaningful action a visitor takes on a listing detail page.
 *
 * Note on `call_click`: it records the BUTTON PRESS, not whether a call was
 * actually answered — the platform has no way to know the latter. Analytics
 * copy must therefore say "কল বাটন চাপা হয়েছে", never "কল হয়েছে".
 */
export type ToletEventType =
  | 'view'
  | 'call_click'
  | 'whatsapp_click'
  | 'favorite'
  | 'share';

/** Where on the page an event was fired from — lets the admin panel compare
 *  the sticky mobile bar against the desktop sidebar. */
export type ToletEventSource = 'detail_page' | 'sticky_bar' | 'card';

export interface ToletEventInput {
  listingId: string;
  eventType: ToletEventType;
  source?: ToletEventSource;
  /** Signed-in user, when there is one. Guests record `null`. */
  userId?: string | null;
  /** Denormalised so per-property analytics survives a listing deletion. */
  areaId?: string;
  propertyType?: string;
  rentPrice?: number;
}

/**
 * Rolled-up counters for one property. This is exactly the shape the admin
 * panel needs, so the future console only has to render rows.
 */
export interface ToletListingStats {
  listingId: string;
  views: number;
  callClicks: number;
  whatsappClicks: number;
  favorites: number;
  shares: number;
  /** callClicks + whatsappClicks — the number that decides "is this listing hot". */
  contactClicks: number;
  /** Distinct visitors (anon id or user id) that produced any event. */
  uniqueVisitors: number;
  lastActivityAt: string | null;
}

export const TOLET_EVENT_TYPE_INFO: Record<ToletEventType, { labelBn: string }> = {
  view: { labelBn: 'বিজ্ঞাপন দেখা হয়েছে' },
  call_click: { labelBn: 'কল বাটন চাপা হয়েছে' },
  whatsapp_click: { labelBn: 'হোয়াটসঅ্যাপ বাটন চাপা হয়েছে' },
  favorite: { labelBn: 'পছন্দ তালিকায় যুক্ত হয়েছে' },
  share: { labelBn: 'শেয়ার করা হয়েছে' },
};

export type ToletRequestStatus = 'submitted' | 'contacted' | 'completed' | 'cancelled';

export const TOLET_REQUEST_STATUS_INFO: Record<
  ToletRequestStatus,
  { labelBn: string; badgeClass: string }
> = {
  submitted: { labelBn: 'অপেক্ষমাণ', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200' },
  contacted: { labelBn: 'যোগাযোগ হয়েছে', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
  completed: { labelBn: 'সম্পন্ন হয়েছে', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
  cancelled: { labelBn: 'বাতিল করা হয়েছে', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export interface ToletRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  areaId?: string;
  message?: string;
  preferredTime?: string;
  status: ToletRequestStatus;
  createdAt: string;
}

export interface ToletRequestInput {
  listingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  areaId?: string;
  message?: string;
  preferredTime?: string;
}

// Must match the listing_reports status CHECK constraint in the schema.
export type ListingReportStatus = 'open' | 'resolved' | 'dismissed';

export const LISTING_REPORT_STATUS_INFO: Record<ListingReportStatus, { labelBn: string }> = {
  open: { labelBn: 'উন্মুক্ত' },
  resolved: { labelBn: 'সমাধান হয়েছে' },
  dismissed: { labelBn: 'অগ্রাহ্য' },
};

export interface ListingReport {
  id: string;
  listingId: string;
  reporterId?: string | null;
  reporterName?: string;
  reason: string;
  details?: string;
  status: ListingReportStatus;
  createdAt: string;
}

export interface ToletFilters {
  search?: string;
  areaId?: string;
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  bedrooms?: string;
  bathrooms?: string;
  facilities?: string[];
  availability?: string;
}