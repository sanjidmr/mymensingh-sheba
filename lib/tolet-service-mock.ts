/**
 * In-memory mock store for To-Let system.
 * Used when Supabase is not configured (preview mode).
 * Seeded from SAMPLE_TOLET_LISTINGS with isVerified=false (no fake verification).
 */
import { SAMPLE_TOLET_LISTINGS } from './services-data';
import type {
  ToletListing,
  ToletListingInput,
  ToletRequest,
  ToletRequestInput,
  ToletRequestStatus,
  ListingReport,
  ListingReportStatus,
} from './tolet-types';
import type { ToletFeeRules } from './tolet-fees';
import { getToletFeeRules } from './tolet-fees';
import type { ToletPropertyType } from './tolet-types';

const FACILITY_MAP: Record<string, string> = {
  'লিফট': 'lift',
  'লিফট ও জেনারেটর': 'generator',
  'তিতাস লাইন গ্যাস': 'gas',
  'তিতাস গ্যাস': 'gas',
  'সিলিন্ডার গ্যাস': 'cylinder',
  'জেনারেটর ব্যাকআপ': 'generator',
  'সিসিটিভি নিরাপত্তা': 'cctv',
  'সার্বক্ষণিক সিকিউরিটি গার্ড': 'cctv',
  'কার পার্কিং': 'parking',
  'মোটরসাইকেল পার্কিং': 'parking',
  'গ্যাস সংযোগ': 'gas',
  'গ্যাস সুবিধা': 'gas',
  'ওয়াইফাই ইন্টারনেট': 'wifi',
  'মিল সিস্টেম': 'mill',
  'ফিল্টার খাওয়ার পানি': 'water_purifier',
  'বুয়া সুবিধা': 'service',
  '২৪ ঘণ্টা পানি': 'water',
  '২৪ ঘণ্টা বিদ্যুৎ': 'power_backup',
  'খোলা বারান্দা': 'balcony',
  'পার্কিং স্পেস': 'parking',
  'মোটর পানি সুবিধা': 'water',
  'আলাদা বাথরুম': 'private_bath',
  'বারান্দা': 'balcony',
  'কিচেন শেয়ারিং': 'shared_kitchen',
  'খোলামেলা ছাদ': 'rooftop',
};

function mapSampleFacility(text: string): string {
  return FACILITY_MAP[text] || text;
}

function computeFee(rent: number, type: string): { fee: number; total: number } {
  const r = getToletFeeRules();
  const MESS = ['mess', 'hostel', 'seat'];
  let fee: number;
  if (MESS.includes(type)) {
    fee = r.messSeatFee;
  } else if (rent <= 10000) {
    fee = r.tier1Max10k;
  } else if (rent <= 20000) {
    fee = r.tier2Max20k;
  } else {
    fee = r.tier3Above20k;
  }
  return { fee, total: rent + fee };
}

let listings: ToletListing[] = SAMPLE_TOLET_LISTINGS.map((s) => {
  const { fee, total } = computeFee(s.rentAmount, s.propertyType);
  return {
    id: s.id,
    ownerId: 'demo-owner',
    ownerName: 'নমুনা মালিক',
    ownerVerified: false,
    title: s.titleBn,
    propertyType: s.propertyType as ToletPropertyType,
    areaId: s.areaId,
    specificAddress: s.specificAddressBn,
    rentPrice: s.rentAmount,
    bedrooms: s.bedrooms,
    bathrooms: s.bathrooms,
    balconies: s.balconies,
    floor: s.floor,
    totalRooms: undefined,
    availableFrom: s.availableFromBn,
    facilities: s.facilitiesBn.map(mapSampleFacility),
    description: s.descriptionBn,
    photos: [s.imageUrl],
    isVerified: false,
    status: 'approved' as const,
    rejectionReason: undefined,
    createdAt: '2026-09-20T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
    publishedAt: '2026-09-20T00:00:00Z',
  };
});

let requests: ToletRequest[] = [];
let reports: ListingReport[] = [];
let requestSeq = 0;
let reportSeq = 0;

// ---- Listings ----

export function mockFetchPublicListings(): ToletListing[] {
  return listings.filter((l) => l.status === 'approved');
}

export function mockFetchListingById(id: string): ToletListing | undefined {
  return listings.find((l) => l.id === id);
}

export function mockFetchMyListings(ownerId: string): ToletListing[] {
  return listings
    .filter((l) => l.ownerId === ownerId)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function mockCreateListing(
  input: ToletListingInput,
  ownerId: string,
  ownerName: string,
  ownerVerified: boolean,
  status: 'draft' | 'pending_review' = 'pending_review'
): ToletListing {
  const now = new Date().toISOString();
  const listing: ToletListing = {
    id: `lt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ownerId,
    ownerName,
    ownerVerified,
    ...input,
    isVerified: false,
    status,
    rejectionReason: undefined,
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
  };
  listings.unshift(listing);
  return listing;
}

export function mockUpdateListingOwned(
  listingId: string,
  ownerId: string,
  input: Partial<ToletListingInput>,
  status?: 'draft' | 'pending_review'
): ToletListing | null {
  const idx = listings.findIndex((l) => l.id === listingId && l.ownerId === ownerId);
  if (idx === -1) return null;
  const existing = listings[idx];
  if (existing.status !== 'draft' && existing.status !== 'pending_review' && existing.status !== 'archived' && existing.status !== 'unavailable' && existing.status !== 'approved' && existing.status !== 'rejected') return null;
  const now = new Date().toISOString();
  const updated: ToletListing = {
    ...existing,
    ...input,
    status: status || existing.status,
    rejectionReason: status === 'pending_review' ? undefined : existing.rejectionReason,
    updatedAt: now,
  };
  listings[idx] = updated;
  return updated;
}

export function mockAdminFetchListings(statusFilter?: string | null): ToletListing[] {
  if (statusFilter && statusFilter !== 'all') {
    return listings.filter((l) => l.status === statusFilter);
  }
  return [...listings].sort((a, b) => {
    if (a.status === 'pending_review' && b.status !== 'pending_review') return -1;
    if (b.status === 'pending_review' && a.status !== 'pending_review') return 1;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });
}

export function mockAdminFetchListingById(listingId: string): ToletListing | null {
  return listings.find((l) => l.id === listingId) || null;
}

export function mockAdminUpdateListing(
  listingId: string,
  patch: Partial<ToletListing>
): ToletListing | null {
  const idx = listings.findIndex((l) => l.id === listingId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  const updated: ToletListing = {
    ...listings[idx],
    ...patch,
    updatedAt: now,
    publishedAt:
      patch.status === 'approved' && listings[idx].status !== 'approved'
        ? now
        : listings[idx].publishedAt,
  };
  listings[idx] = updated;
  return updated;
}

// ---- Requests ----

export function mockCreateToletRequest(
  input: ToletRequestInput,
  listingTitle?: string
): ToletRequest {
  const now = new Date().toISOString();
  const req: ToletRequest = {
    id: `rq-${++requestSeq}`,
    ...input,
    listingTitle: listingTitle || '',
    status: 'submitted',
    createdAt: now,
  };
  requests.unshift(req);
  return req;
}

export function mockFetchToletRequestsAsCustomer(customerId: string): ToletRequest[] {
  return requests.filter((r) => r.customerId === customerId);
}

export function mockFetchToletRequestsAsOwner(ownerId: string): ToletRequest[] {
  const ownerListingIds = new Set(listings.filter((l) => l.ownerId === ownerId).map((l) => l.id));
  return requests
    .filter((r) => ownerListingIds.has(r.listingId))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function mockFetchRequestsForListing(listingId: string): ToletRequest[] {
  return requests.filter((r) => r.listingId === listingId);
}

export function mockUpdateToletRequestStatus(
  requestId: string,
  newStatus: ToletRequestStatus
): ToletRequest | null {
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return null;
  requests[idx] = { ...requests[idx], status: newStatus };
  return requests[idx];
}

// ---- Reports ----

export function mockCreateListingReport(
  listingId: string,
  reporterId: string | null,
  reporterName: string,
  reason: string,
  details?: string
): ListingReport {
  const now = new Date().toISOString();
  const report: ListingReport = {
    id: `rp-${++reportSeq}`,
    listingId,
    reporterId,
    reporterName,
    reason,
    details,
    status: 'open',
    createdAt: now,
  };
  reports.unshift(report);
  return report;
}

export function mockAdminFetchReports(): ListingReport[] {
  return [...reports].sort(
    (a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

export function mockAdminUpdateReportStatus(
  reportId: string,
  newStatus: ListingReportStatus
): ListingReport | null {
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx === -1) return null;
  reports[idx] = { ...reports[idx], status: newStatus };
  return reports[idx];
}

export function mockGetReportsForListing(listingId: string): ListingReport[] {
  return reports.filter((r) => r.listingId === listingId);
}