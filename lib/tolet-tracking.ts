/**
 * To-Let engagement tracking.
 *
 * What this records
 * -----------------
 * Every meaningful action a visitor takes on a listing detail page:
 *
 *   view            the detail page was opened
 *   call_click      the "কল করুন" button was pressed
 *   whatsapp_click  the "হোয়াটসঅ্যাপ" button was pressed
 *   favorite        the listing was added to / removed from the saved list
 *   share           the listing was shared via the OS share sheet or copied
 *
 * IMPORTANT — call_click is a BUTTON PRESS, not a completed call. The platform
 * has no telephony integration and cannot know whether anyone actually dialled
 * the number, let alone whether they were answered. Every surface that renders
 * this number must therefore say "কল বাটন চাপা হয়েছে" and never "কল হয়েছে",
 * otherwise the admin panel reports a figure the system never measured.
 *
 * Storage
 * -------
 * Writes go to `tolet_listing_events` (see `lib/supabase/schema.sql` and
 * `supabase/migrations/`). Two deliberate schema choices:
 *
 *  1. `listing_id` is TEXT with NO foreign key. Showcase/demo ids are not
 *     UUIDs, and an FK would also silently drop analytics the moment an owner
 *     deletes a draft. Denormalised `area_id` / `property_type` / `rent_price`
 *     keep per-property reporting meaningful even after deletion.
 *  2. `visitor_id` is an opaque, locally-generated id — never an IP, never a
 *     fingerprint — so unique-visitor counts work without collecting anything
 *     identifying.
 *
 * Reads (admin analytics) go through the `tolet_listing_analytics` RPC, which
 * does the aggregation in Postgres and is gated on `public.is_admin()`.
 *
 * Failure policy: tracking is strictly fire-and-forget. If Supabase is not
 * configured, if the table has not been migrated yet, or if the network fails,
 * the visitor's action still completes and nothing is shown to the user. A
 * dropped analytics row must never cost a house viewing.
 */
'use client';

import { isSupabaseConfigured, createClient } from './supabase/client';
import type {
  ToletEventInput,
  ToletEventType,
  ToletListingStats,
} from './tolet-types';
import { getAreaById } from './locations';
import { TOLET_PROPERTY_TYPE_INFO } from './tolet-types';

const VISITOR_KEY = 'mms_vid';
const VIEWED_KEY = 'mms_tolet_seen';

/** Guard so a single render loop can never fire the same event twice. */
const inFlight = new Set<string>();

// ---------------------------------------------------------------------------
// Visitor identity
// ---------------------------------------------------------------------------

/**
 * Opaque, per-browser id used only to count distinct visitors.
 * Falls back to an in-memory id when storage is blocked (private mode, some
 * in-app browsers) so tracking still works for the current page view.
 */
let memoryVisitorId: string | null = null;

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `v-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = randomId();
    window.localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    if (!memoryVisitorId) memoryVisitorId = randomId();
    return memoryVisitorId;
  }
}

// ---------------------------------------------------------------------------
// Write path
// ---------------------------------------------------------------------------

/**
 * Records one event. Never throws, never blocks the UI.
 */
export async function trackToletEvent(
  event: ToletEventInput & { eventType: ToletEventType }
): Promise<void> {
  if (typeof window === 'undefined' || !event.listingId || !event.eventType) return;

  const dedupeKey = `${event.listingId}:${event.eventType}:${event.source ?? 'detail_page'}`;
  if (inFlight.has(dedupeKey)) return;
  inFlight.add(dedupeKey);

  try {
    mockRecordEvent(event);

    if (!isSupabaseConfigured) return;
    const client = createClient();
    if (!client) return;

    await client.from('tolet_listing_events').insert({
      listing_id: event.listingId,
      event_type: event.eventType,
      event_source: event.source ?? 'detail_page',
      visitor_id: getVisitorId(),
      user_id: event.userId ?? null,
      area_id: event.areaId ?? null,
      property_type: event.propertyType ?? null,
      rent_price: event.rentPrice ?? null,
    });
  } catch {
    // Fire-and-forget by design. See the failure policy at the top of the file.
  } finally {
    // Release after a tick so a same-render double-tap cannot double-count.
    setTimeout(() => inFlight.delete(dedupeKey), 400);
  }
}

/**
 * Records a page view at most once per browser session per listing, so
 * refreshing ten times is still one view. Uses `sessionStorage` rather than
 * `localStorage` on purpose: a "view" is a visit, not a lifetime total.
 */
export function trackListingView(params: {
  listingId: string;
  userId?: string | null;
  areaId?: string;
  propertyType?: string;
  rentPrice?: number;
}): void {
  if (typeof window === 'undefined') return;
  try {
    const seen = window.sessionStorage.getItem(`${VIEWED_KEY}:${params.listingId}`);
    if (seen) return;
    window.sessionStorage.setItem(`${VIEWED_KEY}:${params.listingId}`, '1');
  } catch {
    // Storage unavailable — fall through and record the view rather than lose it.
  }
  void trackToletEvent({ eventType: 'view', source: 'detail_page', ...params });
}

// ---------------------------------------------------------------------------
// Read path — admin analytics
// ---------------------------------------------------------------------------

const EMPTY_STATS: ToletListingStats = {
  listingId: '',
  views: 0,
  callClicks: 0,
  whatsappClicks: 0,
  favorites: 0,
  shares: 0,
  contactClicks: 0,
  uniqueVisitors: 0,
  lastActivityAt: null,
};

interface RawRollup {
  listing_id?: string | null;
  listing_title?: string | null;
  area_id?: string | null;
  property_type?: string | null;
  rent_price?: number | null;
  status?: string | null;
  views?: number | null;
  call_clicks?: number | null;
  whatsapp_clicks?: number | null;
  favorites?: number | null;
  shares?: number | null;
  unique_visitors?: number | null;
  last_activity_at?: string | null;
}

function normalizeRollup(row: RawRollup): ToletListingStats {
  const callClicks = Number(row.call_clicks ?? 0);
  const whatsappClicks = Number(row.whatsapp_clicks ?? 0);
  return {
    listingId: row.listing_id ?? '',
    views: Number(row.views ?? 0),
    callClicks,
    whatsappClicks,
    favorites: Number(row.favorites ?? 0),
    shares: Number(row.shares ?? 0),
    contactClicks: callClicks + whatsappClicks,
    uniqueVisitors: Number(row.unique_visitors ?? 0),
    lastActivityAt: row.last_activity_at ?? null,
  };
}

/**
 * Property-wise engagement rollup for the admin panel, hottest first.
 *
 * Returns the shape `ToletListingStats` describes, joined with just enough
 * listing metadata for a table row (title / area / type / rent / status), so
 * the console never has to make a second round-trip to label a row.
 *
 * Falls back to the in-memory mock store when Supabase is unavailable or the
 * analytics RPC has not been deployed yet.
 */
export async function adminFetchToletAnalytics(
  limit = 50
): Promise<ToletListingStats[]> {
  if (!isSupabaseConfigured) return mockFetchAnalytics(limit);
  const client = createClient();
  if (!client) return mockFetchAnalytics(limit);

  const { data, error } = await client.rpc('tolet_listing_analytics', {
    p_limit: limit,
  });
  if (error || !Array.isArray(data)) return mockFetchAnalytics(limit);
  return (data as RawRollup[]).map(normalizeRollup);
}

/** Single-property stats — cheap enough for the owner-facing dashboard. */
export async function fetchListingStats(
  listingId: string
): Promise<ToletListingStats> {
  if (!listingId) return { ...EMPTY_STATS };
  if (!isSupabaseConfigured) return mockFetchAnalytics(200).find((s) => s.listingId === listingId) ?? { ...EMPTY_STATS, listingId };
  const client = createClient();
  if (!client) return { ...EMPTY_STATS, listingId };

  const { data, error } = await client.rpc('tolet_listing_analytics', {
    p_limit: 500,
  });
  if (error || !Array.isArray(data)) {
    const found = mockFetchAnalytics(200).find((s) => s.listingId === listingId);
    return found ?? { ...EMPTY_STATS, listingId };
  }
  const match = (data as RawRollup[]).find((row) => row.listing_id === listingId);
  return match ? normalizeRollup(match) : { ...EMPTY_STATS, listingId };
}

// ---------------------------------------------------------------------------
// In-memory store (preview mode, and a safe fallback while the migration
// has not been applied). Mirrors the SQL rollup exactly.
// ---------------------------------------------------------------------------

interface MockEvent {
  listingId: string;
  eventType: ToletEventType;
  visitorId: string;
  areaId?: string;
  propertyType?: string;
  rentPrice?: number;
  at: string;
}

const mockEvents: MockEvent[] = [];

/** Metadata used to label rollup rows; filled in by the service layer. */
const mockListingMeta = new Map<
  string,
  { title: string; areaId: string; propertyType: string; rentPrice: number }
>();

export function mockTrackListingMeta(
  listingId: string,
  meta: { title: string; areaId: string; propertyType: string; rentPrice: number }
): void {
  mockListingMeta.set(listingId, meta);
}

function mockRecordEvent(event: ToletEventInput & { eventType: ToletEventType }): void {
  mockEvents.push({
    listingId: event.listingId,
    eventType: event.eventType,
    visitorId: event.userId ?? getVisitorId(),
    areaId: event.areaId,
    propertyType: event.propertyType,
    rentPrice: event.rentPrice,
    at: new Date().toISOString(),
  });
  // Keep the preview store bounded; nobody scrolls 10k events.
  if (mockEvents.length > 2000) mockEvents.splice(0, mockEvents.length - 2000);
}

function mockFetchAnalytics(limit: number): ToletListingStats[] {
  const byListing = new Map<string, ToletListingStats>();

  for (const event of mockEvents) {
    let stats = byListing.get(event.listingId);
    if (!stats) {
      stats = { ...EMPTY_STATS, listingId: event.listingId };
      byListing.set(event.listingId, stats);
    }
    if (event.eventType === 'view') stats.views += 1;
    if (event.eventType === 'call_click') stats.callClicks += 1;
    if (event.eventType === 'whatsapp_click') stats.whatsappClicks += 1;
    if (event.eventType === 'favorite') stats.favorites += 1;
    if (event.eventType === 'share') stats.shares += 1;
    if (!stats.lastActivityAt || event.at > stats.lastActivityAt) {
      stats.lastActivityAt = event.at;
    }
  }

  // Unique visitors need a set per listing, computed in a second pass.
  const visitors = new Map<string, Set<string>>();
  for (const event of mockEvents) {
    let set = visitors.get(event.listingId);
    if (!set) {
      set = new Set();
      visitors.set(event.listingId, set);
    }
    set.add(event.visitorId);
  }

  const rows = [...byListing.values()].map((stats) => ({
    ...stats,
    contactClicks: stats.callClicks + stats.whatsappClicks,
    uniqueVisitors: visitors.get(stats.listingId)?.size ?? 0,
  }));

  rows.sort((a, b) => b.contactClicks - a.contactClicks || b.views - a.views);
  return rows.slice(0, limit);
}

/**
 * Human labels for a rollup row, so the admin panel and any owner-facing
 * dashboard render the same wording. Kept here rather than in the console so
 * the semantics ("button pressed") can never drift per screen.
 */
export function describeToletStats(stats: ToletListingStats): {
  labelBn: string;
  areaLabelBn: string;
  typeLabelBn: string;
} {
  const meta = mockListingMeta.get(stats.listingId);
  const area = meta ? getAreaById(meta.areaId) : undefined;
  const type = meta?.propertyType as keyof typeof TOLET_PROPERTY_TYPE_INFO | undefined;
  return {
    labelBn: meta?.title ?? stats.listingId,
    areaLabelBn: area?.nameBn ?? meta?.areaId ?? '—',
    typeLabelBn: (type && TOLET_PROPERTY_TYPE_INFO[type]?.labelBn) ?? '—',
  };
}