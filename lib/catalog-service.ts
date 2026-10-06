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
 * On seeds: when Supabase is unconfigured or the tables have not been migrated,
 * these functions return an empty list and the page renders an honest empty
 * state. Inventing providers, prices or emergency phone numbers is exactly what
 * this platform must never do.
 *
 * Two categories are the exception, and only because the alternative was an
 * undesignable page: `vehicle` and the `buy_sell` post kind fall back to the
 * sample rows in `lib/vehicle-demo-data.ts` / `lib/market-demo-data.ts`, but
 * ONLY while the live directory is completely empty — the first real listing
 * replaces them wholesale, so a sample item is never shown beside a real one.
 * Coaching, bus, wifi, job and news have no such fallback on purpose: a demo
 * coaching centre or a fake vacancy would be a fabricated local commercial fact.
 */
import { createClient, isSupabaseConfigured } from './supabase/client';
import { toCamelObject, toSnakeObject } from './supabase/transform';
import { DEMO_MARKET_POSTS, getDemoMarketPost } from './market-demo-data';
import { DEMO_VEHICLE_LISTINGS, getDemoVehicleListing } from './vehicle-demo-data';
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

/**
 * Columns a public (non-admin) reader is allowed to see.
 *
 * `contact_phone_private` is deliberately absent: it is admin-only at the RLS
 * layer AND omitted here, so the public path cannot reach it even if the policy
 * were ever relaxed. Note `photos`/`model_*` are vehicle-only columns that older
 * rows simply do not have — Supabase returns them as null and `mapListing` drops
 * them, so a pre-migration row still renders.
 */
const PUBLIC_LISTING_COLUMNS =
  'id, category, slug, title_bn, subtitle_bn, summary_bn, description_bn, image_url, logo_url, area_ids, tags, monthly_fee_min, monthly_fee_max, price_min, price_max, speed_mbps, fare_min, fare_max, origin_bn, destination_bn, seat_count, photos, model_name_bn, model_year, has_ac, driver_included, available_time_bn, price_note_bn, is_active, is_featured, created_at, updated_at';

/**
 * `author_name` is public — a buyer has to know who is selling. `author_phone`
 * and `whatsapp_number` are NOT here even though they are readable on an
 * approved row, because `community_posts` also backs news and job posts where a
 * number must never surface, and omitting a column from a PostgREST `select` is
 * a convention rather than a boundary. `fetchMarketContact` is the boundary.
 */
const PUBLIC_POST_COLUMNS =
  'id, kind, slug, author_id, author_name, title_bn, summary_bn, body_bn, cover_image_url, gallery, category, area_id, tags, salary_min, salary_max, price, job_type, deadline, condition_label, organization_bn, status, is_featured, published_at, created_at, updated_at';

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
    // --- vehicle only; absent on every other category and on pre-migration
    // rows, where they arrive as null and `optStr`/`optNum` drop them.
    photos: c.photos ? strArray(c.photos) : undefined,
    modelNameBn: optStr(c.modelNameBn),
    modelYear: optNum(c.modelYear),
    hasAc: typeof c.hasAc === 'boolean' ? c.hasAc : undefined,
    driverIncluded: typeof c.driverIncluded === 'boolean' ? c.driverIncluded : undefined,
    availableTimeBn: optStr(c.availableTimeBn),
    priceNoteBn: optStr(c.priceNoteBn),
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
    // Public on purpose: a marketplace buyer has to know who is selling. The
    // column did not exist when this table was first written, which is why
    // `PostDetail` used to print "সদস্য" for everyone.
    authorName: optStr(c.authorName),
    // Never mapped here even when the caller selected `*`. Reaching the number
    // goes through `fetchMarketContact`, which checks the row is an approved
    // marketplace item first. An admin edit path calls `mapPost` on a row that
    // already carries the number; leaving it unmapped is deliberate — the admin
    // UI reads it from the admin listing column list instead.
    authorPhone: undefined,
    whatsappNumber: undefined,
    titleBn: str(c.titleBn),
    summaryBn: optStr(c.summaryBn),
    bodyBn: optStr(c.bodyBn),
    coverImageUrl: optStr(c.coverImageUrl),
    gallery: c.gallery ? strArray(c.gallery) : undefined,
    category: optStr(c.category),
    areaId: optStr(c.areaId),
    tags: strArray(c.tags),
    salaryMin: optNum(c.salaryMin),
    salaryMax: optNum(c.salaryMax),
    price: optNum(c.price),
    jobType: optStr(c.jobType),
    deadline: optStr(c.deadline),
    conditionLabel: optStr(c.conditionLabel),
    // Author-only fields. `fetchMyPosts`/`fetchMyPostForEdit` select `*` so an
    // author always sees why a post was rejected; the public column list
    // deliberately omits `rejection_reason`, so it never reaches a stranger.
    rejectionReason: optStr(c.rejectionReason),
    organizationBn: optStr(c.organizationBn),
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
    passengerCount: optNum(c.passengerCount),
    tripDuration: optStr(c.tripDuration),
    budget: optNum(c.budget),
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

// ---------------------------------------------------------------------------
// Showcase fallback
// ---------------------------------------------------------------------------
//
// Mirrors the rule in `lib/tolet-service.ts`: a curated page with an empty table
// teaches you nothing about the design, but a fake listing presented as real is
// worse than an empty state. So the demo rows appear ONLY while the live
// directory is empty, they never mix with real inventory, and a deep link to a
// demo slug resolves in every mode so the page is always shareable.
//
// Only two categories get a showcase today — `vehicle` and the `buy_sell` post
// kind. Everything else stays empty on purpose: a demo coaching centre or a
// demo bus route would be inventing local commercial facts, whereas a demo
// phone for sale or a demo Toyota Axio is plainly a sample.

/** Demo rows are only worth showing for the categories that have them. */
function showcaseFor(category: ServiceCategory): ServiceListing[] {
  return category === 'vehicle' ? [...DEMO_VEHICLE_LISTINGS] : [];
}

function withListingShowcase(
  category: ServiceCategory,
  real: ServiceListing[]
): ServiceListing[] {
  return real.length > 0 ? real : showcaseFor(category);
}

/** Active listings for a public category page. */
export async function fetchServiceListings(
  category: ServiceCategory
): Promise<ServiceListing[]> {
  if (!isSupabaseConfigured) return withListingShowcase(category, []);
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('service_listings')
    .select(PUBLIC_LISTING_COLUMNS)
    .eq('category', category)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  // With Supabase configured the page shows real curated listings only; a
  // query error or an empty category is an honest empty state, not a sample.
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => mapListing(row, false));
}

/** A single listing by slug, public read (active only). */
export async function fetchServiceListingBySlug(
  category: ServiceCategory,
  slug: string
): Promise<ServiceListing | null> {
  if (!isSupabaseConfigured) {
    const demo = getDemoVehicleListing(slug);
    if (demo && demo.category === category) return demo;
    return null;
  }
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
  // Preview mode resolves the demo listing; on the configured site a demo has
  // no private number to release, so the page renders its request CTA instead.
  if (!isSupabaseConfigured) {
    const demo = getDemoVehicleListing(slug);
    if (demo && demo.category === category) return demo;
    return null;
  }
  const client = createClient();
  if (!client) return null;
  const isAdmin = await currentUserIsAdmin();
  if (!isAdmin) return fetchServiceListingBySlug(category, slug);

  // contact_phone_private is column-revoked; only the admin-gated
  // fn_admin_service_listing RPC may return it.
  const { data, error } = await client
    .rpc('fn_admin_service_listing', { p_category: category, p_slug: slug })
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
  const { data, error } = await client.rpc('fn_admin_service_listings', { p_category: category });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((row) => mapListing(row, true));
}

export async function adminCreateServiceListing(
  input: ServiceListingInput
): Promise<WriteResult<ServiceListing | undefined>> {
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
    .select('id, category, slug')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'সংরক্ষণ ব্যর্থ হয়েছে' };
  }
  // Re-read through the admin RPC so the created row (incl. its contact number)
  // returns complete — contact_phone_private is no longer an ordinary SELECT.
  const created = await client
    .rpc('fn_admin_service_listing', {
      p_category: (data as { category: string }).category,
      p_slug: (data as { slug: string }).slug,
    })
    .maybeSingle();
  if (!created.error && created.data) {
    return { success: true, data: mapListing(created.data as Record<string, unknown>, true) };
  }
  return { success: true, data: undefined };
}

export async function adminUpdateServiceListing(
  id: string,
  patch: Partial<ServiceListingInput>
): Promise<WriteResult<ServiceListing | undefined>> {
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
    .select('id, category, slug')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'আপডেট ব্যর্থ হয়েছে' };
  }
  // Re-read through the admin RPC for the same reason as create.
  const uid = data as { category: string; slug: string };
  const updated = await client
    .rpc('fn_admin_service_listing', { p_category: uid.category, p_slug: uid.slug })
    .maybeSingle();
  if (!updated.error && updated.data) {
    return { success: true, data: mapListing(updated.data as Record<string, unknown>, true) };
  }
  return { success: true, data: undefined };
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

/**
 * Approved posts of one kind, newest first.
 *
 * Only `buy_sell` has a showcase. News and jobs are local reporting and real
 * vacancies — inventing either would put a fabricated headline or a fake job in
 * front of a reader, so an empty table there stays genuinely empty.
 */
export async function fetchApprovedPosts(kind: PostKind): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) {
    return kind === 'buy_sell' ? [...DEMO_MARKET_POSTS] : [];
  }
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
  if (!isSupabaseConfigured) {
    const demo = getDemoMarketPost(slug);
    if (demo && demo.kind === kind) return demo;
    return null;
  }
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
 * Seller contact for an approved marketplace item — or `null` if there is none.
 *
 * Why an RPC instead of just reading `author_phone`:
 *
 * `community_posts` is one table serving three very different surfaces. A
 * marketplace buyer must be able to call the seller, but the same table stores
 * news articles and job ads, where the author's number must never appear. RLS
 * operates on rows, not columns, and PostgREST will happily serve `select=*`, so
 * "the public column list does not include it" is a habit rather than a
 * boundary — one careless `select('*')` anywhere in the codebase would leak it.
 *
 * `fetch_market_contact` moves the check server-side. It is `SECURITY DEFINER`,
 * so it can read a column the anon role cannot, and it returns nothing unless
 * the row is `kind = 'buy_sell'` and `status = 'approved'`. The grants are
 * `REVOKE ALL … FROM PUBLIC` plus explicit `anon, authenticated`, so the function
 * is not reachable by any future role that has not been thought about.
 *
 * It returns `null` — never a fabricated number — when the row is absent, the
 * post is still in moderation, the post is news or a job, or the function has
 * not been deployed yet (the migration has to be applied). Each of those is a
 * normal, expected state for the caller to handle, which is why this is a
 * nullable result rather than an error.
 */
export async function fetchMarketContact(
  slug: string
): Promise<{ authorName?: string; authorPhone?: string; whatsappNumber?: string } | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client.rpc('fetch_market_contact', { p_slug: slug });
  // `PGRST116` / an undefined function both mean the same thing to this caller:
  // there is no contact to show. Swallowing the error keeps the marketplace
  // working on a database that has not been migrated yet.
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const row = (data[0] as Record<string, unknown>) ?? {};
  const c = toCamelObject(row) as Record<string, unknown>;
  const authorPhone = optStr(c.authorPhone);
  const whatsappNumber = optStr(c.whatsappNumber);
  const authorName = optStr(c.authorName);
  // A row with no number in it is not a contact. Returning null here is what
  // makes the detail page show "number নেই" instead of a dead call button.
  if (!authorPhone && !whatsappNumber) return null;
  return { authorName, authorPhone, whatsappNumber };
}

/**
 * Files a report against a marketplace post.
 *
 * Separate from `createListingReport` in the tolet service because
 * `listing_reports` is FK-bound to `tolet_listings`; this writes to
 * `community_post_reports`, which cascades on delete so a report about a removed
 * post cannot sit unresolved in the moderation queue forever.
 *
 * Guests can report, and that is not an oversight: a fake listing is precisely
 * the case where the person who spotted it has no account. RLS allows the
 * INSERT for `anon` and creates no SELECT policy at all, so success is keyed on
 * the absence of an insert error rather than on re-reading the row — the same
 * reasoning as `createVehicleRequest`.
 */
export async function createCommunityPostReport(input: {
  postId: string;
  reporterId: string | null;
  reporterName: string;
  reason: string;
  details?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('community_post_reports').insert({
    post_id: input.postId,
    reporter_id: input.reporterId,
    reporter_name: input.reporterName.trim() || 'অতিথি',
    reason: input.reason,
    details: input.details?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
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
  // `fn_my_post_by_slug` is the author-only path (author_id = auth.uid()) and is
  // the only place a rejected post's rejection_reason can be read since the
  // column REVOKEs.
  const { data, error } = await client
    .rpc('fn_my_post_by_slug', { p_kind: kind, p_slug: slug })
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
    .rpc('fn_my_post_by_id', { p_id: id })
    .maybeSingle();
  if (error || !data) return null;
  const post = mapPost(data as Record<string, unknown>);
  // An already-approved post is not editable from the draft/edit screen.
  if (post.status === 'approved') return null;
  return post;
}

/** The signed-in author's own posts, any status. */
export async function fetchMyPosts(): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  const userId = await currentUserId();
  if (!userId) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client.rpc('fn_my_posts');
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

  // `rejectionReason` is stripped as well: only a moderator may write it, so
  // an author craftily sending one along must land on nothing.
  const {
    status: _ignoredStatus,
    isFeatured: _ignoredFeature,
    authorId: _ignoredAuthor,
    rejectionReason: _ignoredReason,
    ...rest
  } = input;

  const payload = {
    ...toSnakeObject(rest as Record<string, unknown>),
    author_id: userId,
    // Moderation is never client-controlled.
    status: 'pending',
  };

  const { data, error } = await client
    .from('community_posts')
    .insert(payload)
    .select(PUBLIC_POST_COLUMNS)
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

  const {
    status: _s,
    isFeatured: _f,
    authorId: _a,
    slug: _slug,
    rejectionReason: _r,
    ...rest
  } = patch;
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
    .select(PUBLIC_POST_COLUMNS)
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
  // `fn_admin_posts` is the only path that may read author_phone /
  // whatsapp_number / rejection_reason after the column REVOKEs.
  let q = client.rpc('fn_admin_posts');
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
