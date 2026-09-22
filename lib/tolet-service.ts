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

export const toletStorageConfigured = isSupabaseConfigured;

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
    description: input.description,
    photos: input.photos,
  });
}

// ---------------------------------------------------------------------------
// Listing queries
// ---------------------------------------------------------------------------

export async function fetchPublicListings(): Promise<ToletListing[]> {
  if (!isSupabaseConfigured) return mockFetchPublicListings();
  const client = createClient();
  if (!client) return mockFetchPublicListings();
  const { data, error } = await client
    .from('tolet_listings')
    .select('*, owner:owner_id(full_name, is_verified)')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapListingRow(row as RawListingRow));
}

export async function fetchListingById(id: string): Promise<ToletListing | null> {
  if (!isSupabaseConfigured) return mockFetchListingById(id) || null;
  const client = createClient();
  if (!client) return mockFetchListingById(id) || null;
  const { data, error } = await client
    .from('tolet_listings')
    .select('*, owner:owner_id(full_name, is_verified)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapListingRow(data as RawListingRow);
}

export async function fetchMyListings(ownerId: string): Promise<ToletListing[]> {
  if (!isSupabaseConfigured) return mockFetchMyListings(ownerId);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('tolet_listings')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) return [];
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
    const updated = mockAdminUpdateListing(listingId, { status: 'archived' });
    if (!updated) return { success: false, error: 'বিজ্ঞাপন পাওয়া যায়নি' };
    return { success: true };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client
    .from('tolet_listings')
    .update({ status: 'archived' })
    .eq('id', listingId)
    .eq('owner_id', ownerId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Listing mutations (admin)
// ---------------------------------------------------------------------------

export async function adminFetchListings(statusFilter?: string | null): Promise<ToletListing[]> {
  if (!isSupabaseConfigured) return mockAdminFetchListings(statusFilter);
  const client = createClient();
  if (!client) return [];
  const q = client.from('tolet_listings').select('*');
  if (statusFilter && statusFilter !== 'all') q.eq('status', statusFilter);
  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapListingRow(row as RawListingRow));
}

export async function adminFetchListingById(listingId: string): Promise<ToletListing | null> {
  if (!isSupabaseConfigured) return mockAdminFetchListingById(listingId);
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('tolet_listings')
    .select('*, owner:owner_id(id, phone, full_name, is_verified)')
    .eq('id', listingId)
    .maybeSingle();
  if (error || !data) return null;
  return mapListingRow(data as RawListingRow);
}

export async function adminUpdateListing(
  listingId: string,
  patch: Partial<ToletListing>
): Promise<{ success: boolean; listing?: ToletListing; error?: string }> {
  if (!isSupabaseConfigured) {
    const listing = mockAdminUpdateListing(listingId, patch);
    if (!listing) return { success: false, error: 'বিজ্ঞাপন পাওয়া যায়নি' };
    return { success: true, listing };
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
  if (!isSupabaseConfigured) return mockFetchRequestsForListing(listingId);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('tolet_requests')
    .select('*, listing:listing_id(title)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) return [];
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
    reason: input.reason,
    details: input.details || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminFetchReports(): Promise<ListingReport[]> {
  if (!isSupabaseConfigured) return mockAdminFetchReports();
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('listing_reports')
    .select('*, reporter:reporter_id(full_name)')
    .order('created_at', { ascending: false });
  if (error) return [];
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
    const updated = mockAdminUpdateReportStatus(reportId, newStatus);
    if (!updated) return { success: false, error: 'রিপোর্ট পাওয়া যায়নি' };
    return { success: true };
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
  if (!isSupabaseConfigured) return mockGetReportsForListing(listingId);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('listing_reports')
    .select('*, reporter:reporter_id(full_name)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) return [];
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