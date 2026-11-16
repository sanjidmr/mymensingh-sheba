import { getAdminDataClient } from './queries';

export interface NewsAnalyticsArticle {
  slug: string;
  title: string;
  thumbnail: string | null;
  status: string;
  publishedAt: string | null;
  totalViews: number;
  totalVisitors: number;
  views: number;
  uniqueVisitors: number;
  todayViews: number;
  todayVisitors: number;
  weeklyViews: number;
  weeklyVisitors: number;
  monthlyViews: number;
  monthlyVisitors: number;
  previousWeekViews: number;
}

export interface NewsAnalyticsData {
  totals: {
    published: number;
    views: number;
    uniqueVisitors: number;
    totalViews: number;
    totalUniqueVisitors: number;
    todayViews: number;
    todayVisitors: number;
    weeklyViews: number;
    weeklyVisitors: number;
    monthlyViews: number;
    monthlyVisitors: number;
  };
  articles: NewsAnalyticsArticle[];
  daily: { key: string; pageViews: number; visitors: number }[];
  weekly: { key: string; pageViews: number; visitors: number }[];
  monthly: { key: string; pageViews: number; visitors: number }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCount(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseTrend(value: unknown): NewsAnalyticsData['daily'] | null {
  if (!Array.isArray(value)) return null;
  const result: NewsAnalyticsData['daily'] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.key !== 'string') return null;
    const pageViews = readCount(item.pageViews);
    const visitors = readCount(item.visitors);
    if (pageViews === null || visitors === null) return null;
    result.push({ key: item.key, pageViews, visitors });
  }
  return result;
}

function parseNewsAnalytics(value: unknown): NewsAnalyticsData | null {
  if (!isRecord(value) || !isRecord(value.totals) || !Array.isArray(value.articles)) return null;
  const totalKeys = [
    'published',
    'views',
    'uniqueVisitors',
    'totalViews',
    'totalUniqueVisitors',
    'todayViews',
    'todayVisitors',
    'weeklyViews',
    'weeklyVisitors',
    'monthlyViews',
    'monthlyVisitors',
  ] as const;
  const totals = {} as NewsAnalyticsData['totals'];
  for (const key of totalKeys) {
    const count = readCount(value.totals[key]);
    if (count === null) return null;
    totals[key] = count;
  }

  const articles: NewsAnalyticsArticle[] = [];
  for (const item of value.articles) {
    if (
      !isRecord(item) ||
      typeof item.slug !== 'string' ||
      typeof item.title !== 'string' ||
      typeof item.status !== 'string' ||
      (item.thumbnail !== null && typeof item.thumbnail !== 'string') ||
      (item.publishedAt !== null && typeof item.publishedAt !== 'string')
    ) return null;
    const counts = {} as Omit<NewsAnalyticsArticle, 'slug' | 'title' | 'thumbnail' | 'status' | 'publishedAt'>;
    const countKeys = [
      'totalViews',
      'totalVisitors',
      'views',
      'uniqueVisitors',
      'todayViews',
      'todayVisitors',
      'weeklyViews',
      'weeklyVisitors',
      'monthlyViews',
      'monthlyVisitors',
      'previousWeekViews',
    ] as const;
    for (const key of countKeys) {
      const count = readCount(item[key]);
      if (count === null) return null;
      counts[key] = count;
    }
    articles.push({
      slug: item.slug,
      title: item.title,
      thumbnail: item.thumbnail,
      status: item.status,
      publishedAt: item.publishedAt,
      ...counts,
    });
  }

  const daily = parseTrend(value.daily);
  const weekly = parseTrend(value.weekly);
  const monthly = parseTrend(value.monthly);
  if (!daily || !weekly || !monthly) return null;
  return { totals, articles, daily, weekly, monthly };
}

export async function fetchNewsAnalytics(input: {
  from?: string | null;
  to?: string | null;
}): Promise<{ data: NewsAnalyticsData | null; error?: string }> {
  const from = input.from ?? null;
  const to = input.to ?? null;
  const isDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date);
  if ((from === null) !== (to === null) || (from && (!isDate(from) || !isDate(to!) || to! < from))) {
    return { data: null, error: 'সংবাদ অ্যানালিটিক্সের তারিখ সঠিক নয়।' };
  }

  const admin = await getAdminDataClient();
  if (!admin) return { data: null, error: 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।' };
  const { data, error } = await admin.client.rpc('get_news_analytics', {
    p_from: from,
    p_to: to,
  });
  if (error) return { data: null, error: error.message };
  const parsed = parseNewsAnalytics(data);
  if (!parsed) return { data: null, error: 'সংবাদ অ্যানালিটিক্সের ডেটা ফরম্যাট সঠিক নয়।' };
  return { data: parsed };
}
