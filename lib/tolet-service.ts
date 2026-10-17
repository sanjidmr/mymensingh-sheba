/**
 * To-Let System data layer facade.
 * Uses Supabase when configured; otherwise falls back to the in-memory mock store.
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { toCamelObject, toSnakeObject } from './supabase/transform';
import type {
  ToletListing,
  ToletListingInput,
  ToletRequest,
  ToletRequestInput,
  ToletRequestStatus,
  ListingReport,
  ListingReportStatus,
} from './tolet-types';
import {
  mockFetchPublicListings,
  mockFetchListingById,
  mockFetchMyListings,
  mockCreateListing,
  mockUpdateListingOwned,
  mockSetOwnListingVisibility,
  mockDeleteOwnListing,
  mockAdminFetchListings,
  mockAdminFetchListingById,
  mockAdminUpdateListing,
  mockCreateToletRequest,
  mockFetchToletRequestsAsCustomer,
  mockFetchToletRequestsAsOwner,
  mockFetchRequestsForListing,
  mockUpdateToletRequestStatus,
  mockCreateListingReport,
  mockAdminFetchReports,
  mockAdminUpdateReportStatus,
  mockGetReportsForListing,
} from './tolet-service-mock';
import { notifyCustomer, notifyAdminHub } from './notification-service';
import { mockTrackListingMeta } from './tolet-tracking';
import { DEMO_TOLET_LISTINGS, getDemoListing } from './tolet-demo-data';

export const toletStorageConfigured = isSupabaseConfigured;
const LISTING_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Row mapping helpers
// ---------------------------------------------------------------------------

interface RawOwner {
  full_name?: string | null;
  is_verified?: boolean | null;
  phone?: string | null;
}

interface RawListingRow {
  [key: string]: unknown;
  owner?: RawOwner | null;
}

function mapListingRow(row: RawListingRow): ToletListing {
  const c = toCamelObject(row) as Record<string, unknown>;
  const owner = row.owner || null;
  const isDemo = typeof c.id === 'string' && c.id.startsWith('demo-');
  return {
    id: c.id as string,
    ownerId: (c.ownerId as string) || 'demo-owner',
    ownerName:
      (owner?.full_name as string) || (isDemo ? 'নমুনা মালিক' : '') || (c.ownerName as string) || '',
    ownerVerified: Boolean(owner?.is_verified ?? c.ownerVerified ?? false),
    ownerPhone: (owner?.phone as string) || (c.ownerPhone as string) || undefined,
    title: (c.title as string) || '',
    propertyType: (c.propertyType as ToletListing['propertyType']) || 'flat',
    areaId: (c.areaId as string) || '',
    specificAddress: (c.specificAddress as string) || '',
    rentPrice: Number(c.rentPrice ?? 0),
    bedrooms: Number(c.bedrooms ?? 0),
    bathrooms: Number(c.bathrooms ?? 0),
    balconies: Number(c.balconies ?? 0),
    floor: (c.floor as string) || undefined,
    totalRooms: c.totalRooms != null ? Number(c.totalRooms) : undefined,
    availableFrom: (c.availableFrom as string) || undefined,
    facilities: Array.isArray(c.facilities) ? (c.facilities as string[]) : [],
    unavailableFacilities: Array.isArray(c.unavailableFacilities)
      ? (c.unavailableFacilities as string[])
      : undefined,
    description: (c.description as string) || '',
    photos: Array.isArray(c.photos) ? (c.photos as string[]) : [],
    isVerified: Boolean(c.isVerified),
    status: (c.status as ToletListing['status']) || 'draft',
    rejectionReason: (c.rejectionReason as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || '',
    publishedAt: (c.publishedAt as string) || undefined,
  };
}

async function attachApprovedListingPhones(
  client: NonNullable<ReturnType<typeof createClient>>,
  listings: ToletListing[]
): Promise<ToletListing[]> {
  const ids = listings
    .filter((listing) => listing.status === 'approved' && LISTING_UUID_PATTERN.test(listing.id))
    .map((listing) => listing.id);
  if (ids.length === 0) return listings;

  const { data, error } = await client.rpc('fn_public_tolet_listing_contacts', {
    p_listing_ids: ids,
  });
  if (error) throw new Error(`মালিকের যোগাযোগের তথ্য লোড ব্যর্থ হয়েছে: ${error.message}`);

  const phoneByListing = new Map<string, string>(
    (data ?? []).map(
      (row: { listing_id: string; phone: string }): [string, string] => [row.listing_id, row.phone]
    )
  );
  return listings.map((listing) => ({
    ...listing,
    ownerPhone: phoneByListing.get(listing.id) || undefined,
  }));
}

function mapRequestRow(row: Record<string, unknown>, listingTitle = ''): ToletRequest {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    listingId: (c.listingId as string) || '',
    listingTitle: (c.listingTitle as string) || listingTitle,
    customerId: (c.customerId as string) || '',
    customerName: (c.customerName as string) || '',
    customerPhone: (c.customerPhone as string) || '',
    areaId: (c.areaId as string) || undefined,
    message: (c.message as string) || undefined,
    preferredTime: (c.preferredTime as string) || undefined,
    status: (c.status as ToletRequest['status']) || 'submitted',
    createdAt: (c.createdAt as string) || '',
  };
}

function mapReportRow(row: Record<string, unknown>, reporterName = ''): ListingReport {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    listingId: (c.listingId as string) || '',
    reporterId: (c.reporterId as string | null) || null,
    reporterName: reporterName || '',
    reason: (c.reason as string) || '',
    details: (c.details as string) || undefined,
    status: (c.status as ListingReport['status']) || 'open',
    createdAt: (c.createdAt as string) || '',
  };
}

function toListingInputObject(input: Partial<ToletListingInput>): Record<string, unknown> {
  return toSnakeObject({
    title: input.title,
    propertyType: input.propertyType,
    areaId: input.areaId,
    specificAddress: input.specificAddress,
    rentPrice: input.rentPrice,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    balconies: input.balconies,
    floor: input.floor,
    totalRooms: input.totalRooms,
    availableFrom: input.availableFrom,
    facilities: input.facilities,
    unavailableFacilities: input.unavailableFacilities,
    description: input.description,
    photos: input.photos,
  });
}

// ---------------------------------------------------------------------------
// Showcase fallback
// ---------------------------------------------------------------------------
//
// A listing detail page is a design surface, and a design surface with nothing
// behind it teaches you nothing. The rules below are deliberately conservative:
//
//  - Deep links to a seeded showcase id ALWAYS resolve, so a demo listing can be
//    shared and opened from any entry point.
//  - The showcase appears in the DIRECTORY only while the live marketplace has
//    no approved listings. The moment a real listing is published, real
//    inventory replaces it entirely — showcase data never mixes with live
//    inventory, so a tenant is never shown a fake flat as if it were real.

/** Records label metadata so preview-mode analytics rows can name a listing. */
function rememberListingMeta(listing: ToletListing): void {
  mockTrackListingMeta(listing.id, {
    title: listing.title,
    areaId: listing.areaId,
    propertyType: listing.propertyType,
    rentPrice: listing.rentPrice,
  });
}

function withShowcaseFallback(realListings: ToletListing[]): ToletListing[] {
  const merged = realListings.length > 0 ? realListings : [...DEMO_TOLET_LISTINGS];
  merged.forEach(rememberListingMeta);
  return merged;
}

// ---------------------------------------------------------------------------
// Listing queries
// ---------------------------------------------------------------------------

export async function fetchPublicListings(): Promise<ToletListing[]> {
  // The demo showcase exists for local previews only. With Supabase configured
  // the directory shows real approvals alone — an empty table stays an empty
  // directory, never a fabricated one.
  if (!isSupabaseConfigured) return withShowcaseFallback(mockFetchPublicListings());
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('tolet_listings')
    .select('*, owner:profiles!tolet_listings_owner_id_fkey(full_name, is_verified)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) return [];
  const real = await attachApprovedListingPhones(
    client,
    (data || []).map((row) => mapListingRow(row as RawListingRow))
  );
  real.forEach(rememberListingMeta);
  return real;
}

export async function fetchListingById(id: string): Promise<ToletListing | null> {
  if (!isSupabaseConfigured) {
    const demo = getDemoListing(id);
    if (demo) {
      rememberListingMeta(demo);
      return demo;
    }
    return mockFetchListingById(id) || null;
  }
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('tolet_listings')
    .select('*, owner:profiles!tolet_listings_owner_id_fkey(full_name, is_verified)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  let listing = mapListingRow(data as RawListingRow);
  if (listing.status === 'approved' && LISTING_UUID_PATTERN.test(listing.id)) {
    [listing] = await attachApprovedListingPhones(client, [listing]);
  }
  rememberListingMeta(listing);
  return listing;
}

/**
 * "আপনার জন্য আরও কিছু বাসা" — related listings for the detail page.
 *
 * Scoring is intentionally simple and explainable rather than clever, because
 * a tenant can sanity-check it: same area first, then same property type, then
 * a rent that is close to this one's budget. Everything else is filler. The
 * property being viewed is always excluded.
 */
export async function fetchSimilarListings(
  listing: ToletListing,
  limit = 4
): Promise<ToletListing[]> {
  const pool = (await fetchPublicListings()).filter((l) => l.id !== listing.id);

  const score = (candidate: ToletListing): number => {
    let value = 0;
    if (candidate.areaId === listing.areaId) value += 100;
    if (candidate.propertyType === listing.propertyType) value += 40;
    // Within half a month's rent is "same budget"; within one month is close.
    const gap = Math.abs(candidate.rentPrice - listing.rentPrice);
    if (gap <= listing.rentPrice * 0.25) value += 25;
    else if (gap <= listing.rentPrice * 0.5) value += 10;
    // Prefer published over older stock when everything else is equal.
    if (candidate.publishedAt) value += 2;
    return value;
  };

  return pool
    .map((candidate) => ({ candidate, value: score(candidate) }))
    .sort((a, b) => b.value - a.value || b.candidate.rentPrice - a.candidate.rentPrice)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export async function fetchMyListings(ownerId: string, strict = false): Promise<ToletListing[]> {
  if (!isSupabaseConfigured) {
    if (strict) throw new Error('ডেটাবেস সংযোগ নেই। Supabase কনফিগারেশন যাচাই করুন।');
    return mockFetchMyListings(ownerId);
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error('Supabase সংযুক্ত নয়।');
    return [];
  }
  const { data, error } = await client
    .from('tolet_listings')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) {
    if (strict) throw new Error(`আপনার বাসাভাড়ার পোস্ট লোড করা যায়নি: ${error.message}`);
    return [];
  }
  return (data || []).map((row) => mapListingRow(row as RawListingRow));
}

// ---------------------------------------------------------------------------
// Listing mutations (owner)
// ---------------------------------------------------------------------------

export async function createListing(
  ownerId: string,
  ownerName: string,
  ownerVerified: boolean,
  input: ToletListingInput,
  mode: 'draft' | 'submit' = 'submit'
): Promise<{ success: boolean; listing?: ToletListing; error?: string }> {
  const targetStatus: 'draft' | 'pending_review' = mode === 'draft' ? 'draft' : 'pending_review';

  if (!isSupabaseConfigured) {
    const listing = mockCreateListing(input, ownerId, ownerName, ownerVerified, targetStatus);
    return { success: true, listing };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };

  const payload = {
    ...toListingInputObject(input),
    owner_id: ownerId,
    status: targetStatus,
  };
  const { data, error } = await client
    .from('tolet_listings')
    .insert(payload)
    .select('*')
    .single();
  if (error) return { success: false, error: error.message };
  return { success: true, listing: mapListingRow(data as RawListingRow) };
}

export async function updateListingOwned(
  listingId: string,
  ownerId: string,
  input: Partial<ToletListingInput>,
  mode: 'draft' | 'submit' = 'submit'
): Promise<{ success: boolean; listing?: ToletListing; error?: string }> {
  if (!isSupabaseConfigured) {
    const listing = mockUpdateListingOwned(
      listingId,
      ownerId,
      input,
      mode === 'draft' ? 'draft' : 'pending_review'
    );
    if (!listing) return { success: false, error: 'বিজ্ঞাপনটি পাওয়া যায়নি' };
    return { success: true, listing };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };

  const payload: Record<string, unknown> = toListingInputObject(input);
  if (mode === 'submit') {
    const existing = await fetchListingById(listingId);
    if (existing && (existing.status === 'rejected' || existing.status === 'draft' || existing.status === 'archived' || existing.status === 'unavailable')) {
      payload.status = 'pending_review';
    }
    if (payload.status === 'pending_review' && existing?.status !== 'pending_review') {
      payload.rejection_reason = null;
    }
  }

  const { data, error } = await client
    .from('tolet_listings')
    .update(payload)
    .eq('id', listingId)
    .eq('owner_id', ownerId)
    .select('*')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: 'বিজ্ঞাপনটি পাওয়া যায়নি' };
  return { success: true, listing: mapListingRow(data as RawListingRow) };
}

export async function archiveOwnListing(
  listingId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const updated = mockSetOwnListingVisibility(listingId, ownerId, 'archive');
    if (!updated) return { success: false, error: 'বিজ্ঞাপন পাওয়া যায়নি' };
    return { success: true };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data, error } = await client.rpc('fn_set_my_tolet_visibility', {
    p_listing_id: listingId,
    p_action: 'archive',
  });
  if (error) return { success: false, error: error.message };
  if (data !== 'archived') return { success: false, error: 'বিজ্ঞাপনটি আর্কাইভ করা নিশ্চিত হয়নি।' };
  return { success: true };
}

export async function restoreOwnListing(
  listingId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const updated = mockSetOwnListingVisibility(listingId, ownerId, 'restore');
    if (!updated) {
      return {
        success: false,
        error: 'বিজ্ঞাপনটি যাচাইয়ের জন্য প্রস্তুত নয়। তথ্য সম্পাদনা করে আবার চেষ্টা করুন।',
      };
    }
    return { success: true };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data, error } = await client.rpc('fn_set_my_tolet_visibility', {
    p_listing_id: listingId,
    p_action: 'restore',
  });
  if (error) return { success: false, error: error.message };
  if (data !== 'pending_review') {
    return { success: false, error: 'বিজ্ঞাপনটি পুনরায় পাঠানো নিশ্চিত হয়নি।' };
  }
  return { success: true };
}

function ownedListingStoragePath(photo: string, ownerId: string): string | null {
  const marker = '/storage/v1/object/public/listings/';
  let path = photo;
  const markerIndex = photo.indexOf(marker);
  if (markerIndex >= 0) path = photo.slice(markerIndex + marker.length);
  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }
  const parts = path.split('/');
  if (parts[0] !== ownerId || parts.some((part) => !part || part === '.' || part === '..')) {
    return null;
  }
  return path;
}

export async function permanentlyDeleteOwnListing(
  listingId: string,
  ownerId: string
): Promise<{ success: boolean; error?: string; warning?: string }> {
  if (!isSupabaseConfigured) {
    return mockDeleteOwnListing(listingId, ownerId)
      ? { success: true }
      : { success: false, error: 'বিজ্ঞাপনটি পাওয়া যায়নি অথবা এটি আপনার নয়।' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };

  const { data, error } = await client.rpc('fn_delete_my_tolet_listing', {
    p_listing_id: listingId,
  });
  if (error) return { success: false, error: error.message };
  if (!Array.isArray(data)) {
    return { success: false, error: 'বিজ্ঞাপনটি মুছে ফেলা নিশ্চিত করা যায়নি।' };
  }

  const photos = (data as unknown[]).filter((photo): photo is string => typeof photo === 'string');
  const candidatePaths = [...new Set(
    photos.flatMap((photo) =>
      typeof photo === 'string'
        ? [ownedListingStoragePath(photo, ownerId)].filter((path): path is string => Boolean(path))
        : []
    )
  )];
  if (candidatePaths.length === 0) {
    return photos.length > 0
      ? { success: true, warning: 'বিজ্ঞাপন মুছে গেছে, তবে মালিকের নিরাপদ স্টোরেজ পাথ হিসেবে যাচাই করা যায়নি বলে ছবিগুলো রাখা হয়েছে।' }
      : { success: true };
  }

  const { data: remaining, error: referenceError } = await client
    .from('tolet_listings')
    .select('photos')
    .eq('owner_id', ownerId);
  if (referenceError) {
    return {
      success: true,
      warning: 'বিজ্ঞাপন মুছে গেছে, তবে অন্য বিজ্ঞাপনে ব্যবহৃত হতে পারে বলে ছবিগুলোর স্টোরেজ পরিষ্কার করা যায়নি।',
    };
  }
  const stillUsed = new Set(
    (remaining ?? []).flatMap((row) =>
      Array.isArray(row.photos) ? row.photos.filter((photo): photo is string => typeof photo === 'string') : []
    )
  );
  const unusedPaths = candidatePaths.filter((path) => {
    const matchingPhoto = photos.find(
      (photo) => typeof photo === 'string' && ownedListingStoragePath(photo, ownerId) === path
    );
    return typeof matchingPhoto === 'string' && !stillUsed.has(matchingPhoto);
  });
  if (unusedPaths.length === 0) {
    return {
      success: true,
      warning: 'বিজ্ঞাপন মুছে গেছে, তবে অন্য বিজ্ঞাপনে ব্যবহৃত হতে পারে বলে ছবিগুলো নিরাপদে রাখা হয়েছে।',
    };
  }

  const { error: storageError } = await client.storage.from('listings').remove(unusedPaths);
  if (storageError) {
    return {
      success: true,
      warning: `বিজ্ঞাপন মুছে গেছে, তবে কিছু ছবি স্টোরেজ থেকে সরানো যায়নি: ${storageError.message}`,
    };
  }
  return unusedPaths.length < candidatePaths.length
    ? {
        success: true,
        warning: 'বিজ্ঞাপন ও অব্যবহৃত ছবি মুছে গেছে; অন্য বিজ্ঞাপনে ব্যবহৃত ছবিগুলো রাখা হয়েছে।',
      }
    : { success: true };
}

// ---------------------------------------------------------------------------
// Listing mutations (admin)
// ---------------------------------------------------------------------------

export async function adminFetchListings(statusFilter?: string | null): Promise<ToletListing[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; বাসা ভাড়ার তালিকা লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const q = client.from('tolet_listings').select('*');
  if (statusFilter && statusFilter !== 'all') q.eq('status', statusFilter);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw new Error(`বাসা ভাড়ার তালিকা লোড ব্যর্থ হয়েছে: ${error.message}`);
  return (data || []).map((row) => mapListingRow(row as RawListingRow));
}

export interface AdminToletListParams {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  propertyType?: string;
  areaId?: string;
  from?: string;
  to?: string;
}

export interface AdminToletListPage {
  rows: ToletListing[];
  total: number;
  counts: Record<string, number>;
  error?: string;
}

export async function adminFetchListingsPage(
  params: AdminToletListParams
): Promise<AdminToletListPage> {
  if (!isSupabaseConfigured) {
    return { rows: [], total: 0, counts: {}, error: 'Supabase সংযুক্ত নেই; বাসা ভাড়ার তালিকা লোড করা যায়নি।' };
  }
  const client = createClient();
  if (!client) return { rows: [], total: 0, counts: {}, error: 'Supabase ক্লায়েন্ট তৈরি করা যায়নি।' };

  let query = client
    .from('tolet_listings')
    .select('*, owner:profiles!tolet_listings_owner_id_fkey(full_name,is_verified)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  const term = params.search?.trim().replace(/[%_,().*\\"]/g, ' ').replace(/[\[\]]/g, ' ');
  if (term) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)) {
      query = query.eq('id', term);
    } else {
      const filters = [`title.ilike.%${term}%`, `area_id.ilike.%${term}%`];
      const { data: owners, error: ownersError } = await client
        .from('profiles')
        .select('id')
        .ilike('full_name', `%${term}%`)
        .limit(1000);
      if (ownersError) {
        return { rows: [], total: 0, counts: {}, error: `মালিকের তথ্য খোঁজা যায়নি: ${ownersError.message}` };
      }
      if (owners?.length) filters.push(`owner_id.in.(${owners.map(({ id }) => id).join(',')})`);
      query = query.or(filters.join(','));
    }
  }
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  if (params.propertyType) query = query.eq('property_type', params.propertyType);
  if (params.areaId) query = query.eq('area_id', params.areaId);
  if (params.from) query = query.gte('created_at', new Date(`${params.from}T00:00:00+06:00`).toISOString());
  if (params.to) {
    const end = new Date(`${params.to}T00:00:00+06:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.lt('created_at', end.toISOString());
  }

  const statuses = [
    'draft',
    'pending_review',
    'approved',
    'rejected',
    'unavailable',
    'suspended',
    'archived',
  ];
  const [result, ...statusResults] = await Promise.all([
    query,
    ...statuses.map((status) =>
      client.from('tolet_listings').select('id', { count: 'exact', head: true }).eq('status', status)
    ),
  ]);
  if (result.error) {
    return { rows: [], total: 0, counts: {}, error: `বাসা ভাড়ার তালিকা লোড ব্যর্থ হয়েছে: ${result.error.message}` };
  }
  const failedCount = statusResults.find((entry) => entry.error);
  if (failedCount?.error) {
    return { rows: [], total: 0, counts: {}, error: `স্ট্যাটাস গণনা ব্যর্থ হয়েছে: ${failedCount.error.message}` };
  }
  return {
    rows: (result.data || []).map((row) => mapListingRow(row as RawListingRow)),
    total: result.count ?? 0,
    counts: {
      all: statusResults.reduce((sum, result) => sum + (result.count ?? 0), 0),
      ...Object.fromEntries(statuses.map((status, index) => [status, statusResults[index].count ?? 0])),
    },
  };
}

export async function adminFetchListingById(listingId: string): Promise<ToletListing | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; বিজ্ঞাপনের তথ্য লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const { data, error } = await client
    .from('tolet_listings')
    .select('*, owner:profiles!tolet_listings_owner_id_fkey(id, phone, full_name, is_verified)')
    .eq('id', listingId)
    .maybeSingle();
  if (error) throw new Error(`বিজ্ঞাপনের তথ্য লোড ব্যর্থ হয়েছে: ${error.message}`);
  if (!data) return null;
  return mapListingRow(data as RawListingRow);
}

export async function adminUpdateListing(
  listingId: string,
  patch: Partial<ToletListing>
): Promise<{ success: boolean; listing?: ToletListing; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase সংযুক্ত নেই; বাসা ভাড়ার বিজ্ঞাপন আপডেট করা যায়নি।' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const payload = toSnakeObject({
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.propertyType !== undefined ? { propertyType: patch.propertyType } : {}),
    ...(patch.areaId !== undefined ? { areaId: patch.areaId } : {}),
    ...(patch.specificAddress !== undefined ? { specificAddress: patch.specificAddress } : {}),
    ...(patch.rentPrice !== undefined ? { rentPrice: patch.rentPrice } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.photos !== undefined ? { photos: patch.photos } : {}),
    ...(patch.facilities !== undefined ? { facilities: patch.facilities } : {}),
    ...(patch.unavailableFacilities !== undefined
      ? { unavailableFacilities: patch.unavailableFacilities }
      : {}),
    ...(patch.availableFrom !== undefined ? { availableFrom: patch.availableFrom } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.isVerified !== undefined ? { isVerified: patch.isVerified } : {}),
    ...(patch.rejectionReason !== undefined ? { rejectionReason: patch.rejectionReason } : {}),
  });
  const { data, error } = await client
    .from('tolet_listings')
    .update(payload)
    .eq('id', listingId)
    .select('*')
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  if (!data) return { success: false, error: 'বিজ্ঞাপন পাওয়া যায়নি' };
  if (patch.status && data.owner_id) {
    notifyCustomer({
      userId: data.owner_id,
      title: `বিজ্ঞাপনের অবস্থা: ${patch.status}`,
      body: 'আপনার বিজ্ঞাপনের পর্যালোচনা সম্পন্ন হয়েছে।',
      type: patch.status === 'approved' ? 'success' : 'warning',
      relatedType: 'tolet_listing',
      relatedId: listingId,
    });
  }
  notifyAdminHub({
    title: 'বিজ্ঞাপন আপডেট',
    body: `বিজ্ঞাপন ${listingId} এর অবস্থা "${patch.status}" হয়েছে।`,
    type: patch.status === 'approved' ? 'success' : 'info',
    relatedType: 'tolet_listing',
    relatedId: listingId,
  });
  return { success: true, listing: mapListingRow(data as RawListingRow) };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export async function createToletRequest(
  input: ToletRequestInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const listing = mockFetchListingById(input.listingId);
    mockCreateToletRequest(input, listing?.title);
    return { success: true };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('tolet_requests').insert({
    listing_id: input.listingId,
    customer_id: input.customerId,
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    area_id: input.areaId || null,
    message: input.message || null,
    preferred_time: input.preferredTime || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchToletRequestsAsCustomer(customerId: string): Promise<ToletRequest[]> {
  if (!isSupabaseConfigured) return mockFetchToletRequestsAsCustomer(customerId);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('tolet_requests')
    .select('*, listing:listing_id(title)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) =>
    mapRequestRow(row as Record<string, unknown>, ((row as Record<string, unknown>).listing as { title?: string } | null)?.title || '')
  );
}

export async function fetchToletRequestsAsOwner(ownerId: string): Promise<ToletRequest[]> {
  if (!isSupabaseConfigured) return mockFetchToletRequestsAsOwner(ownerId);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('tolet_requests')
    .select('*, listing:listing_id(title)')
    .in(
      'listing_id',
      (
        await fetchMyListings(ownerId)
      ).map((l) => l.id)
    )
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) =>
    mapRequestRow(row as Record<string, unknown>, ((row as Record<string, unknown>).listing as { title?: string } | null)?.title || '')
  );
}

export async function fetchRequestsForListing(
  listingId: string
): Promise<ToletRequest[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; বিজ্ঞাপনের অনুরোধগুলো লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const { data, error } = await client
    .from('tolet_requests')
    .select('*, listing:listing_id(title)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`বিজ্ঞাপনের অনুরোধ লোড ব্যর্থ হয়েছে: ${error.message}`);
  return (data || []).map((row) =>
    mapRequestRow(row as Record<string, unknown>, ((row as Record<string, unknown>).listing as { title?: string } | null)?.title || '')
  );
}

export async function updateToletRequestStatus(
  requestId: string,
  newStatus: ToletRequestStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const updated = mockUpdateToletRequestStatus(requestId, newStatus);
    if (!updated) return { success: false, error: 'অনুরোধ পাওয়া যায়নি' };
    return { success: true };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client
    .from('tolet_requests')
    .update({ status: newStatus })
    .eq('id', requestId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function createListingReport(input: {
  listingId: string;
  reporterId: string | null;
  reporterName: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    mockCreateListingReport(input.listingId, input.reporterId, input.reporterName, input.reason, input.details);
    return { success: true };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('listing_reports').insert({
    listing_id: input.listingId,
    reporter_id: input.reporterId,
    reporter_name: input.reporterName.trim() || 'অতিথি',
    reason: input.reason,
    details: input.details || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminFetchReports(): Promise<ListingReport[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; বাসা ভাড়ার রিপোর্ট লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const { data, error } = await client
    .from('listing_reports')
    .select('*, reporter:reporter_id(full_name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`বাসা ভাড়ার রিপোর্ট লোড ব্যর্থ হয়েছে: ${error.message}`);
  return (data || []).map((row) => {
    const base = mapReportRow(row as Record<string, unknown>);
    base.reporterName =
      ((row as Record<string, unknown>).reporter as { full_name?: string } | null)?.full_name || '';
    return base;
  });
}

export async function adminUpdateReportStatus(
  reportId: string,
  newStatus: ListingReportStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase সংযুক্ত নেই; রিপোর্ট আপডেট করা যায়নি।' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client
    .from('listing_reports')
    .update({ status: newStatus })
    .eq('id', reportId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getReportsForListing(
  listingId: string
): Promise<ListingReport[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; বিজ্ঞাপনের রিপোর্টগুলো লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const { data, error } = await client
    .from('listing_reports')
    .select('*, reporter:reporter_id(full_name)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`বিজ্ঞাপনের রিপোর্ট লোড ব্যর্থ হয়েছে: ${error.message}`);
  return (data || []).map((row) => {
    const base = mapReportRow(row as Record<string, unknown>);
    base.reporterName =
      ((row as Record<string, unknown>).reporter as { full_name?: string } | null)?.full_name || '';
    return base;
  });
}

// ---------------------------------------------------------------------------
// Photo upload
// ---------------------------------------------------------------------------

/** Validates and uploads listing photos. Returns public URLs (or blob URLs in preview mode). */
export async function uploadListingPhotos(
  ownerId: string,
  files: File[],
  context: string
): Promise<{ success: boolean; urls?: string[]; error?: string }> {
  const valid = files.filter(
    (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
  );
  if (valid.length !== files.length) {
    return {
      success: false,
      error: 'শুধুমাত্র ছবি ফাইল (সর্বোচ্চ ৫MB) আপলোড করা যাবে',
    };
  }

  if (!isSupabaseConfigured) {
    const urls = await Promise.all(
      valid.map((f) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('read failed'));
          reader.readAsDataURL(f);
        });
      })
    );
    return { success: true, urls };
  }

  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };

  const urls: string[] = [];
  for (const file of valid) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${ownerId}/${context}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await client.storage.from('listings').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
    }
    const { data } = client.storage.from('listings').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return { success: true, urls };
}

/** Resolves a photo raw value (full URL / blob / data URI / storage path) to a displayable src. */
export function resolveListingPhotoUrl(src: string): string {
  if (!src) return '';
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  return src;
}