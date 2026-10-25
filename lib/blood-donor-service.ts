/**
 * Blood Donor (রক্তদাতা) data layer facade.
 * Uses Supabase when configured; otherwise falls back to the in-memory mock store.
 *
 * Privacy contract:
 *  - The raw `blood_donor_profiles` table keeps `private_phone` REVOKEd from
 *    `anon`/`authenticated`; no public query selects it directly.
 *  - The public directory reads approved donors through the SECURITY DEFINER
 *    function `fn_public_donor_directory`, which returns a `contact_phone`
 *    ONLY for approved rows so the card can build a `tel:` link. The number is
 *    never rendered as visible text.
 *  - Admin reads go through `fn_admin_donor_*`; the admin_notes / rejection_reason
 *    columns are stripped from every non-admin shape here too.
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { toCamelObject } from './supabase/transform';
import { notifyCustomer, notifyAdminHub } from './notification-service';
import { requestAdminEmailAlert } from './admin-email-alerts';
import type {
  BloodDonorProfile,
  BloodDonorReport,
  BloodDonorStatus,
  BloodGroup,
} from '@/lib/supabase/types';
import {
  mockCreateBloodDonorReport,
  mockFetchPublishedDonors,
  mockFetchDonorModuleStats,
} from './blood-donor-mock';
import { DEMO_DONOR_PROFILES, getDemoDonor } from './blood-donor-demo-data';

function mapDonorRow(row: Record<string, unknown>, opts: { admin?: boolean } = {}): BloodDonorProfile {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    publicId: (c.publicId as string) || undefined,
    userId: (c.userId as string) || '',
    status: (c.status as BloodDonorStatus) || 'draft',
    fullName: (c.fullName as string) || '',
    bloodGroup: (c.bloodGroup as BloodGroup) || 'O+',
    areaId: (c.areaId as string) || '',
    gender: c.gender === 'female' ? 'female' : 'male',
    birthYear: c.birthYear != null ? Number(c.birthYear) : undefined,
    weightKg: c.weightKg != null ? Number(c.weightKg) : undefined,
    isAvailable: Boolean(c.isAvailable),
    lastDonationDate: (c.lastDonationDate as string) || undefined,
    donationCount: Number(c.donationCount ?? 0),
    privatePhone: opts.admin ? (c.privatePhone as string) || '' : '__protected__',
    // Public directory rows carry the dialable number so the card can dial; the
    // owner/admin shapes keep using privatePhone.
    contactPhone: (c.contactPhone as string) || undefined,
    isVerified: Boolean(c.isVerified),
    intro: (c.intro as string) || undefined,
    profilePhotoUrl: (c.profilePhotoUrl as string) || undefined,
    showReadiness: Boolean(c.showReadiness),
    adminNotes: opts.admin ? (c.adminNotes as string) || undefined : undefined,
    rejectionReason: opts.admin ? (c.rejectionReason as string) || undefined : undefined,
    publishedAt: (c.publishedAt as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || '',
  };
}

function mapReportRow(row: Record<string, unknown>): BloodDonorReport {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    donorProfileId: (c.donorProfileId as string) || '',
    reporterId: (c.reporterId as string) || undefined,
    reporterName: (c.reporterName as string) || '',
    reason: (c.reason as string) || '',
    details: (c.details as string) || undefined,
    status: (c.status as BloodDonorReport['status']) || 'open',
    createdAt: (c.createdAt as string) || '',
    donorName: (c.donorProfile as { fullName?: string } | undefined)?.fullName,
  };
}

export async function deleteOwnBloodDonorProfile(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    return { success: false, error: 'প্রোফাইলের পরিচয় সঠিক নয়।' };
  }
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase সংযুক্ত নেই।' };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নেই।' };
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) return { success: false, error: 'এই কাজটি করতে আগে লগইন করুন।' };
  const { data, error } = await client
    .from('blood_donor_profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', authData.user.id)
    .select('id')
    .maybeSingle();
  if (error) return { success: false, error: `প্রোফাইল মুছতে ব্যর্থ হয়েছে: ${error.message}` };
  if (!data) return { success: false, error: 'প্রোফাইলটি পাওয়া যায়নি বা মুছার অনুমতি নেই।' };
  return { success: true };
}

export async function updateOwnBloodDonorAvailability(
  profileId: string,
  isAvailable: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) {
    return { success: false, error: 'প্রোফাইলের পরিচয় সঠিক নয়।' };
  }
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase সংযুক্ত নেই।' };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নেই।' };
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) return { success: false, error: 'এই কাজটি করতে আগে লগইন করুন।' };
  const { data, error } = await client
    .from('blood_donor_profiles')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq('id', profileId)
    .eq('user_id', authData.user.id)
    .select('id')
    .maybeSingle();
  if (error) return { success: false, error: `রক্তদানের প্রস্তুতির অবস্থা হালনাগাদ ব্যর্থ হয়েছে: ${error.message}` };
  if (!data) return { success: false, error: 'প্রোফাইলটি পাওয়া যায়নি বা পরিবর্তনের অনুমতি নেই।' };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Public layer (approved directory — the phone rides along for `tel:` only)
// ---------------------------------------------------------------------------
//
// Rows come from `fn_public_donor_directory`, a SECURITY DEFINER function that
// returns ONLY `status = 'approved'` donors plus a `contact_phone`. That is the
// single controlled door to a donor's number: the raw `private_phone` column
// stays REVOKEd from the public key, so a bulk table select still fails. The UI
// never prints the number, it only uses it to build the কল করুন `tel:` link.

export interface PublicDonorFilters {
  bloodGroup?: string;
  areaId?: string;
  isAvailableNow?: boolean;
}

// SHOWCASE FALLBACK — only when Supabase is NOT configured at all.
//
// With a real database attached the directory returns real approvals, or an
// honest empty state; it never mixes sample rows into live data.
function filterDemoDonors(filters?: PublicDonorFilters): BloodDonorProfile[] {
  return DEMO_DONOR_PROFILES.filter((donor) => {
    if (!donor.isAvailable) return false;
    if (filters?.bloodGroup && filters.bloodGroup !== 'all') {
      if (donor.bloodGroup !== filters.bloodGroup) return false;
    }
    if (filters?.areaId && donor.areaId !== filters.areaId) return false;
    if (filters?.isAvailableNow && !donor.isAvailable) return false;
    return true;
  });
}

export async function fetchPublishedDonors(filters?: PublicDonorFilters): Promise<BloodDonorProfile[]> {
  if (!isSupabaseConfigured) return filterDemoDonors(filters);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client.rpc('fn_public_donor_directory', {
    p_blood_group: filters?.bloodGroup && filters.bloodGroup !== 'all' ? filters.bloodGroup : null,
    p_area_id: filters?.areaId || null,
    p_available_only: Boolean(filters?.isAvailableNow),
  });
  // A query error or an empty approval list is an honest empty state, never demo rows.
  if (error) return [];
  return ((data as Record<string, unknown>[]) || []).map((row) => mapDonorRow(row));
}

export async function fetchPublishedDonorById(id: string): Promise<BloodDonorProfile | null> {
  if (!isSupabaseConfigured) {
    const demo = getDemoDonor(id);
    if (demo) return demo;
    return mockFetchPublishedDonors().find((donor) => donor.id === id) || null;
  }
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client.rpc('fn_public_donor_directory');
  if (error) return null;
  const match = ((data as Record<string, unknown>[]) || []).find((row) => row.id === id);
  return match ? mapDonorRow(match) : null;
}

// ---------------------------------------------------------------------------
// Donor reports (visitors flag a donor profile)
// ---------------------------------------------------------------------------

export async function createBloodDonorReport(input: {
  donorProfileId: string;
  reporterName: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return mockCreateBloodDonorReport(input);
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const reportId = crypto.randomUUID();
  const { data: user } = await client.auth.getUser();
  const { error } = await client.from('blood_donor_reports').insert({
    id: reportId,
    donor_profile_id: input.donorProfileId,
    reporter_id: user?.user?.id || null,
    reporter_name: input.reporterName,
    reason: input.reason,
    details: input.details || null,
  });
  if (error) return { success: false, error: `রিপোর্ট জমা ব্যর্থ: ${error.message}` };
  void requestAdminEmailAlert('blood_donor_reports', reportId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin layer (donor profile review)
// ---------------------------------------------------------------------------

export async function adminFetchDonorProfiles(): Promise<BloodDonorProfile[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; রক্তদাতা প্রোফাইল লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  // `fn_admin_donor_profiles` is SECURITY DEFINER + is_admin() gated — the only
  // path that may read private_phone / admin_notes after the column REVOKEs.
  const { data, error } = await client.rpc('fn_admin_donor_profiles');
  if (error) throw new Error(`রক্তদাতা প্রোফাইল লোড ব্যর্থ হয়েছে: ${error.message}`);
  return ((data as Record<string, unknown>[]) || []).map((row) => mapDonorRow(row, { admin: true }));
}

export async function adminFetchDonorProfileById(id: string): Promise<BloodDonorProfile | null> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; রক্তদাতা প্রোফাইল লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const { data, error } = await client
    .rpc('fn_admin_donor_profile', { p_id: id })
    .maybeSingle();
  if (error) throw new Error(`রক্তদাতা প্রোফাইল লোড ব্যর্থ হয়েছে: ${error.message}`);
  if (!data) return null;
  return mapDonorRow(data as Record<string, unknown>, { admin: true });
}

export interface AdminDonorPatch {
  status?: BloodDonorStatus;
  isVerified?: boolean;
  adminNotes?: string;
  rejectionReason?: string;
  isAvailable?: boolean;
}

export async function adminUpdateDonorProfile(
  id: string,
  patch: AdminDonorPatch
): Promise<{ success: boolean; profile?: BloodDonorProfile; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase সংযুক্ত নেই; রক্তদাতা প্রোফাইল আপডেট করা যায়নি।' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) {
    dbPatch.status = patch.status;
    if (patch.status === 'approved') dbPatch.published_at = new Date().toISOString();
    if (patch.status !== 'rejected') dbPatch.rejection_reason = null;
  }
  if (typeof patch.isVerified === 'boolean') dbPatch.is_verified = patch.isVerified;
  if (typeof patch.adminNotes === 'string') dbPatch.admin_notes = patch.adminNotes;
  if (typeof patch.rejectionReason === 'string') dbPatch.rejection_reason = patch.rejectionReason;
  if (typeof patch.isAvailable === 'boolean') dbPatch.is_available = patch.isAvailable;
  const { data: ownerRow } = await client
    .from('blood_donor_profiles')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();
  const { error } = await client
    .from('blood_donor_profiles')
    .update(dbPatch)
    .eq('id', id);
  if (error) return { success: false, error: `আপডেট ব্যর্থ: ${error.message}` };
  if (patch.status && ownerRow?.user_id) {
    notifyCustomer({
      userId: ownerRow.user_id,
      title: `রক্তদাতা প্রোফাইলের অবস্থা: ${patch.status}`,
      body: 'আপনার প্রোফাইলের পর্যালোচনা সম্পন্ন হয়েছে।',
      type: patch.status === 'approved' ? 'success' : 'warning',
      relatedType: 'blood_donor_profile',
      relatedId: id,
    });
  }
  notifyAdminHub({
    title: 'রক্তদাতা প্রোফাইল আপডেট',
    body: `প্রোফাইল ${id} এর অবস্থা "${patch.status}" হয়েছে।`,
    type: patch.status === 'approved' ? 'success' : 'info',
    relatedType: 'donor_profile',
    relatedId: id,
  });
  const refreshed = await adminFetchDonorProfileById(id);
  return { success: true, profile: refreshed ?? undefined };
}

export async function adminFetchDonorReports(donorId?: string): Promise<BloodDonorReport[]> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; রক্তদাতার রিপোর্ট লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  let query = client.from('blood_donor_reports').select('*, donor_profile:blood_donor_profiles(full_name)');
  if (donorId) query = query.eq('donor_profile_id', donorId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`রক্তদাতার রিপোর্ট লোড ব্যর্থ হয়েছে: ${error.message}`);
  return (data || []).map((row) => mapReportRow(row as Record<string, unknown>));
}

export async function adminUpdateDonorReport(
  id: string,
  status: BloodDonorReport['status']
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase সংযুক্ত নেই; রিপোর্ট আপডেট করা যায়নি।' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('blood_donor_reports').update({ status }).eq('id', id);
  if (error) return { success: false, error: `আপডেট ব্যর্থ: ${error.message}` };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Storage helpers — donor photo (public)
// ---------------------------------------------------------------------------

/** Donor profile photo → public avatars bucket. */
export async function uploadDonorProfilePhoto(
  userId: string,
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
  const path = `${userId}/donor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from('avatars').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

export function resolveDonorPhotoUrl(src?: string): string {
  if (!src) return '';
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  const client = createClient();
  if (client) {
    const { data } = client.storage.from('avatars').getPublicUrl(src);
    if (data.publicUrl) return data.publicUrl;
  }
  return src;
}

export async function fetchDonorModuleStats() {
  if (!isSupabaseConfigured) return mockFetchDonorModuleStats();
  const client = createClient();
  if (!client) return mockFetchDonorModuleStats();
  const [donors, requests] = await Promise.all([
    client.from('blood_donor_profiles').select('status'),
    client.from('blood_requests').select('status'),
  ]);
  const rows = donors.data || [];
  const reqs = requests.data || [];
  return {
    publishing: rows.filter((r) => r.status === 'approved').length,
    pending: rows.filter((r) => r.status === 'pending_approval').length,
    openReqs: reqs.filter((r) =>
      ['pending_review', 'approved', 'donor_contacted', 'in_progress'].includes(r.status as string)
    ).length,
  };
}

// Re-export domain helpers for UI rendering.
export { DONOR_STATUS_META, BLOOD_REQUEST_STATUS_META, BLOOD_REQUEST_STATUSES } from './blood-donor-types';