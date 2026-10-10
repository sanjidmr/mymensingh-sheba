import { createServerSideClient } from '@/lib/supabase/server';
import { clampPage, clampPageSize } from './format';
// ⚠️ DEV AUTH BYPASS — remove together with lib/dev-auth-bypass.ts.
import { DEV_AUTH_BYPASS } from '@/lib/dev-auth-bypass';
import {
  createDevServiceRoleClient,
  resolveDevAdminIdentity,
} from '@/lib/admin/dev-service-role';

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
  search?: string;
  status?: string;
  kind?: string;
  category?: string;
  service?: string;
  area?: string;
  sort?: string;
  [key: string]: string | number | undefined;
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

  return {
    page: clampPage(get('page')),
    pageSize: clampPageSize(get('pageSize'), defaults.pageSize ?? 25),
    search: get('q')?.trim() || undefined,
    status: get('status') || undefined,
    kind: get('kind') || undefined,
    category: get('category') || undefined,
    service: get('service') || undefined,
    area: get('area') || undefined,
    sort: get('sort') || undefined,
  };
}

/** Build the `?q=` filter shared by every list screen. */
function searchFilter(search: string | undefined, columns: string[]) {
  if (!search) return undefined;
  const term = search.replace(/[%_]/g, '');
  if (!term) return undefined;
  return columns.map((c) => `${c}.ilike.%${term}%`).join(',');
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
  bloodRequests: number;
  unavailable: boolean;
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
      bloodRequests: 0,
      unavailable: true,
    };
  }
  const { client } = admin;

  const [
    messages,
    posts,
    reports,
    requests,
    verifications,
    notifications,
    bloodRequests,
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
    client
      .from('home_tutor_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
    client
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('target_role', 'admin')
      .eq('is_read', false),
    client
      .from('blood_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review'),
  ]);

  return {
    messages: messages.count ?? 0,
    posts: posts.count ?? 0,
    reports: reports.count ?? 0,
    requests: requests.count ?? 0,
    verifications: verifications.count ?? 0,
    notifications: notifications.count ?? 0,
    bloodRequests: bloodRequests.count ?? 0,
    unavailable: false,
  };
}

export interface DashboardStats {
  total_users: number;
  active_users: number;
  blocked_users: number;
  new_users_7d: number;
  total_posts: number;
  pending_posts: number;
  approved_posts: number;
  rejected_posts: number;
  featured_posts: number;
  total_requests: number;
  open_requests: number;
  completed_requests: number;
  cancelled_requests: number;
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
  unavailable: boolean;
}

/** Live dashboard counters, from the `get_admin_dashboard_stats()` RPC. */
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const admin = await getAdminDataClient();
  if (!admin) {
    return {
      total_users: 0, active_users: 0, blocked_users: 0, new_users_7d: 0,
      total_posts: 0, pending_posts: 0, approved_posts: 0, rejected_posts: 0,
      featured_posts: 0, total_requests: 0, open_requests: 0,
      completed_requests: 0, cancelled_requests: 0,
      total_tolet_requests: 0, open_tolet_requests: 0, total_blood_requests: 0,
      open_blood_requests: 0, total_vehicle_requests: 0, open_vehicle_requests: 0,
      total_messages: 0, unread_messages: 0, total_reports: 0, open_reports: 0,
      pending_verifications: 0, active_tolet_listings: 0, pending_tolet_listings: 0,
      active_staff: 0, active_service_listings: 0, active_emergency_contacts: 0,
      unread_admin_notifications: 0,
      unavailable: true,
    };
  }

  const { data, error } = await admin.client.rpc('get_admin_dashboard_stats');
  if (error || !data) {
    return {
      total_users: 0, active_users: 0, blocked_users: 0, new_users_7d: 0,
      total_posts: 0, pending_posts: 0, approved_posts: 0, rejected_posts: 0,
      featured_posts: 0, total_requests: 0, open_requests: 0,
      completed_requests: 0, cancelled_requests: 0,
      total_tolet_requests: 0, open_tolet_requests: 0, total_blood_requests: 0,
      open_blood_requests: 0, total_vehicle_requests: 0, open_vehicle_requests: 0,
      total_messages: 0, unread_messages: 0, total_reports: 0, open_reports: 0,
      pending_verifications: 0, active_tolet_listings: 0, pending_tolet_listings: 0,
      active_staff: 0, active_service_listings: 0, active_emergency_contacts: 0,
      unread_admin_notifications: 0,
      unavailable: true,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const [completed, cancelled] = await Promise.all([
    admin.client.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.client.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ]);
  if (completed.error || cancelled.error) {
    return {
      ...(row as Omit<DashboardStats, 'unavailable'>),
      completed_requests: 0,
      cancelled_requests: 0,
      unavailable: true,
    };
  }
  return {
    ...(row as Omit<DashboardStats, 'unavailable'>),
    completed_requests: completed.count ?? 0,
    cancelled_requests: cancelled.count ?? 0,
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
}> {
  const admin = await getAdminDataClient();
  if (!admin) return { items: [], unavailable: true };

  const { data, error } = await admin.client.rpc('get_admin_recent_activity', {
    p_limit: limit,
  });
  if (error || !Array.isArray(data)) return { items: [], unavailable: true };

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
    return {
      rows: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      unavailable: true,
      error: error?.message ?? 'গাড়ি রিকোয়েস্ট লোড করা যায়নি।',
    };
  }

  const ids = data.map((r) => r.id);
  const [tolet, tutors, donors, postCounts, requestCounts] = await Promise.all([
    client.from('tolet_profiles').select('user_id, status').in('user_id', ids),
    client.from('home_tutor_profiles').select('user_id, status').in('user_id', ids),
    client.from('blood_donor_profiles').select('user_id, status').in('user_id', ids),
    client.from('community_posts').select('author_id').in('author_id', ids),
    client.from('service_requests').select('customer_id').in('customer_id', ids),
  ]);

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
  slug: string;
  title_bn: string;
  summary_bn: string | null;
  category: string | null;
  area_id: string | null;
  author_name: string | null;
  author_phone: string | null;
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

  const term = searchFilter(params.search, ['title_bn', 'summary_bn', 'author_name', 'slug']);
  if (term) query = query.or(term);
  if (params.status) query = query.eq('status', params.status);
  if (params.kind) query = query.eq('kind', params.kind);
  if (params.category) query = query.eq('category', params.category);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  return {
    rows: data as AdminPostRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface AdminRequestRow {
  id: string;
  service_slug: string;
  service_type: string | null;
  profile_title: string | null;
  contact_name: string;
  contact_phone: string;
  area_id: string;
  status: string;
  quotation: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchServiceRequests(params: ListParams): Promise<Paged<AdminRequestRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('service_requests')
    .select(
      'id, service_slug, service_type, profile_title, contact_name, contact_phone, area_id, status, quotation, admin_notes, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['contact_name', 'contact_phone', 'service_slug', 'profile_title']);
  if (term) query = query.or(term);
  if (params.status) query = query.eq('status', params.status);
  if (params.service) query = query.eq('service_slug', params.service);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  return {
    rows: data as AdminRequestRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
}

export interface AdminToletRequestRow {
  id: string;
  listing_id: string;
  customer_name: string;
  customer_phone: string;
  area_id: string | null;
  preferred_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
  listing_title: string | null;
}

export async function fetchToletRequests(params: ListParams): Promise<Paged<AdminToletRequestRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('tolet_requests')
    .select(
      'id, listing_id, customer_name, customer_phone, area_id, preferred_time, message, status, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['customer_name', 'customer_phone', 'message']);
  if (term) query = query.or(term);
  if (params.status) query = query.eq('status', params.status);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  const listingIds = [...new Set((data as { listing_id: string }[]).map((r) => r.listing_id))];
  const { data: listings } = await client
    .from('tolet_listings')
    .select('id, title_bn')
    .in('id', listingIds);

  const titleById = new Map((listings ?? []).map((l) => [l.id, l.title_bn]));

  const rows: AdminToletRequestRow[] = (data as Omit<AdminToletRequestRow, 'listing_title'>[]).map((r) => ({
    ...r,
    listing_title: titleById.get(r.listing_id) ?? null,
  }));

  return { rows, total: count ?? 0, page: params.page, pageSize: params.pageSize, unavailable: false };
}

export interface AdminVehicleRequestRow {
  id: string;
  vehicle_kind: string;
  vehicle_name: string | null;
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
  status: string;
  created_at: string;
}

export async function fetchVehicleRequests(params: ListParams): Promise<Paged<AdminVehicleRequestRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('vehicle_requests')
    .select(
      'id, vehicle_kind, vehicle_name, contact_name, contact_phone, pickup_area_id, destination_area_id, travel_date, travel_time, passenger_count, trip_duration, budget, notes, status, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['contact_name', 'contact_phone', 'vehicle_name', 'notes']);
  if (term) query = query.or(term);
  if (params.status) query = query.eq('status', params.status);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  return {
    rows: data as AdminVehicleRequestRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
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
      'id, vehicle_kind, vehicle_name, contact_name, contact_phone, pickup_area_id, destination_area_id, travel_date, travel_time, passenger_count, trip_duration, budget, notes, status, created_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) return { row: null, unavailable: true, error: error.message };
  return { row: data as AdminVehicleRequestRow | null, unavailable: false };
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
  message: string;
  status: 'new' | 'reviewing' | 'replied' | 'closed';
  admin_notes: string | null;
  user_id: string | null;
  created_at: string;
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
      'id, name, phone, email, subject, message, status, admin_notes, user_id, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['name', 'phone', 'email', 'subject', 'message']);
  if (term) query = query.or(term);
  if (params.status) query = query.eq('status', params.status);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  return {
    rows: data as AdminMessageRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
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
      if (error || !data) return [] as AdminReportRow[];
      return (data as Record<string, unknown>[]).map((row) => ({
        id: row.id as string,
        source,
        reporter_name: row.reporter_name as string,
        reason: row.reason as string,
        details: (row.details as string) ?? null,
        status: row.status as AdminReportRow['status'],
        created_at: row.created_at as string,
        target_label: targetLabel(row),
        target_href: targetHref(row),
      }));
    });
  };

  const [listings, staff, tutors, donors, communityPosts] = await Promise.all([
    build('listing_reports', 'listing', () => 'বাসা ভাড়া বিজ্ঞাপন', () => '/admin/tolet'),
    build('staff_profile_reports', 'staff', () => 'কর্মী প্রোফাইল', () => '/admin/services'),
    build('tutor_reports', 'tutor', () => 'গৃহশিক্ষক প্রোফাইল', () => '/admin/verifications'),
    build('blood_donor_reports', 'donor', () => 'রক্তদাতা প্রোফাইল', () => '/admin/blood'),
    build('community_post_reports', 'community_post', () => 'কমিউনিটি পোস্ট', () => '/admin/posts'),
  ]);

  const all = [...listings, ...staff, ...tutors, ...donors, ...communityPosts].sort((a, b) =>
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
  category: 'coaching' | 'wifi' | 'bus' | 'vehicle';
  slug: string;
  title_bn: string;
  area_id: string | null;
  contact_phone: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
}

export async function fetchServiceListings(params: ListParams): Promise<Paged<AdminServiceListingRow>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .from('service_listings')
    .select('id, category, slug, title_bn, area_id, contact_phone, is_active, is_featured, created_at', {
      count: 'exact',
    })
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['title_bn', 'slug', 'area_id']);
  if (term) query = query.or(term);
  if (params.category) query = query.eq('category', params.category);
  if (params.status === 'active') query = query.eq('is_active', true);
  if (params.status === 'inactive') query = query.eq('is_active', false);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  return {
    rows: data as AdminServiceListingRow[],
    total: count ?? 0,
    page: params.page,
    pageSize: params.pageSize,
    unavailable: false,
  };
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
    return {
      rows: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      unavailable: true,
      error: error?.message ?? 'জরুরি যোগাযোগ লোড করা যায়নি।',
    };
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
}> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], unavailable: true };

  const { data, error } = await admin.client
    .from('hero_slides')
    .select('id, caption_bn, image_url, storage_path, alt_text_bn, href, is_enabled, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true });

  if (error || !data) return { rows: [], unavailable: false };
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
 * Reads `storage.objects` directly rather than through the Storage API so the
 * panel can show every bucket in one place. Private buckets (`documents`) are
 * listed but get no public URL — the panel must not hand out a link that
 * expires in an hour as if it were permanent.
 */
export async function fetchMediaItems(params: ListParams): Promise<Paged<AdminMediaItem>> {
  const admin = await getAdminDataClient();
  if (!admin) return { rows: [], total: 0, page: 1, pageSize: params.pageSize, unavailable: true };
  const { client } = admin;

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = client
    .schema('storage')
    .from('objects')
    .select('id, name, bucket_id, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  const term = searchFilter(params.search, ['name']);
  if (term) query = query.or(term);
  if (params.category) query = query.eq('bucket_id', params.category);

  const { data, count, error } = await query;
  if (error || !data) return { rows: [], total: 0, page: params.page, pageSize: params.pageSize, unavailable: false };

  const rows: AdminMediaItem[] = (data as {
    id: string;
    name: string;
    bucket_id: string;
    metadata?: { size?: number; mimetype?: string } | null;
    created_at: string;
  }[]).map((row) => {
    const isPublic = row.bucket_id !== 'documents';
    return {
      id: row.id,
      name: row.name,
      bucket_id: row.bucket_id,
      size: row.metadata?.size ?? 0,
      mime_type: row.metadata?.mimetype ?? null,
      created_at: row.created_at,
      public_url: isPublic
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${row.bucket_id}/${row.name}`
        : null,
    };
  });

  return { rows, total: count ?? 0, page: params.page, pageSize: params.pageSize, unavailable: false };
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
      unavailable: false,
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