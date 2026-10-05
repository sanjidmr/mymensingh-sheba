/**
 * In-memory mock store for To-Let system.
 * Used when Supabase is not configured, or as a graceful fallback when the
 * Supabase query fails (e.g. the migration has not been applied yet).
 *
 * Seeded from DEMO_TOLET_LISTINGS — the same showcase inventory the detail
 * page renders — so preview mode, the owner wizard and the detail page all
 * describe an identical set of homes. Seeded with isVerified=false (no fake
 * verification).
 */
import { DEMO_TOLET_LISTINGS } from './tolet-demo-data';
import type {
  ToletListing,
  ToletListingInput,
  ToletRequest,
  ToletRequestInput,
  ToletRequestStatus,
  ListingReport,
  ListingReportStatus,
} from './tolet-types';

/**
 * Clone the showcase seed so the store is mutable per browser session (owners
 * can edit/archive their own demo listings without corrupting the seed).
 *
 * The platform fee is deliberately NOT precomputed here — `lib/tolet-fees.ts`
 * is the single source of truth and every surface calls it live, so a fee-rule
 * change can never leave a stale total baked into a cached row.
 */
let listings: ToletListing[] = DEMO_TOLET_LISTINGS.map((seed) => ({
  ...seed,
  facilities: [...seed.facilities],
  unavailableFacilities: seed.unavailableFacilities
    ? [...seed.unavailableFacilities]
    : undefined,
  photos: [...seed.photos],
}));

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