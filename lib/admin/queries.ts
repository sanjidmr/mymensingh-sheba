import { createServerSideClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { clampPage, clampPageSize } from './format';
// ⚠️ DEV AUTH BYPASS — remove together with lib/dev-auth-bypass.ts.
import { DEV_AUTH_BYPASS } from '@/lib/dev-auth-bypass';
import {
  createDevServiceRoleClient,
  resolveDevAdminIdentity,
} from '@/lib/admin/dev-service-role';
import { STAFF_SERVICE_KEYS, type StaffProfile, type StaffServiceKey } from '@/lib/staff-types';
import { VEHICLE_KINDS, type VehicleKind } from '@/lib/catalog-types';
import { HOME_SERVICE_SLUGS, SERVICE_REQUEST_STATUSES } from './service-request-constants';

/**
 * The admin console's server-side data layer.
 *
 * Every admin screen reads through here rather than reaching for the browser
 * client. Three reasons, in order of importance:
 *
 *  1. Authorisation is checked once, in the Server Component, before any query
 *     runs. A non-admin never gets as far as a database round trip.
 *  2. Pagination, search and filtering happen in Postgres. The previous admin
 *     pages pulled whole tables into the browser and filtered in JavaScript,
 *     which is both slow and a privacy problem — a customer's phone number
 *     should not be in a payload just to render a list of titles.
 *  3. The queries are shared, so the dashboard, the sidebar badges and the list
 *     pages cannot disagree about what "pending" means.
 *
 * Every function returns `unavailable: true` when Supabase is not configured.
 * Callers must render that as a configuration message — never as an empty queue,
 * which is indistinguishable from "nothing to do".
 */

export interface ListParams {
  page: number;
  pageSize: number;
  id?: string;
  search?: string;
  status?: string;
  kind?: string;
  category?: string;
  service?: string;
  area?: string;
  jobType?: string;
  from?: string;
  to?: string;
  sort?: string;
  [key: string]: string | number | undefined;
}

function failedPage<T>(params: ListParams, error: string): Paged<T> {
  return {
    rows: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: true,
    error,
  };
}

export interface Paged<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  /** Supabase is not configured — the UI must say so, not show "empty". */
  unavailable: boolean;
  /** A query failure, distinct from a genuinely empty result set. */
  error?: string;
}

export interface AdminClient {
  client: NonNullable<Awaited<ReturnType<typeof createServerSideClient>>>;
  userId: string;
}

export interface AdminAnalyticsRow {
  key: string;
  count: number;
  secondaryCount?: number;
}

export interface AdminAnalytics {
  customerTotal: number;
  newCustomersByDay: AdminAnalyticsRow[];
  toletListings: AdminAnalyticsRow[];
  serviceListings: AdminAnalyticsRow[];
  communityPosts: AdminAnalyticsRow[];
  serviceRequests: AdminAnalyticsRow[];
  toletRequests: AdminAnalyticsRow[];
  vehicleRequests: AdminAnalyticsRow[];
  bloodRequests: AdminAnalyticsRow[];
  bloodDonors: AdminAnalyticsRow[];
  reports: AdminAnalyticsRow[];
  toletEvents: AdminAnalyticsRow[];
  supportMessages: AdminAnalyticsRow[];
  adminNotifications: AdminAnalyticsRow[];
  auditActions: AdminAnalyticsRow[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAnalyticsRowList(value: unknown): AdminAnalyticsRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: AdminAnalyticsRow[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== 'string' ||
        typeof item.count !== 'number' || !Number.isFinite(item.count)) return null;
    if (item.secondaryCount !== undefined &&
        (typeof item.secondaryCount !== 'number' || !Number.isFinite(item.secondaryCount))) return null;
    rows.push({
      key: item.key,
      count: item.count,
      ...(typeof item.secondaryCount === 'number' ? { secondaryCount: item.secondaryCount } : {}),
    });
  }
  return rows;
}

function parseAdminAnalytics(value: unknown): AdminAnalytics | null {
  if (!isRecord(value) || typeof value.customerTotal !== 'number' ||
      !Number.isFinite(value.customerTotal)) return null;
  const newCustomersByDay = parseAnalyticsRowList(value.newCustomersByDay);
  const toletListings = parseAnalyticsRowList(value.toletListings);
  const serviceListings = parseAnalyticsRowList(value.serviceListings);
  const communityPosts = parseAnalyticsRowList(value.communityPosts);
  const serviceRequests = parseAnalyticsRowList(value.serviceRequests);
  const toletRequests = parseAnalyticsRowList(value.toletRequests);
  const vehicleRequests = parseAnalyticsRowList(value.vehicleRequests);
  const bloodRequests = parseAnalyticsRowList(value.bloodRequests);
  const bloodDonors = parseAnalyticsRowList(value.bloodDonors);
  const reports = parseAnalyticsRowList(value.reports);
  const toletEvents = parseAnalyticsRowList(value.toletEvents);
  const supportMessages = parseAnalyticsRowList(value.supportMessages);
  const adminNotifications = parseAnalyticsRowList(value.adminNotifications);
  const auditActions = parseAnalyticsRowList(value.auditActions);
  if (!newCustomersByDay || !toletListings || !serviceListings || !communityPosts || !serviceRequests || !toletRequests ||
      !vehicleRequests || !bloodRequests || !bloodDonors || !reports || !toletEvents ||
      !supportMessages || !adminNotifications || !auditActions) return null;
  return {
    customerTotal: value.customerTotal,
    newCustomersByDay,
    toletListings,
    serviceListings,
    communityPosts,
    serviceRequests,
    toletRequests,
    vehicleRequests,
    bloodRequests,
    bloodDonors,
    reports,
    toletEvents,
    supportMessages,
    adminNotifications,
    auditActions,
  };
}

/**
 * A Supabase client for an already-verified admin.
 *
 * Returns null when the caller is not an admin. Server Components call this
 * after `requireAdmin()`; Server Actions call it instead of trusting the
 * browser's claim to be an admin.
 */
export async function getAdminDataClient(): Promise<AdminClient | null> {
  // DEV AUTH BYPASS — never active in a production build. Reads run through
  // the server-only service-role client so `/admin` is fully usable without a
  // signed-in session. Never reached in production.
  if (DEV_AUTH_BYPASS) {
    const devClient = createDevServiceRoleClient();
    if (devClient) {
      const identity = await resolveDevAdminIdentity();
      return { client: devClient, userId: identity.userId };
    }
  }

  const client = await createServerSideClient();
  if (!client) return null;

  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'admin') return null;
  if (profile.status && profile.status !== 'active') return null;

  return { client, userId: user.id };
}

export async function fetchAdminAnalytics(from: string, to: string): Promise<{
  data: AdminAnalytics | null;
  unavailable: boolean;
  error?: string;
}> {
  const parseDate = (value: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
  };
  const start = parseDate(from);
  const end = parseDate(to);
  if (!start || !end || start > end || end.getTime() - start.getTime() > 366 * 86400000) {
    return { data: null, unavailable: false, error: 'তারিখের সীমা সঠিক নয়; সর্বোচ্চ ৩৬৭ দিনের পরিসর বেছে নিন।' };
  }

  const admin = await getAdminDataClient();
  if (!admin) return { data: null, unavailable: true, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };

  const { data, error } = await admin.client.rpc('get_admin_analytics', {
    p_from: from,
    p_to: to,
  });
  if (error) return { data: null, unavailable: false, error: error.message };
  const parsed = parseAdminAnalytics(data);
  if (!parsed) return { data: null, unavailable: false, error: 'অ্যানালিটিক্সের ডেটা ফরম্যাট সঠিক নয়।' };
  return { data: parsed, unavailable: false };
}

/** Normalise `searchParams` (string | string[] | undefined) into a query. */
export function parseListParams(
  searchParams: Record<string, string | string[] | undefined> | null | undefined,
  defaults: { pageSize?: number } = {}
): ListParams {
  const get = (key: string): string | undefined => {
    const raw = searchParams?.[key];
    if (Array.isArray(raw)) return raw[0] || undefined;
    return raw || undefined;
  };
  const from = parseDateFilter(get('from'));
  const to = parseDateFilter(get('to'));

  return {
    page: clampPage(get('page')),
    pageSize: clampPageSize(get('pageSize'), defaults.pageSize ?? 25),
    id: get('id'),
    search: get('q')?.trim() || undefined,
    status: get('status') || undefined,
    kind: get('kind') || undefined,
    category: get('category') || undefined,
    service: get('service') || undefined,
    area: get('area') || undefined,
    jobType: get('jobType') || undefined,
    from: from && (!to || from <= to) ? from : undefined,
    to: to && (!from || from <= to) ? to : undefined,
    sort: get('sort') || undefined,
  };
}

function parseDateFilter(value: string | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? value
    : undefined;
}

/** Build the `?q=` filter shared by every list screen. */
function searchFilter(search: string | undefined, columns: string[]) {
  if (!search) return undefined;
  // `.or()` accepts a PostgREST filter expression. Remove expression
  // delimiters from user input before interpolating it into the expression.
  const term = search.replace(/[%_,().*\\"]/g, ' ').replace(/[\[\]]/g, ' ').trim();
  if (!term) return undefined;
  return columns.map((c) => `${c}.ilike.%${term}%`).join(',');
}

function dhakaDateBoundary(date: string, endExclusive = false): string {
  const [year, month, day] = date.split('-').map(Number);
  const dayOffset = endExclusive ? 1 : 0;
  return new Date(Date.UTC(year, month - 1, day + dayOffset) - 6 * 60 * 60 * 1000)
    .toISOString();
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface AdminBadgeCounts {
  messages: number;
  posts: number;
  reports: number;
  requests: number;
  verifications: number;
  notifications: number;
  unavailable: boolean;
  error?: string;
}

/**
 * Sidebar badge counts.
 *
 * One round trip for all of them. These are the numbers that tell an owner
 * where to look first, so they are counts of *actionable* items only — a
 * badge that counts completed work is a badge that never goes away.
 */
export async function fetchAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  const admin = await getAdminDataClient();
  if (!admin) {
    return {
      messages: 0,
      posts: 0,
      reports: 0,
      requests: 0,
      verifications: 0,
      notifications: 0,
      unavailable: true,
    };
  }
  const { client } = admin;

  const [
    messages,
    posts,
    reports,
    requests,
    tutorApprovals,
    toletApprovals,
    donorApprovals,
    ownerApprovals,
    serviceApprovals,
    notifications,
  ] = await Promise.all([
    client.from('contact_messages').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    client.from('community_posts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    client
      .from('listing_reports')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    client
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '("completed","cancelled","rejected")'),
    client.from('home_tutor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    client.from('tolet_listings').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    client.from('blood_donor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    client.from('tolet_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    client.from('service_listings').select('id', { count: 'exact', head: true }).eq('status', 'pending').not('owner_id', 'is', null),
    client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('target_role', 'admin')
      .eq('is_read', false),
  ]);

  const failedQuery = [
    messages,
    posts,
    reports,
    requests,
    tutorApprovals,
    toletApprovals,
    donorApprovals,
    ownerApprovals,
    serviceApprovals,
    notifications,
  ].find((result) => result.error);
  if (failedQuery?.error) {
    return {
      messages: 0,
      posts: 0,
      reports: 0,
      requests: 0,
      verifications: 0,
      notifications: 0,
      unavailable: true,
      error: failedQuery.error.message,
    };
  }

  return {
    messages: messages.count ?? 0,
    posts: posts.count ?? 0,
    reports: reports.count ?? 0,
    requests: requests.count ?? 0,
    verifications:
      (tutorApprovals.count ?? 0) +
      (toletApprovals.count ?? 0) +
      (donorApprovals.count ?? 0) +
      (ownerApprovals.count ?? 0) +
      (serviceApprovals.count ?? 0),
    notifications: notifications.count ?? 0,
    unavailable: false,
  };
}

export interface DashboardStats {
  total_users: number;
  total_customers: number;
  active_users: number;
  blocked_users: number;
  new_users_7d: number;
  total_posts: number;
  post_kind_counts: Record<'news' | 'job' | 'buy_sell', number>;
  pending_posts: number;
  approved_posts: number;
  rejected_posts: number;
  featured_posts: number;
  total_requests: number;
  open_requests: number;
  completed_requests: number;
  cancelled_requests: number;
  rejected_requests: number;
  total_tolet_requests: number;
  open_tolet_requests: number;
  total_blood_requests: number;
  open_blood_requests: number;
  total_vehicle_requests: number;
  open_vehicle_requests: number;
  total_messages: number;
  unread_messages: number;
  total_reports: number;
  open_reports: number;
  pending_verifications: number;
  active_tolet_listings: number;
  pending_tolet_listings: number;
  active_staff: number;
  active_service_listings: number;
  active_emergency_contacts: number;
  unread_admin_notifications: number;
  new_service_requests: number;
  approved_blood_donors: number;
  unavailable: boolean;
  empty: boolean;
  issue?: DashboardDataIssue;
}

export interface DashboardDataIssue {
  kind: 'configuration' | 'connection' | 'schema' | 'permission' | 'authentication' | 'query';
  code?: string;
  title: string;
  message: string;
}

type DashboardRpcStats = Omit<
  DashboardStats,
  | 'post_kind_counts'
  | 'total_customers'
  | 'new_service_requests'
  | 'approved_blood_donors'
  | 'completed_requests'
  | 'cancelled_requests'
  | 'rejected_requests'
  | 'unavailable'
  | 'empty'
  | 'issue'
>;

function unavailableDashboardStats(issue: DashboardDataIssue): DashboardStats {
  return {
    total_users: 0, active_users: 0, blocked_users: 0, new_users_7d: 0,
    total_posts: 0, post_kind_counts: { news: 0, job: 0, buy_sell: 0 },
    pending_posts: 0, approved_posts: 0, rejected_posts: 0,
    featured_posts: 0, total_requests: 0, open_requests: 0,
    completed_requests: 0, cancelled_requests: 0, rejected_requests: 0,
    total_tolet_requests: 0, open_tolet_requests: 0, total_blood_requests: 0,
    open_blood_requests: 0, total_vehicle_requests: 0, open_vehicle_requests: 0,
    total_messages: 0, unread_messages: 0, total_reports: 0, open_reports: 0,
    pending_verifications: 0, active_tolet_listings: 0, pending_tolet_listings: 0,
    active_staff: 0, active_service_listings: 0, active_emergency_contacts: 0,
    unread_admin_notifications: 0,
    total_customers: 0, new_service_requests: 0, approved_blood_donors: 0,
    unavailable: true,
    empty: false,
    issue,
  };
}

function dashboardDataIssue(
  error: { code?: string; message?: string; status?: number } | null
): DashboardDataIssue {
  const code = error?.code;
  const message = error?.message ?? '';

  if (!isSupabaseConfigured) {
    return {
      kind: 'configuration',
      title: 'Supabase কনফিগার করা নেই',
      message: 'NEXT_PUBLIC_SUPABASE_URL এবং NEXT_PUBLIC_SUPABASE_ANON_KEY সেট করুন।',
    };
  }

  if (code === '42P01' || code === '42703' || code === '42883' ||
      code === 'PGRST202' || code === 'PGRST204' || code === 'PGRST205') {
    return {
      kind: 'schema',
      code,
      title: 'ডেটাবেজ স্কিমা অসম্পূর্ণ',
      message: 'প্রয়োজনীয় টেবিল, কলাম বা RPC নেই। Supabase-এ সর্বশেষ migration চালান।',
    };
  }

  if (/admin only/i.test(message)) {
    return DEV_AUTH_BYPASS
      ? {
          kind: 'authentication',
          code,
          title: 'বাস্তব admin session প্রয়োজন',
          message: 'Development UI bypass Supabase authentication তৈরি করে না। bypass বন্ধ করে সক্রিয় admin account দিয়ে sign in করুন।',
        }
      : {
          kind: 'authentication',
          code,
          title: 'অ্যাডমিন authentication ব্যর্থ',
          message: 'সাইন-ইন করা account-এ সক্রিয় admin role নেই।',
        };
  }

  if (code === '42501' || /permission denied|row-level security/i.test(message)) {
    return {
      kind: 'permission',
      code,
      title: 'ডেটাবেজ অনুমতি নেই',
      message: 'সাইন-ইন করা অ্যাকাউন্টে সক্রিয় admin role আছে কি না এবং RLS policy যাচাই করুন।',
    };
  }

  if (error?.status === 401 || error?.status === 403 ||
      code?.startsWith('28') || code === 'PGRST301' || code === 'PGRST302' ||
      /invalid.*(jwt|token)|jwt.*expired|not authenticated/i.test(message)) {
    return {
      kind: 'authentication',
      code,
      title: 'Supabase authentication ব্যর্থ',
      message: 'সেশন মেয়াদোত্তীর্ণ হতে পারে। আবার sign in করে চেষ্টা করুন।',
    };
  }

  if (code?.startsWith('08') || code === 'FETCH_ERROR' ||
      code === 'PGRST000' || code === 'PGRST001' || code === 'PGRST002' ||
      /fetch failed|network|timeout|connection refused/i.test(message)) {
    return {
      kind: 'connection',
      code,
      title: 'Supabase-এ সংযোগ করা যায়নি',
      message: 'নেটওয়ার্ক এবং Supabase project URL/status যাচাই করে আবার চেষ্টা করুন।',
    };
  }

  return {
    kind: 'query',
    code,
    title: 'ডেটাবেজ query ব্যর্থ',
    message: code ? `Supabase error code: ${code}` : 'Supabase query সম্পন্ন হয়নি।',
  };
}

async function getDashboardAdminClient(): Promise<
  { admin: AdminClient; issue?: never } | { admin: null; issue: DashboardDataIssue }
> {
  if (DEV_AUTH_BYPASS) {
    const admin = await getAdminDataClient();
    return admin
      ? { admin }
      : {
          admin: null,
          issue: {
            kind: 'authentication',
            title: 'অ্যাডমিন authentication যাচাই করা যায়নি',
            message: 'Development UI bypass client তৈরি করতে পারেনি। Supabase server configuration যাচাই করুন।',
          },
        };
  }

  if (!isSupabaseConfigured) {
    return { admin: null, issue: dashboardDataIssue(null) };
  }

  const client = await createServerSideClient();
  if (!client) return { admin: null, issue: dashboardDataIssue(null) };

  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) return { admin: null, issue: dashboardDataIssue(authError) };
  if (!authData.user) {
    return {
      admin: null,
      issue: {
        kind: 'authentication',
        title: 'সাইন-ইন প্রয়োজন',
        message: 'Dashboard দেখতে Supabase account দিয়ে sign in করুন।',
      },
    };
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, status')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileError) return { admin: null, issue: dashboardDataIssue(profileError) };
  if (!profile || profile.role !== 'admin' || (profile.status && profile.status !== 'active')) {
    return {
      admin: null,
      issue: {
        kind: 'permission',
        title: 'অ্যাডমিন অনুমতি নেই',
        message: 'সাইন-ইন করা account-এ সক্রিয় admin role নেই।',
      },
    };
  }

  return { admin: { client, userId: authData.user.id } };
}

/** Live dashboard counters, from the `get_admin_dashboard_stats()` RPC. */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { admin, issue } = await getDashboardAdminClient();
  if (!admin) return unavailableDashboardStats(issue);

  const [{ data, error }, { data: activeVisitors, error: activeVisitorsError }] = await Promise.all([
    admin.client.rpc('get_admin_dashboard_stats'),
    admin.client.rpc('fn_admin_active_visitors'),
  ]);
  if (error) return unavailableDashboardStats(dashboardDataIssue(error));
  if (activeVisitorsError) return unavailableDashboardStats(dashboardDataIssue(activeVisitorsError));

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return unavailableDashboardStats({
      kind: 'query',
      title: 'ডেটাবেজ থেকে পরিসংখ্যান পাওয়া যায়নি',
      message: 'Dashboard statistics RPC কোনো result ফেরত দেয়নি।',
    });
  }
  const postKinds = ['news', 'job', 'buy_sell'] as const;
  const [otherCounts, postKindCounts] = await Promise.all([
    Promise.all([
      admin.client.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      admin.client.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
      admin.client.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
      admin.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      admin.client.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      admin.client.from('blood_donor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    ]),
    Promise.all(postKinds.map((kind) =>
      admin.client.rpc('fn_admin_posts', {}, { head: true, count: 'exact' }).eq('kind', kind)
    )),
  ]);
  const [completed, cancelled, rejected, customers, newRequests, approvedDonors] = otherCounts;
  const countError =
    completed.error ??
    cancelled.error ??
    rejected.error ??
    customers.error ??
    newRequests.error ??
    approvedDonors.error ??
    postKindCounts.find((result) => result.error)?.error;
  if (countError) return unavailableDashboardStats(dashboardDataIssue(countError));
  const stats = row as DashboardRpcStats;
  const empty =
    Object.entries(stats)
      .filter(([key]) => key !== 'total_users' && key !== 'active_users')
      .every(([, value]) => value === 0) &&
    (completed.count ?? 0) === 0 &&
    (cancelled.count ?? 0) === 0 &&
    (rejected.count ?? 0) === 0 &&
    (customers.count ?? 0) === 0 &&
    (newRequests.count ?? 0) === 0 &&
    (approvedDonors.count ?? 0) === 0;
  return {
    ...stats,
    active_users: Number(activeVisitors ?? 0),
    post_kind_counts: Object.fromEntries(
      postKinds.map((kind, index) => [kind, postKindCounts[index].count ?? 0])
    ) as DashboardStats['post_kind_counts'],
    total_customers: customers.count ?? 0,
    new_service_requests: newRequests.count ?? 0,
    approved_blood_donors: approvedDonors.count ?? 0,
    completed_requests: completed.count ?? 0,
    cancelled_requests: cancelled.count ?? 0,
    rejected_requests: rejected.count ?? 0,
    unavailable: false,
    empty,
  };
}

export interface DashboardPendingItem {
  id: string;
  title: string;
  category: string;
  submitter: string;
  created_at: string;
  status: string;
  href: string;
}

/**
 * A bounded, minimal-field view of the newest records waiting for review.
 * Each source query is capped before the rows are merged and sorted.
 */
export async function fetchDashboardPendingItems(limit = 10): Promise<{
  items: DashboardPendingItem[];
  unavailable: boolean;
  issue?: DashboardDataIssue;
}> {
  const { admin, issue } = await getDashboardAdminClient();
  if (!admin) return { items: [], unavailable: true, issue };

  const itemLimit = Math.min(Math.max(limit, 1), 40);
  const perSourceLimit = Math.min(itemLimit, 10);
  const [posts, tolet, tutors, donors] = await Promise.all([
    admin.client
      .rpc('fn_admin_posts', {})
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(perSourceLimit),
    admin.client
      .from('tolet_listings')
      .select('id, title, owner_id, status, created_at')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(perSourceLimit),
    admin.client
      .from('home_tutor_profiles')
      .select('id, user_id, full_name, status, created_at')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(perSourceLimit),
    admin.client
      .from('blood_donor_profiles')
      .select('id, user_id, full_name, status, created_at')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(perSourceLimit),
  ]);

  const failed = [posts, tolet, tutors, donors].find((result) => result.error)?.error;
  if (failed) return { items: [], unavailable: true, issue: dashboardDataIssue(failed) };

  const submitterIds = [
    ...new Set([
      ...(tolet.data ?? []).map((row) => row.owner_id),
      ...(tutors.data ?? []).map((row) => row.user_id),
      ...(donors.data ?? []).map((row) => row.user_id),
    ]),
  ];
  const { data: profiles, error: profilesError } =
    submitterIds.length > 0
      ? await admin.client.from('profiles').select('id, full_name').in('id', submitterIds)
      : { data: [], error: null };
  if (profilesError) {
    return { items: [], unavailable: true, issue: dashboardDataIssue(profilesError) };
  }
  const nameByUserId = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  const kindLabel: Record<string, string> = {
    news: 'খবর',
    job: 'চাকরি',
    buy_sell: 'কেনাবেচা',
  };
  const postRows = (posts.data ?? []) as unknown as {
    id: string;
    title_bn: string;
    kind: string;
    author_name: string | null;
    created_at: string;
    status: string;
  }[];
  const postItems: DashboardPendingItem[] = postRows.map((row) => ({
    id: row.id,
    title: row.title_bn,
    category: kindLabel[row.kind] ?? row.kind,
    submitter: row.author_name || 'নাম দেওয়া হয়নি',
    created_at: row.created_at,
    status: row.status,
    href: `/admin/posts?status=pending&kind=${encodeURIComponent(row.kind)}&id=${encodeURIComponent(row.id)}`,
  }));
  const toletItems: DashboardPendingItem[] = (tolet.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    category: 'বাসা ভাড়া',
    submitter: nameByUserId.get(row.owner_id) || 'বিজ্ঞাপনদাতা',
    created_at: row.created_at,
    status: row.status,
    href: `/admin/tolet/${row.id}`,
  }));
  const tutorItems: DashboardPendingItem[] = (tutors.data ?? []).map((row) => ({
    id: row.id,
    title: row.full_name,
    category: 'গৃহশিক্ষক',
    submitter: nameByUserId.get(row.user_id) || row.full_name,
    created_at: row.created_at,
    status: row.status,
    href: `/admin/verifications?focus=${encodeURIComponent(row.id)}`,
  }));
  const donorItems: DashboardPendingItem[] = (donors.data ?? []).map((row) => ({
    id: row.id,
    title: row.full_name,
    category: 'রক্তদাতা',
    submitter: nameByUserId.get(row.user_id) || row.full_name,
    created_at: row.created_at,
    status: row.status,
    href: `/admin/blood/donors/${row.id}`,
  }));

  return {
    items: [...postItems, ...toletItems, ...tutorItems, ...donorItems]
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      .slice(0, itemLimit),
    unavailable: false,
  };
}

export interface ActivityItem {
  id: string;
  occurred_at: string;
  category: 'post' | 'request' | 'message' | 'report' | 'user';
  action: 'submitted' | 'approved' | 'rejected' | 'registered';
  title: string;
  detail: string;
  href: string;
}

/** The Recent Activity feed, from the `get_admin_recent_activity()` RPC. */
export async function fetchRecentActivity(limit = 12): Promise<{
  items: ActivityItem[];
  unavailable: boolean;
  issue?: DashboardDataIssue;
}> {
  const { admin, issue } = await getDashboardAdminClient();
  if (!admin) return { items: [], unavailable: true, issue };

  const { data, error } = await admin.client.rpc('get_admin_recent_activity', {
    p_limit: limit,
  });
  if (error) return { items: [], unavailable: true, issue: dashboardDataIssue(error) };
  if (!Array.isArray(data)) {
    return {
      items: [],
      unavailable: true,
      issue: {
        kind: 'query',
        title: 'সাম্প্রতিক কার্যক্রমের result সঠিক নয়',
        message: 'Dashboard activity RPC একটি তালিকা ফেরত দেয়নি।',
      },
    };
  }

  return {
    items: (data as ActivityItem[]).map((row) => ({
      id: row.id,
      occurred_at: row.occurred_at,
      category: row.category,
      action: row.action,
      title: row.title,
      detail: row.detail,
      href: row.href,
    })),
    unavailable: false,
  };
}

export interface AdminAuditEvent {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  entity_table: string;
  record_id: string | null;
  operation: 'insert' | 'update' | 'delete';
  before_state: Record<string, string | null>;
  after_state: Record<string, string | null>;
  created_at: string;
}

/** Admin-only, paged audit entries. The database policy is the final boundary. */
export async function fetchAdminAuditEvents(
  params: ListParams
): Promise<Paged<AdminAuditEvent>> {
  const admin = await getAdminDataClient();
  if (!admin) {
    return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  }

  let query = admin.client
    .from('admin_audit_log')
    .select('id, actor_id, entity_table, record_id, operation, before_state, after_state, created_at', {
      count: 'exact',
    });

  if (params.status) query = query.eq('operation', params.status);
  if (params.category) query = query.eq('entity_table', params.category);
  if (params.search) {
    const term = params.search.replace(/[%_,()]/g, '').trim();
    if (term) {
      query = query.or(`entity_table.ilike.%${term}%,record_id.ilike.%${term}%`);
    }
  }

  const from = (params.page - 1) * params.pageSize;
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + params.pageSize - 1);

  if (error) {
    return {
      rows: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      unavailable: true,
      error: error.message,
    };
  }

  const rows = data ?? [];
  const actorIds = [...new Set(rows.flatMap((row) => row.actor_id ? [row.actor_id] : []))];
  const namesById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: actors, error: actorError } = await admin.client
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds);
    if (actorError) {
      return {
        rows: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        unavailable: true,
        error: actorError.message,
      };
    }
    for (const actor of actors ?? []) namesById.set(actor.id, actor.full_name);
  }

  return {
    rows: rows.map((row) => ({
      ...row,
      actor_name: row.actor_id ? namesById.get(row.actor_id) ?? null : null,
      before_state: row.before_state ?? {},
      after_state: row.after_state ?? {},
    })),
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface AdminUserRow {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  role: 'customer' | 'admin';
  status: 'active' | 'suspended' | 'blocked';
  is_verified: boolean;
  created_at: string;
  tolet_status: string | null;
  tutor_status: string | null;
  donor_status: string | null;
  post_count: number;
  request_count: number;
}

/**
 * Registered users with the service profiles attached.
 *
 * The three profile tables are fetched by id in one query each rather than
 * joined, because PostgREST cannot join across unrelated tables and a per-row
 * lookup would be N+1. The counts are real — they come from the database, not
 * from a client-side tally.
 */
export async function fetchUsers(params: ListParams): Promise<Paged<AdminUserRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('profiles')
    .select('id, full_name, phone, email, role, status, is_verified, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['full_name', 'phone', 'email']);
  if (term) query = query.or(term);
  if (params.status) query = query.eq('status', params.status);

  const { data, count, error } = await query;
  if (error || !data) {
    return failedPage(params, error?.message ?? 'ইউজার লোড করা যায়নি।');
  }

  const ids = data.map((r) => r.id);
  const [tolet, tutors, donors, postCounts, requestCounts] = await Promise.all([
    client.from('tolet_profiles').select('user_id, status').in('user_id', ids),
    client.from('home_tutor_profiles').select('user_id, status').in('user_id', ids),
    client.from('blood_donor_profiles').select('user_id, status').in('user_id', ids),
    client.from('community_posts').select('author_id').in('author_id', ids),
    client.from('service_requests').select('customer_id').in('customer_id', ids),
  ]);
  const relatedQueryError = [tolet, tutors, donors, postCounts, requestCounts]
    .find((result) => result.error)?.error;
  if (relatedQueryError) return failedPage(params, relatedQueryError.message);

  const statusFor = (rows: { user_id: string; status: string }[] | null, id: string) =>
    rows?.find((r) => r.user_id === id)?.status ?? null;
  const countFor = (rows: { author_id?: string; customer_id?: string }[] | null, id: string, key: 'author_id' | 'customer_id') =>
    rows?.filter((r) => r[key] === id).length ?? 0;

  const rows: AdminUserRow[] = data.map((r) => ({
    id: r.id,
    full_name: r.full_name || '—',
    phone: r.phone || '—',
    email: r.email,
    role: r.role,
    status: r.status,
    is_verified: r.is_verified,
    created_at: r.created_at,
    tolet_status: statusFor(tolet.data, r.id),
    tutor_status: statusFor(tutors.data, r.id),
    donor_status: statusFor(donors.data, r.id),
    post_count: countFor(postCounts.data, r.id, 'author_id'),
    request_count: countFor(requestCounts.data, r.id, 'customer_id'),
  }));

  return { rows, total: count ?? 0, page: params.page, pageSize: params.pageSize, unavailable: false };
}

// ---------------------------------------------------------------------------
// Community posts (news / jobs / buy-sell)
// ---------------------------------------------------------------------------

export interface AdminPostRow {
  id: string;
  kind: 'news' | 'job' | 'buy_sell';
  author_id: string;
  slug: string;
  title_bn: string;
  summary_bn: string | null;
  body_bn: string | null;
  cover_image_url: string | null;
  gallery: string[];
  category: string | null;
  area_id: string | null;
  tags: string[];
  salary_min: number | null;
  salary_max: number | null;
  price: number | null;
  job_type: string | null;
  organization_bn: string | null;
  deadline: string | null;
  condition_label: string | null;
  author_name: string | null;
  author_phone: string | null;
  whatsapp_number: string | null;
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPosts(params: ListParams): Promise<Paged<AdminPostRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  // `fn_admin_posts` is the only path that may read author_phone /
  // whatsapp_number / rejection_reason after the column REVOKEs. It is
  // SECURITY DEFINER, is_admin() gated, and set-returning, so PostgREST still
  // applies search / status / kind / category filters, ordering and paging.
  // (count goes in the rpc() options — the RPC builder's .select() takes no options.)
  let query = client
    .rpc('fn_admin_posts', {}, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, [
    'title_bn',
    'summary_bn',
    'author_name',
    'author_phone',
    'whatsapp_number',
    'slug',
  ]);
  if (term) query = query.or(term);
  if (
    params.search &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.search.trim()
    )
  ) {
    query = query.eq('id', params.search.trim());
  }
  if (params.id) query = query.eq('id', params.id);
  if (params.status) query = query.eq('status', params.status);
  if (params.kind) query = query.eq('kind', params.kind);
  if (params.category) query = query.eq('category', params.category);
  if (params.area) query = query.eq('area_id', params.area);
  if (params.jobType) query = query.eq('job_type', params.jobType);
  if (params.from) query = query.gte('created_at', dhakaDateBoundary(params.from));
  if (params.to) query = query.lt('created_at', dhakaDateBoundary(params.to, true));

  const { data, count, error } = await query;
  if (error || !data) return failedPage(params, error?.message ?? 'পোস্ট লোড করা যায়নি।');

  return {
    rows: data as AdminPostRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

export interface AdminPostCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export async function fetchPostCounts(kind?: string): Promise<{
  counts: AdminPostCounts;
  error?: string;
}> {
  const empty = { total: 0, pending: 0, approved: 0, rejected: 0 };
  const admin = await getAdminDataClient();
  if (!admin) return { counts: empty, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
  if (kind && !['news', 'job', 'buy_sell'].includes(kind)) {
    return { counts: empty, error: 'পোস্টের ধরন সঠিক নয়।' };
  }

  const countFor = (status?: AdminPostRow['status']) => {
    let query = admin.client
      .rpc('fn_admin_posts', {}, { head: true, count: 'exact' });
    if (kind) query = query.eq('kind', kind);
    if (status) query = query.eq('status', status);
    return query;
  };
  const [total, pending, approved, rejected] = await Promise.all([
    countFor(),
    countFor('pending'),
    countFor('approved'),
    countFor('rejected'),
  ]);
  const failed = [total, pending, approved, rejected].find((result) => result.error);
  if (failed?.error) return { counts: empty, error: failed.error.message };
  return {
    counts: {
      total: total.count ?? 0,
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
    },
  };
}

  // ---------------------------------------------------------------------------
  // To-Let listings and home-tutor moderation
  // ---------------------------------------------------------------------------

  export interface AdminToletListRow {
    id: string;
    title: string;
    status: string;
    property_type: string;
    area_id: string;
    rent_price: number;
    owner_id: string;
    owner: { full_name: string | null; is_verified: boolean | null } | null;
    created_at: string;
    updated_at: string;
  }

  export interface AdminStatusCounts {
    all: number;
    byStatus: Record<string, number>;
  }

  export async function fetchToletListings(
    params: ListParams
  ): Promise<Paged<AdminToletListRow> & { counts: AdminStatusCounts }> {
    const admin = await getAdminDataClient();
    const emptyCounts = { all: 0, byStatus: {} };
    if (!admin) {
      return {
        ...failedPage(params, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।'),
        counts: emptyCounts,
      };
    }
    const { client } = admin;
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const statuses = [
      'draft',
      'pending_review',
      'approved',
      'rejected',
      'unavailable',
      'suspended',
      'archived',
    ];
    const countsPromise = Promise.all([
      client.from('tolet_listings').select('id', { count: 'exact', head: true }),
      ...statuses.map((status) =>
        client
          .from('tolet_listings')
          .select('id', { count: 'exact', head: true })
          .eq('status', status)
      ),
    ]);

    let query = client
      .from('tolet_listings')
      .select(
        'id,title,status,property_type,area_id,rent_price,owner_id,created_at,updated_at,owner:owner_id(full_name,is_verified)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    const exactId = params.search?.trim();
    const isExactId = Boolean(
      exactId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exactId)
    );
    if (isExactId) {
      query = query.eq('id', exactId);
    } else {
      const term = searchFilter(params.search, ['title', 'area_id', 'owner.full_name']);
      if (term) query = query.or(term);
    }
    if (params.status) query = query.eq('status', params.status);
    if (params.category) query = query.eq('property_type', params.category);
    if (params.area) query = query.eq('area_id', params.area);
    if (params.from) query = query.gte('created_at', dhakaDateBoundary(params.from));
    if (params.to) query = query.lt('created_at', dhakaDateBoundary(params.to, true));

    const [result, countsResult] = await Promise.all([query, countsPromise]);
    if (result.error || !result.data || countsResult.some((entry) => entry.error)) {
      return {
        ...failedPage(
          params,
          result.error?.message ??
            countsResult.find((entry) => entry.error)?.error?.message ??
            'বাসা ভাড়ার তালিকা লোড করা যায়নি।'
        ),
        counts: emptyCounts,
      };
    }
    return {
      rows: result.data as unknown as AdminToletListRow[],
      total: result.count ?? 0,
      page: params.page,
      pageSize: params.pageSize,
      unavailable: false,
      counts: {
        all: countsResult[0].count ?? 0,
        byStatus: Object.fromEntries(
          statuses.map((status, index) => [status, countsResult[index + 1].count ?? 0])
        ),
      },
    };
  }

  export interface AdminTutorListRow {
    id: string;
    user_id: string;
    status: string;
    full_name: string;
    institution: string;
    qualification: string;
    profile_photo_url: string | null;
    preferred_areas: string[];
    preferred_classes: string[];
    preferred_subjects: string[];
    expected_salary: number;
    created_at: string;
    updated_at: string;
  }

  const TUTOR_LIST_COLUMNS =
    'id,user_id,status,full_name,institution,qualification,profile_photo_url,preferred_areas,preferred_classes,preferred_subjects,expected_salary,created_at,updated_at';

  export async function fetchTutorProfiles(
    params: ListParams
  ): Promise<Paged<AdminTutorListRow> & { counts: AdminStatusCounts }> {
    const admin = await getAdminDataClient();
    const emptyCounts = { all: 0, byStatus: {} };
    if (!admin) {
      return {
        ...failedPage(params, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।'),
        counts: emptyCounts,
      };
    }
    const { client } = admin;
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    const statuses = ['draft', 'pending_approval', 'approved', 'rejected', 'paused', 'suspended'];
    let query = client
      .from('home_tutor_profiles')
      .select(TUTOR_LIST_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: params.sort === 'oldest' })
      .range(from, to);
    const exactId = params.search?.trim();
    if (
      exactId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exactId)
    ) {
      query = query.eq('id', exactId);
    } else {
      const term = searchFilter(params.search, ['full_name', 'institution', 'qualification']);
      if (term) query = query.or(term);
    }
    if (params.id) query = query.eq('id', params.id);
    if (params.status) query = query.eq('status', params.status);
    if (params.from) query = query.gte('created_at', dhakaDateBoundary(params.from));
    if (params.to) query = query.lt('created_at', dhakaDateBoundary(params.to, true));

    const countsPromise = Promise.all([
      client.from('home_tutor_profiles').select('id', { count: 'exact', head: true }),
      ...statuses.map((status) =>
        client
          .from('home_tutor_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('status', status)
      ),
    ]);
    const [result, countsResult] = await Promise.all([query, countsPromise]);
    if (result.error || !result.data || countsResult.some((entry) => entry.error)) {
      return {
        ...failedPage(
          params,
          result.error?.message ??
            countsResult.find((entry) => entry.error)?.error?.message ??
            'টিউটর প্রোফাইল লোড করা যায়নি।'
        ),
        counts: emptyCounts,
      };
    }
    return {
      rows: result.data as unknown as AdminTutorListRow[],
      total: result.count ?? 0,
      page: params.page,
      pageSize: params.pageSize,
      unavailable: false,
      counts: {
        all: countsResult[0].count ?? 0,
        byStatus: Object.fromEntries(
          statuses.map((status, index) => [status, countsResult[index + 1].count ?? 0])
        ),
      },
    };
  }

  export interface AdminTutorRequestListRow {
    id: string;
    customer_id: string;
    status: string;
    area_id: string;
    address_line: string;
    contact_name: string;
    contact_phone: string;
    preferred_time: string | null;
    details: string | null;
    service_type: string | null;
    profile_id: string | null;
    profile_title: string | null;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    tutor_name: string | null;
    tutor_photo_url: string | null;
  }

  export async function fetchTutorRequestById(
    id: string
  ): Promise<{ row: Record<string, unknown> | null; error?: string }> {
    const admin = await getAdminDataClient();
    if (!admin) return { row: null, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
    const { data, error } = await admin.client
      .from('service_requests')
      .select(
        'id,customer_id,status,area_id,address_line,contact_name,contact_phone,preferred_time,details,service_type,profile_id,profile_title,admin_notes,created_at,updated_at'
      )
      .eq('id', id)
      .eq('service_slug', 'home-tutor')
      .maybeSingle();
    if (error) return { row: null, error: error.message };
    return { row: (data as Record<string, unknown> | null) ?? null };
  }

  export async function fetchTutorPublicSummaryById(
    id: string
  ): Promise<{ row: { id: string; full_name: string; profile_photo_url: string | null } | null; error?: string }> {
    const admin = await getAdminDataClient();
    if (!admin) return { row: null, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
    const { data, error } = await admin.client
      .from('home_tutor_profiles')
      .select('id,full_name,profile_photo_url')
      .eq('id', id)
      .maybeSingle();
    if (error) return { row: null, error: error.message };
    return { row: data as { id: string; full_name: string; profile_photo_url: string | null } | null };
  }

  export async function fetchAdminTutorProfileById(
    id: string
  ): Promise<{ row: Record<string, unknown> | null; error?: string }> {
    const admin = await getAdminDataClient();
    if (!admin) return { row: null, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
    const { data, error } = await admin.client
      .rpc('fn_admin_tutor_profile', { p_id: id })
      .maybeSingle();
    if (error) return { row: null, error: error.message };
    return { row: (data as Record<string, unknown> | null) ?? null };
  }

  export async function fetchTutorRequests(
    params: ListParams
  ): Promise<Paged<AdminTutorRequestListRow>> {
    const admin = await getAdminDataClient();
    if (!admin) return failedPage(params, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
    const { client } = admin;
    const from = (params.page - 1) * params.pageSize;
    const to = from + params.pageSize - 1;
    let query = client
      .from('service_requests')
      .select(
        'id,customer_id,status,area_id,address_line,contact_name,contact_phone,preferred_time,details,service_type,profile_id,profile_title,admin_notes,created_at,updated_at',
        { count: 'exact' }
      )
      .eq('service_slug', 'home-tutor')
      .order('created_at', { ascending: false })
      .range(from, to);
    if (params.status) query = query.eq('status', params.status);
    if (params.area) query = query.eq('area_id', params.area);
    if (params.from) query = query.gte('created_at', dhakaDateBoundary(params.from));
    if (params.to) query = query.lt('created_at', dhakaDateBoundary(params.to, true));
    const term = searchFilter(params.search, ['contact_name', 'contact_phone', 'profile_title', 'details']);
    if (term) query = query.or(term);

    const { data, count, error } = await query;
    if (error || !data) return failedPage(params, error?.message ?? 'টিউটর অনুরোধ লোড করা যায়নি।');

    const profileIds = [
      ...new Set(
        data
          .map((row) => row.profile_id)
          .filter(
            (id): id is string =>
              typeof id === 'string' &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          )
      ),
    ];
    const { data: tutors, error: tutorError } = profileIds.length
      ? await client
          .from('home_tutor_profiles')
          .select('id,full_name,profile_photo_url')
          .in('id', profileIds)
      : { data: [], error: null };
    if (tutorError) return failedPage(params, tutorError.message);
    const tutorById = new Map(
      (tutors ?? []).map((tutor) => [tutor.id, tutor as { id: string; full_name: string; profile_photo_url: string | null }])
    );
    return {
      rows: data.map((row) => {
        const tutor = row.profile_id ? tutorById.get(row.profile_id) : undefined;
        return {
          ...(row as unknown as Omit<AdminTutorRequestListRow, 'tutor_name' | 'tutor_photo_url'>),
          tutor_name: tutor?.full_name ?? null,
          tutor_photo_url: tutor?.profile_photo_url ?? null,
        };
      }),
      total: count ?? 0,
      page: params.page,
      pageSize: params.pageSize,
      unavailable: false,
    };
  }
export async function fetchAdminPostById(id: string): Promise<{
  post: AdminPostRow | null;
  unavailable: boolean;
  error?: string;
}> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { post: null, unavailable: false };
  }

  const admin = await getAdminDataClient();
  if (!admin) return { post: null, unavailable: true };

  const { data, error } = await admin.client
    .rpc('fn_admin_posts', {})
    .eq('id', id)
    .maybeSingle();
  if (error) return { post: null, unavailable: true, error: error.message };
  return { post: data as AdminPostRow | null, unavailable: false };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface AdminRequestRow {
  id: string;
  reference_code?: string | null;
  customer_id: string;
  service_slug: string;
  service_type: string | null;
  profile_title: string | null;
  profile_id: string | null;
  contact_name: string;
  contact_phone: string;
  area_id: string;
  address_line: string;
  details: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  quotation: string | null;
  admin_notes: string | null;
  service_meta: Record<string, unknown> | null;
  pickup_area_id: string | null;
  destination_area_id: string | null;
  pickup_address: string | null;
  destination_address: string | null;
  pickup_floor: string | null;
  destination_floor: string | null;
  has_lift: boolean | null;
  parking_info: string | null;
  moving_items: Array<{ id?: string; labelBn?: string; quantity?: number }> | null;
  photo_urls: string[] | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
  customer_full_name?: string | null;
  assigned_worker_name?: string | null;
}

export interface AdminServiceRequestCounts {
  total: number;
  statuses: Record<string, number>;
}

export interface AdminServiceRequestPage extends Paged<AdminRequestRow> {
  counts: AdminServiceRequestCounts;
}

export interface AdminStaffListRow {
  id: string;
  service_slug: string;
  name_bn: string;
  title_bn: string;
  phone_private?: string | null;
  image_url: string | null;
  areas: string[];
  work_types: string[];
  experience_years: number;
  availability: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function validDateFilter(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function fetchServiceRequests(params: ListParams): Promise<AdminServiceRequestPage> {
  const admin = await getAdminDataClient();
  if (!admin) {
    return {
      ...failedPage<AdminRequestRow>(params, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।'),
      counts: { total: 0, statuses: {} },
    };
  }
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  if (
    (params.from && !validDateFilter(params.from)) ||
    (params.to && !validDateFilter(params.to)) ||
    (params.from && params.to && params.from > params.to)
  ) {
    return {
      ...failedPage<AdminRequestRow>(params, 'তারিখের ফিল্টার সঠিক নয়।'),
      counts: { total: 0, statuses: {} },
    };
  }

  const statusCounts = await Promise.all([
    client.from('service_requests').select('id', { count: 'exact', head: true }).in('service_slug', [...HOME_SERVICE_SLUGS]),
    ...SERVICE_REQUEST_STATUSES.map((status) =>
      client.from('service_requests').select('id', { count: 'exact', head: true })
        .in('service_slug', [...HOME_SERVICE_SLUGS])
        .eq('status', status)
    ),
  ]);
  const countError = statusCounts.find((result) => result.error);
  if (countError?.error) {
    return {
      ...failedPage<AdminRequestRow>(params, countError.error.message),
      counts: { total: 0, statuses: {} },
    };
  }
  const counts: AdminServiceRequestCounts = {
    total: statusCounts[0].count ?? 0,
    statuses: Object.fromEntries(
      SERVICE_REQUEST_STATUSES.map((status, index) => [status, statusCounts[index + 1].count ?? 0])
    ),
  };

  let query = client
    .from('service_requests')
    .select(
      'id, reference_code, customer_id, service_slug, service_type, profile_title, profile_id, contact_name, contact_phone, area_id, address_line, details, preferred_date, preferred_time, status, quotation, admin_notes, service_meta, pickup_area_id, destination_area_id, pickup_address, destination_address, pickup_floor, destination_floor, has_lift, parking_info, moving_items, photo_urls, attachment_url, created_at, updated_at',
      { count: 'exact' }
    )
    .in('service_slug', [...HOME_SERVICE_SLUGS])
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = params.search?.trim();
  if (term) {
    const safeTerm = term.replace(/[%_,().*\\"]/g, ' ').replace(/[\[\]]/g, ' ').trim();
    if (safeTerm) {
      const filters = [
        searchFilter(safeTerm, ['reference_code', 'contact_name', 'contact_phone', 'service_slug', 'profile_title']),
        validUuid(safeTerm) ? `id.eq.${safeTerm}` : undefined,
      ].filter((value): value is string => Boolean(value));
      if (filters.length) query = query.or(filters.join(','));
    }
  }
  if (params.status) query = query.eq('status', params.status);
  if (params.service) query = query.eq('service_slug', params.service);
  if (params.area) query = query.eq('area_id', params.area);
  const workerFilter = typeof params.worker === 'string' ? params.worker : undefined;
  if (workerFilter === 'unassigned') query = query.is('profile_id', null);
  else if (workerFilter && validUuid(workerFilter)) query = query.eq('profile_id', workerFilter);
  if (validDateFilter(params.from)) query = query.gte('created_at', dhakaDateBoundary(params.from));
  if (validDateFilter(params.to)) query = query.lt('created_at', dhakaDateBoundary(params.to, true));

  const { data, count, error } = await query;
  if (error || !data) {
    return {
      ...failedPage<AdminRequestRow>(params, error?.message ?? 'রিকোয়েস্ট লোড করা যায়নি।'),
      counts,
    };
  }

  const workerIds = [...new Set(data.flatMap((row) => row.profile_id && validUuid(row.profile_id) ? [row.profile_id] : []))];
  const { data: workers, error: workersError } = workerIds.length
    ? await client.from('staff_profiles').select('id, name_bn').in('id', workerIds)
    : { data: [], error: null };
  if (workersError) {
    return {
      ...failedPage<AdminRequestRow>(params, workersError.message),
      counts,
    };
  }
  const workerNames = new Map((workers ?? []).map((worker) => [worker.id, worker.name_bn]));
  const rows = data.map((row) => ({
    ...(row as unknown as AdminRequestRow),
    assigned_worker_name: row.profile_id ? workerNames.get(row.profile_id) ?? row.profile_title : null,
  }));

  return {
    rows,
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
    counts,
  };
}

export async function fetchServiceRequestById(id: string): Promise<AdminRequestRow | null> {
  if (!validUuid(id)) return null;
  const admin = await getAdminDataClient();
  if (!admin) throw new Error('অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const { data, error } = await admin.client
    .from('service_requests')
    .select(
      'id, reference_code, customer_id, service_slug, service_type, profile_title, profile_id, contact_name, contact_phone, area_id, address_line, details, preferred_date, preferred_time, status, quotation, admin_notes, service_meta, pickup_area_id, destination_area_id, pickup_address, destination_address, pickup_floor, destination_floor, has_lift, parking_info, moving_items, photo_urls, attachment_url, created_at, updated_at'
    )
    .eq('id', id)
    .in('service_slug', [...HOME_SERVICE_SLUGS])
    .maybeSingle();
  if (error) throw new Error(`রিকোয়েস্ট লোড ব্যর্থ হয়েছে: ${error.message}`);
  if (!data) return null;

  const [customer, worker] = await Promise.all([
    admin.client.from('profiles').select('full_name').eq('id', data.customer_id).maybeSingle(),
    data.profile_id && validUuid(data.profile_id)
      ? admin.client.from('staff_profiles').select('name_bn').eq('id', data.profile_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (customer.error) throw new Error(`গ্রাহকের তথ্য লোড ব্যর্থ হয়েছে: ${customer.error.message}`);
  if (worker.error) throw new Error(`নির্ধারিত কর্মীর তথ্য লোড ব্যর্থ হয়েছে: ${worker.error.message}`);
  return {
    ...(data as unknown as AdminRequestRow),
    customer_full_name: customer.data?.full_name ?? null,
    assigned_worker_name: worker.data?.name_bn ?? data.profile_title,
  };
}

export async function fetchServiceRequestAttachmentUrls(paths: string[]): Promise<{
  urls: string[];
  error?: string;
}> {
  const admin = await getAdminDataClient();
  if (!admin) return { urls: [], error: 'সংযুক্ত ফাইল দেখার অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
  const urls: string[] = [];
  for (const path of paths) {
    if (!path) continue;
    if (/^https:\/\//i.test(path)) {
      urls.push(path);
      continue;
    }
    const { data, error } = await admin.client.storage
      .from('documents')
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      return {
        urls,
        error: `একটি সংযুক্ত ফাইলের নিরাপদ লিংক তৈরি করা যায়নি${error?.message ? `: ${error.message}` : '.'}`,
      };
    }
    urls.push(data.signedUrl);
  }
  return { urls };
}

export async function fetchAssignableStaff(serviceSlug: string): Promise<AdminStaffListRow[]> {
  const admin = await getAdminDataClient();
  if (!admin) throw new Error('অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  if (!STAFF_SERVICE_KEYS.includes(serviceSlug as StaffServiceKey)) return [];
  const { data, error } = await admin.client
    .from('staff_profiles')
    .select('id, service_slug, name_bn, title_bn, image_url, areas, work_types, experience_years, availability, is_verified, is_active, created_at, updated_at')
    .eq('service_slug', serviceSlug)
    .eq('is_active', true)
    .neq('availability', 'busy')
    .order('name_bn', { ascending: true });
  if (error) throw new Error(`উপযুক্ত কর্মী তালিকা লোড ব্যর্থ হয়েছে: ${error.message}`);
  return (data ?? []) as AdminStaffListRow[];
}

export async function fetchStaffAssignmentFilterOptions(): Promise<Array<{ id: string; name_bn: string; service_slug: string }>> {
  const admin = await getAdminDataClient();
  if (!admin) throw new Error('অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const { data, error } = await admin.client
    .from('staff_profiles')
    .select('id, name_bn, service_slug')
    .in('service_slug', STAFF_SERVICE_KEYS)
    .order('name_bn', { ascending: true });
  if (error) throw new Error(`কর্মী তালিকা লোড ব্যর্থ হয়েছে: ${error.message}`);
  return data ?? [];
}

export interface AdminStaffPage extends Paged<AdminStaffListRow> {
  total_active: number;
  total_inactive: number;
  total_verified: number;
}

export async function fetchAdminStaffPage(params: ListParams): Promise<AdminStaffPage> {
  const admin = await getAdminDataClient();
  const failed = (error?: string): AdminStaffPage => ({
    rows: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: true,
    ...(error ? { error } : {}),
    total_active: 0,
    total_inactive: 0,
    total_verified: 0,
  });
  if (!admin) return failed('অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const client = admin.client;
  const counts = await Promise.all([
    client.from('staff_profiles').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('staff_profiles').select('id', { count: 'exact', head: true }).eq('is_active', false),
    client.from('staff_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true),
  ]);
  const countError = counts.find((result) => result.error);
  if (countError?.error) return failed(countError.error.message);
  let query = client
    .rpc('fn_admin_staff_profiles', {}, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);
  if (params.service && STAFF_SERVICE_KEYS.includes(params.service as StaffServiceKey)) {
    query = query.eq('service_slug', params.service);
  }
  if (params.status === 'active') query = query.eq('is_active', true);
  if (params.status === 'inactive') query = query.eq('is_active', false);
  if (params.status === 'verified') query = query.eq('is_verified', true);
  if (params.search) {
    const term = searchFilter(params.search, ['name_bn', 'phone_private', 'service_slug']);
    const safeId = params.search.trim();
    const filters = [term, validUuid(safeId) ? `id.eq.${safeId}` : undefined]
      .filter((value): value is string => Boolean(value));
    if (filters.length) query = query.or(filters.join(','));
  }
  if (params.area) query = query.contains('areas', [params.area]);
  const { data, count, error } = await query;
  if (error || !data) return failed(error?.message ?? 'কর্মী তালিকা লোড করা যায়নি।');
  return {
    rows: data as unknown as AdminStaffListRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
    total_active: counts[0].count ?? 0,
    total_inactive: counts[1].count ?? 0,
    total_verified: counts[2].count ?? 0,
  };
}

export async function fetchAdminStaffDirectory(params: ListParams): Promise<AdminStaffPage> {
  const pageSize = 1000;
  const firstPage = await fetchAdminStaffPage({ ...params, page: 1, pageSize });
  if (firstPage.unavailable || firstPage.total <= firstPage.rows.length) {
    return { ...firstPage, page: 1, pageSize: firstPage.total };
  }

  const pageCount = Math.ceil(firstPage.total / pageSize);
  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchAdminStaffPage({ ...params, page: index + 2, pageSize })
    )
  );
  const failedPageResult = remainingPages.find((result) => result.unavailable);
  if (failedPageResult) {
    return {
      ...failedPageResult,
      rows: [],
      page: 1,
      pageSize: firstPage.total,
    };
  }

  const rows = [...firstPage.rows, ...remainingPages.flatMap((result) => result.rows)];
  if (rows.length !== firstPage.total) {
    return {
      ...firstPage,
      rows: [],
      page: 1,
      pageSize: firstPage.total,
      unavailable: true,
      error: 'কর্মী তালিকার সব রেকর্ড একসঙ্গে লোড করা যায়নি; তালিকা পরিবর্তন করে আবার চেষ্টা করুন।',
    };
  }

  return { ...firstPage, rows, page: 1, pageSize: firstPage.total };
}

export async function fetchAdminStaffProfile(id: string): Promise<{
  profile: StaffProfile | null;
  error?: string;
}> {
  if (!validUuid(id)) return { profile: null };
  const admin = await getAdminDataClient();
  if (!admin) return { profile: null, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
  const { data, error } = await admin.client.rpc('fn_admin_staff_profile', { p_id: id }).maybeSingle();
  if (error) return { profile: null, error: error.message };
  if (!data) return { profile: null };
  const row = data as unknown as Record<string, unknown>;
  return {
    profile: {
      id: String(row.id),
      serviceSlug: String(row.service_slug) as StaffProfile['serviceSlug'],
      nameBn: String(row.name_bn ?? ''),
      titleBn: String(row.title_bn ?? ''),
      imageUrl: String(row.image_url ?? ''),
      areaIds: Array.isArray(row.areas) ? row.areas as string[] : [],
      workTypes: Array.isArray(row.work_types) ? row.work_types as string[] : [],
      workMode: typeof row.work_mode === 'string' ? row.work_mode : undefined,
      timeSlot: typeof row.time_slot === 'string' ? row.time_slot : undefined,
      experienceYears: Number(row.experience_years ?? 0),
      availability: String(row.availability ?? 'available') as StaffProfile['availability'],
      isEmergency: Boolean(row.is_emergency),
      salaryMin: row.salary_min == null ? undefined : Number(row.salary_min),
      salaryMax: row.salary_max == null ? undefined : Number(row.salary_max),
      rateLabel: typeof row.rate_label === 'string' ? row.rate_label : undefined,
      aboutBn: String(row.about_bn ?? ''),
      isVerified: Boolean(row.is_verified),
      isActive: Boolean(row.is_active),
      phonePrivate: typeof row.phone_private === 'string' ? row.phone_private : undefined,
      createdAt: String(row.created_at ?? ''),
      updatedAt: String(row.updated_at ?? ''),
    },
  };
}

export interface AdminVehicleRequestRow {
  id: string;
  reference_code?: string | null;
  vehicle_listing_id: string | null;
  vehicle_kind: string;
  vehicle_listing_kind: VehicleKind | null;
  vehicle_is_active: boolean | null;
  vehicle_name: string | null;
  vehicle_title: string | null;
  vehicle_slug: string | null;
  vehicle_image_url: string | null;
  vehicle_photos: string[];
  contact_name: string;
  contact_phone: string;
  pickup_area_id: string | null;
  destination_area_id: string | null;
  travel_date: string | null;
  travel_time: string | null;
  passenger_count: number | null;
  trip_duration: string | null;
  budget: number | null;
  notes: string | null;
  estimated_distance_km: number | null;
  distance_source: 'road_route' | 'manual_estimate' | null;
  rate_per_km: number | null;
  minimum_fare: number | null;
  estimated_fare: number | null;
  additional_fee: number | null;
  additional_fee_note_bn: string | null;
  assigned_vehicle_listing_id: string | null;
  assigned_driver_name: string | null;
  assigned_driver_phone: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customer_id: string | null;
  customer_full_name: string | null;
}

export async function fetchVehicleRequests(params: ListParams): Promise<Paged<AdminVehicleRequestRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return failedPage(params, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('vehicle_requests')
    .select(
      'id, reference_code, vehicle_listing_id, vehicle_kind, vehicle_name, customer_id, contact_name, contact_phone, pickup_area_id, destination_area_id, travel_date, travel_time, passenger_count, trip_duration, budget, notes, estimated_distance_km, distance_source, rate_per_km, minimum_fare, estimated_fare, additional_fee, additional_fee_note_bn, assigned_vehicle_listing_id, assigned_driver_name, assigned_driver_phone, admin_notes, status, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['reference_code', 'contact_name', 'contact_phone', 'vehicle_name', 'notes']);
  if (term) {
    const safeId = params.search?.trim();
    const filters = [term, safeId && validUuid(safeId) ? `id.eq.${safeId}` : undefined]
      .filter((value): value is string => Boolean(value));
    query = query.or(filters.join(','));
  }
  if (params.status) query = query.eq('status', params.status);
  if (params.kind) query = query.eq('vehicle_kind', params.kind);
  if (params.area) {
    if (!/^[a-z0-9_-]{1,100}$/i.test(params.area)) return failedPage(params, 'এলাকা ফিল্টারের মান সঠিক নয়।');
    query = query.or(`pickup_area_id.eq.${params.area},destination_area_id.eq.${params.area}`);
  }
  if (validDateFilter(params.from)) query = query.gte('travel_date', params.from);
  if (validDateFilter(params.to)) query = query.lte('travel_date', params.to);

  const { data, count, error } = await query;
  if (error || !data) return failedPage(params, error?.message ?? 'গাড়ি রিকোয়েস্ট লোড করা যায়নি।');

  let rows: AdminVehicleRequestRow[];
  try {
    rows = await attachVehicleRequestListingData(client, data as unknown as AdminVehicleRequestRow[]);
  } catch (error) {
    return failedPage(params, error instanceof Error ? error.message : 'যানবাহন রিকোয়েস্টের সম্পর্ক লোড ব্যর্থ হয়েছে।');
  }
  const customerIds = [...new Set(rows.flatMap((row) => row.customer_id ? [row.customer_id] : []))];
  if (customerIds.length) {
    const { data: profiles, error: profilesError } = await client
      .from('profiles')
      .select('id, full_name')
      .in('id', customerIds);
    if (profilesError) return failedPage(params, `গ্রাহকের তথ্য লোড ব্যর্থ হয়েছে: ${profilesError.message}`);
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    rows = rows.map((row) => ({ ...row, customer_full_name: row.customer_id ? names.get(row.customer_id) ?? null : null }));
  }

  return {
    rows,
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

export async function fetchVehicleRequestCounts(): Promise<{
  counts: { total: number; new: number; reviewing: number; approved: number; rejected: number; contacted: number; closed: number };
  error?: string;
}> {
  const admin = await getAdminDataClient();
  if (!admin) return { counts: { total: 0, new: 0, reviewing: 0, approved: 0, rejected: 0, contacted: 0, closed: 0 }, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };

  const statuses = ['new', 'reviewing', 'approved', 'rejected', 'contacted', 'closed'] as const;
  const results = await Promise.all([
    admin.client.from('vehicle_requests').select('id', { count: 'exact', head: true }),
    ...statuses.map((status) => admin.client
      .from('vehicle_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', status)),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error) return { counts: { total: 0, new: 0, reviewing: 0, approved: 0, rejected: 0, contacted: 0, closed: 0 }, error: failed.error.message };
  return {
    counts: {
      total: results[0].count ?? 0,
      new: results[1].count ?? 0,
      reviewing: results[2].count ?? 0,
      approved: results[3].count ?? 0,
      rejected: results[4].count ?? 0,
      contacted: results[5].count ?? 0,
      closed: results[6].count ?? 0,
    },
  };
}

/** Full vehicle booking details for its admin-only detail route. */
export async function fetchVehicleRequestById(id: string): Promise<{
  row: AdminVehicleRequestRow | null;
  unavailable: boolean;
  error?: string;
}> {
  const admin = await getAdminDataClient();
  if (!admin) return { row: null, unavailable: true };

  const { data, error } = await admin.client
    .from('vehicle_requests')
    .select(
      'id, reference_code, vehicle_listing_id, vehicle_kind, vehicle_name, customer_id, contact_name, contact_phone, pickup_area_id, destination_area_id, travel_date, travel_time, passenger_count, trip_duration, budget, notes, estimated_distance_km, distance_source, rate_per_km, minimum_fare, estimated_fare, additional_fee, additional_fee_note_bn, assigned_vehicle_listing_id, assigned_driver_name, assigned_driver_phone, admin_notes, status, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) return { row: null, unavailable: true, error: error.message };
  if (!data) return { row: null, unavailable: false };
  let row: AdminVehicleRequestRow;
  try {
    [row] = await attachVehicleRequestListingData(admin.client, [data as unknown as AdminVehicleRequestRow]);
  } catch (attachError) {
    return { row: null, unavailable: true, error: attachError instanceof Error ? attachError.message : 'যানবাহনের তালিকা সংযুক্ত করা যায়নি।' };
  }

  if (row.customer_id) {
    const { data: profile, error: profileError } = await admin.client
      .from('profiles')
      .select('full_name')
      .eq('id', row.customer_id)
      .maybeSingle();
    if (profileError) return { row: null, unavailable: true, error: profileError.message };
    row.customer_full_name = profile?.full_name ?? null;
  }
  return { row, unavailable: false };
}

export async function fetchAssignableVehicles(): Promise<Array<{ id: string; title_bn: string }>> {
  const admin = await getAdminDataClient();
  if (!admin) throw new Error('অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const { data, error } = await admin.client
    .from('service_listings')
    .select('id, title_bn')
    .eq('category', 'vehicle')
    .eq('is_active', true)
    .order('title_bn', { ascending: true });
  if (error) throw new Error(`উপলভ্য যানবাহন লোড ব্যর্থ হয়েছে: ${error.message}`);
  return data ?? [];
}

async function attachVehicleRequestListingData(
  client: AdminClient['client'],
  rows: AdminVehicleRequestRow[]
): Promise<AdminVehicleRequestRow[]> {
  const ids = [...new Set(rows.flatMap((row) => row.vehicle_listing_id ? [row.vehicle_listing_id] : []))];
  if (!ids.length) return rows.map((row) => ({
    ...row,
    vehicle_title: null,
    vehicle_listing_kind: null,
    vehicle_is_active: null,
    vehicle_slug: null,
    vehicle_image_url: null,
    vehicle_photos: [],
    customer_id: row.customer_id ?? null,
    customer_full_name: null,
    updated_at: row.updated_at ?? row.created_at,
  }));
  const { data, error } = await client
    .from('service_listings')
    .select('id, slug, title_bn, image_url, photos, tags, is_active')
    .in('id', ids)
    .eq('category', 'vehicle');
  if (error) throw new Error(`যানবাহনের রেকর্ড লোড ব্যর্থ হয়েছে: ${error.message}`);
  const listings = new Map((data ?? []).map((listing) => [listing.id, listing]));
  return rows.map((row) => {
    const listing = row.vehicle_listing_id ? listings.get(row.vehicle_listing_id) : undefined;
    return {
      ...row,
      vehicle_title: listing?.title_bn ?? null,
      vehicle_listing_kind: listing?.tags?.find((tag: string): tag is VehicleKind => VEHICLE_KINDS.includes(tag as VehicleKind)) ?? null,
      vehicle_is_active: listing?.is_active ?? null,
      vehicle_slug: listing?.slug ?? null,
      vehicle_image_url: listing?.image_url || listing?.photos?.[0] || null,
      vehicle_photos: listing?.photos ?? [],
      customer_id: row.customer_id ?? null,
      customer_full_name: null,
      updated_at: row.updated_at ?? row.created_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface AdminMessageRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  complaint_category: string | null;
  complaint_subject: string | null;
  message: string;
  status: 'new' | 'reviewing' | 'replied' | 'closed';
  admin_notes: string | null;
  user_id: string | null;
  created_at: string;
  latest_message?: string;
  latest_at?: string;
}

/**
 * Marks every still-new contact message as under review.
 *
 * The sidebar badge counts `contact_messages` rows with `status = 'new'`, so
 * the number above "যোগাযোগ বার্তা" kept following the admin around even after
 * they opened the inbox. Visiting the list page means the queue has been
 * seen — flip it to `reviewing`. Best-effort: the inbox still renders if the
 * update fails.
 */
export async function markContactMessagesSeen(): Promise<void> {
  const admin = await getAdminDataClient();
  if (!admin) return;
  await admin.client
    .from('contact_messages')
    .update({ status: 'reviewing' })
    .eq('status', 'new');
}

export async function fetchMessages(params: ListParams): Promise<Paged<AdminMessageRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('contact_messages')
    .select(
      'id, name, phone, email, subject, complaint_category, complaint_subject, message, status, admin_notes, user_id, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['name', 'phone', 'email', 'subject', 'complaint_subject', 'message']);
  if (term) query = query.or(term);
  if (params.search && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.search)) {
    query = query.eq('id', params.search);
  }
  if (params.status) query = query.eq('status', params.status);
  if (params.category) query = query.eq('subject', params.category);

  const { data, count, error } = await query;
  if (error || !data) return failedPage(params, error?.message ?? 'মেসেজ লোড করা যায়নি।');

  const latest = await attachLatestContactReplies(client, data as AdminMessageRow[]);
  if (latest.error) return failedPage(params, latest.error);
  return {
    rows: latest.rows,
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

async function attachLatestContactReplies(
  client: AdminClient['client'],
  rows: AdminMessageRow[]
): Promise<{ rows: AdminMessageRow[]; error?: string }> {
  if (rows.length === 0) return { rows };
  const { data, error } = await client
    .from('contact_message_replies')
    .select('message_id, body, created_at')
    .in('message_id', rows.map((row) => row.id))
    .order('created_at', { ascending: false });
  if (error) return { rows: [], error: `সর্বশেষ উত্তর লোড করা যায়নি: ${error.message}` };

  const latest = new Map<string, { body: string; created_at: string }>();
  for (const reply of data ?? []) {
    if (!latest.has(reply.message_id)) latest.set(reply.message_id, reply);
  }

  return { rows: rows.map((row) => {
    const reply = latest.get(row.id);
    return reply
      ? { ...row, latest_message: reply.body, latest_at: reply.created_at }
      : row;
  }) };
}

export interface AdminNotificationRow {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  related_type: string | null;
  related_id: string | null;
  is_read: boolean;
  created_at: string;
  link_href: string;
}

export function notificationTargetLink(relatedType: string | null, relatedId: string | null): string {
  const id = relatedId ? encodeURIComponent(relatedId) : '';
  switch (relatedType) {
    case 'service_request': return id ? `/admin/requests/${id}` : '/admin/requests';
    case 'service_listing': return '/admin/approvals';
    case 'blood_donor_profile':
    case 'donor_profile': return id ? `/admin/blood/donors/${id}` : '/admin/blood/donors';
    case 'home_tutor_profile':
    case 'tutor_profile': return id ? `/admin/verifications/${id}` : '/admin/verifications';
    case 'tolet_profile': return '/admin/approvals';
    case 'blood_request': return '/admin/notifications';
    case 'vehicle_request': return id ? `/admin/vehicle-requests/${id}` : '/admin/vehicle-requests';
    case 'contact_message': return id ? `/admin/messages/${id}` : '/admin/messages';
    case 'community_post': return id ? `/admin/posts/${id}` : '/admin/posts';
    case 'community_post_reports': return '/admin/reports';
    case 'tolet_listing': return id ? `/admin/tolet/${id}` : '/admin/tolet';
    case 'tolet_listing_deleted': return '/admin/tolet';
    case 'community_post_report':
    case 'listing_reports':
    case 'staff_profile_reports':
    case 'tutor_reports':
    case 'blood_donor_reports':
      return '/admin/reports';
    default:
      return '/admin/notifications';
  }
}

export async function fetchAdminNotifications(
  params: ListParams,
  preview = false
): Promise<Paged<AdminNotificationRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };

  const from = (params.page - 1) * params.pageSize;
  let query = admin.client
    .from('notifications')
    .select('id, title, body, type, related_type, related_id, is_read, created_at', { count: 'exact' })
    .eq('target_role', 'admin')
    .order('created_at', { ascending: false });

  if (!preview) query = query.range(from, from + params.pageSize - 1);
  else query = query.limit(params.pageSize);
  if (params.status === 'read') query = query.eq('is_read', true);
  if (params.status === 'unread') query = query.eq('is_read', false);
  if (params.category) query = query.eq('related_type', params.category);
  if (params.search) {
    const escaped = params.search.replace(/[\\%_(),]/g, ' ').trim();
    if (escaped) query = query.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`);
  }

  const { data, count, error } = await query;
  if (error || !data) {
    return failedPage(params, error?.message ?? 'নোটিফিকেশন লোড করা যায়নি।');
  }

  return {
    rows: data.map((row) => ({
      ...row,
      link_href: notificationTargetLink(row.related_type, row.related_id),
    })) as AdminNotificationRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

export async function fetchAdminUnreadNotificationCount(): Promise<number | null> {
  const admin = await getAdminDataClient();
  if (!admin) return null;
  const { count, error } = await admin.client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('target_role', 'admin')
    .eq('is_read', false);
  if (error) throw new Error(`অপঠিত নোটিফিকেশন গণনা করা যায়নি: ${error.message}`);
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type ReportSource = 'listing' | 'staff' | 'tutor' | 'donor' | 'community_post';

export interface AdminReportRow {
  id: string;
  source: ReportSource;
  reporter_name: string;
  reason: string;
  details: string | null;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  /** The record the report is about, for the "open" link. */
  target_label: string;
  target_href: string;
}

/**
 * All five report tables, merged into one queue.
 *
 * They are queried separately and concatenated rather than unioned in SQL
 * because they have different columns and no shared foreign key. The merge is
 * done in memory over five paginated reads — each table is filtered to open
 * reports first, so this stays cheap even as the tables grow.
 */
export async function fetchReports(params: ListParams): Promise<Paged<AdminReportRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const term = params.search?.trim().replace(/[%_]/g, '');

  const build = (
    table: string,
    source: ReportSource,
    targetLabel: (row: Record<string, unknown>) => string,
    targetHref: (row: Record<string, unknown>) => string
  ) => {
    let query = client
      .from(table)
      .select('id, reporter_name, reason, details, status, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (params.status) query = query.eq('status', params.status);
    if (term) {
      query = query.or(
        [`reporter_name.ilike.%${term}%`, `reason.ilike.%${term}%`, `details.ilike.%${term}%`].join(',')
      );
    }
    return query.then(({ data, error }) => {
      if (error || !data) return { rows: [] as AdminReportRow[], error: error?.message ?? 'রিপোর্ট লোড করা যায়নি।' };
      return { rows: (data as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        source,
        reporter_name: row.reporter_name as string,
        reason: row.reason as string,
        details: (row.details as string) ?? null,
        status: row.status as AdminReportRow['status'],
        created_at: row.created_at as string,
        target_label: targetLabel(row),
        target_href: targetHref(row),
      })), error: undefined };
    });
  };

  const [listings, staff, tutors, donors, communityPosts] = await Promise.all([
    build('listing_reports', 'listing', () => 'বাসা ভাড়া বিজ্ঞাপন', () => '/admin/tolet'),
    build('staff_profile_reports', 'staff', () => 'কর্মী প্রোফাইল', () => '/admin/services'),
    build('tutor_reports', 'tutor', () => 'গৃহ শিক্ষক প্রোফাইল', () => '/admin/verifications'),
    build('blood_donor_reports', 'donor', () => 'রক্তদাতা প্রোফাইল', () => '/admin/blood/donors'),
    build('community_post_reports', 'community_post', () => 'কমিউনিটি পোস্ট', () => '/admin/posts'),
  ]);

  const reportResults = [listings, staff, tutors, donors, communityPosts];
  const reportError = reportResults.find((result) => result.error)?.error;
  if (reportError) return failedPage(params, reportError);

  const all = reportResults.flatMap((result) => result.rows).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );

  const total = all.length;
  const from = (params.page - 1) * params.pageSize;
  const rows = all.slice(from, from + params.pageSize);

  return { rows, total, page: params.page, pageSize: params.pageSize, unavailable: false };
}

// ---------------------------------------------------------------------------
// Catalog: service listings + emergency contacts
// ---------------------------------------------------------------------------

export interface AdminServiceListingRow {
  id: string;
  public_id: string;
  public_code: string;
  category: 'coaching' | 'wifi' | 'bus' | 'vehicle';
  owner_id: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  slug: string;
  title_bn: string;
  subtitle_bn: string | null;
  summary_bn: string | null;
  description_bn: string | null;
  image_url: string | null;
  logo_url: string | null;
  coaching_category: 'class_1_8' | 'ssc' | 'hsc' | 'bba' | 'admission' | null;
  area_ids: string[];
  tags: string[];
  monthly_fee_min: number | null;
  monthly_fee_max: number | null;
  admission_fee: number | null;
  price_min: number | null;
  price_max: number | null;
  speed_mbps: number | null;
  fare_min: number | null;
  fare_max: number | null;
  origin_bn: string | null;
  destination_bn: string | null;
  travel_days: string[];
  stops_bn: string[];
  journey_duration_bn: string | null;
  operator_bn: string | null;
  address_bn: string | null;
  rating_avg: number;
  rating_count: number;
  seat_count: number | null;
  photos: string[];
  model_name_bn: string | null;
  model_year: number | null;
  has_ac: boolean | null;
  driver_included: boolean | null;
  driver_name_bn: string | null;
  available_time_bn: string | null;
  price_note_bn: string | null;
  rate_per_km: number | null;
  minimum_fare: number | null;
  additional_fee: number | null;
  additional_fee_note_bn: string | null;
  available_facilities: string[];
  unavailable_facilities: string[];
  contact_phone_private: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminServiceListingPage extends Paged<AdminServiceListingRow> {
  counts: { total: number; active: number; inactive: number };
}

const SERVICE_LISTING_SELECT =
  'id, public_id, public_code, category, coaching_category, slug, title_bn, subtitle_bn, summary_bn, description_bn, image_url, logo_url, area_ids, tags, monthly_fee_min, monthly_fee_max, admission_fee, price_min, price_max, speed_mbps, fare_min, fare_max, origin_bn, destination_bn, travel_days, stops_bn, journey_duration_bn, operator_bn, address_bn, rating_avg, rating_count, seat_count, photos, model_name_bn, model_year, has_ac, driver_included, driver_name_bn, available_time_bn, price_note_bn, rate_per_km, minimum_fare, additional_fee, additional_fee_note_bn, available_facilities, unavailable_facilities, contact_phone_private, owner_id, status, rejection_reason, is_active, is_featured, created_at, updated_at';

export async function fetchServiceListings(params: ListParams, category?: string): Promise<AdminServiceListingPage> {
  const admin = await getAdminDataClient();
  const emptyCounts = { total: 0, active: 0, inactive: 0 };
  if (!admin) return { ...failedPage<AdminServiceListingRow>(params, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।'), counts: emptyCounts };
  const validCategories = ['coaching', 'wifi', 'bus', 'vehicle'];
  if (category && !validCategories.includes(category)) {
    return { ...failedPage<AdminServiceListingRow>(params, 'ক্যাটাগরি সঠিক নয়।'), counts: emptyCounts };
  }
  const { client } = admin;
  const filterCategory = category ?? params.category;
  if (filterCategory && !validCategories.includes(filterCategory)) {
    return { ...failedPage<AdminServiceListingRow>(params, 'ক্যাটাগরি সঠিক নয়।'), counts: emptyCounts };
  }
  const rpcCategory = filterCategory ?? 'vehicle';
  const countQuery = (kind: 'all' | 'published' | 'unpublished') => {
    let query = client
      .from('service_listings')
      .select('id', { head: true, count: 'exact' })
      .eq('category', rpcCategory);
    if (kind === 'published') query = query.eq('is_active', true).eq('status', 'approved');
    if (kind === 'unpublished') query = query.or('is_active.eq.false,status.neq.approved');
    return query;
  };
  const counts = await Promise.all([countQuery('all'), countQuery('published'), countQuery('unpublished')]);
  const countError = counts.find((item) => item.error);
  if (countError?.error) {
    return { ...failedPage<AdminServiceListingRow>(params, countError.error.message), counts: emptyCounts };
  }

  let query = client
    .from('service_listings')
    .select(SERVICE_LISTING_SELECT, { count: 'exact' })
    .eq('category', rpcCategory)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range((params.page - 1) * params.pageSize, params.page * params.pageSize - 1);

  const term = searchFilter(params.search, [
    'public_id', 'title_bn', 'slug', 'subtitle_bn', 'summary_bn', 'description_bn',
    'origin_bn', 'destination_bn', 'operator_bn', 'address_bn', 'model_name_bn', 'driver_name_bn',
  ]);
  if (term) query = query.or(term);
  if (params.status === 'active') query = query.eq('is_active', true);
  if (params.status === 'inactive') query = query.eq('is_active', false);
  if (['draft', 'pending', 'approved', 'rejected'].includes(params.status ?? '')) {
    query = query.eq('status', params.status);
  }
  if (params.area) query = query.contains('area_ids', [params.area]);
  if (params.kind) {
    const coachingCategories = ['class_1_8', 'ssc', 'hsc', 'bba', 'admission'];
    if (rpcCategory === 'coaching' && coachingCategories.includes(params.kind)) {
      query = query.eq('coaching_category', params.kind);
    } else {
      query = query.contains('tags', [params.kind]);
    }
  }

  const { data, count, error } = await query;
  if (error || !data) {
    return {
      ...failedPage<AdminServiceListingRow>(params, error?.message ?? 'ক্যাটালগ লোড করা যায়নি।'),
      counts: emptyCounts,
    };
  }

  return {
    rows: data as unknown as AdminServiceListingRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
    counts: {
      total: counts[0].count ?? 0,
      active: counts[1].count ?? 0,
      inactive: counts[2].count ?? 0,
    },
  };
}

export async function fetchAdminServiceListing(id: string): Promise<AdminServiceListingRow | null> {
  if (!validUuid(id)) return null;
  const admin = await getAdminDataClient();
  if (!admin) throw new Error('অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const { data, error } = await admin.client
    .from('service_listings')
    .select(SERVICE_LISTING_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`তালিকার বিস্তারিত লোড ব্যর্থ হয়েছে: ${error.message}`);
  return data as unknown as AdminServiceListingRow | null;
}

export interface AdminEmergencyContactRow {
  id: string;
  service: 'doctor' | 'police' | 'ambulance' | 'fire_service';
  name_bn: string;
  organization_bn: string | null;
  area_id: string | null;
  address_bn: string | null;
  phone: string;
  source_note: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface AdminBloodDonorRow {
  id: string;
  status: string;
  full_name: string;
  private_phone?: string | null;
  blood_group: string;
  area_id: string;
  gender: string;
  birth_year: number | null;
  weight_kg: number | null;
  is_available: boolean;
  last_donation_date: string | null;
  donation_count: number;
  is_verified: boolean;
  intro: string | null;
  profile_photo_url: string | null;
  rejection_reason: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminBloodDonorCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inactive: number;
}

export interface AdminBloodDonorPage extends Paged<AdminBloodDonorRow> {
  counts: AdminBloodDonorCounts;
}

const EMPTY_DONOR_COUNTS: AdminBloodDonorCounts = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  inactive: 0,
};

export async function fetchBloodDonorProfile(
  id: string
): Promise<AdminBloodDonorRow & { user_id: string; private_phone: string; admin_notes: string | null } | null> {
  const admin = await getAdminDataClient();
  if (!admin) throw new Error('রক্তদাতা প্রোফাইল দেখার অ্যাডমিন অনুমতি যাচাই করা যায়নি।');
  const { data, error } = await admin.client
    .rpc('fn_admin_donor_profile', { p_id: id })
    .maybeSingle();
  if (error) throw new Error(`রক্তদাতা প্রোফাইল লোড ব্যর্থ হয়েছে: ${error.message}`);
  return data as (AdminBloodDonorRow & {
    user_id: string;
    private_phone: string;
    admin_notes: string | null;
  }) | null;
}

export async function fetchAdminBloodDonors(params: ListParams): Promise<AdminBloodDonorPage> {
  const admin = await getAdminDataClient();
  const failed = (error?: string): AdminBloodDonorPage => ({
    rows: [],
    total: 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: true,
    ...(error ? { error } : {}),
    counts: EMPTY_DONOR_COUNTS,
  });
  if (!admin) return failed();
  if (
    (params.from && !validDateFilter(params.from)) ||
    (params.to && !validDateFilter(params.to)) ||
    (params.from && params.to && params.from > params.to)
  ) {
    return failed('জমার তারিখের ফিল্টার সঠিক নয়।');
  }

  const { client } = admin;
  const [total, pending, approved, rejected, inactive] = await Promise.all([
    client.from('blood_donor_profiles').select('id', { count: 'exact', head: true }),
    client.from('blood_donor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'pending_approval'),
    client.from('blood_donor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
    client.from('blood_donor_profiles').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    client.from('blood_donor_profiles').select('id', { count: 'exact', head: true })
      .or('status.in.(paused,suspended),is_available.eq.false'),
  ]);
  const countError = [total, pending, approved, rejected, inactive].find((result) => result.error);
  if (countError?.error) return failed(countError.error.message);
  const counts: AdminBloodDonorCounts = {
    total: total.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    inactive: inactive.count ?? 0,
  };

  const from = (params.page - 1) * params.pageSize;
  let query = client
    .rpc('fn_admin_donor_profiles', {}, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + params.pageSize - 1);

  const term = params.search?.trim();
  if (term) {
    const safeTerm = term.replace(/[%_,().*\\"]/g, ' ').replace(/[\[\]]/g, ' ').trim();
    if (safeTerm) {
      const fields = searchFilter(safeTerm, ['full_name', 'private_phone', 'blood_group', 'area_id']);
      const idFilter = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(safeTerm)
        ? `,id.eq.${safeTerm}`
        : '';
      const filters = [fields, idFilter.slice(1)].filter((value): value is string => Boolean(value));
      if (filters.length > 0) query = query.or(filters.join(','));
    }
  }
  if (params.category) query = query.eq('blood_group', params.category);
  if (params.area) query = query.eq('area_id', params.area);
  if (params.status === 'inactive') {
    query = query.or('status.in.(paused,suspended),is_available.eq.false');
  } else if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.availability === 'available') query = query.eq('is_available', true);
  if (params.availability === 'unavailable') query = query.eq('is_available', false);
  if (validDateFilter(params.from)) query = query.gte('created_at', `${params.from}T00:00:00.000Z`);
  if (validDateFilter(params.to)) {
    const dayAfter = new Date(`${params.to}T00:00:00.000Z`);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);
    query = query.lt('created_at', dayAfter.toISOString());
  }

  const { data, count, error } = await query;
  if (error || !data) return failed(error?.message ?? 'রক্তদাতা লোড করা যায়নি।');
  return {
    rows: data as unknown as AdminBloodDonorRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
    counts,
  };
}

export async function fetchEmergencyContacts(params: ListParams): Promise<Paged<AdminEmergencyContactRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('emergency_contacts')
    .select(
      'id, service, name_bn, organization_bn, area_id, address_bn, phone, source_note, is_active, sort_order, created_at',
      { count: 'exact' }
    )
    .order('sort_order', { ascending: true })
    .range(from, to);

  const term = searchFilter(params.search, ['name_bn', 'organization_bn', 'phone']);
  if (term) query = query.or(term);
  if (params.service) query = query.eq('service', params.service);
  if (params.status === 'active') query = query.eq('is_active', true);
  if (params.status === 'inactive') query = query.eq('is_active', false);

  const { data, count, error } = await query;
  if (error || !data) {
    return failedPage(params, error?.message ?? 'জরুরি যোগাযোগ লোড করা যায়নি।');
  }

  return {
    rows: data as AdminEmergencyContactRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

// ---------------------------------------------------------------------------
// Hero slides
// ---------------------------------------------------------------------------

export interface AdminHeroSlide {
  id: string;
  caption_bn: string;
  image_url: string;
  storage_path: string | null;
  alt_text_bn: string | null;
  href: string | null;
  is_enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function fetchHeroSlides(): Promise<{
  rows: AdminHeroSlide[];
  unavailable: boolean;
  error?: string;
}> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], unavailable: true };

  const { data, error } = await admin.client
    .from('hero_slides')
    .select('id, caption_bn, image_url, storage_path, alt_text_bn, href, is_enabled, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (error || !data) return { rows: [], unavailable: true, error: error?.message ?? 'হিরো স্লাইড লোড করা যায়নি।' };
  return { rows: data as AdminHeroSlide[], unavailable: false };
}

// ---------------------------------------------------------------------------
// Media library
// ---------------------------------------------------------------------------

export interface AdminMediaItem {
  id: string;
  name: string;
  bucket_id: string;
  size: number;
  mime_type: string | null;
  created_at: string;
  /** Public URL for public buckets; null for private ones. */
  public_url: string | null;
}

/**
 * The media library.
 *
 * Reads a bounded page through the admin-only RPC because Supabase's internal
 * `storage` schema is not exposed through PostgREST. Private buckets are listed
 * without a public URL.
 */
export async function fetchMediaItems(params: ListParams): Promise<Paged<AdminMediaItem>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const allowedBuckets = [
    'site',
    'listings',
    'staff',
    'avatars',
    'documents',
    'posts',
    'support-attachments',
  ];
  if (params.category && !allowedBuckets.includes(params.category)) {
    return failedPage(params, 'স্টোরেজ বাকেটের মান সঠিক নয়।');
  }

  const { data, error } = await client.rpc('fn_admin_media_page', {
    p_bucket: params.category ?? null,
    p_search: params.search?.trim() || null,
    p_limit: params.pageSize,
    p_offset: from,
  });
  if (error || !data) {
    return failedPage(params, error?.message ?? 'মিডিয়া লাইব্রেরি লোড করা যায়নি।');
  }

  const result = data as unknown;
  if (!isRecord(result) || !Array.isArray(result.items) ||
      typeof result.total !== 'number' || !Number.isFinite(result.total)) {
    return failedPage(params, 'মিডিয়া লাইব্রেরি থেকে অপ্রত্যাশিত ডেটা পাওয়া গেছে।');
  }

  const validRows = result.items.filter((row): row is Record<string, unknown> =>
    isRecord(row) &&
    typeof row.id === 'string' &&
    typeof row.name === 'string' &&
    typeof row.bucket_id === 'string' &&
    typeof row.created_at === 'string'
  );
  if (validRows.length !== result.items.length) {
    return failedPage(params, 'মিডিয়া লাইব্রেরির কোনো রেকর্ডের ফরম্যাট সঠিক নয়।');
  }

  const rows: AdminMediaItem[] = validRows.map((row) => {
    const metadata = isRecord(row.metadata) ? row.metadata : null;
    const isPublic = row.bucket_id !== 'documents' && row.bucket_id !== 'support-attachments';
    return {
      id: row.id as string,
      name: row.name as string,
      bucket_id: row.bucket_id as string,
      size: typeof metadata?.size === 'number' ? metadata.size : 0,
      mime_type: typeof metadata?.mimetype === 'string' ? metadata.mimetype : null,
      created_at: row.created_at as string,
      public_url: isPublic
        ? client.storage.from(row.bucket_id as string).getPublicUrl(row.name as string).data.publicUrl
        : null,
    };
  });

  return {
    rows,
    total: result.total,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

// ---------------------------------------------------------------------------
// Platform settings
// ---------------------------------------------------------------------------

export interface PlatformSettings {
  tolet_fee_rules: {
    messSeatFee: number;
    tier1Max10k: number;
    tier2Max20k: number;
    tier3Above20k: number;
  };
  service_availability: Record<string, boolean>;
  notification_settings: {
    notifyOnRequestSubmitted: boolean;
    notifyOnStatusChange: boolean;
    notifyAdminOnNewRequest: boolean;
    notifyCustomerOnStatusChange: boolean;
  };
  unavailable: boolean;
  error?: string;
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const admin = await getAdminDataClient();
  if (!admin) {
    return {
      tolet_fee_rules: { messSeatFee: 50, tier1Max10k: 100, tier2Max20k: 200, tier3Above20k: 400 },
      service_availability: {},
      notification_settings: {
        notifyOnRequestSubmitted: true,
        notifyOnStatusChange: true,
        notifyAdminOnNewRequest: true,
        notifyCustomerOnStatusChange: true,
      },
      unavailable: true,
    };
  }

  return fetchPlatformSettingsWithClient(admin);
}

// ---------------------------------------------------------------------------
// Unified approval queue and financial management
// ---------------------------------------------------------------------------

  export type AdminApprovalKind =
    | 'post'
    | 'tolet_listing'
    | 'tutor_profile'
    | 'donor_profile'
    | 'service_listing'
    | 'tolet_profile';

  export interface AdminApprovalRow {
    id: string;
    approval_kind: AdminApprovalKind;
    service_key: string;
    title: string;
    summary: string | null;
    owner_id: string | null;
    owner_name: string | null;
    owner_phone: string | null;
    created_at: string;
  }

  export async function fetchAdminApprovalQueue(
    page: number,
    pageSize = 25
  ): Promise<Paged<AdminApprovalRow>> {
    const admin = await getAdminDataClient();
    const safePage = clampPage(page);
    const safePageSize = clampPageSize(pageSize);
    if (!admin) {
      return {
        ...failedPage({ page: safePage, pageSize: safePageSize }, 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।'),
      };
    }

    const { data, error } = await admin.client.rpc('fn_admin_approval_queue', {
      p_limit: safePageSize,
      p_offset: (safePage - 1) * safePageSize,
    });
    if (error || !Array.isArray(data)) {
      return failedPage(
        { page: safePage, pageSize: safePageSize },
        error?.message ?? 'অনুমোদনের তালিকা সঠিকভাবে পাওয়া যায়নি।'
      );
    }

    const first = data[0] as (AdminApprovalRow & { total_count: number }) | undefined;
    return {
      rows: data.map((row) => {
        const value = row as AdminApprovalRow & { total_count: number };
        return {
          id: value.id,
          approval_kind: value.approval_kind,
          service_key: value.service_key,
          title: value.title,
          summary: value.summary,
          owner_id: value.owner_id,
          owner_name: value.owner_name,
          owner_phone: value.owner_phone,
          created_at: value.created_at,
        };
      }),
      total: typeof first?.total_count === 'number' ? first.total_count : 0,
      page: safePage,
      pageSize: safePageSize,
      unavailable: false,
    };
  }

  export interface AdminUserDetail {
    profile: Record<string, unknown>;
    toletProfile: Record<string, unknown> | null;
    tutorProfile: Record<string, unknown> | null;
    donorProfile: Record<string, unknown> | null;
    toletListings: Record<string, unknown>[];
    communityPosts: Record<string, unknown>[];
    serviceListings: Record<string, unknown>[];
    serviceRequests: Record<string, unknown>[];
    toletRequests: Record<string, unknown>[];
    vehicleRequests: Record<string, unknown>[];
  }

  export async function fetchAdminUserDetail(
    userId: string
  ): Promise<{ data: AdminUserDetail | null; error?: string }> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return { data: null, error: 'ইউজার আইডি সঠিক নয়।' };
    }
    const admin = await getAdminDataClient();
    if (!admin) return { data: null, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
    const client = admin.client;
    const [profile, toletProfile, tutorProfile, donorProfile, toletListings, communityPosts,
      serviceListings, serviceRequests, toletRequests, vehicleRequests] = await Promise.all([
      client.from('profiles')
        .select('id,full_name,phone,email,avatar_url,bio,primary_area_id,role,status,is_verified,emergency_contact,created_at,updated_at')
        .eq('id', userId).maybeSingle(),
      client.from('tolet_profiles')
        .select('id,status,rejection_reason,owner_name,phone,primary_area_id,address_line,total_listings_count,is_verified,created_at')
        .eq('user_id', userId).maybeSingle(),
      client.from('home_tutor_profiles')
        .select('id,status,full_name,gender,institution,department,qualification,experience_years,preferred_areas,preferred_classes,preferred_subjects,expected_salary,days_per_week,bio,teaching_mode,availability,profile_photo_url,educations,current_activity,class_duration_minutes,preferred_student_type,created_at')
        .eq('user_id', userId).maybeSingle(),
      client.from('blood_donor_profiles')
        .select('id,status,full_name,blood_group,area_id,gender,birth_year,weight_kg,is_available,last_donation_date,donation_count,intro,profile_photo_url,show_readiness,created_at')
        .eq('user_id', userId).maybeSingle(),
      client.from('tolet_listings')
        .select('id,title,status,property_type,area_id,specific_address,rent_price,bedrooms,bathrooms,facilities,unavailable_facilities,available_from,description,created_at,published_at')
        .eq('owner_id', userId).order('created_at', { ascending: false }),
      client.from('community_posts')
        .select('id,kind,status,title_bn,summary_bn,body_bn,category,area_id,price,salary_min,salary_max,job_type,organization_bn,deadline,condition_label,created_at,slug')
        .eq('author_id', userId).order('created_at', { ascending: false }),
      client.from('service_listings')
        .select('id,category,status,title_bn,subtitle_bn,slug,summary_bn,description_bn,area_ids,address_bn,is_active,rejection_reason,created_at')
        .eq('owner_id', userId).order('created_at', { ascending: false }),
      client.from('service_requests')
        .select('id,status,service_slug,service_type,profile_title,area_id,address_line,details,preferred_date,preferred_time,quotation,admin_notes,service_meta,pickup_area_id,destination_area_id,pickup_address,destination_address,created_at')
        .eq('customer_id', userId).order('created_at', { ascending: false }),
      client.from('tolet_requests')
        .select('id,listing_id,status,area_id,preferred_time,message,created_at')
        .eq('customer_id', userId).order('created_at', { ascending: false }),
      client.from('vehicle_requests')
        .select('id,status,contact_name,pickup_area_id,destination_area_id,travel_date,travel_time,passenger_count,trip_duration,budget,notes,created_at')
        .eq('customer_id', userId).order('created_at', { ascending: false }),
    ]);
    const failed = [
      profile, toletProfile, tutorProfile, donorProfile, toletListings, communityPosts,
      serviceListings, serviceRequests, toletRequests, vehicleRequests,
    ].find((result) => result.error);
    if (failed?.error) return { data: null, error: failed.error.message };
    if (!profile.data) return { data: null };

    return {
      data: {
        profile: profile.data as unknown as Record<string, unknown>,
        toletProfile: (toletProfile.data as unknown as Record<string, unknown> | null) ?? null,
        tutorProfile: (tutorProfile.data as unknown as Record<string, unknown> | null) ?? null,
        donorProfile: (donorProfile.data as unknown as Record<string, unknown> | null) ?? null,
        toletListings: (toletListings.data ?? []) as unknown as Record<string, unknown>[],
        communityPosts: (communityPosts.data ?? []) as unknown as Record<string, unknown>[],
        serviceListings: (serviceListings.data ?? []) as unknown as Record<string, unknown>[],
        serviceRequests: (serviceRequests.data ?? []) as unknown as Record<string, unknown>[],
        toletRequests: (toletRequests.data ?? []) as unknown as Record<string, unknown>[],
        vehicleRequests: (vehicleRequests.data ?? []) as unknown as Record<string, unknown>[],
      },
    };
  }

  export type AdminFinancialService =
    | 'tolet'
    | 'tutor'
    | 'blood_donor'
    | 'wifi'
    | 'coaching'
    | 'vehicle'
    | 'staff'
    | 'other';

  export interface AdminFinancialRecord {
    id: string;
    service_key: AdminFinancialService;
    income_amount: number;
    due_amount: number;
    record_date: string;
    notes: string;
    created_at: string;
    updated_at: string;
  }

  export interface AdminFinancialSummary {
    service_key: AdminFinancialService;
    income_total: number;
    due_total: number;
    record_count: number;
  }

  export async function fetchAdminFinancialManagement(
    page: number,
    pageSize = 20
  ): Promise<{
    records: AdminFinancialRecord[];
    total: number;
    summary: AdminFinancialSummary[];
    page: number;
    pageSize: number;
    unavailable: boolean;
    error?: string;
  }> {
    const safePage = clampPage(page);
    const safePageSize = clampPageSize(pageSize);
    const empty = {
      records: [],
      total: 0,
      summary: [],
      page: safePage,
      pageSize: safePageSize,
      unavailable: true,
    };
    const admin = await getAdminDataClient();
    if (!admin) return { ...empty, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };

    const from = (safePage - 1) * safePageSize;
    const [records, summary] = await Promise.all([
      admin.client
        .from('admin_financial_records')
        .select('id,service_key,income_amount,due_amount,record_date,notes,created_at,updated_at', { count: 'exact' })
        .order('record_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + safePageSize - 1),
      admin.client.rpc('fn_admin_financial_summary'),
    ]);
    if (records.error || summary.error || !records.data || !summary.data) {
      return {
        ...empty,
        error: records.error?.message ?? summary.error?.message ?? 'আর্থিক হিসাব লোড করা যায়নি।',
      };
    }
    return {
      records: records.data as AdminFinancialRecord[],
      total: records.count ?? 0,
      summary: summary.data as AdminFinancialSummary[],
      page: safePage,
      pageSize: safePageSize,
      unavailable: false,
    };
  }

async function fetchPlatformSettingsWithClient(admin: AdminClient): Promise<PlatformSettings> {
  const { data, error } = await admin.client
    .from('platform_settings')
    .select('key, value');

  if (error || !Array.isArray(data)) {
    return {
      tolet_fee_rules: { messSeatFee: 50, tier1Max10k: 100, tier2Max20k: 200, tier3Above20k: 400 },
      service_availability: {},
      notification_settings: {
        notifyOnRequestSubmitted: true,
        notifyOnStatusChange: true,
        notifyAdminOnNewRequest: true,
        notifyCustomerOnStatusChange: true,
      },
      unavailable: true,
      error: error?.message ?? 'প্ল্যাটফর্ম সেটিংসের result সঠিক নয়।',
    };
  }

  const byKey = new Map(data.map((r) => [r.key, r.value]));
  const read = <T,>(key: string, fallback: T): T => {
    const value = byKey.get(key);
    return value && typeof value === 'object' ? (value as T) : fallback;
  };

  return {
    tolet_fee_rules: read('tolet_fee_rules', {
      messSeatFee: 50,
      tier1Max10k: 100,
      tier2Max20k: 200,
      tier3Above20k: 400,
    }),
    service_availability: read('service_availability', {}),
    notification_settings: read('notification_settings', {
      notifyOnRequestSubmitted: true,
      notifyOnStatusChange: true,
      notifyAdminOnNewRequest: true,
      notifyCustomerOnStatusChange: true,
    }),
    unavailable: false,
  };
}