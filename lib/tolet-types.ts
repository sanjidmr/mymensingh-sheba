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

export interface ToletListing {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerVerified: boolean;
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
  description: string;
  photos: string[];
}

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

export type ListingReportStatus = 'open' | 'reviewed' | 'resolved' | 'dismissed';

export const LISTING_REPORT_STATUS_INFO: Record<ListingReportStatus, { labelBn: string }> = {
  open: { labelBn: 'উন্মুক্ত' },
  reviewed: { labelBn: 'পর্যালোচিত' },
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