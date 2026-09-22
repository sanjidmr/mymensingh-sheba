/**
 * Home Tutor (গৃহশিক্ষক) data layer facade.
 * Uses Supabase when configured; otherwise falls back to the in-memory mock store.
 *
 * Privacy contract:
 *  - PUBLIC_* column lists NEVER include private_phone or nid_number.
 *  - Public returned objects are defense-in-depth stripped too.
 *  - Reviews can only be created after a COMPLETED home-tutor request that the
 *    reviewer owns (enforced server-side by the DB trigger; this facade is a
 *    thin client used for real data entry).
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { toCamelObject } from './supabase/transform';
import type {
  HomeTutorProfile,
  ServiceRequestStatus,
  TutorAvailability,
  TutorProfileStatus,
  TutorReview,
  TutorReport,
} from '@/lib/supabase/types';
import {
  mockFetchPublishedTutors,
  mockFetchPublishedTutorById,
  mockFetchTutorReviews,
  mockFetchReviewEligibility,
  mockCreateTutorReport,
  mockAdminFetchTutorProfiles,
  mockAdminFetchTutorProfileById,
  mockAdminUpdateTutorProfile,
  mockAdminFetchTutorRequests,
  mockAdminUpdateTutorRequest,
} from './home-tutor-mock';
import { notifyCustomer, notifyAdminHub } from './notification-service';
import { TUTOR_STATUS_META } from './home-tutor-types';

/** Normalized admin-console shape of a 'home-tutor' service request. */
export interface AdminTutorRequest {
  id: string;
  customerId: string;
  serviceSlug: 'home-tutor';
  status: ServiceRequestStatus;
  areaId: string;
  addressLine: string;
  contactName: string;
  contactPhone: string;
  preferredTime?: string;
  details?: string;
  serviceType?: string;
  profileId?: string;
  profileTitle?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

// PRIVACY: deliberately no private_phone / nid_number here.
const PUBLIC_TUTOR_COLUMNS =
  'id, user_id, status, full_name, gender, institution, department, qualification, experience_years, preferred_areas, preferred_classes, preferred_subjects, expected_salary_min, expected_salary_max, days_per_week, bio, student_id_card_url, profile_photo_url, teaching_mode, availability, is_verified, rating_avg, rating_count, published_at, created_at, updated_at';

function mapTutorRow(row: Record<string, unknown>, opts: { admin?: boolean } = {}): HomeTutorProfile {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    userId: (c.userId as string) || '',
    status: (c.status as TutorProfileStatus) || 'draft',
    fullName: (c.fullName as string) || '',
    gender: c.gender === 'female' ? 'female' : 'male',
    institution: (c.institution as string) || '',
    department: (c.department as string) || '',
    qualification: (c.qualification as string) || '',
    experienceYears: Number(c.experienceYears ?? 0),
    preferredAreas: Array.isArray(c.preferredAreas) ? (c.preferredAreas as string[]) : [],
    preferredClasses: Array.isArray(c.preferredClasses) ? (c.preferredClasses as string[]) : [],
    preferredSubjects: Array.isArray(c.preferredSubjects) ? (c.preferredSubjects as string[]) : [],
    expectedSalaryMin: Number(c.expectedSalaryMin ?? 0),
    expectedSalaryMax: Number(c.expectedSalaryMax ?? 0),
    daysPerWeek: Number(c.daysPerWeek ?? 0),
    bio: (c.bio as string) || undefined,
    studentIdCardUrl: (c.studentIdCardUrl as string) || undefined,
    // Admin-only: never exposed to the public.
    nidNumber: opts.admin ? (c.nidNumber as string) || undefined : undefined,
    isVerified: Boolean(c.isVerified),
    privatePhone: opts.admin ? (c.privatePhone as string) || '' : '__protected__',
    teachingMode: (c.teachingMode as HomeTutorProfile['teachingMode']) || 'both',
    availability: (c.availability as TutorAvailability) || 'available',
    profilePhotoUrl: (c.profilePhotoUrl as string) || undefined,
    adminNotes: opts.admin ? (c.adminNotes as string) || undefined : undefined,
    rejectionReason: opts.admin ? (c.rejectionReason as string) || undefined : undefined,
    publishedAt: (c.publishedAt as string) || undefined,
    ratingAvg: c.ratingAvg != null ? Number(c.ratingAvg) : 0,
    ratingCount: Number(c.ratingCount ?? 0),
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || '',
  };
}

function mapReviewRow(row: Record<string, unknown>): TutorReview {
  const c = toCamelObject(row) as Record<string, unknown>;
  const customer = c.customer as { fullName?: string } | undefined;
  return {
    id: (c.id as string) || '',
    tutorId: (c.tutorId as string) || '',
    customerId: (c.customerId as string) || '',
    requestId: (c.requestId as string) || '',
    rating: Number(c.rating ?? 0),
    comment: (c.comment as string) || undefined,
    isPublished: Boolean(c.isPublished),
    createdAt: (c.createdAt as string) || '',
    customerName: customer?.fullName || undefined,
  };
}

// ---------------------------------------------------------------------------
// Public queries (directory)
// ---------------------------------------------------------------------------

export async function fetchPublishedTutors(): Promise<HomeTutorProfile[]> {
  if (!isSupabaseConfigured) return mockFetchPublishedTutors();
  const client = createClient();
  if (!client) return mockFetchPublishedTutors();
  const { data, error } = await client
    .from('home_tutor_profiles')
    .select(PUBLIC_TUTOR_COLUMNS)
    .eq('status', 'approved')
    .order('published_at', { ascending: false });
  if (error) return [];
  return (data || [])
    .map((row) => mapTutorRow(row as Record<string, unknown>))
    .map((t) => ({ ...t, privatePhone: '__protected__' }));
}

export async function fetchPublishedTutorById(id: string): Promise<HomeTutorProfile | null> {
  if (!isSupabaseConfigured) return mockFetchPublishedTutorById(id) || null;
  const client = createClient();
  if (!client) return mockFetchPublishedTutorById(id) || null;
  const { data, error } = await client
    .from('home_tutor_profiles')
    .select(PUBLIC_TUTOR_COLUMNS)
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle();
  if (error || !data) return null;
  return { ...mapTutorRow(data as Record<string, unknown>), privatePhone: '__protected__' };
}

// ---------------------------------------------------------------------------
// Reviews (public read; create after a completed request)
// ---------------------------------------------------------------------------

export async function fetchTutorReviews(tutorId: string): Promise<TutorReview[]> {
  if (!isSupabaseConfigured) return mockFetchTutorReviews(tutorId);
  const client = createClient();
  if (!client) return mockFetchTutorReviews(tutorId);
  const { data, error } = await client
    .from('tutor_reviews')
    .select(
      'id, tutor_id, customer_id, request_id, rating, comment, is_published, created_at, customer:profiles(full_name)'
    )
    .eq('tutor_id', tutorId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapReviewRow(row as Record<string, unknown>));
}

export type ReviewEligibility = {
  eligible: boolean;
  alreadyReviewed: boolean;
  completedRequestId?: string;
};

export async function fetchReviewEligibility(userId: string, tutorId: string): Promise<ReviewEligibility> {
  if (!isSupabaseConfigured) return mockFetchReviewEligibility(tutorId);
  const client = createClient();
  if (!client) return mockFetchReviewEligibility(tutorId);
  const [reqRes, revRes] = await Promise.all([
    client
      .from('service_requests')
      .select('id')
      .eq('customer_id', userId)
      .eq('service_slug', 'home-tutor')
      .eq('status', 'completed')
      .eq('profile_id', tutorId)
      .maybeSingle(),
    client
      .from('tutor_reviews')
      .select('id')
      .eq('customer_id', userId)
      .eq('tutor_id', tutorId)
      .maybeSingle(),
  ]);
  const completedRequestId = reqRes.data?.id as string | undefined;
  const alreadyReviewed = Boolean(revRes.data);
  return { eligible: Boolean(completedRequestId) && !alreadyReviewed, alreadyReviewed, completedRequestId };
}

export async function createTutorReview(input: {
  tutorId: string;
  requestId: string;
  rating: number;
  comment?: string;
}): Promise<{ success: boolean; error?: string }> {
  // gating check mirrors DB trigger; attacker-safe because DB enforces it too.
  if (!isSupabaseConfigured) return { success: false, error: 'প্রিভিউ মোডে রিভিউ দেওয়া যায় না' };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data: user } = await client.auth.getUser();
  const userId = user?.user?.id;
  if (!userId) return { success: false, error: 'লগইন প্রয়োজন' };
  const { error } = await client.from('tutor_reviews').insert({
    tutor_id: input.tutorId,
    customer_id: userId,
    request_id: input.requestId,
    rating: input.rating,
    comment: input.comment || null,
  });
  if (error) return { success: false, error: `রিভিউ জমা ব্যর্থ: ${error.message}` };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function createTutorReport(input: {
  tutorId: string;
  reporterName: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return mockCreateTutorReport(input);
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { data: user } = await client.auth.getUser();
  const { error } = await client.from('tutor_reports').insert({
    tutor_id: input.tutorId,
    reporter_id: user?.user?.id || null,
    reporter_name: input.reporterName,
    reason: input.reason,
    details: input.details || null,
  });
  if (error) return { success: false, error: `রিপোর্ট জমা ব্যর্থ: ${error.message}` };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin (profiles + requests) — private phone/notes only visible here
// ---------------------------------------------------------------------------

export async function adminFetchTutorProfiles(): Promise<HomeTutorProfile[]> {
  if (!isSupabaseConfigured) return mockAdminFetchTutorProfiles();
  const client = createClient();
  if (!client) return mockAdminFetchTutorProfiles();
  const { data, error } = await client
    .from('home_tutor_profiles')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => mapTutorRow(row as Record<string, unknown>, { admin: true }));
}

export async function adminFetchTutorProfileById(id: string): Promise<HomeTutorProfile | null> {
  if (!isSupabaseConfigured) return mockAdminFetchTutorProfileById(id) || null;
  const client = createClient();
  if (!client) return mockAdminFetchTutorProfileById(id) || null;
  const { data, error } = await client
    .from('home_tutor_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return mapTutorRow(data as Record<string, unknown>, { admin: true });
}

export interface AdminTutorPatch {
  status?: TutorProfileStatus;
  isVerified?: boolean;
  adminNotes?: string;
  rejectionReason?: string;
  availability?: TutorAvailability;
}

export async function adminUpdateTutorProfile(
  id: string,
  patch: AdminTutorPatch
): Promise<{ success: boolean; profile?: HomeTutorProfile; error?: string }> {
  if (!isSupabaseConfigured) {
    const profile = mockAdminUpdateTutorProfile(id, patch);
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
  if (patch.availability) dbPatch.availability = patch.availability;
  const { data: ownerRow } = await client
    .from('home_tutor_profiles')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();
  const { data, error } = await client
    .from('home_tutor_profiles')
    .update(dbPatch)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  if (patch.status && ownerRow?.user_id) {
    notifyCustomer({
      userId: ownerRow.user_id,
      title: `গৃহশিক্ষক প্রোফাইলের অবস্থা: ${TUTOR_STATUS_META[patch.status]?.labelBn || patch.status}`,
      body: 'আপনার প্রোফাইলের পর্যালোচনা সম্পন্ন হয়েছে।',
      type: patch.status === 'approved' ? 'success' : 'warning',
      relatedType: 'home_tutor_profile',
      relatedId: id,
    });
  }
  if (patch.status) {
    notifyAdminHub({
      title: 'গৃহশিক্ষক প্রোফাইল আপডেট',
      body: `প্রোফাইল ${id} এর অবস্থা "${patch.status}" হয়েছে।`,
      type: patch.status === 'approved' ? 'success' : 'info',
      relatedType: 'tutor_profile',
      relatedId: id,
    });
  }
  return { success: true, profile: mapTutorRow(data as Record<string, unknown>, { admin: true }) };
}

export async function adminFetchTutorRequests(): Promise<AdminTutorRequest[]> {
  if (!isSupabaseConfigured) return mockAdminFetchTutorRequests() as unknown as AdminTutorRequest[];
  const client = createClient();
  if (!client) return mockAdminFetchTutorRequests();
  const { data, error } = await client
    .from('service_requests')
    .select('*')
    .eq('service_slug', 'home-tutor')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || [])
    .map((row) => {
      const c = toCamelObject(row as Record<string, unknown>) as Record<string, unknown>;
      return {
        id: (c.id as string) || '',
        customerId: (c.customerId as string) || '',
        serviceSlug: 'home-tutor' as const,
        status: (c.status as ServiceRequestStatus) || 'new',
        areaId: (c.areaId as string) || '',
        addressLine: (c.addressLine as string) || '',
        contactName: (c.contactName as string) || '',
        contactPhone: (c.contactPhone as string) || '',
        preferredTime: (c.preferredTime as string) || undefined,
        details: (c.details as string) || undefined,
        serviceType: (c.serviceType as string) || undefined,
        profileId: (c.profileId as string) || undefined,
        profileTitle: (c.profileTitle as string) || undefined,
        adminNotes: (c.adminNotes as string) || undefined,
        createdAt: (c.createdAt as string) || '',
        updatedAt: (c.updatedAt as string) || undefined,
      } as AdminTutorRequest;
    });
}

export async function adminFetchTutorRequestById(
  id: string
): Promise<AdminTutorRequest | null> {
  if (!isSupabaseConfigured) {
    return mockAdminFetchTutorRequests().find((r) => r.id === id) ?? null;
  }
  const client = createClient();
  if (!client) return mockAdminFetchTutorRequests().find((r) => r.id === id) ?? null;
  const { data, error } = await client
    .from('service_requests')
    .select('*')
    .eq('id', id)
    .eq('service_slug', 'home-tutor')
    .single();
  if (error || !data) return null;
  const c = toCamelObject(data as Record<string, unknown>) as Record<string, unknown>;
  return {
    id: (c.id as string) || '',
    customerId: (c.customerId as string) || '',
    serviceSlug: 'home-tutor' as const,
    status: (c.status as ServiceRequestStatus) || 'new',
    areaId: (c.areaId as string) || '',
    addressLine: (c.addressLine as string) || '',
    contactName: (c.contactName as string) || '',
    contactPhone: (c.contactPhone as string) || '',
    preferredTime: (c.preferredTime as string) || undefined,
    details: (c.details as string) || undefined,
    serviceType: (c.serviceType as string) || undefined,
    profileId: (c.profileId as string) || undefined,
    profileTitle: (c.profileTitle as string) || undefined,
    adminNotes: (c.adminNotes as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || undefined,
  } as AdminTutorRequest;
}

export async function adminUpdateTutorRequest(
  id: string,
  status: ServiceRequestStatus,
  adminNotes?: string
): Promise<{ success: boolean; request?: AdminTutorRequest; error?: string }> {
  if (!isSupabaseConfigured) {
    const req = mockAdminUpdateTutorRequest(id, { status, adminNotes });
    return req ? { success: true, request: req } : { success: false, error: 'রিকোয়েস্ট পাওয়া যায়নি' };
  }
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (adminNotes !== undefined) patch.admin_notes = adminNotes;
  const { data, error } = await client
    .from('service_requests')
    .update(patch)
    .eq('id', id)
    .eq('service_slug', 'home-tutor')
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  const c = toCamelObject(data as Record<string, unknown>) as Record<string, unknown>;
  const request: AdminTutorRequest = {
    id: (c.id as string) || '',
    customerId: (c.customerId as string) || '',
    serviceSlug: 'home-tutor',
    status: (c.status as ServiceRequestStatus) || 'new',
    areaId: (c.areaId as string) || '',
    addressLine: (c.addressLine as string) || '',
    contactName: (c.contactName as string) || '',
    contactPhone: (c.contactPhone as string) || '',
    preferredTime: (c.preferredTime as string) || undefined,
    details: (c.details as string) || undefined,
    serviceType: (c.serviceType as string) || undefined,
    profileId: (c.profileId as string) || undefined,
    profileTitle: (c.profileTitle as string) || undefined,
    adminNotes: (c.adminNotes as string) || undefined,
    createdAt: (c.createdAt as string) || '',
    updatedAt: (c.updatedAt as string) || undefined,
  };
  return { success: true, request };
}

// ---------------------------------------------------------------------------
// Uploads (tutor profile photo -> public 'avatars' bucket)
// ---------------------------------------------------------------------------

export async function uploadTutorProfilePhoto(
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
  const path = `${userId}/tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from('avatars').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
  const { data } = client.storage.from('avatars').getPublicUrl(path);
  return { success: true, url: data.publicUrl };
}

/** Resolves a tutor photo raw value into a displayable src. */
export function resolveTutorPhotoUrl(src?: string): string {
  if (!src) return '';
  if (/^(https?:|blob:|data:)/.test(src)) return src;
  const client = createClient();
  if (client) {
    const { data } = client.storage.from('avatars').getPublicUrl(src);
    if (data.publicUrl) return data.publicUrl;
  }
  return src;
}

// ---------------------------------------------------------------------------
// Admin report/review moderation
// ---------------------------------------------------------------------------

export async function adminFetchTutorReports(): Promise<TutorReport[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('tutor_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((row) => toCamelObject(row as Record<string, unknown>) as unknown as TutorReport);
}

export async function adminUpdateTutorReportStatus(
  id: string,
  status: TutorReport['status']
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const { error } = await client.from('tutor_reports').update({ status }).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminFetchTutorReviews(): Promise<(TutorReview & { tutorName?: string })[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data } = await client
    .from('tutor_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((row) => {
    const c = toCamelObject(row as Record<string, unknown>) as unknown as TutorReview;
    return c;
  });
}

export async function adminUpdateTutorReview(
  id: string,
  patch: { isPublished?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  try {
    const dbPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof patch.isPublished === 'boolean') dbPatch.is_published = patch.isPublished;
    const { error } = await client.from('tutor_reviews').update(dbPatch).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ব্যর্থ' };
  }
}