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
    previousDayPageViews: number;
    previousDayVisitors: number;
    guestVisitors: number;
    loggedInVisitors: number;
  };
  trafficQuality: {
    botEvents: number;
    internalEvents: number;
    unidentifiedEvents: number;
    legacyEvents: number;
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

export interface WebsiteBusinessAnalyticsData {
  accounts: {
    total: number;
    new: number;
    byRole: WebsiteAnalyticsRow[];
  };
  profiles: WebsiteAnalyticsRow[];
  posts: WebsiteAnalyticsRow[];
  requests: WebsiteAnalyticsRow[];
  finance: {
    income: number;
    due: number;
    records: number;
    byService: {
      key: string;
      income: number;
      due: number;
      records: number;
    }[];
    expensesTracked: boolean;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function toRow(value: unknown): WebsiteAnalyticsRow | null {
  if (
    !isRecord(value) ||
    typeof value.key !== 'string' ||
    typeof value.count !== 'number' ||
    !Number.isFinite(value.count) ||
    (value.secondaryCount !== undefined &&
      (typeof value.secondaryCount !== 'number' || !Number.isFinite(value.secondaryCount)))
  ) return null;
  const row: WebsiteAnalyticsRow = { key: value.key, count: value.count };
  if (typeof value.secondaryCount === 'number') row.secondaryCount = value.secondaryCount;
  return row;
}

function toRowList(value: unknown): WebsiteAnalyticsRow[] {
  if (!Array.isArray(value)) return [];
  return value.map(toRow).filter((row): row is WebsiteAnalyticsRow => row !== null);
}

function isValidRowList(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) => toRow(item) !== null);
}

function isValidContentList(value: unknown): boolean {
  return Array.isArray(value) &&
    value.every((item) => isRecord(item) && toRow(item) !== null);
}

function isValidTrendList(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    typeof item.key === 'string' &&
    isFiniteNumber(item.pageViews) &&
    isFiniteNumber(item.visitors) &&
    (item.sessions === undefined || isFiniteNumber(item.sessions))
  );
}

function isValidServiceCtaList(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    typeof item.key === 'string' &&
    isFiniteNumber(item.count) &&
    (item.category === undefined || item.category === null || typeof item.category === 'string')
  );
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
    if (
      !isRecord(item) ||
      typeof item.key !== 'string' ||
      typeof item.count !== 'number' ||
      !Number.isFinite(item.count)
    ) continue;
    rows.push({
      key: item.key,
      count: item.count,
      category: toNullableString(item.category),
    });
  }
  return rows;
}

function toTrendList(value: unknown): WebsiteAnalyticsTrendPoint[] {
  if (!Array.isArray(value)) return [];
  const points: WebsiteAnalyticsTrendPoint[] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.key !== 'string' ||
      typeof item.pageViews !== 'number' ||
      !Number.isFinite(item.pageViews) ||
      typeof item.visitors !== 'number' ||
      !Number.isFinite(item.visitors) ||
      (item.sessions !== undefined &&
        (typeof item.sessions !== 'number' || !Number.isFinite(item.sessions)))
    ) continue;
    const point: WebsiteAnalyticsTrendPoint = {
      key: item.key,
      pageViews: item.pageViews,
      visitors: item.visitors,
    };
    if (typeof item.sessions === 'number') point.sessions = item.sessions;
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

function toFinancialRows(value: unknown): WebsiteBusinessAnalyticsData['finance']['byService'] | null {
  if (!Array.isArray(value)) return null;
  const rows: WebsiteBusinessAnalyticsData['finance']['byService'] = [];
  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.key !== 'string' ||
      !isFiniteNumber(item.income) ||
      !isFiniteNumber(item.due) ||
      !isFiniteNumber(item.records)
    ) return null;
    rows.push({ key: item.key, income: item.income, due: item.due, records: item.records });
  }
  return rows;
}

function parseWebsiteAnalytics(value: unknown): WebsiteAnalyticsData | null {
  if (!isRecord(value)) return null;
  const totals = value.totals;
  const trafficQuality = value.trafficQuality;
  if (
    !isRecord(totals) ||
    !isFiniteNumber(totals.pageViews) ||
    !isFiniteNumber(totals.sessions) ||
    !isFiniteNumber(totals.uniqueVisitors) ||
    !isFiniteNumber(totals.newVisitors) ||
    !isFiniteNumber(totals.returningVisitors) ||
    !isFiniteNumber(totals.ctaClicks) ||
    !isFiniteNumber(totals.formSubmits) ||
    !isFiniteNumber(totals.todayPageViews) ||
    !isFiniteNumber(totals.todayVisitors) ||
    !isFiniteNumber(totals.previousDayPageViews) ||
    !isFiniteNumber(totals.previousDayVisitors) ||
    !isFiniteNumber(totals.guestVisitors) ||
    !isFiniteNumber(totals.loggedInVisitors) ||
    !isRecord(trafficQuality) ||
    !isFiniteNumber(trafficQuality.botEvents) ||
    !isFiniteNumber(trafficQuality.internalEvents) ||
    !isFiniteNumber(trafficQuality.unidentifiedEvents) ||
    !isFiniteNumber(trafficQuality.legacyEvents) ||
    !isValidTrendList(value.daily) ||
    !isValidTrendList(value.weekly) ||
    !isValidTrendList(value.monthly) ||
    !isValidRowList(value.topPages) ||
    !isValidRowList(value.landingPages) ||
    !isValidContentList(value.topContent) ||
    !isValidRowList(value.topCategories) ||
    !isValidRowList(value.ctaClicks) ||
    !isValidRowList(value.formSubmits) ||
    !isValidServiceCtaList(value.serviceCtas) ||
    !isValidRowList(value.devices) ||
    !isValidRowList(value.referrers)
  ) return null;

  const tolet = value.tolet;
  const requests = value.requests;
  if (
    !isRecord(tolet) ||
    !isFiniteNumber(tolet.views) ||
    !isFiniteNumber(tolet.callClicks) ||
    !isFiniteNumber(tolet.whatsappClicks) ||
    !isFiniteNumber(tolet.favorites) ||
    !isFiniteNumber(tolet.shares) ||
    !isFiniteNumber(tolet.uniqueVisitors) ||
    !Array.isArray(tolet.topListings) ||
    !tolet.topListings.every((item) =>
      isRecord(item) &&
      typeof item.listingId === 'string' &&
      isFiniteNumber(item.views) &&
      isFiniteNumber(item.callClicks) &&
      isFiniteNumber(item.whatsappClicks) &&
      isFiniteNumber(item.contactClicks)
    ) ||
    !isRecord(requests) ||
    !isFiniteNumber(requests.vehicleRequests) ||
    !isValidRowList(requests.serviceRequests)
  ) return null;

  return {
    totals: {
      pageViews: totals.pageViews,
      sessions: totals.sessions,
      uniqueVisitors: totals.uniqueVisitors,
      newVisitors: totals.newVisitors,
      returningVisitors: totals.returningVisitors,
      ctaClicks: totals.ctaClicks,
      formSubmits: totals.formSubmits,
      todayPageViews: totals.todayPageViews,
      todayVisitors: totals.todayVisitors,
      previousDayPageViews: totals.previousDayPageViews,
      previousDayVisitors: totals.previousDayVisitors,
      guestVisitors: totals.guestVisitors,
      loggedInVisitors: totals.loggedInVisitors,
    },
    trafficQuality: {
      botEvents: trafficQuality.botEvents,
      internalEvents: trafficQuality.internalEvents,
      unidentifiedEvents: trafficQuality.unidentifiedEvents,
      legacyEvents: trafficQuality.legacyEvents,
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

  const { data, error } = await admin.client.rpc('get_website_analytics_v2', {
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

export async function fetchWebsiteBusinessAnalytics(
  filters: Pick<WebsiteAnalyticsFilters, 'from' | 'to'>
): Promise<{ data: WebsiteBusinessAnalyticsData | null; unavailable: boolean; error?: string }> {
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
  const { data, error } = await admin.client.rpc('get_website_business_analytics', {
    p_from: from,
    p_to: to,
  });
  if (error) return { data: null, unavailable: false, error: error.message };
  if (
    !isRecord(data) ||
    !isRecord(data.accounts) ||
    !isFiniteNumber(data.accounts.total) ||
    !isFiniteNumber(data.accounts.new) ||
    !isRecord(data.finance) ||
    !isFiniteNumber(data.finance.income) ||
    !isFiniteNumber(data.finance.due) ||
    !isFiniteNumber(data.finance.records)
  ) {
    return { data: null, unavailable: false, error: 'ব্যবসায়িক অ্যানালিটিক্সের ডেটা ফরম্যাট সঠিক নয়।' };
  }
  const byService = toFinancialRows(data.finance.byService);
  if (
    !byService ||
    !isValidRowList(data.accounts.byRole) ||
    !isValidRowList(data.profiles) ||
    !isValidRowList(data.posts) ||
    !isValidRowList(data.requests)
  ) {
    return { data: null, unavailable: false, error: 'আর্থিক রেকর্ডের ডেটা ফরম্যাট সঠিক নয়।' };
  }
  const byRole = toRowList(data.accounts.byRole);
  const profiles = toRowList(data.profiles);
  const posts = toRowList(data.posts);
  const requests = toRowList(data.requests);
  return {
    data: {
      accounts: {
        total: toNumber(data.accounts.total),
        new: toNumber(data.accounts.new),
        byRole,
      },
      profiles,
      posts,
      requests,
      finance: {
        income: data.finance.income,
        due: data.finance.due,
        records: data.finance.records,
        byService,
        expensesTracked: data.finance.expensesTracked === true,
      },
    },
    unavailable: false,
  };
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
  vehicle: 'যানবাহন',
  staff: 'কর্মী',
  blood_donor: 'রক্তদাতা',
  wifi: 'WiFi',
  coaching: 'কোচিং',
  other: 'অন্যান্য',
};

export const DEVICE_LABELS: Record<string, string> = {
  mobile: 'মোবাইল',
  tablet: 'ট্যাবলেট',
  desktop: 'ডেস্কটপ',
  unknown: 'অজানা',
};
