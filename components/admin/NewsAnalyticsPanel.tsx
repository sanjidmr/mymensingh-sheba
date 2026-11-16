import Link from 'next/link';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import { formatDate } from '@/lib/admin/format';
import type { NewsAnalyticsArticle, NewsAnalyticsData } from '@/lib/admin/news-analytics';

function bn(value: number): string {
  return value.toLocaleString('bn-BD');
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 rounded-admin-card border border-admin-border bg-white p-3">
      <p className="break-words text-xs text-admin-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-admin-text">{bn(value)}</p>
    </div>
  );
}

function TrendChart({
  title,
  points,
}: {
  title: string;
  points: NewsAnalyticsData['daily'];
}) {
  const max = Math.max(1, ...points.map((point) => point.pageViews));
  return (
    <div className="rounded-admin-card border border-admin-border bg-white p-4">
      <h3 className="text-sm font-bold text-admin-text">{title}</h3>
      {points.length === 0 ? (
        <p className="mt-3 text-xs text-admin-muted">কোনো ট্রাফিক ডেটা নেই।</p>
      ) : (
        <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
          {points.map((point) => (
            <div key={point.key} className="grid grid-cols-[5.5rem_minmax(0,1fr)_4.25rem] items-center gap-2 text-[11px]">
              <span className="truncate text-admin-muted">{point.key}</span>
              <div className="h-2 overflow-hidden rounded-full bg-admin-page" aria-label={`${point.key}: ${bn(point.pageViews)} views`}>
                <div className="h-full rounded-full bg-admin-navy" style={{ width: `${Math.max(2, (point.pageViews / max) * 100)}%` }} />
              </div>
              <span className="text-right tabular-nums">
                <strong className="block font-semibold">{bn(point.pageViews)}</strong>
                <span className="block text-[9px] text-admin-muted">ভিজিটর {bn(point.visitors)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RankedArticle({
  title,
  article,
  metric,
}: {
  title: string;
  article: NewsAnalyticsArticle | undefined;
  metric: (article: NewsAnalyticsArticle) => number;
}) {
  return (
    <div className="min-w-0 rounded-admin-card border border-admin-border bg-white p-4">
      <h3 className="text-xs font-semibold text-admin-muted">{title}</h3>
      {article ? (
        <Link href={`/news/${encodeURIComponent(article.slug)}`} target="_blank" rel="noopener noreferrer" className="mt-1 block min-w-0">
          <span className="block truncate text-sm font-bold text-admin-navy hover:underline">{article.title}</span>
          <span className="mt-1 inline-flex items-center gap-1 text-xs tabular-nums text-admin-text">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {bn(metric(article))}
          </span>
        </Link>
      ) : (
        <p className="mt-1 text-sm text-admin-muted">কোনো নিবন্ধ নেই।</p>
      )}
    </div>
  );
}

export default function NewsAnalyticsPanel({
  data,
  error,
  range,
  showArticleTable = false,
  searchParams,
}: {
  data: NewsAnalyticsData | null;
  error?: string;
  range?: 'today' | '7d' | '30d' | 'all';
  showArticleTable?: boolean;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!data) {
    return (
      <section className="rounded-admin-card border border-status-warning/30 bg-status-warning/5 p-4" aria-labelledby="news-analytics-title">
        <h2 id="news-analytics-title" className="font-bold text-admin-text">সংবাদ অ্যানালিটিক্স</h2>
        <p role="status" className="mt-2 text-sm text-admin-muted">{error ?? 'সংবাদ অ্যানালিটিক্স লোড করা যায়নি।'}</p>
      </section>
    );
  }

  const popular = [...data.articles].sort((a, b) => b.views - a.views || a.title.localeCompare(b.title))[0];
  const least = [...data.articles].sort((a, b) => a.totalViews - b.totalViews || a.title.localeCompare(b.title))[0];
  const trending = [...data.articles].sort(
    (a, b) =>
      (b.weeklyViews - b.previousWeekViews) - (a.weeklyViews - a.previousWeekViews) ||
      a.title.localeCompare(b.title)
  )[0];
  const engaged = [...data.articles].sort((a, b) => b.uniqueVisitors - a.uniqueVisitors || a.title.localeCompare(b.title))[0];
  const visibleArticles = showArticleTable ? data.articles : data.articles.slice(0, 10);
  const rangeLabel = range === 'today' ? 'আজ' : range === '7d' ? 'গত ৭ দিন' : range === 'all' ? 'সর্বকাল' : 'গত ৩০ দিন';
  const rangeHref = (value: string) => {
    const params = new URLSearchParams();
    for (const [key, paramValue] of Object.entries(searchParams ?? {})) {
      if (key === 'range' || paramValue === undefined) continue;
      if (Array.isArray(paramValue)) paramValue.forEach((item) => params.append(key, item));
      else params.set(key, paramValue);
    }
    params.set('range', value);
    return `/admin/news?${params.toString()}`;
  };

  return (
    <section className="space-y-4 rounded-admin-card border border-admin-border bg-admin-page/50 p-4 sm:p-5" aria-labelledby="news-analytics-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="news-analytics-title" className="text-lg font-bold text-admin-text">সংবাদ অ্যানালিটিক্স</h2>
          <p className="mt-1 text-xs text-admin-muted">প্রকাশিত সংবাদ {bn(data.totals.published)} · নিবন্ধের পেজ ভিউ ও ইউনিক ভিজিটর shared site_events থেকে।</p>
        </div>
        {range && (
          <nav className="flex flex-wrap gap-1.5" aria-label="সংবাদ অ্যানালিটিক্স সময়সীমা">
            {([
              ['today', 'আজ'],
              ['7d', 'গত ৭ দিন'],
              ['30d', 'গত ৩০ দিন'],
              ['all', 'সর্বকাল'],
            ] as const).map(([value, label]) => (
              <Link
                key={value}
                href={rangeHref(value)}
                aria-current={range === value ? 'page' : undefined}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${range === value ? 'border-admin-navy bg-admin-navy text-white' : 'border-admin-border bg-white text-admin-text hover:bg-admin-page'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <Metric label={`পেজ ভিউ · ${rangeLabel}`} value={data.totals.views} />
        <Metric label={`ইউনিক ভিজিটর · ${rangeLabel}`} value={data.totals.uniqueVisitors} />
        <Metric label="সর্বমোট পেজ ভিউ" value={data.totals.totalViews} />
        <Metric label="সর্বমোট ইউনিক ভিজিটর" value={data.totals.totalUniqueVisitors} />
        <Metric label="আজকের সংবাদ ভিউ" value={data.totals.todayViews} />
        <Metric label="আজকের সংবাদ ভিজিটর" value={data.totals.todayVisitors} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="গত ৭ দিনের ভিউ" value={data.totals.weeklyViews} />
        <Metric label="গত ৭ দিনের ভিজিটর" value={data.totals.weeklyVisitors} />
        <Metric label="গত ৩০ দিনের ভিউ" value={data.totals.monthlyViews} />
        <Metric label="গত ৩০ দিনের ভিজিটর" value={data.totals.monthlyVisitors} />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <RankedArticle title="জনপ্রিয় · নির্বাচিত সময়" article={popular} metric={(article) => article.views} />
        <RankedArticle title="কম দেখা · সর্বকাল" article={least} metric={(article) => article.totalViews} />
        <RankedArticle title="ট্রেন্ডিং · গত ৭ দিন বনাম আগের ৭ দিন" article={trending} metric={(article) => article.weeklyViews} />
        <RankedArticle title="সর্বাধিক ইউনিক ভিজিটর" article={engaged} metric={(article) => article.uniqueVisitors} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <TrendChart title="দৈনিক সংবাদ ট্রাফিক" points={data.daily} />
        <TrendChart title="সাপ্তাহিক সংবাদ ট্রাফিক" points={data.weekly} />
        <TrendChart title="মাসিক সংবাদ ট্রাফিক" points={data.monthly} />
      </div>

      <div className="rounded-md border border-admin-border bg-white p-3 text-xs leading-relaxed text-admin-muted">
        সংবাদে শেয়ার ইভেন্ট এবং নির্ভরযোগ্য reading-time পরিমাপ বর্তমানে সংরক্ষিত হয় না; তাই এগুলোর সংখ্যা দেখানো হয়নি। ভিজিটর গণনায় পরিচয়যোগ্য guest/account event ব্যবহৃত হয়েছে; bot ও অভ্যন্তরীণ traffic বাদ।
      </div>

      <div className="overflow-hidden rounded-admin-card border border-admin-border bg-white">
        <h3 className="border-b border-admin-border px-4 py-3 text-sm font-bold text-admin-text">
          {showArticleTable ? 'প্রতিটি সংবাদের পারফরম্যান্স' : 'শীর্ষ ১০ সংবাদ · নিবন্ধভিত্তিক পারফরম্যান্স'}
        </h3>
        {visibleArticles.length === 0 ? (
          <p className="p-4 text-sm text-admin-muted">কোনো সংবাদ নিবন্ধ নেই।</p>
        ) : (
          <div className="divide-y divide-admin-border">
            {visibleArticles.map((article) => (
              <div key={article.slug} className="grid gap-2 p-3 sm:grid-cols-[minmax(12rem,1.5fr)_repeat(5,minmax(4rem,1fr))] sm:items-center sm:px-4">
                <Link href={`/news/${encodeURIComponent(article.slug)}`} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2">
                  {article.thumbnail ? (
                    <Image src={article.thumbnail} alt="" width={56} height={40} unoptimized className="h-10 w-14 shrink-0 rounded object-cover" />
                  ) : (
                    <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-admin-page text-admin-muted"><Eye className="h-4 w-4" aria-hidden="true" /></span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-admin-navy">{article.title}</span>
                    <span className="block text-[11px] text-admin-muted">{formatDate(article.publishedAt)} · {article.status === 'approved' ? 'প্রকাশিত' : article.status}</span>
                  </span>
                </Link>
                <div className="grid grid-cols-3 gap-2 text-xs sm:col-span-5 sm:grid-cols-5">
                  <span><span className="block text-admin-muted">মোট ভিউ</span><strong className="tabular-nums">{bn(article.totalViews)}</strong></span>
                  <span><span className="block text-admin-muted">ইউনিক</span><strong className="tabular-nums">{bn(article.totalVisitors)}</strong></span>
                  <span><span className="block text-admin-muted">আজ</span><strong className="tabular-nums">{bn(article.todayViews)}</strong></span>
                  <span><span className="block text-admin-muted">৭ দিন</span><strong className="tabular-nums">{bn(article.weeklyViews)}</strong></span>
                  <span><span className="block text-admin-muted">৩০ দিন</span><strong className="tabular-nums">{bn(article.monthlyViews)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
