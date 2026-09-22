/**
 * Centralized Admin data layer (Mymensingh Sheba).
 * Everything here is consumed ONLY behind the client-side `isAdmin` gate
 * (`app/admin/layout.tsx`). The real security boundary is Supabase RLS,
 * enforced by `public.is_admin()` and per-table policies in schema.sql.
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import { createServerSideClient } from './supabase/server';
import { toCamelObject } from './supabase/transform';
import type {
  BloodDonorProfile,
  BloodDonorReport,
  HomeTutorProfile,
  ListingReport,
  NotificationItem,
  StaffProfile,
  StaffReport,
  TutorReport,
  TutorReview,
  ToletProfile,
  UserProfile,
  ServiceRequestStatus,
} from '@/lib/supabase/types';
import { DEFAULT_TOLET_FEE_RULES, type ToletFeeRules } from './tolet-fees';
import type {
  AdminUserRow,
  AdminReportRow,
  AdminReportStatus,
  AdminDashboardStats,
  PlatformSettings,
} from './admin-types';

export type { AdminUserRow, AdminReportRow, AdminReportStatus, AdminDashboardStats, PlatformSettings } from './admin-types';

// ---------------------------------------------------------------------------
// Mock fallbacks (preview mode — honest zeros, no fabricated statistics)
// ---------------------------------------------------------------------------

function mockDashboardStats(): AdminDashboardStats {
  return {
    users: 0,
    pendingVerifications: 0,
    publishedTutors: 0,
    publishedDonors: 0,
    activeStaff: 0,
    openRequests: 0,
    bloodPending: 0,
    openReports: 0,
    unreadAdminNotifs: 0,
  };
}

function mockUsers(): AdminUserRow[] {
  return [];
}

function mockReports(): AdminReportRow[] {
  return [];
}

// ---------------------------------------------------------------------------
// Dashboard statistics (real counts from existing admin facades)
// ---------------------------------------------------------------------------

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (!isSupabaseConfigured) return mockDashboardStats();
  const client = createClient();
  if (!client) return mockDashboardStats();

  try {
    const [profilesRes, tutorsRes, donorsRes, staffRes, managedRes, bloodRes, reportsRes, notifsRes] = await Promise.all([
      client.from('profiles').select('id, role').order('created_at', { ascending: false }),
      client.from('home_tutor_profiles').select('id, status'),
      client.from('blood_donor_profiles').select('id, status'),
      client.from('staff_profiles').select('id, is_active'),
      client.from('service_requests').select('id, status').order('created_at', { ascending: false }),
      client.from('blood_requests').select('id, status'),
      Promise.all([
        client.from('listing_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        client.from('staff_profile_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        client.from('tutor_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        client.from('blood_donor_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]),
      client.from('notifications').select('id', { count: 'exact', head: true }).eq('target_role', 'admin').eq('is_read', false),
    ]);

    const profiles = profilesRes.data || [];
    const tutorsArr = (tutorsRes.data || []) as { id: string; status: string }[];
    const donorsArr = (donorsRes.data || []) as { id: string; status: string }[];
    const staffArr = (staffRes.data || []) as { id: string; is_active: boolean }[];
    const reqArr = (managedRes.data || []) as { status: ServiceRequestStatus }[];
    const bloodArr = (bloodRes.data || []) as { status: string }[];
    const [listingCount, staffCount, tutorCount, donorCount] = reportsRes.map(r => r.count ?? 0);

    const toletPendingCount = await client.from('tolet_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval');

    return {
      users: profiles.length,
      pendingVerifications:
        tutorsArr.filter((t) => t.status === 'pending_approval').length +
        donorsArr.filter((d) => d.status === 'pending_approval').length +
        (toletPendingCount.count ?? 0),
      publishedTutors: tutorsArr.filter((t) => t.status === 'approved').length,
      publishedDonors: donorsArr.filter((d) => d.status === 'approved').length,
      activeStaff: staffArr.filter((s) => s.is_active).length,
      openRequests: reqArr.filter(
        (r) =>
          r.status !== 'completed' &&
          r.status !== 'cancelled' &&
          r.status !== 'rejected'
      ).length,
      bloodPending: bloodArr.filter((b) =>
        ['pending_review', 'approved'].includes(b.status)
      ).length,
      openReports: listingCount + staffCount + tutorCount + donorCount,
      unreadAdminNotifs: notifsRes.count ?? 0,
    };
  } catch {
    return mockDashboardStats();
  }
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export async function adminFetchUsers(): Promise<AdminUserRow[]> {
  if (!isSupabaseConfigured) return mockUsers();
  const client = createClient();
  if (!client) return [];
  try {
    const profilesRes = await client.from('profiles').select('*').order('created_at', { ascending: false });
    const toletRes = await client.from('tolet_profiles').select('id, user_id, status, owner_name, phone');
    const tutorsRes = await client.from('home_tutor_profiles').select('id, user_id, status, full_name');
    const donorsRes = await client.from('blood_donor_profiles').select('id, user_id, status, full_name');
    
    const profiles = profilesRes.data || [];
    const tolet = toletRes.data || [];
    const tutors = tutorsRes.data || [];
    const donors = donorsRes.data || [];
    
    return profiles.map((p) => {
      const tp = tolet.find((x) => x.user_id === p.id);
      const tt = tutors.find((x) => x.user_id === p.id);
      const td = donors.find((x) => x.user_id === p.id);
      const base = toCamelObject(p as Record<string, unknown>) as unknown as UserProfile;
      return {
        id: base.id,
        fullName: base.fullName,
        phone: base.phone,
        email: base.email,
        role: base.role,
        status: base.status,
        isVerified: base.isVerified,
        createdAt: base.createdAt,
        toletStatus: tp?.status ?? null,
        tutorStatus: tt?.status ?? null,
        donorStatus: td?.status ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function adminUpdateUserStatus(
  userId: string,
  status: UserProfile['status']
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  try {
    const { error } = await client.from('profiles').update({ status, updated_at: new Date().toISOString() }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ব্যর্থ' };
  }
}

// ---------------------------------------------------------------------------
// Reports moderation hub
// ---------------------------------------------------------------------------

export async function adminFetchAllReports(): Promise<AdminReportRow[]> {
  if (!isSupabaseConfigured) return mockReports();
  const client = createClient();
  if (!client) return [];
  try {
    const [listing, staff, tutor, donor] = await Promise.all([
      client.from('listing_reports').select('*').order('created_at', { ascending: false }),
      client.from('staff_profile_reports').select('*').order('created_at', { ascending: false }),
      client.from('tutor_reports').select('*').order('created_at', { ascending: false }),
      client.from('blood_donor_reports').select('*').order('created_at', { ascending: false }),
    ]);
    const rows: AdminReportRow[] = [];
    for (const r of listing.data || []) {
      const c = toCamelObject(r as Record<string, unknown>) as unknown as ListingReport;
      rows.push({ id: c.id, type: 'listing', status: c.status, title: c.title ?? c.reason, reason: c.reason, createdAt: c.createdAt, relatedId: c.listingId });
    }
    for (const r of staff.data || []) {
      const c = toCamelObject(r as Record<string, unknown>) as unknown as StaffReport;
      rows.push({ id: c.id, type: 'staff', status: c.status, title: c.reason, reason: c.reason, createdAt: c.createdAt, relatedId: c.staffProfileId });
    }
    for (const r of tutor.data || []) {
      const c = toCamelObject(r as Record<string, unknown>) as unknown as TutorReport;
      rows.push({ id: c.id, type: 'tutor', status: c.status, title: c.reason, reason: c.reason, createdAt: c.createdAt, relatedId: c.tutorId });
    }
    for (const r of donor.data || []) {
      const c = toCamelObject(r as Record<string, unknown>) as unknown as BloodDonorReport;
      rows.push({ id: c.id, type: 'donor', status: c.status, title: c.reason, reason: c.reason, createdAt: c.createdAt, relatedId: c.donorProfileId });
    }
    return rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch {
    return [];
  }
}

export async function adminUpdateReportStatus(
  type: AdminReportRow['type'],
  id: string,
  status: AdminReportStatus
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  const table = ({
    listing: 'listing_reports',
    staff: 'staff_profile_reports',
    tutor: 'tutor_reports',
    donor: 'blood_donor_reports',
  } as const)[type];
  try {
    const { error } = await client.from(table).update({ status }).eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'ব্যর্থ' };
  }
}

// ---------------------------------------------------------------------------
// Tutor review moderation (admin)
// ---------------------------------------------------------------------------

export async function adminFetchTutorReviews(): Promise<(TutorReview & { tutorName?: string })[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data } = await client
    .from('tutor_reviews')
    .select('*')
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((row) => toCamelObject(row as Record<string, unknown>) as unknown as TutorReview);
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

// ---------------------------------------------------------------------------
// Platform settings (single source of truth for admin-configurable values)
// ---------------------------------------------------------------------------

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  if (!isSupabaseConfigured) {
    return {
      toletFeeRules: { ...DEFAULT_TOLET_FEE_RULES },
      serviceAvailability: {
        tolet: true,
        'home-tutor': true,
        'home-moving': true,
        kajerBua: true,
        electrician: true,
        plumber: true,
      },
      notificationSettings: {
        notifyOnRequestSubmitted: true,
        notifyOnStatusChange: true,
        notifyAdminOnNewRequest: true,
        notifyCustomerOnStatusChange: true,
      },
    };
  }
  const client = createClient();
  if (!client) return {
    toletFeeRules: { ...DEFAULT_TOLET_FEE_RULES },
    serviceAvailability: {},
    notificationSettings: {
      notifyOnRequestSubmitted: true,
      notifyOnStatusChange: true,
      notifyAdminOnNewRequest: true,
      notifyCustomerOnStatusChange: true,
    },
  };
  const { data } = await client.from('platform_settings').select('key, value').in('key', [
    'tolet_fee_rules',
    'service_availability',
    'notification_settings',
  ]);
  const parse = (key: string, fallback: unknown) => {
    const row = (data || []).find((r) => (r as Record<string, unknown>).key === key);
    if (!row) return fallback;
    const v = (row as Record<string, unknown>).value;
    return typeof v === 'object' && v !== null ? v : fallback;
  };
  return {
    toletFeeRules: (parse('tolet_fee_rules', DEFAULT_TOLET_FEE_RULES) as ToletFeeRules) || DEFAULT_TOLET_FEE_RULES,
    serviceAvailability: (parse('service_availability', {}) as Record<string, boolean>) || {},
    notificationSettings: (parse('notification_settings', {
      notifyOnRequestSubmitted: true,
      notifyOnStatusChange: true,
      notifyAdminOnNewRequest: true,
      notifyCustomerOnStatusChange: true,
    }) as PlatformSettings['notificationSettings']) || {
      notifyOnRequestSubmitted: true,
      notifyOnStatusChange: true,
      notifyAdminOnNewRequest: true,
      notifyCustomerOnStatusChange: true,
    },
  };
}

export async function savePlatformSettings(patch: {
  toletFeeRules?: ToletFeeRules;
  serviceAvailability?: Record<string, boolean>;
  notificationSettings?: PlatformSettings['notificationSettings'];
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false, error: 'Supabase সংযুক্ত নয়' };
  try {
    if (patch.toletFeeRules) {
      const { error } = await client
        .from('platform_settings')
        .upsert({ key: 'tolet_fee_rules', value: patch.toletFeeRules }, { onConflict: 'key' });
      if (error) throw error;
    }
    if (patch.serviceAvailability) {
      const { error } = await client
        .from('platform_settings')
        .upsert({ key: 'service_availability', value: patch.serviceAvailability }, { onConflict: 'key' });
      if (error) throw error;
    }
    if (patch.notificationSettings) {
      const { error } = await client
        .from('platform_settings')
        .upsert({ key: 'notification_settings', value: patch.notificationSettings }, { onConflict: 'key' });
      if (error) throw error;
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ' };
  }
}

// ---------------------------------------------------------------------------
// Notification hub (admin inbox)
// ---------------------------------------------------------------------------

export async function adminFetchNotifications(): Promise<NotificationItem[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  try {
    const { data } = await client
      .from('notifications')
      .select('*')
      .eq('target_role', 'admin')
      .order('created_at', { ascending: false })
      .limit(100);
    return (data || []).map(
      (row) =>
        ({
          ...toCamelObject(row as Record<string, unknown>),
          linkHref: undefined,
        } as unknown as NotificationItem)
    );
  } catch {
    return [];
  }
}

export async function adminMarkNotificationsRead(): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured) return { success: true };
  const client = createClient();
  if (!client) return { success: false } as { success: boolean };
  try {
    const { error } = await client.from('notifications').update({ is_read: true }).eq('target_role', 'admin').eq('is_read', false);
    if (error) return { success: false };
    return { success: true };
  } catch {
    return { success: false };
  }
}

export function reportTargetLink(type: AdminReportRow['type'], relatedId?: string): string {
  switch (type) {
    case 'listing':
      return relatedId ? `/admin/tolet/${relatedId}` : '/admin/tolet';
    case 'staff':
      return relatedId ? `/admin/services/${relatedId}` : '/admin/services';
    case 'tutor':
      return '/admin/verifications';
    case 'donor':
      return '/admin/blood';
  }
}