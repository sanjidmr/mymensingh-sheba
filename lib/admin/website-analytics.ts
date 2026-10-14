import { getAdminDataClient } from './queries';

/**
 * Server-side data layer for the Website Analytics console.
 *
 * Everything here reads a single Postgres function,
 * `public.get_website_analytics(...)`, which does the aggregation in the
 * database and returns one JSON document. Raw `site_events` rows never travel
 * to the browser — a page view log is both large and a small fingerprinting
 * surface, and the console only ever needs the rollups.
 *
 * The parser below is the only thing standing between a malformed or partially
 * migrated database and the UI, so it validates every shape and returns `null`
 * rather than rendering a number it cannot trust.
 */

export interface WebsiteAnalyticsRow {
  key: string;
  count: number;
  secondaryCount?: number;
}

export interface WebsiteAnalyticsContentRow extends WebsiteAnalyticsRow {
  kind?: string | null;
  contentId?: string | null;
}

export interface WebsiteAnalyticsServiceCtaRow {
  key: string;
  count: number;
  category?: string | null;
}

export interface WebsiteAnalyticsTrendPoint {
  key: string;
  pageViews: number;
  visitors: number;
  sessions?: number;
}

export interface WebsiteToletTopListing {
  listingId: string;
  title: string | null;
  areaId: string | null;
  propertyType: string | null;
  rentPrice: number | null;
  status: string | null;
  views: number;
  callClicks: number;
  whatsappClicks: number;
  contactClicks: number;
}

export interface WebsiteAnalyticsData {
  totals: {
    pageViews: number;
    sessions: number;
    uniqueVisitors: number;
    newVisitors: number;
    returningVisitors: number;
    ctaClicks: number;
    formSubmits: number;
    todayPageViews: number;
    todayVisitors: number;
  };
  daily: WebsiteAnalyticsTrendPoint[];
  weekly: WebsiteAnalyticsTrendPoint[];
  monthly: WebsiteAnalyticsTrendPoint[];
  topPages: WebsiteAnalyticsRow[];
  landingPages: WebsiteAnalyticsRow[];
  topContent: WebsiteAnalyticsContentRow[];
  topCategories: WebsiteAnalyticsRow[];
  ctaClicks: WebsiteAnalyticsRow[];
  formSubmits: WebsiteAnalyticsRow[];
  serviceCtas: WebsiteAnalyticsServiceCtaRow[];
  devices: WebsiteAnalyticsRow[];
  referrers: WebsiteAnalyticsRow[];
  tolet: {
    views: number;
    callClicks: number;
    whatsappClicks: number;
    favorites: number;
    shares: number;
    uniqueVisitors: number;
    topListings: WebsiteToletTopListing[];
  };
  requests: {
    serviceRequests: WebsiteAnalyticsRow[];
    vehicleRequests: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toRow(value: unknown): WebsiteAnalyticsRow | null {
  if (!isRecord(value) || typeof value.key !== 'string') return null;
  const row: WebsiteAnalyticsRow = { key: value.key, count: toNumber(value.count) };
  if (value.secondaryCount !== undefined) row.secondaryCount = toNumber(value.secondaryCount);
  return row;
}

function toRowList(value: unknown): WebsiteAnalyticsRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(toRow).filter((row): row is WebsiteAnalyticsRow => row !== null);
}

function toContentRowList(value: unknown): WebsiteAnalyticsContentRow[] {
  if (!Array.isArray(value)) return [];
  const rows: WebsiteAnalyticsContentRow[] = [];
  for (const item of value) {
    const base = toRow(item);
    if (!base || !isRecord(item)) continue;
    rows.push({
      ...base,
      kind: toNullableString(item.kind),
      contentId: toNullableString(item.contentId),
    });
  }
  return rows;
}

function toServiceCtaList(value: unknown): WebsiteAnalyticsServiceCtaRow[] {
  if (!Array.isArray(value)) return [];
  const rows: WebsiteAnalyticsServiceCtaRow[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== 'string') continue;
    rows.push({
      key: item.key,
      count: toNumber(item.count),
      category: toNullableString(item.category),
    });
  }
  return rows;
}

function toTrendList(value: unknown): WebsiteAnalyticsTrendPoint[] {
  if (!Array.isArray(value)) return [];
  const points: WebsiteAnalyticsTrendPoint[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== 'string') continue;
    const point: WebsiteAnalyticsTrendPoint = {
      key: item.key,
      pageViews: toNumber(item.pageViews),
      visitors: toNumber(item.visitors),
    };
    if (item.sessions !== undefined) point.sessions = toNumber(item.sessions);
    points.push(point);
  }
  return points;
}

function toToletListings(value: unknown): WebsiteToletTopListing[] {
  if (!Array.isArray(value)) return [];
  const rows: WebsiteToletTopListing[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.listingId !== 'string') continue;
    rows.push({
      listingId: item.listingId,
      title: toNullableString(item.title),
      areaId: toNullableString(item.areaId),
      propertyType: toNullableString(item.propertyType),
      rentPrice: typeof item.rentPrice === 'number' ? item.rentPrice : null,
      status: toNullableString(item.status),
      views: toNumber(item.views),
      callClicks: toNumber(item.callClicks),
      whatsappClicks: toNumber(item.whatsappClicks),
      contactClicks: toNumber(item.contactClicks),
    });
  }
  return rows;
}

function parseWebsiteAnalytics(value: unknown): WebsiteAnalyticsData | null {
  if (!isRecord(value)) return null;
  const totals = value.totals;
  if (!isRecord(totals)) return null;

  const tolet = isRecord(value.tolet) ? value.tolet : {};
  const requests = isRecord(value.requests) ? value.requests : {};

  return {
    totals: {
      pageViews: toNumber(totals.pageViews),
      sessions: toNumber(totals.sessions),
      uniqueVisitors: toNumber(totals.uniqueVisitors),
      newVisitors: toNumber(totals.newVisitors),
      returningVisitors: toNumber(totals.returningVisitors),
      ctaClicks: toNumber(totals.ctaClicks),
      formSubmits: toNumber(totals.formSubmits),
      todayPageViews: toNumber(totals.todayPageViews),
      todayVisitors: toNumber(totals.todayVisitors),
    },
    daily: toTrendList(value.daily),
    weekly: toTrendList(value.weekly),
    monthly: toTrendList(value.monthly),
    topPages: toRowList(value.topPages),
    landingPages: toRowList(value.landingPages),
    topContent: toContentRowList(value.topContent),
    topCategories: toRowList(value.topCategories),
    ctaClicks: toRowList(value.ctaClicks),
    formSubmits: toRowList(value.formSubmits),
    serviceCtas: toServiceCtaList(value.serviceCtas),
    devices: toRowList(value.devices),
    referrers: toRowList(value.referrers),
    tolet: {
      views: toNumber(tolet.views),
      callClicks: toNumber(tolet.callClicks),
      whatsappClicks: toNumber(tolet.whatsappClicks),
      favorites: toNumber(tolet.favorites),
      shares: toNumber(tolet.shares),
      uniqueVisitors: toNumber(tolet.uniqueVisitors),
      topListings: toToletListings(tolet.topListings),
    },
    requests: {
      serviceRequests: toRowList(requests.serviceRequests),
      vehicleRequests: toNumber(requests.vehicleRequests),
    },
  };
}

export interface WebsiteAnalyticsFilters {
  from: string;
  to: string;
  category?: string;
  route?: string;
  eventType?: string;
}

export async function fetchWebsiteAnalytics(
  filters: WebsiteAnalyticsFilters
): Promise<{ data: WebsiteAnalyticsData | null; unavailable: boolean; error?: string }> {
  const { from, to } = filters;
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (!isDate(from) || !isDate(to) || to < from) {
    return { data: null, unavailable: false, error: 'তারিখের সীমা সঠিক নয়।' };
  }
  const span = (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000;
  if (span > 366) {
    return { data: null, unavailable: false, error: 'সর্বোচ্চ ৩৬৭ দিনের পরিসর বেছে নিন।' };
  }

  const admin = await getAdminDataClient();
  if (!admin) {
    return { data: null, unavailable: true, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
  }

  const { data, error } = await admin.client.rpc('get_website_analytics', {
    p_from: from,
    p_to: to,
    p_category: filters.category ?? null,
    p_route: filters.route ?? null,
    p_event_type: filters.eventType ?? null,
  });
  if (error) return { data: null, unavailable: false, error: error.message };

  const parsed = parseWebsiteAnalytics(data);
  if (!parsed) {
    return { data: null, unavailable: false, error: 'অ্যানালিটিক্সের ডেটা ফরম্যাট সঠিক নয়।' };
  }
  return { data: parsed, unavailable: false };
}

/** Human labels for the event/CTA vocabularies the rollup returns. */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  page_view: 'পেজ ভিউ',
  session_start: 'সেশন শুরু',
  cta_click: 'বাটনে ক্লিক',
  form_submit: 'ফর্ম জমা (নিশ্চিত)',
};

export const CTA_TYPE_LABELS: Record<string, string> = {
  get_service: '“সেবা নিন” বাটন',
  call: '“কল করুন” বাটন',
  whatsapp: 'WhatsApp বাটন',
  contact_request: 'যোগাযোগের অনুরোধ',
  tutor_contact: 'শিক্ষক নিতে চাই',
  apply: 'আবেদন',
  other: 'অন্যান্য বাটন',
  service_request: 'সেবা অনুরোধ (নিশ্চিত)',
  vehicle_request: 'যানবাহন অনুরোধ (নিশ্চিত)',
  tutor_request: 'গৃহশিক্ষক অনুরোধ (নিশ্চিত)',
  buy_sell_request: 'কেনাবেচা অনুরোধ (নিশ্চিত)',
  home_moving_request: 'বাসা পাল্টানোর অনুরোধ (নিশ্চিত)',
  staff_request: 'কর্মীর অনুরোধ (নিশ্চিত)',
  contact_message: 'বার্তা (নিশ্চিত)',
};

export const SERVICE_LABELS: Record<string, string> = {
  'kajer-bua': 'কাজের বুয়া',
  electrician: 'ইলেকট্রিশিয়ান',
  plumber: 'প্লাম্বার',
  'basha-paltano': 'বাসা পাল্টানো',
  'ac-fridge': 'এসি ও ফ্রিজ',
  'home-tutor': 'গৃহশিক্ষক',
  'home-moving': 'বাসা পাল্টানো',
  news: 'সংবাদ',
  job: 'চাকরি',
  jobs: 'চাকরি',
  buy_sell: 'কেনাবেচা',
  'buy-sell': 'কেনাবেচা',
  tolet: 'বাসা ভাড়া',
};

export const DEVICE_LABELS: Record<string, string> = {
  mobile: 'মোবাইল',
  tablet: 'ট্যাবলেট',
  desktop: 'ডেস্কটপ',
  unknown: 'অজানা',
};
