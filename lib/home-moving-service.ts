/**
 * Admin-managed Home Moving (বাসা পাল্টানো) data layer facade.
 * Uses Supabase when configured; otherwise falls back to the in-memory mock store.
 *
 * Business rules:
 *  - Requests live in the shared service_requests table; home-moving fields are
 *    the pickle/destination/floor/lift/items/photo columns.
 *  - The admin console resolves private storage paths via signed URLs and NEVER
 *    exposes the raw path from the public layout.
 *  - No automatic pricing: the admin records the quotation manually.
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { toCamelObject } from './supabase/transform';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import { notifyCustomer, notifyAdminHub } from './notification-service';
import type {
  HomeMovingRequest,
  HomeMovingRequestInput,
} from './home-moving-types';
import {
  mockAdminFetchHomeMovingRequests,
  mockAdminFetchHomeMovingRequestById,
  mockAdminUpdateHomeMovingRequest,
  mockAdminFetchHomeMovingRequestStats,
} from './home-moving-mock';
import {
  adminFetchStaffRequests as fetchStaffRequestsForUnion,
  adminFetchStaffRequestById as fetchStaffRequestByIdForUnion,
  adminUpdateStaffRequest as updateStaffRequestForUnion,
} from './staff-service';
import type { StaffRequest, StaffServiceKey } from './staff-types';
import {
  adminFetchTutorRequests as fetchTutorRequestsForUnion,

  adminFetchTutorRequestById as fetchTutorRequestByIdForUnion,
  adminFetchTutorProfileById as fetchTutorProfileByIdForUnion,
  adminUpdateTutorRequest as updateTutorRequestForUnion,
} from './home-tutor-service';
import type { AdminTutorRequest } from './home-tutor-service';
import type { HomeTutorProfile } from '@/lib/supabase/types';

export function mapHomeMovingRow(row: Record<string, unknown>): HomeMovingRequest {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    customerId: (c.customerId as string) || '',
    serviceSlug: 'home-moving',
    status: (c.status as ServiceRequestStatus) || 'new',
    pickupAreaId: (c.pickupAreaId as string) || (c.areaId as string) || '',
    destinationAreaId: (c.destinationAreaId as string) || '',
    pickupAddress: (c.pickupAddress as string) || (c.addressLine as string) || '',
    destinationAddress: (c.destinationAddress as string) || '',
    preferredDate: (c.preferredDate as string) || undefined,
    preferredTime: (c.preferredTime as string) || undefined,
    items: Array.isArray(c.movingItems)
      ? (c.movingItems as HomeMovingRequest['items'])
      : [],
    pickupFloor: (c.pickupFloor as string) || undefined,
    destinationFloor: (c.destinationFloor as string) || undefined,
    hasLift: Boolean(c.hasLift),
    parkingInfo: (c.parkingInfo as string) || undefined,
    description: (c.details as string) || undefined,
    photoUrls: Array.isArray(c.photoUrls)
      ? (c.photoUrls as string[])
      : c.attachmentUrl
      ? [c.attachmentUrl as string]
      : [],
    contactName: (c.contactName as string) || '',
    contactPhone: (c.contactPhone as string) || '',
    adminNotes: (c.adminNotes as string) || undefined,
    quotation: (c.quotation as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || undefined,
  };
}

/** Shapes a HomeMovingRequestInput into the generic service request record. */
export function toServiceRequestPayload(input: HomeMovingRequestInput): {
  areaId: string;
  addressLine: string;
  preferredDate?: string;
  preferredTime?: string;
  details?: string;
  pickupAreaId: string;
  destinationAreaId: string;
  pickupAddress: string;
  destinationAddress: string;
  pickupFloor?: string;
  destinationFloor?: string;
  hasLift?: boolean;
  parkingInfo?: string;
  movingItems: { id: string; labelBn: string; quantity?: number }[];
  photoUrls: string[];
  description?: string;
} {
  return {
    areaId: input.pickupAreaId,
    addressLine: input.pickupAddress,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    details: input.description,
    pickupAreaId: input.pickupAreaId,
    destinationAreaId: input.destinationAreaId,
    pickupAddress: input.pickupAddress,
    destinationAddress: input.destinationAddress,
    pickupFloor: input.pickupFloor,
    destinationFloor: input.destinationFloor,
    hasLift: input.hasLift,
    parkingInfo: input.parkingInfo,
    movingItems: input.items,
    photoUrls: input.photoUrls,
    description: input.description,
  };
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

export async function adminFetchHomeMovingRequests(): Promise<HomeMovingRequest[]> {
  if (!isSupabaseConfigured) return mockAdminFetchHomeMovingRequests();
  const client = createClient();
  if (!client) return mockAdminFetchHomeMovingRequests();
  const { data, error } = await client
    .from('service_requests')
    .select('*')
    .eq('service_slug', 'home-moving')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapHomeMovingRow(row as Record<string, unknown>));
}

export async function adminFetchHomeMovingRequestById(
  id: string
): Promise<HomeMovingRequest | null> {
  if (!isSupabaseConfigured) return mockAdminFetchHomeMovingRequestById(id) || null;
  const client = createClient();
  if (!client) return mockAdminFetchHomeMovingRequestById(id) || null;
  const { data, error } = await client
    .from('service_requests')
    .select('*')
    .eq('id', id)
    .eq('service_slug', 'home-moving')
    .maybeSingle();
  if (error || !data) return null;
  return mapHomeMovingRow(data as Record<string, unknown>);
}

export async function adminUpdateHomeMovingRequest(
  id: string,
  patch: { status?: ServiceRequestStatus; adminNotes?: string; quotation?: string }
): Promise<{ success: boolean; request?: HomeMovingRequest; error?: string }> {
  if (!isSupabaseConfigured) {
    const req = mockAdminUpdateHomeMovingRequest(id, patch);
    return req ? { success: true, request: req } : { success: false, error: 'রিকোয়েস্ট পাওয়া যায়নি' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) dbPatch.status = patch.status;
  if (typeof patch.adminNotes === 'string') dbPatch.admin_notes = patch.adminNotes;
  if (typeof patch.quotation === 'string') dbPatch.quotation = patch.quotation;
  const { data, error } = await client
    .from('service_requests')
    .update(dbPatch)
    .eq('id', id)
    .eq('service_slug', 'home-moving')
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  if (data.customer_id) {
    notifyCustomer({
      userId: data.customer_id,
      title: 'আপনার বাসা পাল্টানো রিকোয়েস্ট আপডেট',
      body: `আপনার রিকোয়েস্টের অবস্থা এখন "${data.status}"।`,
      type: data.status === 'completed' ? 'success' : 'info',
      relatedType: 'service_request',
      relatedId: id,
    });
  }
  notifyAdminHub({
    title: 'বাসা পাল্টানো রিকোয়েস্ট আপডেট',
    body: `রিকোয়েস্ট ${id} এর অবস্থা "${data.status}" হয়েছে।`,
    type: 'info',
    relatedType: 'service_request',
    relatedId: id,
  });
  return { success: true, request: mapHomeMovingRow(data as Record<string, unknown>) };
}

/** Union of admin-managed requests (staff services + home moving + home tutor) for the admin console. */
export type AdminServiceSlug = StaffServiceKey | 'home-moving' | 'home-tutor';

/** Normalized admin-console row for ANY managed service request. */
export interface AdminRequestRow {
  id: string;
  serviceSlug: AdminServiceSlug;
  status: ServiceRequestStatus;
  customerId: string;
  contactName: string;
  contactPhone: string;
  areaId: string;
  addressLine: string;
  profileId?: string;
  profileTitleBn?: string;
  serviceType?: string;
  description?: string;
  preferredDate?: string;
  preferredTime?: string;
  attachmentUrl?: string;
  adminNotes?: string;
  quotation?: string;
  createdAt: string;
  updatedAt?: string;
  // Home Moving (বাসা পাল্টানো) private request fields
  pickupAreaId?: string;
  destinationAreaId?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  pickupFloor?: string;
  destinationFloor?: string;
  hasLift?: boolean;
  parkingInfo?: string;
  movingItems?: HomeMovingRequest['items'];
  photoUrls?: string[];
}

function staffToAdminRow(row: StaffRequest): AdminRequestRow {
  return {
    id: row.id,
    serviceSlug: row.serviceSlug,
    status: row.status,
    customerId: row.customerId,
    contactName: row.customerName,
    contactPhone: row.customerPhone,
    areaId: row.areaId,
    addressLine: row.addressLine,
    profileId: row.profileId,
    profileTitleBn: row.profileTitleBn,
    serviceType: row.serviceType,
    description: row.description,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    attachmentUrl: row.attachmentUrl,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function movingToAdminRow(row: HomeMovingRequest): AdminRequestRow {
  return {
    id: row.id,
    serviceSlug: 'home-moving',
    status: row.status,
    customerId: row.customerId,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    areaId: row.pickupAreaId,
    addressLine: row.pickupAddress,
    description: row.description,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    adminNotes: row.adminNotes,
    quotation: row.quotation,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    pickupAreaId: row.pickupAreaId,
    destinationAreaId: row.destinationAreaId,
    pickupAddress: row.pickupAddress,
    destinationAddress: row.destinationAddress,
    pickupFloor: row.pickupFloor,
    destinationFloor: row.destinationFloor,
    hasLift: row.hasLift,
    parkingInfo: row.parkingInfo,
    movingItems: row.items,
    photoUrls: row.photoUrls,
  };
}

function tutorToAdminRow(row: AdminTutorRequest): AdminRequestRow {
  return {
    id: row.id,
    serviceSlug: 'home-tutor',
    status: row.status,
    customerId: row.customerId,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    areaId: row.areaId,
    addressLine: row.addressLine,
    profileId: row.profileId,
    profileTitleBn: row.profileTitle,
    serviceType: row.serviceType,
    description: row.details,
    preferredTime: row.preferredTime,
    adminNotes: row.adminNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function adminFetchAllManagedRequests(): Promise<AdminRequestRow[]> {
  const [staffRows, movingRows, tutorRows] = await Promise.all([
    fetchStaffRequestsForUnion(),
    adminFetchHomeMovingRequests(),
    fetchTutorRequestsForUnion(),
  ]);
  return [
    ...staffRows.map(staffToAdminRow),
    ...movingRows.map(movingToAdminRow),
    ...tutorRows.map(tutorToAdminRow),
  ].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function adminFetchManagedRequestById(
  id: string
): Promise<AdminRequestRow | null> {
  const moving = await adminFetchHomeMovingRequestById(id);
  if (moving) return movingToAdminRow(moving);
  const staff = await fetchStaffRequestByIdForUnion(id);
  if (staff) return staffToAdminRow(staff);
  const tutor = await fetchTutorRequestByIdForUnion(id);
  if (tutor) return tutorToAdminRow(tutor);
  return null;
}

/** Admin: update any managed request. Tutoring requests use their own facade. */
export async function adminUpdateManagedRequest(
  id: string,
  slug: AdminServiceSlug,
  status: ServiceRequestStatus,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  if (slug === 'home-tutor') {
    const res = await updateTutorRequestForUnion(id, status, adminNotes);
    return res.success ? { success: true } : { success: false, error: res.error };
  }
  if (slug === 'home-moving') {
    const res = await adminUpdateHomeMovingRequest(id, { status, adminNotes });
    return res.success ? { success: true } : { success: false, error: res.error };
  }
  const res = await updateStaffRequestForUnion(id, status, adminNotes);
  return res.success ? { success: true } : { success: false, error: res.error };
}

/** Admin helper: joins the tutor profile onto a tutor request row. */
export async function adminFetchTutorProfileForRequest(
  profileId?: string
): Promise<HomeTutorProfile | null> {
  if (!profileId) return null;
  return fetchTutorProfileByIdForUnion(profileId);
}

export async function adminFetchHomeMovingStats(): Promise<number> {
  if (!isSupabaseConfigured) return mockAdminFetchHomeMovingRequestStats();
  const client = createClient();
  if (!client) return 0;
  const { count } = await client
    .from('service_requests')
    .select('*', { count: 'exact', head: true })
    .eq('service_slug', 'home-moving')
    .in('status', ['new', 'submitted', 'reviewing']);
  return count ?? 0;
}

export { uploadRequestAttachment, getRequestAttachmentViewUrl } from './staff-service';