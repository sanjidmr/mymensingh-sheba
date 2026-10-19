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
 * The buy/sell marketplace may use sample rows only while its live directory
 * is empty. Vehicles always come from Supabase because a sample rental or fare
 * could mislead a customer into submitting a real booking request.
 */
import { createClient, isSupabaseConfigured } from './supabase/client';
import { requestAdminEmailAlert } from './admin-email-alerts';
import { toCamelObject, toSnakeObject } from './supabase/transform';
import { DEMO_MARKET_POSTS, getDemoMarketPost } from './market-demo-data';
import {
  JOB_TYPES,
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  NEWS_CATEGORIES,
} from './catalog-types';
import type {
  CoachingBatch,
  CoachingBatchInput,
  CoachingTeacher,
  CoachingTeacherInput,
  CommunityPost,
  CommunityPostInput,
  CustomerServiceCategory,
  CustomerServiceListingInput,
  DirectoryReview,
  DirectoryReviewCategory,
  DirectoryReviewInput,
  EmergencyContact,
  EmergencyContactInput,
  EmergencyService,
  MarketplaceStatus,
  PostKind,
  ServiceCategory,
  ServiceListing,
  ServiceListingInput,
  ServiceListingStatus,
  VehicleKind,
  VehicleRequest,
  VehicleRequestInput,
  VehicleRequestStatus,
  WifiPackage,
  WifiPackageInput,
} from './catalog-types';

const NOT_CONFIGURED =
  'সেবাটি এই মুহূর্তে চালু নেই। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
const NOT_ALLOWED = 'এই কাজটি করতে অ্যাডমিন অনুমতি প্রয়োজন।';
const NOT_SIGNED_IN = 'এই কাজটি করতে আগে লগইন করুন।';

function communityPostWriteError(
  input: Partial<CommunityPostInput> & { kind?: PostKind },
  requireComplete = false,
  existingCategory?: string | null
): string | null {
  if ((requireComplete || input.titleBn !== undefined) && !input.titleBn?.trim()) return 'শিরোনাম লিখুন।';
  if ((input.titleBn?.length ?? 0) > 120) return 'শিরোনাম ১২০ অক্ষরের মধ্যে লিখুন।';
  const category = input.category?.trim() ?? '';
  if (category.length > 100) return 'ক্যাটাগরি ১০০ অক্ষরের মধ্যে লিখুন।';
  if (input.kind === 'news') {
    if (category && !NEWS_CATEGORIES.some((item) => item.id === category) && category !== existingCategory) {
      return 'সংবাদের সঠিক বিভাগ বেছে নিন।';
    }
    if ((requireComplete || input.bodyBn !== undefined) && (input.bodyBn?.trim().length ?? 0) < 40) {
      return 'সংবাদের মূল বিষয়বস্তু কমপক্ষে ৪০ অক্ষরের হতে হবে।';
    }
  } else if (input.kind === 'job') {
    if ((requireComplete || input.category !== undefined) && !category) return 'চাকরির ক্যাটাগরি লিখুন।';
    if ((requireComplete || input.summaryBn !== undefined) && !input.summaryBn?.trim()) return 'চাকরির সংক্ষিপ্ত বিবরণ লিখুন।';
    if ((requireComplete || input.organizationBn !== undefined) && !input.organizationBn?.trim()) return 'প্রতিষ্ঠানের নাম লিখুন।';
    if ((requireComplete || input.jobType !== undefined) &&
      (!input.jobType || !JOB_TYPES.some((item) => item.id === input.jobType))) {
      return 'চাকরির ধরন বেছে নিন।';
    }
    if (input.salaryMin != null && (!Number.isSafeInteger(input.salaryMin) || input.salaryMin < 0)) {
      return 'সর্বনিম্ন বেতন শূন্য বা তার বেশি পূর্ণসংখ্যা হতে হবে।';
    }
    if (input.salaryMax != null && (!Number.isSafeInteger(input.salaryMax) || input.salaryMax < 0)) {
      return 'সর্বোচ্চ বেতন শূন্য বা তার বেশি পূর্ণসংখ্যা হতে হবে।';
    }
    if (requireComplete && input.salaryMin == null && input.salaryMax == null) {
      return 'বেতনের অন্তত একটি সীমা লিখুন।';
    }
    if (input.salaryMin != null && input.salaryMax != null && input.salaryMax < input.salaryMin) {
      return 'সর্বোচ্চ বেতন সর্বনিম্ন বেতনের চেয়ে কম হতে পারবে না।';
    }
  } else if (input.kind === 'buy_sell') {
    if ((requireComplete || input.category !== undefined) &&
      !MARKET_CATEGORIES.some((item) => item.id === category) &&
      category !== 'vehicle' && category !== existingCategory) {
      return 'তালিকা থেকে সঠিক পণ্যের ক্যাটাগরি বেছে নিন।';
    }
    if ((requireComplete || input.summaryBn !== undefined) && !input.summaryBn?.trim()) {
      return 'পণ্যের সংক্ষিপ্ত বিবরণ লিখুন।';
    }
    if ((requireComplete || input.price !== undefined) &&
      (input.price == null || !Number.isSafeInteger(input.price) || input.price < 0)) {
      return 'পণ্যের সঠিক দাম লিখুন।';
    }
    if ((requireComplete || input.conditionLabel !== undefined) &&
      (!input.conditionLabel || !MARKET_CONDITIONS.some((item) => item.id === input.conditionLabel))) {
      return 'পণ্যের অবস্থা বেছে নিন।';
    }
    if ((requireComplete || input.authorPhone !== undefined) &&
      !/^01[3-9]\d{8}$/.test(normalizeBdPhone(input.authorPhone ?? '') ?? '')) {
      return 'সঠিক বিক্রেতার মোবাইল নম্বর দিন।';
    }
    if (input.whatsappNumber &&
      !/^01[3-9]\d{8}$/.test(normalizeBdPhone(input.whatsappNumber) ?? '')) {
      return 'সঠিক হোয়াটসঅ্যাপ নম্বর দিন।';
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

/**
 * Columns a public (non-admin) reader is allowed to see.
 *
 * `contact_phone_private` is deliberately absent: it is admin-only at the RLS
 * layer AND omitted here, so the public path cannot reach it even if the policy
 * were ever relaxed. `photos`/`model_*` are vehicle-only and
 * `operator_bn`/`address_bn`/`rating_*` come from the directory-catalog
 * migration; `mapListing` drops a null with `optStr`/`optNum`, so a row that
 * leaves them unset still renders. NOTE: because this list is explicit, the
 * directory-catalog migration must be applied before this query runs — PostgREST
 * errors on an unknown column rather than ignoring it.
 *
 * `owner_id` and the customer-owned columns (`contact_phone_public`,
 * `admission_info_bn`, `admission_fee`, `connection_fee`, `terms_bn`) are public: the first is
 * how the detail page tells a member submission from an admin one, the rest are
 * exactly what the public card/detail must show. `status` is deliberately NOT
 * here — the public policy already guarantees `approved`, so the reader never
 * needs the field, and the owner path reads it through `fn_my_service_listings`.
 */
const PUBLIC_LISTING_COLUMNS =
  'id, category, slug, title_bn, subtitle_bn, summary_bn, description_bn, image_url, logo_url, area_ids, tags, monthly_fee_min, monthly_fee_max, price_min, price_max, speed_mbps, fare_min, fare_max, origin_bn, destination_bn, operator_bn, address_bn, rating_avg, rating_count, seat_count, photos, travel_days, stops_bn, journey_duration_bn, model_name_bn, model_year, has_ac, driver_included, driver_name_bn, available_time_bn, price_note_bn, rate_per_km, minimum_fare, additional_fee, additional_fee_note_bn, available_facilities, unavailable_facilities, owner_id, contact_phone_public, admission_info_bn, admission_fee, connection_fee, terms_bn, is_active, is_featured, created_at, updated_at';

/**
 * `author_name` is public — a buyer has to know who is selling. `author_phone`
 * and `whatsapp_number` are NOT here even though they are readable on an
 * approved row, because `community_posts` also backs news and job posts where a
 * number must never surface, and omitting a column from a PostgREST `select` is
 * a convention rather than a boundary. `fetchMarketContact` is the boundary.
 */
const PUBLIC_POST_COLUMNS =
  'id, kind, slug, author_id, author_name, title_bn, summary_bn, body_bn, cover_image_url, gallery, category, area_id, tags, salary_min, salary_max, price, job_type, deadline, condition_label, organization_bn, status, marketplace_status, is_featured, published_at, created_at, updated_at';

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

function isServiceListingStatus(v: unknown): v is ServiceListingStatus {
  return v === 'draft' || v === 'pending' || v === 'approved' || v === 'rejected';
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
    operatorBn: optStr(c.operatorBn),
    addressBn: optStr(c.addressBn),
    ratingAvg: optNum(c.ratingAvg),
    ratingCount: optNum(c.ratingCount),
    seatCount: optNum(c.seatCount),
    travelDays: strArray(c.travelDays),
    stops: strArray(c.stopsBn),
    journeyDurationBn: optStr(c.journeyDurationBn),
    // --- vehicle only; absent on every other category and on pre-migration
    // rows, where they arrive as null and `optStr`/`optNum` drop them.
    photos: c.photos ? strArray(c.photos) : undefined,
    modelNameBn: optStr(c.modelNameBn),
    modelYear: optNum(c.modelYear),
    hasAc: typeof c.hasAc === 'boolean' ? c.hasAc : undefined,
    driverIncluded: typeof c.driverIncluded === 'boolean' ? c.driverIncluded : undefined,
    driverNameBn: optStr(c.driverNameBn),
    availableTimeBn: optStr(c.availableTimeBn),
    priceNoteBn: optStr(c.priceNoteBn),
    ratePerKm: optNum(c.ratePerKm),
    minimumFare: optNum(c.minimumFare),
    additionalFee: optNum(c.additionalFee),
    additionalFeeNoteBn: optStr(c.additionalFeeNoteBn),
    availableFacilities: strArray(c.availableFacilities),
    unavailableFacilities: strArray(c.unavailableFacilities),
    // --- customer ownership + moderation ---------------------------------
    // `ownerId` is public (it drives the "provider-submitted" trust chip).
    // `status`/`rejectionReason`/`publishedAt` are owner-or-admin only: they are
    // absent from PUBLIC_LISTING_COLUMNS, so they simply arrive undefined on the
    // public path and `optStr` would drop them anyway.
    ownerId: optStr(c.ownerId),
    status: isServiceListingStatus(c.status) ? c.status : undefined,
    rejectionReason: optStr(c.rejectionReason),
    publishedAt: optStr(c.publishedAt),
    contactPhonePublic: optStr(c.contactPhonePublic),
    admissionInfoBn: optStr(c.admissionInfoBn),
    admissionFee: optNum(c.admissionFee),
    connectionFee: optNum(c.connectionFee),
    termsBn: optStr(c.termsBn),
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
    marketplaceStatus:
      c.marketplaceStatus === 'available' ||
      c.marketplaceStatus === 'sold' ||
      c.marketplaceStatus === 'closed'
        ? c.marketplaceStatus
        : undefined,
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
    estimatedDistanceKm: optNum(c.estimatedDistanceKm),
    distanceSource: c.distanceSource === 'road_route' || c.distanceSource === 'manual_estimate' ? c.distanceSource : undefined,
    ratePerKm: optNum(c.ratePerKm),
    minimumFare: optNum(c.minimumFare),
    estimatedFare: optNum(c.estimatedFare),
    additionalFee: optNum(c.additionalFee),
    additionalFeeNoteBn: optStr(c.additionalFeeNoteBn),
    assignedVehicleListingId: optStr(c.assignedVehicleListingId),
    assignedDriverName: optStr(c.assignedDriverName),
    assignedDriverPhone: optStr(c.assignedDriverPhone),
    adminNotes: optStr(c.adminNotes),
    status: (c.status as VehicleRequestStatus) || 'new',
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapTeacher(row: Record<string, unknown>): CoachingTeacher {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    listingId: str(c.listingId),
    nameBn: str(c.nameBn),
    subjects: strArray(c.subjects),
    qualificationBn: optStr(c.qualificationBn),
    experienceBn: optStr(c.experienceBn),
    sortOrder: optNum(c.sortOrder) ?? 0,
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapBatch(row: Record<string, unknown>): CoachingBatch {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    listingId: str(c.listingId),
    titleBn: str(c.titleBn),
    startDate: optStr(c.startDate),
    startTime: optStr(c.startTime),
    noteBn: optStr(c.noteBn),
    isActive: c.isActive !== false,
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapPackage(row: Record<string, unknown>): WifiPackage {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    listingId: str(c.listingId),
    nameBn: str(c.nameBn),
    speedMbps: optNum(c.speedMbps),
    price: optNum(c.price),
    offerLabelBn: optStr(c.offerLabelBn),
    offerConditionsBn: optStr(c.offerConditionsBn),
    connectionFee: optNum(c.connectionFee),
    offerExpiresOn: optStr(c.offerExpiresOn),
    isActive: c.isActive !== false,
    sortOrder: optNum(c.sortOrder) ?? 0,
    createdAt: str(c.createdAt),
    updatedAt: str(c.updatedAt),
  };
}

function mapReview(row: Record<string, unknown>): DirectoryReview {
  const c = toCamelObject(row) as Record<string, unknown>;
  return {
    id: str(c.id),
    category: c.category as DirectoryReviewCategory,
    listingId: str(c.listingId),
    authorId: str(c.authorId),
    authorName: optStr(c.authorName),
    rating: optNum(c.rating) ?? 0,
    commentBn: optStr(c.commentBn),
    isPublished: c.isPublished !== false,
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

export interface CommunityPostDraft {
  version: number;
  values: Record<string, string>;
  tags: string[];
  photos?: string[];
  savedAt: string;
}

export async function loadCommunityPostDraft(
  kind: PostKind
): Promise<WriteResult<{ draft: unknown; updatedAt: string | null }>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const { data, error } = await client
    .from('customer_post_drafts')
    .select('draft, updated_at')
    .eq('user_id', userId)
    .eq('kind', kind)
    .maybeSingle();
  if (error) return { success: false, error: error.message };
  return {
    success: true,
    data: { draft: data?.draft ?? null, updatedAt: data?.updated_at ?? null },
  };
}

export async function saveCommunityPostDraft(
  kind: PostKind,
  draft: CommunityPostDraft
): Promise<WriteResult<string>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const { data, error } = await client
    .from('customer_post_drafts')
    .upsert(
      { user_id: userId, kind, draft, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,kind' }
    )
    .select('updated_at')
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'জমা দেওয়া হয়নি হিসেবে সংরক্ষণ ব্যর্থ হয়েছে।' };
  }
  return { success: true, data: data.updated_at };
}

export async function deleteCommunityPostDraft(kind: PostKind): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const { error } = await client
    .from('customer_post_drafts')
    .delete()
    .eq('user_id', userId)
    .eq('kind', kind);
  return error ? { success: false, error: error.message } : { success: true, data: undefined };
}

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

/** Active listings for a public category page. */
export async function fetchServiceListings(
  category: ServiceCategory,
  strict = false,
): Promise<ServiceListing[]> {
  if (!isSupabaseConfigured) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const { data, error } = await client
    .from('service_listings')
    .select(PUBLIC_LISTING_COLUMNS)
    .eq('category', category)
    .eq('is_active', true)
    // Explicit, not just the RLS rule: an admin browsing the public directory
    // bypasses RLS and would otherwise see other members' pending rows.
    .eq('status', 'approved')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });
  // With Supabase configured the page shows real curated listings only; a
  // query error or an empty category is an honest empty state, not a sample.
  if (error || !data) {
    if (strict) throw new Error(error?.message ?? 'ডিরেক্টরি লোড করা যায়নি।');
    return [];
  }
  return (data as Record<string, unknown>[]).map((row) => mapListing(row, false));
}

/** A single listing by slug, public read (active only). */
export async function fetchServiceListingBySlug(
  category: ServiceCategory,
  slug: string
): Promise<ServiceListing | null> {
  if (!isSupabaseConfigured) {
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
    .eq('status', 'approved')
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
  if (!isSupabaseConfigured) {
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
// Customer-owned service listings (coaching + wifi)
// ---------------------------------------------------------------------------
//
// A signed-in member manages their own coaching centre / wifi provider here.
// Everything is owner-scoped: ownership is re-checked in SQL (the guard trigger
// + RLS), never trusted from the client. `status` is decided by moderation — a
// member can save a `draft` or send a row to `pending`, never to `approved`.

/** Columns the owner may read back after a write (no private contact column). */
const OWNER_LISTING_COLUMNS = `${PUBLIC_LISTING_COLUMNS}, status, rejection_reason, published_at`;

/** Labels used in the "which category" copy and notification text. */
const CUSTOMER_CATEGORY_LABEL: Record<CustomerServiceCategory, string> = {
  coaching: 'কোচিং সেন্টার',
  wifi: 'WiFi প্রদানকারী',
};

export function customerCategoryLabel(category: CustomerServiceCategory): string {
  return CUSTOMER_CATEGORY_LABEL[category];
}

/** The category page a customer-owned listing belongs to. */
export function customerCategoryRoute(category: CustomerServiceCategory): string {
  return category === 'coaching' ? '/coaching' : '/wifi';
}

/**
 * A URL-safe slug that never collides.
 *
 * Bengali titles do not transliterate cleanly, so the readable part is built
 * from any ASCII the title happens to contain and the uniqueness comes from a
 * short random suffix. The `(category, slug)` unique constraint plus this
 * suffix makes a collision effectively impossible for a manual post.
 */
function makeServiceSlug(category: CustomerServiceCategory, title: string): string {
  const readable = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${readable || category}-${suffix}`;
}

/**
 * Accepts the shapes people actually type ("01712-345678", "+8801712345678")
 * and returns the local 11-digit form, or null when it is not a valid BD mobile.
 */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  let local = digits;
  if (local.startsWith('880') && local.length === 13) local = `0${local.slice(3)}`;
  return /^01\d{9}$/.test(local) ? local : null;
}

function customerListingPayload(
  input: CustomerServiceListingInput
): Record<string, unknown> {
  return {
    category: input.category,
    title_bn: input.titleBn.trim(),
    subtitle_bn: input.subtitleBn?.trim() || null,
    summary_bn: input.summaryBn?.trim() || null,
    description_bn: input.descriptionBn?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    photos: input.photos ?? [],
    logo_url: input.logoUrl?.trim() || null,
    area_ids: input.areaIds ?? [],
    tags: input.tags ?? [],
    address_bn: input.addressBn?.trim() || null,
    contact_phone_public: input.contactPhonePublic?.trim() || null,
    monthly_fee_min: input.monthlyFeeMin ?? null,
    monthly_fee_max: input.monthlyFeeMax ?? null,
    admission_info_bn: input.admissionInfoBn?.trim() || null,
    admission_fee: input.admissionFee ?? null,
    price_min: input.priceMin ?? null,
    price_max: input.priceMax ?? null,
    speed_mbps: input.speedMbps ?? null,
    connection_fee: input.connectionFee ?? null,
    terms_bn: input.termsBn?.trim() || null,
  };
}

/**
 * Validation shared by create and edit. A draft only needs a title (the DB
 * requires one); a submission must also carry a reachable number and at least
 * one service area, since that is what a reader relies on.
 */
function validateCustomerListing(
  input: CustomerServiceListingInput,
  mode: 'draft' | 'submit'
): string | null {
  if (input.category !== 'coaching' && input.category !== 'wifi') return 'ক্যাটাগরি সঠিক নয়।';
  if (input.titleBn.trim().length < 2 || input.titleBn.trim().length > 160) return 'প্রতিষ্ঠানের নাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।';
  if ((input.subtitleBn?.length ?? 0) > 240 || (input.summaryBn?.length ?? 0) > 800 ||
      (input.descriptionBn?.length ?? 0) > 10_000 || (input.addressBn?.length ?? 0) > 400 ||
      (input.admissionInfoBn?.length ?? 0) > 2000 || (input.termsBn?.length ?? 0) > 2000) {
    return 'বিবরণ, ঠিকানা বা শর্ত অনুমোদিত অক্ষরসীমার মধ্যে লিখুন।';
  }
  if (!Array.isArray(input.areaIds) || input.areaIds.length > 100 ||
      input.areaIds.some((area) => typeof area !== 'string' || !area.trim() || area.length > 100)) {
    return 'এলাকার তালিকা সঠিক নয়।';
  }
  if (!Array.isArray(input.tags) || input.tags.length > 60 ||
      input.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 120)) {
    return 'বিষয়, ক্লাস বা সুবিধার তালিকা সঠিক নয়।';
  }
  const amounts = [input.monthlyFeeMin, input.monthlyFeeMax, input.admissionFee, input.priceMin, input.priceMax, input.connectionFee];
  if (amounts.some((amount) => amount !== undefined &&
      (!Number.isInteger(amount) || amount < 0 || amount > 100_000_000))) {
    return 'ফি ও মূল্য পূর্ণসংখ্যা এবং ০ থেকে ১০ কোটি টাকার মধ্যে হতে হবে।';
  }
  if (input.monthlyFeeMin != null && input.monthlyFeeMax != null && input.monthlyFeeMax < input.monthlyFeeMin) return 'সর্বোচ্চ মাসিক ফি সর্বনিম্ন ফির চেয়ে কম হতে পারে না।';
  if (input.priceMin != null && input.priceMax != null && input.priceMax < input.priceMin) return 'সর্বোচ্চ মূল্য সর্বনিম্ন মূল্যের চেয়ে কম হতে পারে না।';
  if (input.speedMbps !== undefined && (!Number.isInteger(input.speedMbps) || input.speedMbps < 1 || input.speedMbps > 100_000)) return 'স্পিড ১ থেকে ১,০০,০০০ Mbps-এর মধ্যে পূর্ণসংখ্যা হতে হবে।';
  if ((input.photos?.length ?? 0) > 5 || (input.photos ?? []).some((url) =>
    typeof url !== 'string' || url.length > 2000 || !(url.startsWith('/') || /^https:\/\//i.test(url))
  )) return 'সর্বোচ্চ ৫টি সঠিক HTTPS বা সাইটের ছবি যোগ করুন।';
  if (mode === 'submit') {
    if (!normalizeBdPhone(input.contactPhonePublic ?? '')) {
      return 'সঠিক ১১-ডিজিটের মোবাইল নম্বর লিখুন (যেমন ০১৭xxxxxxxx)।';
    }
    if (!input.addressBn?.trim()) return 'প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা লিখুন।';
    if (input.category === 'coaching' && input.monthlyFeeMin == null) return 'মাসিক ফি লিখুন।';
    if (input.category === 'coaching' && input.monthlyFeeMin !== input.monthlyFeeMax) {
      return 'একটি নির্দিষ্ট মাসিক ফি লিখুন।';
    }
  }
  return null;
}

/** The signed-in member's own service listings, any moderation state. */
export async function fetchMyServiceListings(strict = false): Promise<ServiceListing[]> {
  if (!isSupabaseConfigured) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const userId = await currentUserId();
  if (!userId) {
    if (strict) throw new Error(NOT_SIGNED_IN);
    return [];
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const { data, error } = await client.rpc('fn_my_service_listings');
  if (error || !Array.isArray(data)) {
    if (strict) throw new Error(error?.message || 'তালিকা লোড করা যায়নি।');
    return [];
  }
  return (data as Record<string, unknown>[]).map((row) => mapListing(row, false));
}

/** One of the signed-in member's own listings (draft/pending/rejected too). */
export async function fetchMyServiceListing(id: string): Promise<ServiceListing | null> {
  if (!isSupabaseConfigured || !isUuid(id)) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .rpc('fn_my_service_listing', { p_id: id })
    .maybeSingle();
  if (error) throw new Error(`তালিকার তথ্য লোড করা যায়নি: ${error.message}`);
  if (!data) return null;
  return mapListing(data as Record<string, unknown>, false);
}

export async function createCustomerServiceListing(
  input: CustomerServiceListingInput,
  mode: 'draft' | 'submit'
): Promise<WriteResult<ServiceListing | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const invalid = validateCustomerListing(input, mode);
  if (invalid) return { success: false, error: invalid };

  const payload = {
    ...customerListingPayload(input),
    slug: makeServiceSlug(input.category, input.titleBn),
    owner_id: userId,
    status: mode === 'draft' ? 'draft' : 'pending',
    is_active: true,
  };

  const { data, error } = await client
    .from('service_listings')
    .insert(payload)
    .select(OWNER_LISTING_COLUMNS)
    .single();
  if (error || !data) {
    return { success: false, error: error?.message || 'সংরক্ষণ ব্যর্থ হয়েছে।' };
  }
  return { success: true, data: mapListing(data as Record<string, unknown>, false) };
}

export async function updateCustomerServiceListing(
  id: string,
  input: CustomerServiceListingInput,
  mode: 'draft' | 'submit'
): Promise<WriteResult<ServiceListing | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const invalid = validateCustomerListing(input, mode);
  if (invalid) return { success: false, error: invalid };

  // `category` and `owner_id` are intentionally not written here: the guard
  // trigger pins the owner and a listing never changes category.
  const payload = {
    ...customerListingPayload(input),
    status: mode === 'draft' ? 'draft' : 'pending',
    updated_at: new Date().toISOString(),
  };
  delete (payload as Record<string, unknown>).category;
  delete (payload as Record<string, unknown>).owner_id;

  const { data, error } = await client
    .from('service_listings')
    .update(payload)
    .eq('id', id)
    .eq('owner_id', userId)
    .select(OWNER_LISTING_COLUMNS)
    .maybeSingle();
  if (error) return { success: false, error: error.message || 'আপডেট ব্যর্থ হয়েছে।' };
  if (!data) return { success: false, error: 'তালিকাটি পাওয়া যায়নি বা সম্পাদনার অনুমতি নেই।' };
  return { success: true, data: mapListing(data as Record<string, unknown>, false) };
}

export async function deleteCustomerServiceListing(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client
    .from('service_listings')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

const SERVICE_IMAGE_BUCKET = 'listings';
const SERVICE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Upload one cover image for a customer listing into the shared, public
 * `listings` bucket, namespaced by owner so one member cannot overwrite
 * another's file. Type and size are checked before sending.
 */
export async function uploadServiceListingImage(
  ownerId: string,
  file: File
): Promise<WriteResult<string>> {
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'শুধুমাত্র ছবি ফাইল দেওয়া যাবে।' };
  }
  if (file.size > SERVICE_IMAGE_MAX_BYTES) {
    return { success: false, error: 'ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।' };
  }
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${ownerId}/service-listings/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await client.storage.from(SERVICE_IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return { success: false, error: `ছবি আপলোড ব্যর্থ: ${error.message}` };
  const { data } = client.storage.from(SERVICE_IMAGE_BUCKET).getPublicUrl(path);
  return { success: true, data: data.publicUrl };
}

// --- owner: coaching teachers ---------------------------------------------

export async function fetchOwnCoachingTeachers(listingId: string, strict = false): Promise<CoachingTeacher[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) {
    if (strict) throw new Error(!isSupabaseConfigured ? NOT_CONFIGURED : 'তালিকাটি সঠিক নয়।');
    return [];
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const { data, error } = await client
    .from('coaching_teachers')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) {
    if (strict) throw new Error(error?.message ?? 'শিক্ষকের তালিকা লোড করা যায়নি।');
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapTeacher);
}

export async function createOwnCoachingTeacher(
  listingId: string,
  input: Omit<CoachingTeacherInput, 'listingId'>
): Promise<WriteResult<CoachingTeacher | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const name = input.nameBn.trim();
  if (name.length < 2 || name.length > 160) return { success: false, error: 'শিক্ষকের নাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।' };
  if (input.subjects.length > 30 || input.subjects.some((subject) => !subject.trim() || subject.length > 100)) return { success: false, error: 'শিক্ষকের বিষয়ের তালিকা সঠিক নয়।' };
  if ((input.qualificationBn?.length ?? 0) > 200 || (input.experienceBn?.length ?? 0) > 200) return { success: false, error: 'যোগ্যতা ও অভিজ্ঞতা সর্বোচ্চ ২০০ অক্ষরের মধ্যে লিখুন।' };
  const { data, error } = await client
    .from('coaching_teachers')
    .insert({
      listing_id: listingId,
      name_bn: name,
      subjects: input.subjects ?? [],
      qualification_bn: input.qualificationBn?.trim() || null,
      experience_bn: input.experienceBn?.trim() || null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
  const failed = dbWriteError(error, 'শিক্ষক সংরক্ষণ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  return { success: true, data: mapTeacher(data as Record<string, unknown>) };
}

export async function updateOwnCoachingTeacher(
  id: string,
  patch: TeacherPatch
): Promise<WriteResult<CoachingTeacher | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'শিক্ষকটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const payload: Record<string, unknown> = {};
  if (patch.nameBn !== undefined) {
    const name = patch.nameBn.trim();
    if (name.length < 2 || name.length > 160) return { success: false, error: 'শিক্ষকের নাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।' };
    payload.name_bn = name;
  }
  if (patch.subjects !== undefined) {
    if (patch.subjects.length > 30 || patch.subjects.some((subject) => !subject.trim() || subject.length > 100)) return { success: false, error: 'শিক্ষকের বিষয়ের তালিকা সঠিক নয়।' };
    payload.subjects = patch.subjects;
  }
  if (patch.qualificationBn !== undefined) {
    if ((patch.qualificationBn?.length ?? 0) > 200) return { success: false, error: 'যোগ্যতা সর্বোচ্চ ২০০ অক্ষরের মধ্যে লিখুন।' };
    payload.qualification_bn = patch.qualificationBn?.trim() || null;
  }
  if (patch.experienceBn !== undefined) {
    if ((patch.experienceBn?.length ?? 0) > 200) return { success: false, error: 'অভিজ্ঞতা সর্বোচ্চ ২০০ অক্ষরের মধ্যে লিখুন।' };
    payload.experience_bn = patch.experienceBn?.trim() || null;
  }
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { data, error } = await client
    .from('coaching_teachers')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  const failed = dbWriteError(error, 'শিক্ষকের তথ্য হালনাগাদ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  if (!data) return { success: true, data: undefined };
  return { success: true, data: mapTeacher(data as Record<string, unknown>) };
}

export async function deleteOwnCoachingTeacher(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'শিক্ষকটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('coaching_teachers').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// --- owner: coaching batches ----------------------------------------------

export async function fetchOwnCoachingBatches(listingId: string, strict = false): Promise<CoachingBatch[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) {
    if (strict) throw new Error(!isSupabaseConfigured ? NOT_CONFIGURED : 'তালিকাটি সঠিক নয়।');
    return [];
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const { data, error } = await client
    .from('coaching_batches')
    .select('*')
    .eq('listing_id', listingId)
    .order('start_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error || !data) {
    if (strict) throw new Error(error?.message ?? 'ব্যাচের তালিকা লোড করা যায়নি।');
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapBatch);
}

export async function createOwnCoachingBatch(
  listingId: string,
  input: Omit<CoachingBatchInput, 'listingId'>
): Promise<WriteResult<CoachingBatch | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const title = input.titleBn.trim();
  if (title.length < 2 || title.length > 160) return { success: false, error: 'ব্যাচের নাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।' };
  if ((input.noteBn?.length ?? 0) > 1000 || (input.startTime?.length ?? 0) > 80) return { success: false, error: 'ব্যাচের নোট বা সময়ের দৈর্ঘ্য অনুমোদিত সীমা ছাড়িয়েছে।' };
  const { data, error } = await client
    .from('coaching_batches')
    .insert({
      listing_id: listingId,
      title_bn: title,
      start_date: input.startDate?.trim() || null,
      start_time: input.startTime?.trim() || null,
      note_bn: input.noteBn?.trim() || null,
      is_active: input.isActive !== false,
    })
    .select('*')
    .single();
  const failed = dbWriteError(error, 'ব্যাচ সংরক্ষণ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  return { success: true, data: mapBatch(data as Record<string, unknown>) };
}

export async function updateOwnCoachingBatch(
  id: string,
  patch: BatchPatch
): Promise<WriteResult<CoachingBatch | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'ব্যাচটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const payload: Record<string, unknown> = {};
  if (patch.titleBn !== undefined) {
    const title = patch.titleBn.trim();
    if (title.length < 2 || title.length > 160) return { success: false, error: 'ব্যাচের নাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।' };
    payload.title_bn = title;
  }
  if (patch.startDate !== undefined) payload.start_date = patch.startDate?.trim() || null;
  if (patch.startTime !== undefined) payload.start_time = patch.startTime?.trim() || null;
  if (patch.noteBn !== undefined) {
    if ((patch.noteBn?.length ?? 0) > 1000) return { success: false, error: 'ব্যাচের নোট সর্বোচ্চ ১০০০ অক্ষরের মধ্যে লিখুন।' };
    payload.note_bn = patch.noteBn?.trim() || null;
  }
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;
  const { data, error } = await client
    .from('coaching_batches')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  const failed = dbWriteError(error, 'ব্যাচ হালনাগাদ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  if (!data) return { success: true, data: undefined };
  return { success: true, data: mapBatch(data as Record<string, unknown>) };
}

export async function deleteOwnCoachingBatch(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'ব্যাচটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('coaching_batches').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// --- owner: wifi packages --------------------------------------------------

export async function fetchOwnWifiPackages(listingId: string, strict = false): Promise<WifiPackage[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) {
    if (strict) throw new Error(!isSupabaseConfigured ? NOT_CONFIGURED : 'তালিকাটি সঠিক নয়।');
    return [];
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const { data, error } = await client
    .from('wifi_packages')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) {
    if (strict) throw new Error(error?.message ?? 'WiFi প্যাকেজ লোড করা যায়নি।');
    return [];
  }
  return (data as Record<string, unknown>[]).map(mapPackage);
}

export async function saveOwnWifiPricingPackages(
  listingId: string,
  packages: { id?: string; speedMbps: number; price: number }[]
): Promise<WriteResult<WifiPackage[]>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  if (packages.length > 30 || packages.some((item) =>
    (item.id !== undefined && !isUuid(item.id)) ||
    !Number.isInteger(item.speedMbps) || item.speedMbps < 1 || item.speedMbps > 100_000 ||
    !Number.isInteger(item.price) || item.price < 0 || item.price > 100_000_000
  )) {
    return { success: false, error: 'প্রতিটি প্যাকেজে ১–১,০০,০০০ Mbps স্পিড ও ০–১০ কোটি টাকার বৈধ পূর্ণসংখ্যা দিন।' };
  }
  if (new Set(packages.flatMap((item) => item.id ? [item.id] : [])).size !== packages.filter((item) => item.id).length) {
    return { success: false, error: 'একই WiFi প্যাকেজ একাধিকবার নির্বাচন করা হয়েছে।' };
  }

  const { data, error } = await client.rpc('fn_save_my_wifi_pricing_packages', {
    p_listing_id: listingId,
    p_packages: packages,
  });
  if (error || !Array.isArray(data)) {
    return { success: false, error: error?.message || 'WiFi প্যাকেজ সংরক্ষণ ব্যর্থ হয়েছে।' };
  }
  return { success: true, data: (data as Record<string, unknown>[]).map(mapPackage) };
}

export async function createOwnWifiPackage(
  listingId: string,
  input: Omit<WifiPackageInput, 'listingId'>
): Promise<WriteResult<WifiPackage | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const name = input.nameBn.trim();
  const invalid = validateWifiPackageInput(input);
  if (invalid) return { success: false, error: invalid };
  const { data, error } = await client
    .from('wifi_packages')
    .insert({
      listing_id: listingId,
      name_bn: name,
      speed_mbps: input.speedMbps ?? null,
      price: input.price ?? null,
      offer_label_bn: input.offerLabelBn?.trim() || null,
      offer_conditions_bn: input.offerConditionsBn?.trim() || null,
      connection_fee: input.connectionFee ?? null,
      offer_expires_on: input.offerExpiresOn?.trim() || null,
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
  const failed = dbWriteError(error, 'প্যাকেজ সংরক্ষণ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  return { success: true, data: mapPackage(data as Record<string, unknown>) };
}

export async function updateOwnWifiPackage(
  id: string,
  patch: PackagePatch
): Promise<WriteResult<WifiPackage | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'প্যাকেজটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const invalid = validateWifiPackageInput(patch);
  if (invalid) return { success: false, error: invalid };
  const payload: Record<string, unknown> = {};
  if (patch.nameBn !== undefined) {
    const name = patch.nameBn.trim();
    if (name.length < 2) return { success: false, error: 'প্যাকেজের নাম লিখুন।' };
    payload.name_bn = name;
  }
  if (patch.speedMbps !== undefined) {
    if (patch.speedMbps != null && patch.speedMbps <= 0) {
      return { success: false, error: 'স্পিড শূন্যের বেশি হতে হবে।' };
    }
    payload.speed_mbps = patch.speedMbps;
  }
  if (patch.price !== undefined) {
    if (patch.price != null && patch.price < 0) {
      return { success: false, error: 'দাম ঋণাত্মক হতে পারে না।' };
    }
    payload.price = patch.price;
  }
  if (patch.offerLabelBn !== undefined) payload.offer_label_bn = patch.offerLabelBn?.trim() || null;
  if (patch.offerConditionsBn !== undefined)
    payload.offer_conditions_bn = patch.offerConditionsBn?.trim() || null;
  if (patch.connectionFee !== undefined) {
    if (patch.connectionFee != null && patch.connectionFee < 0) {
      return { success: false, error: 'সংযোগ ফি ঋণাত্মক হতে পারে না।' };
    }
    payload.connection_fee = patch.connectionFee;
  }
  if (patch.offerExpiresOn !== undefined)
    payload.offer_expires_on = patch.offerExpiresOn?.trim() || null;
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { data, error } = await client
    .from('wifi_packages')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  const failed = dbWriteError(error, 'প্যাকেজ হালনাগাদ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  if (!data) return { success: true, data: undefined };
  return { success: true, data: mapPackage(data as Record<string, unknown>) };
}

export async function deleteOwnWifiPackage(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'প্যাকেজটি সঠিক নয়।' };
  if (!(await currentUserId())) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('wifi_packages').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Directory sub-entities: coaching teachers / batches, wifi packages
// ---------------------------------------------------------------------------
//
// Public reads resolve only what a published parent may show (RLS gates the
// parent + the row's own `is_active`). Admin reads/writes are guarded here AND
// by RLS, matching every other write path in this module.

const PUBLIC_TEACHER_COLUMNS =
  'id, listing_id, name_bn, subjects, qualification_bn, experience_bn, sort_order, created_at, updated_at';
const PUBLIC_BATCH_COLUMNS =
  'id, listing_id, title_bn, start_date, start_time, note_bn, is_active, created_at, updated_at';
const PUBLIC_PACKAGE_COLUMNS =
  'id, listing_id, name_bn, speed_mbps, price, offer_label_bn, offer_conditions_bn, connection_fee, offer_expires_on, is_active, sort_order, created_at, updated_at';
const REVIEW_COLUMNS =
  'id, category, listing_id, author_id, rating, comment_bn, is_published, created_at, updated_at';

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function fetchCoachingTeachers(listingId: string): Promise<CoachingTeacher[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('coaching_teachers')
    .select(PUBLIC_TEACHER_COLUMNS)
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTeacher);
}

export async function fetchCoachingBatches(listingId: string): Promise<CoachingBatch[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('coaching_batches')
    .select(PUBLIC_BATCH_COLUMNS)
    .eq('listing_id', listingId)
    .eq('is_active', true)
    .order('start_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapBatch);
}

export async function fetchWifiPackagesForListings(
  listingIds: string[],
  strict = false
): Promise<Record<string, WifiPackage[]>> {
  const result: Record<string, WifiPackage[]> = {};
  const ids = Array.from(new Set(listingIds));
  if (ids.length === 0) return result;
  if (!isSupabaseConfigured) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return result;
  }
  if (ids.some((id) => !isUuid(id))) {
    if (strict) throw new Error('WiFi তালিকার আইডি সঠিক নয়।');
    return result;
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return result;
  }
  let offset = 0;
  while (true) {
    const { data, error } = await client
      .from('wifi_packages')
      .select(PUBLIC_PACKAGE_COLUMNS)
      .in('listing_id', ids)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .range(offset, offset + 999);
    if (error || !data) {
      if (strict) throw new Error(error?.message ?? 'WiFi প্যাকেজ লোড করা যায়নি।');
      return {};
    }
    for (const row of data as Record<string, unknown>[]) {
      const item = mapPackage(row);
      (result[item.listingId] ??= []).push(item);
    }
    if (data.length < 1000) break;
    offset += data.length;
  }
  return result;
}

export async function fetchWifiPackages(listingId: string): Promise<WifiPackage[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('wifi_packages')
    .select(PUBLIC_PACKAGE_COLUMNS)
    .eq('listing_id', listingId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPackage);
}

/**
 * Published reviews for a listing, newest first.
 *
 * Deliberately does NOT read `profiles` for the author name: an anonymous
 * visitor has no business seeing who wrote a review in a small town, so cards
 * render a neutral label and the caller matches its own rows by `authorId`.
 */
export async function fetchDirectoryReviews(
  category: DirectoryReviewCategory,
  listingId: string
): Promise<DirectoryReview[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('directory_reviews')
    .select(REVIEW_COLUMNS)
    .eq('category', category)
    .eq('listing_id', listingId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapReview);
}

/** The signed-in member's own review for a listing, or null. */
export async function fetchMyDirectoryReview(
  category: DirectoryReviewCategory,
  listingId: string
): Promise<DirectoryReview | null> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const client = createClient();
  if (!client) return null;
  const { data, error } = await client
    .from('directory_reviews')
    .select(REVIEW_COLUMNS)
    .eq('category', category)
    .eq('listing_id', listingId)
    .eq('author_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapReview(data as Record<string, unknown>);
}

const MAX_COMMENT_CHARS = 2000;

function validateReviewInput(input: DirectoryReviewInput): string | null {
  if (input.category !== 'coaching' && input.category !== 'wifi') {
    return 'রিভিউর ক্যাটাগরি সঠিক নয়।';
  }
  if (!isUuid(input.listingId)) return 'তালিকাটি সঠিক নয়।';
  const rating = Number(input.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'রেটিং ১ থেকে ৫-এর মধ্যে হতে হবে।';
  }
  const comment = (input.commentBn ?? '').trim();
  if (comment.length > MAX_COMMENT_CHARS) {
    return `মন্তব্য সর্বোচ্চ ${MAX_COMMENT_CHARS} অক্ষরের মধ্যে লিখুন।`;
  }
  return null;
}

/**
 * Submit a star rating (and optional written review) as the signed-in member.
 *
 * Auth, authorship and immediate publication are enforced by RLS + the
 * `guard_directory_review` trigger; the unique constraint means a second review
 * for the same listing comes back as a real database error the UI can explain
 * rather than as a silent duplicate.
 */
export async function submitDirectoryReview(
  input: DirectoryReviewInput
): Promise<WriteResult<DirectoryReview>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const invalid = validateReviewInput(input);
  if (invalid) return { success: false, error: invalid };

  const { data, error } = await client
    .from('directory_reviews')
    .insert({
      category: input.category,
      listing_id: input.listingId,
      author_id: userId,
      rating: Number(input.rating),
      comment_bn: (input.commentBn ?? '').trim() || null,
    })
    .select(REVIEW_COLUMNS)
    .single();
  if (error || !data) {
    const message = error?.message ?? 'রিভিউ সংরক্ষণ ব্যর্থ হয়েছে।';
    const duplicate =
      /duplicate|unique constraint/i.test(message) ||
      message.includes('directory_reviews_one_per_author');
    return {
      success: false,
      error: duplicate
        ? 'আপনি ইতিমধ্যে এই তালিকার জন্য রিভিউ দিয়েছেন। সেটি হালনাগাদ করতে পারেন।'
        : message,
    };
  }
  return { success: true, data: mapReview(data as Record<string, unknown>) };
}

/** Edit your own rating/comment. Authorship and publication are pinned server-side. */
export async function updateMyDirectoryReview(
  id: string,
  rating: number,
  commentBn?: string
): Promise<WriteResult<DirectoryReview>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'রিভিউটি সঠিক নয়।' };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) {
    return { success: false, error: 'রেটিং ১ থেকে ৫-এর মধ্যে হতে হবে।' };
  }
  const comment = (commentBn ?? '').trim();
  if (comment.length > MAX_COMMENT_CHARS) {
    return { success: false, error: `মন্তব্য সর্বোচ্চ ${MAX_COMMENT_CHARS} অক্ষরের মধ্যে লিখুন।` };
  }

  const { data, error } = await client
    .from('directory_reviews')
    .update({ rating: r, comment_bn: comment || null })
    .eq('id', id)
    .eq('author_id', userId)
    .select(REVIEW_COLUMNS)
    .maybeSingle();
  if (error || !data) {
    return { success: false, error: error?.message ?? 'রিভিউ হালনাগাদ ব্যর্থ হয়েছে (অথবা এটি আপনার নয়)।' };
  }
  return { success: true, data: mapReview(data as Record<string, unknown>) };
}

export async function deleteMyDirectoryReview(id: string): Promise<AckResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'রিভিউটি সঠিক নয়।' };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client
    .from('directory_reviews')
    .delete()
    .eq('id', id)
    .eq('author_id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// --- admin: sub-entity management ---

export async function adminFetchCoachingTeachers(listingId: string): Promise<CoachingTeacher[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('coaching_teachers')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapTeacher);
}

export async function adminFetchCoachingBatches(listingId: string): Promise<CoachingBatch[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('coaching_batches')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapBatch);
}

export async function adminFetchWifiPackages(listingId: string): Promise<WifiPackage[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];
  const { data, error } = await client
    .from('wifi_packages')
    .select('*')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapPackage);
}

/**
 * Every review for a listing (published or not) with the author's name.
 *
 * Admin-only, which is why the author name is safe to resolve here: it is never
 * part of a public read path.
 */
export async function adminFetchDirectoryReviews(
  listingId: string
): Promise<(DirectoryReview & { listingTitleBn?: string })[]> {
  if (!isSupabaseConfigured || !isUuid(listingId)) return [];
  if (!(await currentUserIsAdmin())) return [];
  const client = createClient();
  if (!client) return [];

  const [reviewsRes, listingRes] = await Promise.all([
    client
      .from('directory_reviews')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false }),
    client.from('service_listings').select('title_bn').eq('id', listingId).maybeSingle(),
  ]);
  if (reviewsRes.error || !reviewsRes.data) return [];

  const rows = (reviewsRes.data as Record<string, unknown>[]).map(mapReview);
  const authorIds = Array.from(new Set(rows.map((r) => r.authorId).filter(Boolean)));
  const names = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles } = await client
      .from('profiles')
      .select('id, full_name')
      .in('id', authorIds);
    for (const row of (profiles ?? []) as Record<string, unknown>[]) {
      if (typeof row.id === 'string' && typeof row.full_name === 'string') {
        names.set(row.id, row.full_name);
      }
    }
  }
  const listingTitleBn =
    typeof listingRes.data?.title_bn === 'string' ? listingRes.data.title_bn : undefined;
  return rows.map((r) => ({
    ...r,
    authorName: names.get(r.authorId),
    listingTitleBn,
  }));
}

type TeacherPatch = {
  nameBn?: string;
  subjects?: string[];
  qualificationBn?: string | null;
  experienceBn?: string | null;
  sortOrder?: number;
};
type BatchPatch = {
  titleBn?: string;
  startDate?: string | null;
  startTime?: string | null;
  noteBn?: string | null;
  isActive?: boolean;
};
type PackagePatch = {
  nameBn?: string;
  speedMbps?: number | null;
  price?: number | null;
  offerLabelBn?: string | null;
  offerConditionsBn?: string | null;
  connectionFee?: number | null;
  offerExpiresOn?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

function validateWifiPackageInput(input: PackagePatch | WifiPackageInput): string | null {
  if ('nameBn' in input && input.nameBn !== undefined) {
    const name = input.nameBn.trim();
    if (name.length < 2 || name.length > 160) return 'প্যাকেজের নাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।';
  }
  if (input.speedMbps != null && (!Number.isInteger(input.speedMbps) || input.speedMbps < 1 || input.speedMbps > 100_000)) {
    return 'স্পিড ১ থেকে ১,০০,০০০ Mbps-এর মধ্যে পূর্ণসংখ্যা হতে হবে।';
  }
  for (const amount of [input.price, input.connectionFee]) {
    if (amount != null && (!Number.isInteger(amount) || amount < 0 || amount > 100_000_000)) {
      return 'মূল্য ও সংযোগ ফি ০ থেকে ১০ কোটি টাকার পূর্ণসংখ্যা হতে হবে।';
    }
  }
  if ((input.offerLabelBn?.length ?? 0) > 240 || (input.offerConditionsBn?.length ?? 0) > 1000) {
    return 'অফার ও শর্তের লেখা অনুমোদিত অক্ষরসীমার মধ্যে লিখুন।';
  }
  if (input.offerExpiresOn) {
    const date = new Date(`${input.offerExpiresOn}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.offerExpiresOn) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.offerExpiresOn) {
      return 'অফারের শেষ তারিখ সঠিক নয়।';
    }
  }
  if (input.sortOrder != null && (!Number.isInteger(input.sortOrder) || input.sortOrder < 0 || input.sortOrder > 10_000)) {
    return 'প্যাকেজের ক্রম ০ থেকে ১০,০০০-এর মধ্যে পূর্ণসংখ্যা হতে হবে।';
  }
  return null;
}

function dbWriteError(error: { message: string } | null, fallback: string) {
  return error ? { success: false as const, error: error.message || fallback } : null;
}

export async function adminCreateCoachingTeacher(
  listingId: string,
  input: Omit<CoachingTeacherInput, 'listingId'>
): Promise<WriteResult<CoachingTeacher | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const name = input.nameBn.trim();
  if (name.length < 2) return { success: false, error: 'শিক্ষকের নাম লিখুন।' };
  const { data, error } = await client
    .from('coaching_teachers')
    .insert({
      listing_id: listingId,
      name_bn: name,
      subjects: input.subjects ?? [],
      qualification_bn: input.qualificationBn?.trim() || null,
      experience_bn: input.experienceBn?.trim() || null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
  const failed = dbWriteError(error, 'শিক্ষক সংরক্ষণ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  return { success: true, data: mapTeacher(data as Record<string, unknown>) };
}

export async function adminUpdateCoachingTeacher(
  id: string,
  patch: TeacherPatch
): Promise<WriteResult<CoachingTeacher | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'শিক্ষকটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const payload: Record<string, unknown> = {};
  if (patch.nameBn !== undefined) {
    const name = patch.nameBn.trim();
    if (name.length < 2) return { success: false, error: 'শিক্ষকের নাম লিখুন।' };
    payload.name_bn = name;
  }
  if (patch.subjects !== undefined) payload.subjects = patch.subjects;
  if (patch.qualificationBn !== undefined) payload.qualification_bn = patch.qualificationBn?.trim() || null;
  if (patch.experienceBn !== undefined) payload.experience_bn = patch.experienceBn?.trim() || null;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { data, error } = await client
    .from('coaching_teachers')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  const failed = dbWriteError(error, 'শিক্ষক হালনাগাদ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  if (!data) return { success: true, data: undefined };
  return { success: true, data: mapTeacher(data as Record<string, unknown>) };
}

export async function adminDeleteCoachingTeacher(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'শিক্ষকটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('coaching_teachers').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function adminCreateCoachingBatch(
  listingId: string,
  input: Omit<CoachingBatchInput, 'listingId'>
): Promise<WriteResult<CoachingBatch | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const title = input.titleBn.trim();
  if (title.length < 2) return { success: false, error: 'ব্যাচের নাম লিখুন।' };
  const { data, error } = await client
    .from('coaching_batches')
    .insert({
      listing_id: listingId,
      title_bn: title,
      start_date: input.startDate?.trim() || null,
      start_time: input.startTime?.trim() || null,
      note_bn: input.noteBn?.trim() || null,
      is_active: input.isActive !== false,
    })
    .select('*')
    .single();
  const failed = dbWriteError(error, 'ব্যাচ সংরক্ষণ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  return { success: true, data: mapBatch(data as Record<string, unknown>) };
}

export async function adminUpdateCoachingBatch(
  id: string,
  patch: BatchPatch
): Promise<WriteResult<CoachingBatch | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'ব্যাচটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const payload: Record<string, unknown> = {};
  if (patch.titleBn !== undefined) {
    const title = patch.titleBn.trim();
    if (title.length < 2) return { success: false, error: 'ব্যাচের নাম লিখুন।' };
    payload.title_bn = title;
  }
  if (patch.startDate !== undefined) payload.start_date = patch.startDate?.trim() || null;
  if (patch.startTime !== undefined) payload.start_time = patch.startTime?.trim() || null;
  if (patch.noteBn !== undefined) payload.note_bn = patch.noteBn?.trim() || null;
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;
  const { data, error } = await client
    .from('coaching_batches')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  const failed = dbWriteError(error, 'ব্যাচ হালনাগাদ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  if (!data) return { success: true, data: undefined };
  return { success: true, data: mapBatch(data as Record<string, unknown>) };
}

export async function adminDeleteCoachingBatch(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'ব্যাচটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('coaching_batches').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function adminCreateWifiPackage(
  listingId: string,
  input: Omit<WifiPackageInput, 'listingId'>
): Promise<WriteResult<WifiPackage | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(listingId)) return { success: false, error: 'তালিকাটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const name = input.nameBn.trim();
  if (name.length < 2) return { success: false, error: 'প্যাকেজের নাম লিখুন।' };
  if (input.speedMbps != null && input.speedMbps <= 0) {
    return { success: false, error: 'স্পিড শূন্যের বেশি হতে হবে।' };
  }
  if (input.price != null && input.price < 0) {
    return { success: false, error: 'দাম ঋণাত্মক হতে পারে না।' };
  }
  const { data, error } = await client
    .from('wifi_packages')
    .insert({
      listing_id: listingId,
      name_bn: name,
      speed_mbps: input.speedMbps ?? null,
      price: input.price ?? null,
      offer_label_bn: input.offerLabelBn?.trim() || null,
      offer_conditions_bn: input.offerConditionsBn?.trim() || null,
      connection_fee: input.connectionFee ?? null,
      offer_expires_on: input.offerExpiresOn?.trim() || null,
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single();
  const failed = dbWriteError(error, 'প্যাকেজ সংরক্ষণ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  return { success: true, data: mapPackage(data as Record<string, unknown>) };
}

export async function adminUpdateWifiPackage(
  id: string,
  patch: PackagePatch
): Promise<WriteResult<WifiPackage | undefined>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'প্যাকেজটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const payload: Record<string, unknown> = {};
  if (patch.nameBn !== undefined) {
    const name = patch.nameBn.trim();
    if (name.length < 2) return { success: false, error: 'প্যাকেজের নাম লিখুন।' };
    payload.name_bn = name;
  }
  if (patch.speedMbps !== undefined) {
    if (patch.speedMbps != null && patch.speedMbps <= 0) {
      return { success: false, error: 'স্পিড শূন্যের বেশি হতে হবে।' };
    }
    payload.speed_mbps = patch.speedMbps;
  }
  if (patch.price !== undefined) {
    if (patch.price != null && patch.price < 0) {
      return { success: false, error: 'দাম ঋণাত্মক হতে পারে না।' };
    }
    payload.price = patch.price;
  }
  if (patch.offerLabelBn !== undefined) payload.offer_label_bn = patch.offerLabelBn?.trim() || null;
  if (patch.offerConditionsBn !== undefined)
    payload.offer_conditions_bn = patch.offerConditionsBn?.trim() || null;
  if (patch.connectionFee !== undefined) {
    if (patch.connectionFee != null && patch.connectionFee < 0) {
      return { success: false, error: 'সংযোগ ফি ঋণাত্মক হতে পারে না।' };
    }
    payload.connection_fee = patch.connectionFee;
  }
  if (patch.offerExpiresOn !== undefined)
    payload.offer_expires_on = patch.offerExpiresOn?.trim() || null;
  if (patch.isActive !== undefined) payload.is_active = patch.isActive;
  if (patch.sortOrder !== undefined) payload.sort_order = patch.sortOrder;
  const { data, error } = await client
    .from('wifi_packages')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  const failed = dbWriteError(error, 'প্যাকেজ হালনাগাদ ব্যর্থ হয়েছে।');
  if (failed) return failed;
  if (!data) return { success: true, data: undefined };
  return { success: true, data: mapPackage(data as Record<string, unknown>) };
}

export async function adminDeleteWifiPackage(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'প্যাকেজটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('wifi_packages').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

// --- admin: review moderation ---

/** Publish / unpublish a review. Admin only. */
export async function adminSetDirectoryReviewPublished(
  id: string,
  isPublished: boolean
): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'রিভিউটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client
    .from('directory_reviews')
    .update({ is_published: isPublished })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

export async function adminDeleteDirectoryReview(id: string): Promise<WriteResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!isUuid(id)) return { success: false, error: 'রিভিউটি সঠিক নয়।' };
  if (!(await currentUserIsAdmin())) return { success: false, error: NOT_ALLOWED };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  const { error } = await client.from('directory_reviews').delete().eq('id', id);
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
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data, error } = await client
    .from('community_posts')
    .select(PUBLIC_POST_COLUMNS)
    .eq('kind', kind)
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`অনুমোদিত পোস্ট লোড করা যায়নি: ${error.message}`);
  if (!data) return [];
  return (data as Record<string, unknown>[]).map(mapPost);
}

/** Approved posts for every kind at once — used by the homepage rails. */
export async function fetchApprovedPostsByKind(
  kinds: PostKind[]
): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data, error } = await client
    .from('community_posts')
    .select(PUBLIC_POST_COLUMNS)
    .in('kind', kinds)
    .eq('status', 'approved')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`অনুমোদিত পোস্ট লোড করা যায়নি: ${error.message}`);
  if (!data) return [];
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
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data, error } = await client
    .from('community_posts')
    .select(PUBLIC_POST_COLUMNS)
    .eq('kind', kind)
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  if (error) throw new Error(`পোস্ট লোড করা যায়নি: ${error.message}`);
  if (!data) return null;
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
 * post is still in moderation, or the post is news or a job. Database/RPC
 * failures are thrown so a missing migration cannot masquerade as no contact.
 */
export async function fetchMarketContact(
  slug: string
): Promise<{ authorName?: string; authorPhone?: string; whatsappNumber?: string } | null> {
  if (!isSupabaseConfigured) return null;
  const client = createClient();
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data, error } = await client.rpc('fetch_market_contact', { p_slug: slug });
  if (error) throw new Error(`বিক্রেতার যোগাযোগের তথ্য লোড করা যায়নি: ${error.message}`);
  if (!Array.isArray(data) || data.length === 0) return null;
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
  const reportId = crypto.randomUUID();
  const { error } = await client.from('community_post_reports').insert({
    id: reportId,
    post_id: input.postId,
    reporter_id: input.reporterId,
    reporter_name: input.reporterName.trim() || 'অতিথি',
    reason: input.reason,
    details: input.details?.trim() || null,
  });
  if (error) return { success: false, error: error.message };
  void requestAdminEmailAlert('community_post_reports', reportId);
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
  if (!client) throw new Error(NOT_CONFIGURED);
  // `fn_my_post_by_slug` is the author-only path (author_id = auth.uid()) and is
  // the only place a rejected post's rejection_reason can be read since the
  // column REVOKEs.
  const { data, error } = await client
    .rpc('fn_my_post_by_slug', { p_kind: kind, p_slug: slug })
    .maybeSingle();
  if (error) throw new Error(`পোস্ট লোড করা যায়নি: ${error.message}`);
  if (!data) return null;
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
  if (!client) throw new Error(NOT_CONFIGURED);
  const { data, error } = await client
    .rpc('fn_my_post_by_id', { p_id: id })
    .maybeSingle();
  if (error) throw new Error(`পোস্ট সম্পাদনার তথ্য লোড করা যায়নি: ${error.message}`);
  if (!data) return null;
  const post = mapPost(data as Record<string, unknown>);
  // An already-approved post is not editable from the draft/edit screen.
  if (post.status === 'approved') return null;
  return post;
}

/** The signed-in author's own posts, any status. */
export async function fetchMyPosts(strict = false): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const userId = await currentUserId();
  if (!userId) {
    if (strict) throw new Error(NOT_SIGNED_IN);
    return [];
  }
  const client = createClient();
  if (!client) {
    if (strict) throw new Error(NOT_CONFIGURED);
    return [];
  }
  const { data, error } = await client.rpc('fn_my_posts');
  if (error) {
    throw new Error(`আপনার পোস্ট লোড করা যায়নি: ${error.message}`);
  }
  if (!data) return [];
  return (data as Record<string, unknown>[]).map(mapPost);
}

/**
 * Real page-view counts for the signed-in author's own posts, keyed by slug.
 *
 * Reads the narrow owner-facing aggregate `fn_my_post_views()` added in
 * 20261016120000_customer_post_views.sql — the raw `site_events` table is
 * admin-only, and this function exists precisely so an author can see their own
 * traffic without opening raw visitor rows to every member. Ownership is
 * re-checked inside the SQL (`author_id = auth.uid()`), never trusted here.
 *
 * Degrades gracefully: while the migration has not been applied yet, or when
 * analytics is unavailable, it returns an empty map instead of throwing, so the
 * dashboard still renders posts — just without a view figure.
 */
export async function fetchMyPostViewCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const userId = await currentUserId();
  if (!userId) return {};
  const client = createClient();
  if (!client) return {};

  const { data, error } = await client.rpc('fn_my_post_views');
  if (error || !Array.isArray(data)) return {};

  const counts: Record<string, number> = {};
  for (const row of data as { post_slug?: unknown; view_count?: unknown }[]) {
    if (typeof row.post_slug !== 'string') continue;
    counts[row.post_slug] = Number(row.view_count ?? 0);
  }
  return counts;
}

/**
 * Real page-view counts for the signed-in member's own service profiles,
 * keyed by content id: the home-tutor profile UUID, or the WiFi / coaching
 * listing slug.
 *
 * Reads the narrow owner-facing aggregate `fn_my_profile_views()` added in
 * 20261018000000_customer_profile_views.sql — the raw `site_events` table is
 * admin-only, and this function exists so a member can see their own profile
 * traffic without opening raw visitor rows to everyone. Ownership is re-checked
 * inside the SQL (`auth.uid()`), never trusted here.
 *
 * Degrades gracefully: while the migration has not been applied yet, or when
 * analytics is unavailable, it returns an empty map instead of throwing, so the
 * dashboard still renders profiles — just without a view figure.
 */
export async function fetchMyProfileViewCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const userId = await currentUserId();
  if (!userId) return {};
  const client = createClient();
  if (!client) return {};

  const { data, error } = await client.rpc('fn_my_profile_views');
  if (error || !Array.isArray(data)) return {};

  const counts: Record<string, number> = {};
  for (const row of data as { content_id?: unknown; view_count?: unknown }[]) {
    if (typeof row.content_id !== 'string') continue;
    counts[row.content_id] = Number(row.view_count ?? 0);
  }
  return counts;
}

/**
 * Create a post. Always forced to `pending`, regardless of what the caller
 * passes, and always attributed to the signed-in user.
 */
export async function createCommunityPost(
  input: CommunityPostInput
): Promise<WriteResult<CommunityPost>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  const validationError = communityPostWriteError(input, true);
  if (validationError) return { success: false, error: validationError };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };
  // Resolve the display name from the authenticated profile instead of trusting
  // the optional authorName supplied by a specific form.
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) {
    return { success: false, error: `আপনার প্রোফাইলের নাম যাচাই করা যায়নি: ${profileError.message}` };
  }
  const authorName = typeof profile?.full_name === 'string' ? profile.full_name.trim() : '';
  if (authorName.length < 2) {
    return { success: false, error: 'পোস্ট করার আগে প্রোফাইলে আপনার সঠিক নাম যোগ করুন।' };
  }

  // `rejectionReason` is stripped as well: only a moderator may write it, so
  // an author craftily sending one along must land on nothing.
  const {
    status: _ignoredStatus,
    marketplaceStatus: _ignoredMarketplaceStatus,
    isFeatured: _ignoredFeature,
    authorId: _ignoredAuthor,
    authorName: _ignoredAuthorName,
    rejectionReason: _ignoredReason,
    ...rest
  } = input;

  const payload = {
    ...toSnakeObject(rest as Record<string, unknown>),
    author_id: userId,
    author_name: authorName,
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

  const { data: current, error: currentError } = await client
    .from('community_posts')
    .select('kind, category')
    .eq('id', id)
    .eq('author_id', userId)
    .maybeSingle();
  if (currentError) return { success: false, error: currentError.message };
  if (!current) return { success: false, error: 'পোস্টটি পাওয়া যায়নি অথবা এটি আপনার নয়।' };
  const validationError = communityPostWriteError(
    { ...patch, kind: current.kind as PostKind },
    false,
    current.category
  );
  if (validationError) return { success: false, error: validationError };

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) {
    return { success: false, error: `আপনার প্রোফাইলের নাম যাচাই করা যায়নি: ${profileError.message}` };
  }
  const authorName = typeof profile?.full_name === 'string' ? profile.full_name.trim() : '';
  if (authorName.length < 2) {
    return { success: false, error: 'পোস্ট সম্পাদনার আগে প্রোফাইলে আপনার সঠিক নাম যোগ করুন।' };
  }

  const {
    status: _s,
    marketplaceStatus: _marketplaceStatus,
    isFeatured: _f,
    authorId: _a,
    authorName: _authorName,
    slug: _slug,
    rejectionReason: _r,
    ...rest
  } = patch;
  const payload = {
    ...toSnakeObject(rest as Record<string, unknown>),
    author_name: authorName,
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

/** Update only the seller-facing state of an approved marketplace post. */
export async function setMyMarketplaceStatus(
  id: string,
  status: MarketplaceStatus
): Promise<WriteResult<MarketplaceStatus>> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { success: false, error: 'পোস্টটি সঠিক নয়।' };
  const userId = await currentUserId();
  if (!userId) return { success: false, error: NOT_SIGNED_IN };
  const client = createClient();
  if (!client) return { success: false, error: NOT_CONFIGURED };

  const { data, error } = await client.rpc('fn_set_my_marketplace_status', {
    p_id: id,
    p_status: status,
  });
  if (error) return { success: false, error: error.message };
  if (data !== status) return { success: false, error: 'বিক্রির অবস্থা আপডেট নিশ্চিত করা যায়নি।' };
  return { success: true, data: status };
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
  if (!client) throw new Error(NOT_CONFIGURED);
  // `fn_admin_posts` is the only path that may read author_phone /
  // whatsapp_number / rejection_reason after the column REVOKEs.
  let q = client.rpc('fn_admin_posts');
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw new Error(`অ্যাডমিন পোস্ট লোড করা যায়নি: ${error.message}`);
  if (!data) return [];
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
  if (!isSupabaseConfigured) throw new Error('জরুরি নম্বরের ডেটাবেজ সংযুক্ত নেই।');
  const client = createClient();
  if (!client) throw new Error('জরুরি নম্বরের ডেটাবেজ সংযোগ তৈরি করা যায়নি।');
  const { data, error } = await client
    .from('emergency_contacts')
    .select('*')
    .eq('service', service)
    .eq('is_active', true)
    .not('source_note', 'is', null)
    .order('sort_order', { ascending: true })
    .order('name_bn', { ascending: true });
  if (error) throw new Error(`জরুরি নম্বর লোড করা যায়নি: ${error.message}`);
  if (!data) throw new Error('জরুরি নম্বর লোড করা যায়নি।');
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
 * Submit a public rental request through the server endpoint. The endpoint
 * validates the request and invokes the database function that snapshots the
 * active listing's pricing and calculates the final estimate; browser-side
 * inserts are intentionally not permitted.
 */
export async function createVehicleRequest(
  input: VehicleRequestInput
): Promise<AckResult> {
  if (!isSupabaseConfigured) return { success: false, error: NOT_CONFIGURED };
  try {
    const response = await fetch('/api/vehicle-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      return { success: false, error: result.error || 'যানবাহনের অনুরোধ পাঠানো যায়নি।' };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'যানবাহনের অনুরোধ পাঠানো যায়নি।',
    };
  }
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
