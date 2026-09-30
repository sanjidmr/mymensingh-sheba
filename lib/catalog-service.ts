'use client';

/**
 * Data access for the newer service pages.
 *
 * Three concerns live here, deliberately in one place so no page can bypass
 * them:
 *
 *  1. PUBLIC READS   — only `is_active` rows, and never the private contact
 *                      column. Public CTAs route through /contact, matching the
 *                      existing staff-profile privacy contract.
 *  2. ADMIN WRITES   — guarded here AND by RLS. The UI hides admin buttons, but
 *                      the service layer refuses a non-admin write even if a
 *                      crafted request reaches it. RLS is the real boundary;
 *                      this check stops the request before it is sent.
 *  3. USER WRITES    — authors may write only their own rows, and every insert
 *                      is forced to `pending` so a user cannot self-approve.
 *
 * There is deliberately NO mock/seed fallback. When Supabase is unconfigured or
 * the tables have not been migrated yet, these functions return an empty list
 * and pages render an honest empty state. Inventing providers, prices or
 * emergency phone numbers is exactly what this platform must never do.
 */
import { createClient, isSupabaseConfigured } from './supabase/client';
import { toCamelObject, toSnakeObject } from './supabase/transform';
import type {
  CommunityPost,
  CommunityPostInput,
  EmergencyContact,
  EmergencyContactInput,
  EmergencyService,
  PostKind,
  ServiceCategory,
  ServiceListing,
  ServiceListingInput,
  VehicleKind,
  VehicleRequest,
  VehicleRequestInput,
  VehicleRequestStatus,
} from './catalog-types';

const NOT_CONFIGURED =
  'ডেটাবেস সংযোগ নেই। প্রকল্পে Supabase কনফিগারেশন ও মাইগ্রেশন সম্পন্ন হলে এই সেবা চালু হবে।';
const NOT_ALLOWED = 'এই কাজটি করতে অ্যাডমিন অনুমতি প্রয়োজন।';
const NOT_SIGNED_IN = 'এই কাজটি করতে আগে লগইন করুন।';

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/** Columns a public (non-admin) reader is allowed to see. */
const PUBLIC_LISTING_COLUMNS =
  'id, category, slug, title_bn, subtitle_bn, summary_bn, description_bn, image_url, logo_url, area_ids, tags, monthly_fee_min, monthly_fee_max, price_min, price_max, speed_mbps, fare_min, fare_max, origin_bn, destination_bn, seat_count, is_active, is_featured, created_at, updated_at';

const PUBLIC_POST_COLUMNS =
  'id, kind, slug, author_id, title_bn, summary_bn, body_bn, cover_image_url, category, area_id, tags, salary_min, salary_max, price, job_type, deadline, condition_label, status, is_featured, published_at, created_at, updated_at';

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function optNum(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function mapListing(row: Record<string, unknown>, admin: boolean): ServiceListing {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    category: c.category as ServiceCategory,
    slug: str(c.slug),
    titleBn: str(c.titleBn),
    subtitleBn: optStr(c.subtitleBn),
    summaryBn: optStr(c.summaryBn),
    descriptionBn: optStr(c.descriptionBn),
    imageUrl: optStr(c.imageUrl),
    logoUrl: optStr(c.logoUrl),
    areaIds: strArray(c.areaIds),
    tags: strArray(c.tags),
    monthlyFeeMin: optNum(c.monthlyFeeMin),
    monthlyFeeMax: optNum(c.monthlyFeeMax),
    priceMin: optNum(c.priceMin),
    priceMax: optNum(c.priceMax),
    speedMbps: optNum(c.speedMbps),
    fareMin: optNum(c.fareMin),
    fareMax: optNum(c.fareMax),
    originBn: optStr(c.originBn),
    destinationBn: optStr(c.destinationBn),
    seatCount: optNum(c.seatCount),
    // Admin-only column: only populated on the authenticated admin path.
    contactPhonePrivate: admin ? optStr(c.contactPhonePrivate) : undefined,
    isActive: c.isActive !== false,
    isFeatured: Boolean(c.isFeatured),
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapPost(row: Record<string, unknown>): CommunityPost {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    kind: c.kind as PostKind,
    slug: str(c.slug),
    authorId: str(c.authorId),
    titleBn: str(c.titleBn),
    summaryBn: optStr(c.summaryBn),
    bodyBn: optStr(c.bodyBn),
    coverImageUrl: optStr(c.coverImageUrl),
    category: optStr(c.category),
    areaId: optStr(c.areaId),
    tags: strArray(c.tags),
    salaryMin: optNum(c.salaryMin),
    salaryMax: optNum(c.salaryMax),
    price: optNum(c.price),
    jobType: optStr(c.jobType),
    deadline: optStr(c.deadline),
    conditionLabel: optStr(c.conditionLabel),
    status: c.status as CommunityPost['status'],
    isFeatured: Boolean(c.isFeatured),
    publishedAt: optStr(c.publishedAt),
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapContact(row: Record<string, unknown>): EmergencyContact {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    service: c.service as EmergencyService,
    nameBn: str(c.nameBn),
    organizationBn: optStr(c.organizationBn),
    areaId: optStr(c.areaId),
    addressBn: optStr(c.addressBn),
    phone: str(c.phone),
    sourceNote: optStr(c.sourceNote),
    isActive: c.isActive !== false,
    sortOrder: typeof c.sortOrder === 'number' ? c.sortOrder : 0,
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapVehicleRequest(row: Record<string, unknown>): VehicleRequest {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    vehicleListingId: optStr(c.vehicleListingId),
    vehicleKind: c.vehicleKind as VehicleKind,
    vehicleName: optStr(c.vehicleName),
    customerId: optStr(c.customerId),
    contactName: str(c.contactName),
    contactPhone: str(c.contactPhone),
    pickupAreaId: optStr(c.pickupAreaId),
    destinationAreaId: optStr(c.destinationAreaId),
    travelDate: optStr(c.travelDate),
    travelTime: optStr(c.travelTime),
    notes: optStr(c.notes),
    status: (c.status as VehicleRequestStatus) || 'new',
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Current user id, or null. Never throws. */
export async function currentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  if (!client) return null;
  const { data } = await client.auth.getSession();
  return data.session?.user?.id ?? null;
}

/**
 * Server-side role check used to gate admin writes in the service layer.
 * RLS is the authoritative boundary; this only avoids sending a request that is
 * guaranteed to be refused, and keeps the UI honest.
 */
export async function currentUserIsAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const client = createClient();
  if (!client) return false;
  const { data } = await client.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return false;
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();
  return profile?.role === 'admin';
}

export type WriteResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * A write whose row the caller is not allowed to read back — for example a
 * guest submitting a vehicle request. `success` still means the database
 * confirmed the write; there is simply no row to hand back.
 */
export type AckResult = { success: true } | { success: false; error: string };

// ---------------------------------------------------------------------------
// Service listings (admin-curated)
// ---------------------------------------------------------------------------

/** Active listings for a public category page. */
export async function fetchServiceListings(
  category: ServiceCategory
): Promise<ServiceListing[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('service_listings')
    .select(PUBLIC_LISTING_COLUMNS)
    .eq('category', category)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => mapListing(row, false));
}

/** A single listing by slug, public read (active only). */
export async function fetchServiceListingBySlug(
  category: ServiceCategory,
  slug: string
): Promise<ServiceListing | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('service_listings')
    .select(PUBLIC_LISTING_COLUMNS)
    .eq('category', category)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return mapListing(data as Record<string, unknown>, false);
}

/**
 * A single listing by slug, including the private contact number.
 *
 * The number belongs in the schema for the admin who typed it, but publishing
 * it is a moderation decision, not a row-visibility one. RLS cannot hide a
 * column, so the service layer gates this read behind an admin check instead of
 * relying on the public column list alone. A non-admin gets the row with no
 * number attached, and the detail page renders a request button in its place.
 */
export async function fetchServiceListingForContact(
  category: ServiceCategory,
  slug: string
): Promise<ServiceListing | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  if (!client) return null;
  const isAdmin = await currentUserIsAdmin();
  if (!isAdmin) return fetchServiceListingBySlug(category, slug);

  const { data, error } = await client
    .from('service_listings')
    .select('*')
    .eq('category', category)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return mapListing(data as Record<string, unknown>, true);
}

/** Every listing in a category, including inactive — admin only. */
export async function adminFetchServiceListings(
  category: ServiceCategory
): Promise<ServiceListing[]> {
  if (!isSupabaseConfigured) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('service_listings')
    .select('*')
    .eq('category', category)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => mapListing(row, true));
}

export async function adminCreateServiceListing(
  input: ServiceListingInput
): Promise<WriteResult<ServiceListing>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const payload = toSnakeObject(input as unknown as Record<string, unknown>);
  delete payload.createdAt;
  delete payload.updatedAt;

  const { data, error } = await client
    .from('service_listings')
    .insert(payload)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'সংরক্ষণ ব্যর্থ হয়েছে' };
  }
  return { success: true, data: mapListing(data as Record<string, unknown>, true) };
}

export async function adminUpdateServiceListing(
  id: string,
  patch: Partial<ServiceListingInput>
): Promise<WriteResult<ServiceListing>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const payload = toSnakeObject(patch as Record<string, unknown>);
  delete payload.createdAt;
  delete payload.updatedAt;

  const { data, error } = await client
    .from('service_listings')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  return { success: true, data: mapListing(data as Record<string, unknown>, true) };
}

export async function adminDeleteServiceListing(
  id: string
): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('service_listings').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Community posts (user-authored: news / jobs / buy-sell)
// ---------------------------------------------------------------------------

/** Approved posts of one kind, newest first. */
export async function fetchApprovedPosts(kind: PostKind): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('community_posts')
    .select(PUBLIC_POST_COLUMNS)
    .eq('kind', kind)
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPost);
}

/** Approved posts for every kind at once — used by the homepage rails. */
export async function fetchApprovedPostsByKind(
  kinds: PostKind[]
): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('community_posts')
    .select(PUBLIC_POST_COLUMNS)
    .in('kind', kinds)
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPost);
}

export async function fetchApprovedPostBySlug(
  kind: PostKind,
  slug: string
): Promise<CommunityPost | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('community_posts')
    .select(PUBLIC_POST_COLUMNS)
    .eq('kind', kind)
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  if (error || !data) return null;
  return mapPost(data as Record<string, unknown>);
}

/**
 * A post by slug, visible to its author even when not yet approved.
 *
 * An author needs to see their own pending or rejected post — otherwise a
 * rejected submission looks like it vanished. The ownership check is done here
 * rather than trusted from the client, and the `author_id` filter means a
 * non-author simply gets no row.
 */
export async function fetchPostForViewer(
  kind: PostKind,
  slug: string
): Promise<CommunityPost | null> {
  const publicPost = await fetchApprovedPostBySlug(kind, slug);
  if (publicPost) return publicPost;
  if (!isSupabaseConfigured) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('community_posts')
    .select('*')
    .eq('kind', kind)
    .eq('slug', slug)
    .eq('author_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapPost(data as Record<string, unknown>);
}

/**
 * The signed-in author's own post, by id, for the edit screen.
 *
 * Scoped with `author_id = user_id` in the query itself, so another member's id
 * simply matches nothing. An already-approved post returns null as well: the
 * public detail page is the right place for those, and a "save" that silently
 * pushed an approved post back into moderation would be surprising.
 */
export async function fetchMyPostForEdit(id: string): Promise<CommunityPost | null> {
  if (!isSupabaseConfigured) return null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('community_posts')
    .select('*')
    .eq('id', id)
    .eq('author_id', userId)
    .neq('status', 'approved')
    .maybeSingle();
  if (error || !data) return null;
  return mapPost(data as Record<string, unknown>);
}

/** The signed-in author's own posts, any status. */
export async function fetchMyPosts(): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('community_posts')
    .select('*')
    .eq('author_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPost);
}

/**
 * Create a post. Always forced to `pending`, regardless of what the caller
 * passes, and always attributed to the signed-in user.
 */
export async function createCommunityPost(
  input: CommunityPostInput
): Promise<WriteResult<CommunityPost>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const { status: _ignoredStatus, isFeatured: _ignoredFeature, authorId: _ignoredAuthor, ...rest } =
    input;

  const payload = {
    ...toSnakeObject(rest as Record<string, unknown>),
    author_id: userId,
    // Moderation is never client-controlled.
    status: 'pending',
  };

  const { data, error } = await client
    .from('community_posts')
    .insert(payload)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'পোস্ট সংরক্ষণ ব্যর্থ হয়েছে' };
  }
  return { success: true, data: mapPost(data as Record<string, unknown>) };
}

/** Edit own post. Ownership and `pending` status are enforced again here. */
export async function updateCommunityPost(
  id: string,
  patch: Partial<CommunityPostInput>
): Promise<WriteResult<CommunityPost>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const { status: _s, isFeatured: _f, authorId: _a, slug: _slug, ...rest } = patch;
  const payload = {
    ...toSnakeObject(rest as Record<string, unknown>),
    // An edit re-enters moderation.
    status: 'pending',
  };

  const { data, error } = await client
    .from('community_posts')
    .update(payload)
    .eq('id', id)
    .eq('author_id', userId)
    .select('*')
    .single();
  if (error || !data) {
    return {
      success: false,
      error: error?.message || 'আপডেট ব্যর্থ হয়েছে (অথবা এই পোস্টটি আপনার নয়)',
    };
  }
  return { success: true, data: mapPost(data as Record<string, unknown>) };
}

/** Delete own post. */
export async function deleteCommunityPost(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client
    .from('community_posts')
    .delete()
    .eq('id', id)
    .eq('author_id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// --- admin moderation ---

export async function adminFetchPosts(kind?: PostKind): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  let q = client.from('community_posts').select('*').order('created_at', { ascending: false });
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPost);
}

/** Approve / reject / feature a post. Admin only. */
export async function adminSetPostStatus(
  id: string,
  status: CommunityPost['status'],
  isFeatured?: boolean
): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const patch: Record<string, unknown> = { status };
  if (isFeatured !== undefined) patch.is_featured = isFeatured;
  if (status === 'approved') {
    patch.published_at = new Date().toISOString();
  }

  const { error } = await client.from('community_posts').update(patch).eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function adminDeletePost(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('community_posts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Emergency contacts (admin-curated, verified numbers only)
// ---------------------------------------------------------------------------

export async function fetchEmergencyContacts(
  service: EmergencyService
): Promise<EmergencyContact[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('emergency_contacts')
    .select('*')
    .eq('service', service)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name_bn', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapContact);
}

export async function adminFetchEmergencyContacts(
  service?: EmergencyService
): Promise<EmergencyContact[]> {
  if (!isSupabaseConfigured) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  let q = client.from('emergency_contacts').select('*').order('sort_order', { ascending: true });
  if (service) q = q.eq('service', service);
  const { data, error } = await q;
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapContact);
}

export async function adminCreateEmergencyContact(
  input: EmergencyContactInput
): Promise<WriteResult<EmergencyContact>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const payload = toSnakeObject(input as unknown as Record<string, unknown>);
  delete payload.createdAt;
  delete payload.updatedAt;

  const { data, error } = await client
    .from('emergency_contacts')
    .insert(payload)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'সংরক্ষণ ব্যর্থ হয়েছে' };
  }
  return { success: true, data: mapContact(data as Record<string, unknown>) };
}

export async function adminUpdateEmergencyContact(
  id: string,
  patch: Partial<EmergencyContactInput>
): Promise<WriteResult<EmergencyContact>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const payload = toSnakeObject(patch as Record<string, unknown>);
  delete payload.createdAt;
  delete payload.updatedAt;

  const { data, error } = await client
    .from('emergency_contacts')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  return { success: true, data: mapContact(data as Record<string, unknown>) };
}

export async function adminDeleteEmergencyContact(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('emergency_contacts').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Post image upload
// ---------------------------------------------------------------------------

/** Storage bucket for news / job / marketplace cover images. */
const POST_IMAGE_BUCKET = 'posts';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Uploads one cover image and returns its public URL.
 *
 * Uses the `posts` bucket, namespaced by author id so one member cannot
 * overwrite another's file, and validates type and size before sending rather
 * than relying on the bucket policy alone.
 */
export async function uploadPostImage(
  authorId: string,
  file: File
): Promise<WriteResult<string>> {
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'শুধুমাত্র ছবি ফাইল দেওয়া যাবে।' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: 'ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।' };
  }
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().slice(0, 5);
  const path = `${authorId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await client.storage.from(POST_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };

  const { data } = client.storage.from(POST_IMAGE_BUCKET).getPublicUrl(path);
  return { success: true, data: data.publicUrl };
}

// ---------------------------------------------------------------------------
// Vehicle requests
// ---------------------------------------------------------------------------

/**
 * Submit a vehicle rental request.
 *
 * Open to guests by design: a taxi enquiry should not require an account. The
 * row is real and lands in the admin inbox.
 *
 * Note there is deliberately NO `.select()` on this insert. Guests are allowed
 * to INSERT the row but not to read `vehicle_requests` back, so asking
 * PostgREST to `RETURNING *` would come back empty even though the write
 * succeeded — and reporting that as a failure would tell a real customer their
 * request was lost. Success is therefore keyed purely on Supabase reporting no
 * error, which is the actual signal that the row was written. Nothing is
 * synthesised: a failure still surfaces the real database message.
 */
export async function createVehicleRequest(
  input: VehicleRequestInput
): Promise<AckResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const userId = await currentUserId();
  const payload = {
    ...toSnakeObject(input as unknown as Record<string, unknown>),
    customer_id: userId,
    status: 'new',
  };

  const { error } = await client.from('vehicle_requests').insert(payload);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function adminFetchVehicleRequests(): Promise<VehicleRequest[]> {
  if (!isSupabaseConfigured) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('vehicle_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapVehicleRequest);
}

export async function adminSetVehicleRequestStatus(
  id: string,
  status: VehicleRequestStatus
): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client
    .from('vehicle_requests')
    .update({ status })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
