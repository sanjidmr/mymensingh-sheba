/**
 * Admin-managed staff services (কাজের বুয়া / Electrician / Plumber) data layer facade.
 * Uses Supabase when configured; otherwise falls back to the in-memory mock store.
 *
 * Privacy contract:
 *  - Public queries NEVER select phone_private and the mapper strips it defensively.
 *  - Public users only receive is_active profiles (RLS + facade both enforce).
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { toCamelObject, toSnakeObject } from './supabase/transform';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import type {
  StaffProfile,
  StaffProfileInput,
  StaffServiceKey,
  StaffRequest,
  StaffReport,
  StaffReportStatus,
} from './staff-types';
import { notifyCustomer, notifyAdminHub } from './notification-service';
import {
  mockFetchPublicStaffProfiles,
  mockFetchStaffProfileById,
  mockAdminFetchStaffProfiles,
  mockAdminFetchStaffProfileById,
  mockCreateStaffProfile,
  mockUpdateStaffProfile,
  mockDeleteStaffProfile,
  mockAdminFetchStaffRequests,
  mockAdminFetchStaffRequestById,
  mockAdminUpdateStaffRequest,
  mockCreateStaffReport,
  mockAdminFetchStaffReports,
  mockAdminUpdateStaffReportStatus,
} from './staff-service-mock';

export const staffStorageConfigured = isSupabaseConfigured;

// ---------------------------------------------------------------------------
// Row mapping helpers
// ---------------------------------------------------------------------------

const PUBLIC_PROFILE_COLUMNS =
  'id, service_slug, name_bn, title_bn, image_url, areas, work_types, work_mode, time_slot, experience_years, availability, is_emergency, salary_min, salary_max, rate_label, about_bn, is_verified, is_active, created_at, updated_at';

function mapProfileRow(row: Record<string, unknown>, opts: { admin?: boolean } = {}): StaffProfile {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    serviceSlug: (c.serviceSlug as StaffServiceKey) || 'kajer-bua',
    nameBn: (c.nameBn as string) || '',
    titleBn: (c.titleBn as string) || '',
    imageUrl: (c.imageUrl as string) || '',
    areaIds: Array.isArray(c.areas) ? (c.areas as string[]) : [],
    workTypes: Array.isArray(c.workTypes) ? (c.workTypes as string[]) : [],
    workMode: (c.workMode as string) || undefined,
    timeSlot: (c.timeSlot as string) || undefined,
    experienceYears: Number(c.experienceYears ?? 0),
    availability: (c.availability as StaffProfile['availability']) || 'available',
    isEmergency: Boolean(c.isEmergency),
    salaryMin: c.salaryMin != null ? Number(c.salaryMin) : undefined,
    salaryMax: c.salaryMax != null ? Number(c.salaryMax) : undefined,
    rateLabel: (c.rateLabel as string) || undefined,
    aboutBn: (c.aboutBn as string) || '',
    isVerified: Boolean(c.isVerified),
    isActive: Boolean(c.isActive),
    phonePrivate: opts.admin ? (c.phonePrivate as string) || undefined : undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || '',
  };
}

function mapRequestRow(row: Record<string, unknown>): StaffRequest {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    serviceSlug: (c.serviceSlug as StaffServiceKey) || 'kajer-bua',
    profileId: (c.profileId as string) || undefined,
    profileTitleBn: (c.profileTitleBn as string) || (c.profileTitle as string) || undefined,
    customerId: (c.customerId as string) || '',
    customerName: (c.contactName as string) || (c.customerName as string) || '',
    customerPhone: (c.contactPhone as string) || (c.customerPhone as string) || '',
    areaId: (c.areaId as string) || '',
    addressLine: (c.addressLine as string) || '',
    serviceType: (c.serviceType as string) || undefined,
    description: (c.details as string) || (c.description as string) || undefined,
    preferredDate: (c.preferredDate as string) || undefined,
    preferredTime: (c.preferredTime as string) || undefined,
    attachmentUrl: (c.attachmentUrl as string) || undefined,
    status: (c.status as ServiceRequestStatus) || 'new',
    adminNotes: (c.adminNotes as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || undefined,
  };
}

function mapReportRow(row: Record<string, unknown>): StaffReport {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    profileId: (c.profileId as string) || '',
    serviceSlug: (c.serviceSlug as StaffServiceKey) || 'kajer-bua',
    reporterId: (c.reporterId as string) || undefined,
    reporterName: (c.reporterName as string) || '',
    reason: (c.reason as string) || '',
    details: (c.details as string) || undefined,
    status: (c.status as StaffReportStatus) || 'open',
    createdAt: (c.createdAt as string) || '',
  };
}

function toProfileInsertObject(input: StaffProfileInput): Record<string, unknown> {
  return toSnakeObject({
    serviceSlug: input.serviceSlug,
    nameBn: input.nameBn,
    titleBn: input.titleBn,
    imageUrl: input.imageUrl,
    areas: input.areaIds,
    workTypes: input.workTypes,
    workMode: input.workMode,
    timeSlot: input.timeSlot,
    experienceYears: input.experienceYears,
    availability: input.availability,
    isEmergency: input.isEmergency,
    salaryMin: input.salaryMin,
    salaryMax: input.salaryMax,
    rateLabel: input.rateLabel,
    aboutBn: input.aboutBn,
    phonePrivate: input.phonePrivate,
    isVerified: input.isVerified,
    isActive: input.isActive,
  });
}

// ---------------------------------------------------------------------------
// Public queries (customers)
// ---------------------------------------------------------------------------

export async function fetchPublicStaffProfiles(slug: StaffServiceKey): Promise<StaffProfile[]> {
  if (!isSupabaseConfigured) return mockFetchPublicStaffProfiles(slug);
  const client = createClient();
  if (!client) return mockFetchPublicStaffProfiles(slug);
  const { data, error } = await client
    .from('staff_profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('service_slug', slug)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapProfileRow(row as Record<string, unknown>));
}

export async function fetchStaffProfileById(id: string): Promise<StaffProfile | null> {
  if (!isSupabaseConfigured) return mockFetchStaffProfileById(id) || null;
  const client = createClient();
  if (!client) return mockFetchStaffProfileById(id) || null;
  const { data, error } = await client
    .from('staff_profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfileRow(data as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Public: report a profile
// ---------------------------------------------------------------------------

export async function createStaffReport(input: {
  profileId: string;
  serviceSlug: StaffServiceKey;
  reporterId?: string;
  reporterName: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return mockCreateStaffReport(input);
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('staff_profile_reports').insert({
    profile_id: input.profileId,
    service_slug: input.serviceSlug,
    reporter_id: input.reporterId || null,
    reporter_name: input.reporterName,
    reason: input.reason,
    details: input.details || null,
  });
  if (error) return { success: false, error: `রিপোর্ট জমা ব্যর্থ: ${error.message}` };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin queries (profiles)
// ---------------------------------------------------------------------------

export async function adminFetchStaffProfiles(
  slug?: StaffServiceKey
): Promise<StaffProfile[]> {
  if (!isSupabaseConfigured) return mockAdminFetchStaffProfiles(slug);
  const client = createClient();
  if (!client) return mockAdminFetchStaffProfiles(slug);
  let query = client.from('staff_profiles').select('*');
  if (slug) query = query.eq('service_slug', slug);
  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapProfileRow(row as Record<string, unknown>, { admin: true }));
}

export async function adminFetchStaffProfileById(id: string): Promise<StaffProfile | null> {
  if (!isSupabaseConfigured) return mockAdminFetchStaffProfileById(id) || null;
  const client = createClient();
  if (!client) return mockAdminFetchStaffProfileById(id) || null;
  const { data, error } = await client
    .from('staff_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfileRow(data as Record<string, unknown>, { admin: true });
}

export async function adminCreateStaffProfile(
  input: StaffProfileInput
): Promise<{ success: boolean; profile?: StaffProfile; error?: string }> {
  if (!isSupabaseConfigured) {
    const profile = mockCreateStaffProfile(input);
    return { success: true, profile };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data, error } = await client
    .from('staff_profiles')
    .insert(toProfileInsertObject(input))
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'সংরক্ষণ ব্যর্থ হয়েছে' };
  }
  return { success: true, profile: mapProfileRow(data as Record<string, unknown>, { admin: true }) };
}

export async function adminUpdateStaffProfile(
  id: string,
  patch: Partial<StaffProfileInput>
): Promise<{ success: boolean; profile?: StaffProfile; error?: string }> {
  if (!isSupabaseConfigured) {
    const profile = mockUpdateStaffProfile(id, patch);
    return profile ? { success: true, profile } : { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data, error } = await client
    .from('staff_profiles')
    .update(toProfileInsertObject(patch as StaffProfileInput))
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  return { success: true, profile: mapProfileRow(data as Record<string, unknown>, { admin: true }) };
}

export async function deleteStaffProfile(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: mockDeleteStaffProfile(id), error: undefined };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('staff_profiles').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin queries (requests)
// ---------------------------------------------------------------------------

export async function adminFetchStaffRequests(
  slug?: StaffServiceKey
): Promise<StaffRequest[]> {
  if (!isSupabaseConfigured) return mockAdminFetchStaffRequests(slug);
  const client = createClient();
  if (!client) return mockAdminFetchStaffRequests(slug);
  let query = client.from('service_requests').select('*');
  if (slug) query = query.eq('service_slug', slug);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return (data || [])
    .filter((r) => r.service_slug === 'kajer-bua' || r.service_slug === 'electrician' || r.service_slug === 'plumber')
    .map((row) => mapRequestRow(row as Record<string, unknown>));
}

export async function adminFetchStaffRequestById(id: string): Promise<StaffRequest | null> {
  if (!isSupabaseConfigured) return mockAdminFetchStaffRequestById(id) || null;
  const client = createClient();
  if (!client) return mockAdminFetchStaffRequestById(id) || null;
  const { data, error } = await client
    .from('service_requests')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const slug = data.service_slug as string;
  if (slug !== 'kajer-bua' && slug !== 'electrician' && slug !== 'plumber') return null;
  return mapRequestRow(data as Record<string, unknown>);
}

export async function adminUpdateStaffRequest(
  id: string,
  status: ServiceRequestStatus,
  adminNotes?: string
): Promise<{ success: boolean; request?: StaffRequest; error?: string }> {
  if (!isSupabaseConfigured) {
    const req = mockAdminUpdateStaffRequest(id, status, adminNotes);
    return req ? { success: true, request: req } : { success: false, error: 'রিকোয়েস্ট পাওয়া যায়নি' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) patch.admin_notes = adminNotes;
  const { data, error } = await client
    .from('service_requests')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে' };
  }
  if (data.customer_id) {
    notifyCustomer({
      userId: data.customer_id,
      title: 'সেবা রিকোয়েস্টের অবস্থা আপডেট',
      body: `আপনার রিকোয়েস্টের অবস্থা এখন "${status}"।`,
      type: status === 'completed' ? 'success' : 'info',
      relatedType: 'service_request',
      relatedId: id,
    });
  }
  notifyAdminHub({
    title: 'সার্ভিস রিকোয়েস্ট আপডেট',
    body: `রিকোয়েস্ট ${id} এর অবস্থা "${status}" হয়েছে।`,
    type: 'info',
    relatedType: 'service_request',
    relatedId: id,
  });
  return { success: true, request: mapRequestRow(data as Record<string, unknown>) };
}

// ---------------------------------------------------------------------------
// Admin queries (reports)
// ---------------------------------------------------------------------------

export async function adminFetchStaffReports(): Promise<StaffReport[]> {
  if (!isSupabaseConfigured) return mockAdminFetchStaffReports();
  const client = createClient();
  if (!client) return mockAdminFetchStaffReports();
  const { data, error } = await client
    .from('staff_profile_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapReportRow(row as Record<string, unknown>));
}

export async function adminUpdateStaffReportStatus(
  id: string,
  status: StaffReportStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const updated = mockAdminUpdateStaffReportStatus(id, status);
    return updated ? { success: true } : { success: false, error: 'রিপোর্ট পাওয়া যায়নি' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('staff_profile_reports').update({ status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

/** Admin-only: upload a staff profile photo into the public 'staff' bucket. */
export async function uploadStaffProfilePhoto(
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'শুধুমাত্র ছবি ফাইল (সর্বোচ্চ ৫MB) আপলোড করা যাবে' };
  }
  if (!isSupabaseConfigured) {
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
    return { success: true, url };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `profiles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from('staff').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
  const { data } = client.storage.from('staff').getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

/** Private request attachment (customer photo for electrician/plumber) — stored in 'documents'. */
export async function uploadRequestAttachment(
  customerId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'শুধুমাত্র ছবি ফাইল (সর্বোচ্চ ৫MB) আপলোড করা যাবে' };
  }
  if (!isSupabaseConfigured) {
    const url = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('read failed'));
      reader.readAsDataURL(file);
    });
    return { success: true, url };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${customerId}/requests/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from('documents').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
  return { success: true, url: path };
}

/** Resolves a private storage path to a temporary signed URL for admin viewing. */
export async function getRequestAttachmentViewUrl(
  url?: string
): Promise<string | undefined> {
  if (!url) return undefined;
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  if (!isSupabaseConfigured) return url;
  const client = createClient();
  if (!client) return url;
  const { data, error } = await client.storage.from('documents').createSignedUrl(url, 3600);
  if (error || !data?.signedUrl) return undefined;
  return data.signedUrl;
}

/** Resolves a staff profile photo raw value to a displayable src. */
export function resolveStaffImageUrl(src: string): string {
  if (!src) return '';
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  const client = createClient();
  if (client) {
    const { data } = client.storage.from('staff').getPublicUrl(src);
    if (data.publicUrl) return data.publicUrl;
  }
  return src;
}