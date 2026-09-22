/**
 * Blood Donor (রক্তদাতা) data layer facade.
 * Uses Supabase when configured; otherwise falls back to the in-memory mock store.
 *
 * Privacy contract:
 *  - PUBLIC_DONOR_COLUMNS NEVER includes private_phone.
 *  - Public donor objects are defense-in-depth stripped too; the phone exists
 *    only in admin responses and, after an ADMIN-released contact event, in the
 *    requesting customer's own contact-release record.
 *  - Prescriptions are private 'documents' paths, viewable only via signed URL
 *    (owner / admin at the DB layer; admin console here).
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { toCamelObject } from './supabase/transform';
import { notifyCustomer, notifyAdminHub } from './notification-service';
import type {
  BloodContactRelease,
  BloodDonorProfile,
  BloodDonorReport,
  BloodDonorStatus,
  BloodGroup,
  BloodRequest,
  BloodRequestStatus,
} from '@/lib/supabase/types';
import {
  mockCreateBloodDonorReport,
  mockCreateBloodRequest,
  mockFetchMyBloodRequests,
  mockFetchPublishedDonors,
  mockFetchPublishedDonorById,
  mockCancelBloodRequest,
  mockAdminFetchBloodRequestById,
  mockAdminFetchBloodRequests,
  mockAdminFetchContactReleases,
  mockAdminFetchDonorProfileById,
  mockAdminFetchDonorProfiles,
  mockAdminFetchDonorReports,
  mockAdminReleaseDonorContact,
  mockAdminUpdateBloodRequest,
  mockAdminUpdateDonorProfile,
  mockFetchDonorModuleStats,
  mockFetchMyContactReleases,
} from './blood-donor-mock';

// PRIVACY: deliberately no private_phone here.
const PUBLIC_DONOR_COLUMNS =
  'id, user_id, status, full_name, blood_group, area_id, gender, birth_year, weight_kg, is_available, last_donation_date, donation_count, is_verified, intro, profile_photo_url, published_at, created_at, updated_at';

function mapDonorRow(row: Record<string, unknown>, opts: { admin?: boolean } = {}): BloodDonorProfile {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
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
    isVerified: Boolean(c.isVerified),
    intro: (c.intro as string) || undefined,
    profilePhotoUrl: (c.profilePhotoUrl as string) || undefined,
    adminNotes: opts.admin ? (c.adminNotes as string) || undefined : undefined,
    rejectionReason: opts.admin ? (c.rejectionReason as string) || undefined : undefined,
    publishedAt: (c.publishedAt as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || '',
  };
}

function mapRequestRow(row: Record<string, unknown>): BloodRequest {
  const c = toCamelObject(row) as Record<string, unknown>;
  const donor = c.donorProfile as { fullName?: string; bloodGroup?: string } | undefined;
  return {
    id: (c.id as string) || '',
    customerId: (c.customerId as string) || '',
    donorProfileId: (c.donorProfileId as string) || undefined,
    donorName: donor?.fullName || (c.donorName as string) || undefined,
    donorBloodGroup: (donor?.bloodGroup as BloodGroup) || undefined,
    status: (c.status as BloodRequestStatus) || 'pending_review',
    patientName: (c.patientName as string) || '',
    phone: (c.phone as string) || '',
    bloodGroup: (c.bloodGroup as BloodGroup) || 'O+',
    units: Number(c.units ?? 1),
    hospitalName: (c.hospitalName as string) || '',
    hospitalAreaId: (c.hospitalAreaId as string) || undefined,
    hospitalLocation: (c.hospitalLocation as string) || '',
    requiredDateTime: (c.requiredDateTime as string) || undefined,
    areaId: (c.areaId as string) || '',
    patientInfo: (c.patientInfo as string) || undefined,
    prescriptionUrl: (c.prescriptionUrl as string) || '',
    adminNotes: (c.adminNotes as string) || undefined,
    rejectionReason: (c.rejectionReason as string) || undefined,
    contactedDonorName: (c.contactedDonorName as string) || undefined,
    contactReleasedAt: (c.contactReleasedAt as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || undefined,
  };
}

function mapReleaseRow(row: Record<string, unknown>): BloodContactRelease {
  const c = toCamelObject(row) as Record<string, unknown>;
  const donor = c.donorProfile as { privatePhone?: string } | undefined;
  return {
    id: (c.id as string) || '',
    requestId: (c.requestId as string) || '',
    donorProfileId: (c.donorProfileId as string) || '',
    releasedBy: (c.releasedBy as string) || '',
    releasedToCustomer: (c.releasedToCustomer as string) || '',
    contactPhone: donor?.privatePhone || (c.contactPhone as string) || undefined,
    createdAt: (c.createdAt as string) || '',
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

// ---------------------------------------------------------------------------
// Public layer (directory + detail — phone NEVER present)
// ---------------------------------------------------------------------------

export interface PublicDonorFilters {
  bloodGroup?: string;
  areaId?: string;
  isAvailableNow?: boolean;
}

export async function fetchPublishedDonors(filters?: PublicDonorFilters): Promise<BloodDonorProfile[]> {
  if (!isSupabaseConfigured) return mockFetchPublishedDonors(filters);
  const client = createClient();
  if (!client) return mockFetchPublishedDonors(filters);
  let query = client.from('blood_donor_profiles').select(PUBLIC_DONOR_COLUMNS).eq('status', 'approved');
  if (filters?.bloodGroup && filters.bloodGroup !== 'all') {
    query = query.eq('blood_group', filters.bloodGroup);
  }
  if (filters?.areaId) {
    query = query.eq('area_id', filters.areaId);
  }
  if (filters?.isAvailableNow) {
    query = query.eq('is_available', true);
  }
  const { data, error } = await query.order('published_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapDonorRow(row as Record<string, unknown>));
}

export async function fetchPublishedDonorById(id: string): Promise<BloodDonorProfile | null> {
  if (!isSupabaseConfigured) return mockFetchPublishedDonorById(id) || null;
  const client = createClient();
  if (!client) return mockFetchPublishedDonorById(id) || null;
  const { data, error } = await client
    .from('blood_donor_profiles')
    .select(PUBLIC_DONOR_COLUMNS)
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();
  if (error || !data) return null;
  return mapDonorRow(data as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Blood request (customer)
// ---------------------------------------------------------------------------

export interface CreateBloodRequestInput {
  donorProfileId: string;
  patientName: string;
  phone: string;
  bloodGroup: BloodGroup;
  units: number;
  hospitalName: string;
  hospitalAreaId?: string;
  hospitalLocation: string;
  requiredDateTime?: string;
  areaId: string;
  patientInfo?: string;
  prescriptionUrl: string;
}

export async function createBloodRequest(
  input: CreateBloodRequestInput
): Promise<{ success: boolean; request?: BloodRequest; error?: string }> {
  if (!input.patientName.trim()) return { success: false, error: 'রোগী / যোগাযোগকারীর নাম লিখুন' };
  if (!input.phone.trim()) return { success: false, error: 'আপনার ফোন নম্বর লিখুন' };
  if (!input.hospitalName.trim() || !input.hospitalLocation.trim()) {
    return { success: false, error: 'হাসপাতাল / ল্যাবের নাম ও অবস্থান লিখুন' };
  }
  if (!input.prescriptionUrl.trim()) {
    return { success: false, error: 'প্রেসক্রিপশন / ডাক্তারের লিখন আপলোড বাধ্যতামূলক' };
  }
  if (!isSupabaseConfigured) return mockCreateBloodRequest(input, 'guest');
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data: user } = await client.auth.getUser();
  const userId = user?.user?.id;
  if (!userId) return { success: false, error: 'রক্তের অনুরোধ পাঠাতে লগইন প্রয়োজন' };
  const { data, error } = await client
    .from('blood_requests')
    .insert({
      customer_id: userId,
      donor_profile_id: input.donorProfileId,
      patient_name: input.patientName.trim(),
      phone: input.phone.trim(),
      blood_group: input.bloodGroup,
      units: input.units,
      hospital_name: input.hospitalName.trim(),
      hospital_area_id: input.hospitalAreaId || null,
      hospital_location: input.hospitalLocation.trim(),
      required_date_time: input.requiredDateTime || null,
      area_id: input.areaId,
      patient_info: input.patientInfo?.trim() || null,
      prescription_url: input.prescriptionUrl,
    })
    .select('id, customer_id, donor_profile_id, status, patient_name, phone, blood_group, units, hospital_name, hospital_area_id, hospital_location, required_date_time, area_id, patient_info, prescription_url, admin_notes, rejection_reason, contacted_donor_name, contact_released_at, created_at, updated_at')
    .single();
  if (error) return { success: false, error: `অনুরোধ জমা ব্যর্থ: ${error.message}` };
  return { success: true, request: mapRequestRow(data as Record<string, unknown>) };
}

export async function fetchMyBloodRequests(customerId: string): Promise<BloodRequest[]> {
  if (!isSupabaseConfigured) return mockFetchMyBloodRequests(customerId);
  const client = createClient();
  if (!client) return mockFetchMyBloodRequests(customerId);
  const { data, error } = await client
    .from('blood_requests')
    .select(
      '*, donor_profile:blood_donor_profiles(full_name, blood_group), donor_name, donor_blood_group'
    )
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapRequestRow(row as Record<string, unknown>));
}

export async function cancelMyBloodRequest(
  id: string,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return mockCancelBloodRequest(id, customerId);
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data, error } = await client
    .from('blood_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('customer_id', customerId)
    .eq('status', 'pending_review')
    .select('status')
    .single();
  if (error) {
    // fall back: also allow cancelling an approved request that hasn't been released
    const { data: ok, error: err2 } = await client
      .from('blood_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('customer_id', customerId)
      .eq('status', 'approved')
      .select('status')
      .single();
    if (err2 || !ok) return { success: false, error: 'এই অবস্থায় আর বাতিল করা সম্ভব নয়' };
    return { success: true };
  }
  return { success: true };
}

export async function fetchMyContactReleases(customerId: string): Promise<BloodContactRelease[]> {
  if (!isSupabaseConfigured) return mockFetchMyContactReleases(customerId);
  const client = createClient();
  if (!client) return mockFetchMyContactReleases(customerId);
  const { data, error } = await client
    .from('blood_contact_releases')
    .select('*, donor_profile:blood_donor_profiles(private_phone)')
    .eq('released_to_customer', customerId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapReleaseRow(row as Record<string, unknown>));
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
  const { data: user } = await client.auth.getUser();
  const { error } = await client.from('blood_donor_reports').insert({
    donor_profile_id: input.donorProfileId,
    reporter_id: user?.user?.id || null,
    reporter_name: input.reporterName,
    reason: input.reason,
    details: input.details || null,
  });
  if (error) return { success: false, error: `রিপোর্ট জমা ব্যর্থ: ${error.message}` };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin layer (profiles + requests + contact release audit)
// ---------------------------------------------------------------------------

export async function adminFetchDonorProfiles(): Promise<BloodDonorProfile[]> {
  if (!isSupabaseConfigured) return mockAdminFetchDonorProfiles();
  const client = createClient();
  if (!client) return mockAdminFetchDonorProfiles();
  const { data, error } = await client.from('blood_donor_profiles').select('*').order('updated_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapDonorRow(row as Record<string, unknown>, { admin: true }));
}

export async function adminFetchDonorProfileById(id: string): Promise<BloodDonorProfile | null> {
  if (!isSupabaseConfigured) return mockAdminFetchDonorProfileById(id) || null;
  const client = createClient();
  if (!client) return mockAdminFetchDonorProfileById(id) || null;
  const { data, error } = await client.from('blood_donor_profiles').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
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
    const profile = mockAdminUpdateDonorProfile(id, patch);
    return profile ? { success: true, profile } : { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
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
  const { data, error } = await client
    .from('blood_donor_profiles')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .single();
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
  return { success: true, profile: mapDonorRow(data as Record<string, unknown>, { admin: true }) };
}

export async function adminFetchBloodRequests(): Promise<BloodRequest[]> {
  if (!isSupabaseConfigured) return mockAdminFetchBloodRequests();
  const client = createClient();
  if (!client) return mockAdminFetchBloodRequests();
  const { data, error } = await client
    .from('blood_requests')
    .select('*, donor_profile:blood_donor_profiles(full_name, blood_group)')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapRequestRow(row as Record<string, unknown>));
}

export async function adminFetchBloodRequestById(id: string): Promise<BloodRequest | null> {
  if (!isSupabaseConfigured) return mockAdminFetchBloodRequestById(id) || null;
  const client = createClient();
  if (!client) return mockAdminFetchBloodRequestById(id) || null;
  const { data, error } = await client
    .from('blood_requests')
    .select('*, donor_profile:blood_donor_profiles(full_name, blood_group)')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRequestRow(data as Record<string, unknown>);
}

export async function adminUpdateBloodRequest(
  id: string,
  patch: { status?: BloodRequestStatus; adminNotes?: string; rejectionReason?: string }
): Promise<{ success: boolean; request?: BloodRequest; error?: string }> {
  if (!isSupabaseConfigured) {
    const request = mockAdminUpdateBloodRequest(id, patch);
    return request ? { success: true, request } : { success: false, error: 'আবেদনটি পাওয়া যায়নি' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) {
    dbPatch.status = patch.status;
    if (patch.status !== 'rejected') dbPatch.rejection_reason = null;
  }
  if (typeof patch.adminNotes === 'string') dbPatch.admin_notes = patch.adminNotes;
  if (typeof patch.rejectionReason === 'string') dbPatch.rejection_reason = patch.rejectionReason;
  const { data, error } = await client
    .from('blood_requests')
    .update(dbPatch)
    .eq('id', id)
    .select('*, donor_profile:blood_donor_profiles(full_name, blood_group)')
    .single();
  if (error) return { success: false, error: `আপডেট ব্যর্থ: ${error.message}` };
  if (data.customer_id) {
    notifyCustomer({
      userId: data.customer_id,
      title: 'আপনার রক্তের অনুরোধ আপডেট',
      body: `আপনার অনুরোধের অবস্থা এখন "${data.status}"।`,
      type: ['approved', 'donor_contacted', 'in_progress'].includes(data.status) ? 'success' : 'info',
      relatedType: 'blood_request',
      relatedId: id,
    });
  }
  notifyAdminHub({
    title: 'রক্তের অনুরোধ আপডেট',
    body: `অনুরোধ ${id} এর অবস্থা "${data.status}" হয়েছে।`,
    type: 'info',
    relatedType: 'blood_request',
    relatedId: id,
  });
  return { success: true, request: mapRequestRow(data as Record<string, unknown>) };
}

// --- Controlled contact release (audited) ---
export async function adminReleaseDonorContact(
  requestId: string
): Promise<{ success: boolean; phone?: string; donorName?: string; alreadyReleased?: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const res = mockAdminReleaseDonorContact(requestId, 'admin-user');
    return res;
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data: user } = await client.auth.getUser();
  const adminId = user?.user?.id;
  if (!adminId) return { success: false, error: 'পরিচয় নিশ্চিত করা যায়নি' };

  const request = await adminFetchBloodRequestById(requestId);
  if (!request || !request.donorProfileId) return { success: false, error: 'আবেদনটি পাওয়া যায়নি' };

  const [donorRes, existingRes] = await Promise.all([
    client.from('blood_donor_profiles').select('id, full_name, private_phone').eq('id', request.donorProfileId).maybeSingle(),
    client.from('blood_contact_releases').select('id').eq('request_id', requestId).maybeSingle(),
  ]);
  if (donorRes.error || !donorRes.data) return { success: false, error: 'রক্তদাতার তথ্য পাওয়া যায়নি' };
  if (existingRes.data) {
    return {
      success: true,
      phone: (donorRes.data as { private_phone: string }).private_phone,
      donorName: (donorRes.data as { full_name: string }).full_name,
      alreadyReleased: true,
    };
  }

  const { error: insErr } = await client.from('blood_contact_releases').insert({
    request_id: requestId,
    donor_profile_id: request.donorProfileId,
    released_by: adminId,
    released_to_customer: request.customerId,
  });
  if (insErr) return { success: false, error: `মুক্তি রেকর্ড ব্যর্থ: ${insErr.message}` };

  await client
    .from('blood_requests')
    .update({
      contact_released_at: new Date().toISOString(),
      contacted_donor_name: (donorRes.data as { full_name: string }).full_name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  return {
    success: true,
    phone: (donorRes.data as { private_phone: string }).private_phone,
    donorName: (donorRes.data as { full_name: string }).full_name,
    alreadyReleased: false,
  };
}

export async function adminFetchContactReleases(requestId: string): Promise<BloodContactRelease[]> {
  if (!isSupabaseConfigured) return mockAdminFetchContactReleases(requestId);
  const client = createClient();
  if (!client) return mockAdminFetchContactReleases(requestId);
  const { data, error } = await client
    .from('blood_contact_releases')
    .select(
      'id, request_id, donor_profile_id, released_by, released_to_customer, created_at, released_by:profiles!blood_contact_releases_released_by_fkey(full_name), donor_profile:blood_donor_profiles(private_phone)'
    )
    .eq('request_id', requestId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapReleaseRow(row as Record<string, unknown>));
}

export async function adminFetchDonorReports(donorId?: string): Promise<BloodDonorReport[]> {
  if (!isSupabaseConfigured) return mockAdminFetchDonorReports(donorId);
  const client = createClient();
  if (!client) return mockAdminFetchDonorReports(donorId);
  let query = client.from('blood_donor_reports').select('*, donor_profile:blood_donor_profiles(full_name)');
  if (donorId) query = query.eq('donor_profile_id', donorId);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapReportRow(row as Record<string, unknown>));
}

export async function adminUpdateDonorReport(
  id: string,
  status: BloodDonorReport['status']
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('blood_donor_reports').update({ status }).eq('id', id);
  if (error) return { success: false, error: `আপডেট ব্যর্থ: ${error.message}` };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Storage helpers — prescriptions (private) + donor photo (public)
// ---------------------------------------------------------------------------

/** Prescription / medical document: private 'documents' bucket, image OR PDF. */
export async function uploadBloodPrescription(
  customerId: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> {
  const isImage = file.type.startsWith('image/');
  const isPdf = file.type === 'application/pdf';
  if ((!isImage && !isPdf) || file.size > 5 * 1024 * 1024) {
    return { success: false, error: 'শুধুমাত্র ছবি বা PDF ফাইল (সর্বোচ্চ ৫MB) আপলোড করা যাবে' };
  }
  if (!isSupabaseConfigured) {
    if (!isImage) return { success: true, url: `__mock__/prescriptions/${Date.now()}.pdf` };
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
  const ext = file.name.split('.').pop()?.toLowerCase() || (isPdf ? 'pdf' : 'jpg');
  const path = `${customerId}/prescriptions/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from('documents').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `আপলোড ব্যর্থ: ${error.message}` };
  return { success: true, url: path };
}

/** Resolves a private prescription path to a temporary signed URL (owner/admin). */
export async function getPrescriptionViewUrl(url?: string): Promise<string | undefined> {
  if (!url) return undefined;
  if (/^(https?:|blob:|data:)/.test(url) || url.startsWith('__mock__')) return url;
  if (!isSupabaseConfigured) return url;
  const client = createClient();
  if (!client) return url;
  const { data, error } = await client.storage.from('documents').createSignedUrl(url, 3600);
  if (error || !data?.signedUrl) return undefined;
  return data.signedUrl;
}

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