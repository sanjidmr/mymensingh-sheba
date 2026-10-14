import type React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  Eye,
  Filter,
  MousePointerClick,
  Phone,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import {
  CTA_TYPE_LABELS,
  DEVICE_LABELS,
  EVENT_TYPE_LABELS,
  SERVICE_LABELS,
  fetchWebsiteAnalytics,
} from '@/lib/admin/website-analytics';
import type {
  WebsiteAnalyticsData,
  WebsiteAnalyticsRow,
  WebsiteAnalyticsServiceCtaRow,
} from '@/lib/admin/website-analytics';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  from?: string;
  to?: string;
  category?: string;
  route?: string;
  eventType?: string;
}>;

const SERVICE_CATEGORY_SLUGS = new Set([
  'kajer-bua',
  'electrician',
  'plumber',
  'basha-paltano',
  'ac-fridge',
]);

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function bn(value: number): string {
  return value.toLocaleString('bn-BD');
}

function percent(numerator: number, denominator: number): string | null {
  if (denominator <= 0) return null;
  return ((numerator / denominator) * 100).toLocaleString('bn-BD', { maximumFractionDigits: 1 });
}

/** A label for a vocabulary value, falling back to the raw key, never guessed. */
function labelFor(key: string, map: Record<string, string>): string {
  return map[key] ?? key.replaceAll('_', ' ');
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: typeof Users;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-page text-admin-navy">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="break-words text-xs text-admin-muted">{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-admin-text">{bn(value)}</p>
        {hint && <p className="mt-0.5 break-words text-[11px] leading-snug text-admin-muted">{hint}</p>}
      </div>
    </div>
  );
}

/** A ranked list of label/count rows. Never invents a row when the list is empty. */
function RankedList({
  title,
  description,
  rows,
  labelMap,
  secondaryLabel,
  emptyText = 'এই সময়সীমায় কোনো রেকর্ড নেই।',
  renderKey,
}: {
  title: string;
  description?: string;
  rows: WebsiteAnalyticsRow[];
  labelMap?: Record<string, string>;
  secondaryLabel?: string;
  emptyText?: string;
  renderKey?: (row: WebsiteAnalyticsRow) => React.ReactNode;
}) {
  return (
    <Panel title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-admin-muted">{emptyText}</p>
      ) : (
        <div className="divide-y divide-admin-border">
          {rows.map((row, index) => (
            <div
              key={`${row.key}-${index}`}
              className="flex min-w-0 items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <span className="min-w-0 break-words text-sm text-admin-text">
                {renderKey ? renderKey(row) : labelMap ? labelFor(row.key, labelMap) : row.key}
              </span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-admin-navy">
                {bn(row.count)}
                {secondaryLabel && row.secondaryCount !== undefined && (
                  <span className="ml-1 text-xs font-normal text-admin-muted">
                    ({secondaryLabel}: {bn(row.secondaryCount)})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function TrendBars({
  title,
  description,
  points,
  showSessions,
}: {
  title: string;
  description?: string;
  points: { key: string; pageViews: number; visitors: number; sessions?: number }[];
  showSessions?: boolean;
}) {
  const maximum = Math.max(1, ...points.map((point) => point.pageViews));
  return (
    <Panel title={title} description={description}>
      {points.length === 0 ? (
        <AdminEmpty title="এই সময়ে কোনো ডেটা নেই" />
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {points.map((point) => (
            <div
              key={point.key}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-xs"
            >
              <span className="text-admin-muted">{point.key}</span>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-admin-page"
                role="img"
                aria-label={`${point.key}: ${point.pageViews} পেজ ভিউ, ${point.visitors} ভিজিটর`}
              >
                <div
                  className="h-full rounded-full bg-admin-navy"
                  style={{ width: `${Math.max(2, (point.pageViews / maximum) * 100)}%` }}
                />
              </div>
              <span className="text-right font-semibold tabular-nums text-admin-text">
                {bn(point.pageViews)}
                {showSessions && point.sessions !== undefined && (
                  <span className="block text-[10px] font-normal text-admin-muted">
                    ভিজিটর {bn(point.visitors)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ServiceCtaCtr({
  categories,
  ctas,
}: {
  categories: WebsiteAnalyticsRow[];
  ctas: WebsiteAnalyticsServiceCtaRow[];
}) {
  // Pair the two measured sets by category. Only service pages are used as the
  // denominator — a "সেবা নিন" press divided by every page view on the site
  // would be a ratio with no meaning.
  const clickByCategory = new Map<string, number>();
  for (const cta of ctas) {
    if (!cta.category) continue;
    clickByCategory.set(cta.category, (clickByCategory.get(cta.category) ?? 0) + cta.count);
  }
  const rows = categories
    .filter((row) => SERVICE_CATEGORY_SLUGS.has(row.key) && row.count > 0)
    .map((row) => ({
      key: row.key,
      views: row.count,
      clicks: clickByCategory.get(row.key) ?? 0,
    }));

  return (
    <Panel
      title="“সেবা নিন” ক্লিক-থ্রু হার"
      description="সার্ভিস পেজ ভিউ-এর তুলনায় বাটন চাপার হার। এটি অনুরোধ সম্পন্ন হওয়ার হার নয় — শুধু বাটন চাপা।"
    >
      {rows.length === 0 ? (
        <p className="text-sm text-admin-muted">গণনার জন্য যথেষ্ট ডেটা নেই।</p>
      ) : (
        <div className="divide-y divide-admin-border">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 break-words text-sm text-admin-text">
                {labelFor(row.key, SERVICE_LABELS)}
              </span>
              <span className="shrink-0 text-right text-sm tabular-nums text-admin-navy">
                <strong className="font-semibold">
                  {percent(row.clicks, row.views) ?? '—'}%
                </strong>
                <span className="ml-1 text-xs font-normal text-admin-muted">
                  ({bn(row.clicks)}/{bn(row.views)})
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ToLetPanel({ data }: { data: WebsiteAnalyticsData }) {
  const { tolet } = data;
  const callCtr = percent(tolet.callClicks, tolet.views);
  return (
    <Panel
      title="বাসা ভাড়া (To-Let) এনগেজমেন্ট"
      description="বিদ্যমান tolet_listing_events থেকে; শুধু নির্বাচিত তারিখসীমা ব্যবহার করে, উপরের category/route ফিল্টার এখানে প্রযোজ্য নয়। “কল করুন” মানে বাটন চাপা — সম্পন্ন ফোনকল নয়।"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-admin-border bg-admin-page p-3">
          <p className="text-xs text-admin-muted">তালিকা দেখা</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-admin-text">{bn(tolet.views)}</p>
        </div>
        <div className="rounded-lg border border-admin-border bg-admin-page p-3">
          <p className="text-xs text-admin-muted">“কল করুন” বাটন চাপা</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-admin-text">{bn(tolet.callClicks)}</p>
          <p className="mt-0.5 text-[11px] text-admin-muted">
            প্রতি ভিউয়ে চাপ {callCtr ?? '—'}%
          </p>
        </div>
        <div className="rounded-lg border border-admin-border bg-admin-page p-3">
          <p className="text-xs text-admin-muted">WhatsApp বাটন চাপা</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-admin-text">
            {bn(tolet.whatsappClicks)}
          </p>
          <p className="mt-0.5 text-[11px] text-admin-muted">পছন্দ {bn(tolet.favorites)} · শেয়ার {bn(tolet.shares)}</p>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {tolet.topListings.length === 0 ? (
          <p className="text-sm text-admin-muted">এই সময়সীমায় কোনো To-Let এনগেজমেন্ট নেই।</p>
        ) : (
          <table className="w-full min-w-[38rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-admin-border text-left text-xs text-admin-muted">
                <th className="py-2 pr-3 font-semibold">তালিকা</th>
                <th className="py-2 pr-3 text-right font-semibold">দেখা</th>
                <th className="py-2 pr-3 text-right font-semibold">কল ক্লিক</th>
                <th className="py-2 pr-3 text-right font-semibold">WhatsApp</th>
                <th className="py-2 text-right font-semibold">মোট যোগাযোগ চাপ</th>
              </tr>
            </thead>
            <tbody>
              {tolet.topListings.map((listing) => (
                <tr key={listing.listingId} className="border-b border-admin-border last:border-0">
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/tolet/${encodeURIComponent(listing.listingId)}`}
                      className="font-semibold text-admin-navy hover:underline"
                    >
                      {listing.title ?? listing.listingId}
                    </Link>
                    <span className="mt-0.5 block text-[11px] text-admin-muted">
                      {[listing.areaId, listing.propertyType, listing.status]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{bn(listing.views)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{bn(listing.callClicks)}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{bn(listing.whatsappClicks)}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">{bn(listing.contactClicks)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
}

function WebsiteAnalyticsSections({ data }: { data: WebsiteAnalyticsData }) {
  const { totals } = data;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile label="মোট পেজ ভিউ (নির্বাচিত সময়)" value={totals.pageViews} icon={Eye} />
        <StatTile
          label="আনুমানিক ইউনিক ভিজিটর"
          value={totals.uniqueVisitors}
          hint={`নতুন ${bn(totals.newVisitors)} · ফিরে আসা ${bn(totals.returningVisitors)}`}
          icon={Users}
        />
        <StatTile
          label="সেশন"
          value={totals.sessions}
          hint="এক ট্যাব-সেশনে একবার"
          icon={TrendingUp}
        />
        <StatTile label="আজকের ভিজিটর" value={totals.todayVisitors} icon={UserCheck} />
        <StatTile label="আজকের পেজ ভিউ" value={totals.todayPageViews} icon={ChartNoAxesColumnIncreasing} />
        <StatTile
          label="CTA বাটন ক্লিক"
          value={totals.ctaClicks}
          hint="বাটন চাপা, সম্পন্ন কাজ নয়"
          icon={MousePointerClick}
        />
        <StatTile
          label="নিশ্চিত ফর্ম জমা"
          value={totals.formSubmits}
          hint="ডেটাবেজ গ্রহণ করার পর গোনা"
          icon={Phone}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TrendBars
          title="দৈনিক ভিজিট"
          description="নির্বাচিত সময়ের প্রতিদিনের পেজ ভিউ ও ইউনিক ভিজিটর; শূন্য দিনসহ।"
          points={data.daily}
          showSessions
        />
        <div className="grid gap-4">
          <TrendBars title="সাপ্তাহিক" description="সপ্তাহের শুরু অনুযায়ী।" points={data.weekly} />
          <TrendBars title="মাসিক" description="মাস অনুযায়ী।" points={data.monthly} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="সর্বাধিক দেখা পেজ"
          description="path ভিত্তিক; বন্ধনীতে ইউনিক ভিজিটর।"
          rows={data.topPages}
          secondaryLabel="ভিজিটর"
          renderKey={(row) => (
            <Link
              href={row.key}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {row.key}
            </Link>
          )}
        />
        <RankedList
          title="ল্যান্ডিং পেজ"
          description="যে পাতায় সেশন শুরু হয়েছে; বন্ধনীতে ইউনিক ভিজিটর।"
          rows={data.landingPages}
          secondaryLabel="ভিজিটর"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="সর্বাধিক দেখা কনটেন্ট ও তালিকা"
          description="পোস্ট, বাসা ভাড়া ও সার্ভিস পেজ; বন্ধনীতে ইউনিক ভিজিটর।"
          rows={data.topContent}
          secondaryLabel="ভিজিটর"
          renderKey={(row) => {
            const rich = row as WebsiteAnalyticsRow & { contentId?: string | null; kind?: string | null };
            if (rich.kind === 'tolet' && rich.contentId) {
              return (
                <Link
                  href={`/admin/tolet/${encodeURIComponent(rich.contentId)}`}
                  className="font-semibold text-admin-navy hover:underline"
                >
                  {row.key}
                </Link>
              );
            }
            return (
              <Link href={row.key} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {row.key}
              </Link>
            );
          }}
        />
        <RankedList
          title="জনপ্রিয় সার্ভিস ক্যাটাগরি"
          description="সার্ভিস পেজের ভিজিট অনুযায়ী; বন্ধনীতে ইউনিক ভিজিটর।"
          rows={data.topCategories}
          labelMap={SERVICE_LABELS}
          secondaryLabel="ভিজিটর"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="CTA বাটন ক্লিক (ধরন অনুযায়ী)"
          description="বাটন চাপা — সম্পন্ন কল, বুকিং বা অনুরোধের প্রমাণ নয়।"
          rows={data.ctaClicks}
          labelMap={CTA_TYPE_LABELS}
          secondaryLabel="ভিজিটর"
        />
        <RankedList
          title="নিশ্চিত ফর্ম জমা"
          description="শুধু ডেটাবেজ গ্রহণ করা জমা; CTA বাটন চাপার সঙ্গে মেলানো হয়নি।"
          rows={data.formSubmits}
          labelMap={CTA_TYPE_LABELS}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="“সেবা নিন” বাটন — সর্বাধিক চাপা"
          description="path ও ক্যাটাগরি অনুযায়ী বাটন চাপার সংখ্যা।"
        >
          {data.serviceCtas.length === 0 ? (
            <p className="text-sm text-admin-muted">এই সময়সীমায় কোনো “সেবা নিন” ক্লিক নেই।</p>
          ) : (
            <div className="divide-y divide-admin-border">
              {data.serviceCtas.map((row, index) => (
                <div
                  key={`${row.key}-${index}`}
                  className="flex min-w-0 items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 break-words text-sm text-admin-text">
                    {row.key}
                    {row.category && (
                      <span className="ml-1 text-xs text-admin-muted">
                        · {labelFor(row.category, SERVICE_LABELS)}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-admin-navy">
                    {bn(row.count)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <ServiceCtaCtr categories={data.topCategories} ctas={data.serviceCtas} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="ডিভাইস (সেশন অনুযায়ী)"
          description="স্ক্রিন প্রস্থ থেকে অনুমান; বন্ধনীতে ইউনিক ভিজিটর।"
          rows={data.devices}
          labelMap={DEVICE_LABELS}
          secondaryLabel="ভিজিটর"
        />
        <RankedList
          title="রেফারেল সোর্স"
          description="ল্যান্ডিং সেশনের হোস্টনেম; সরাসরি প্রবেশ = “direct”। শুধু হোস্ট সংরক্ষিত, সম্পূর্ণ URL নয়।"
          rows={data.referrers}
        />
      </div>

      <ToLetPanel data={data} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RankedList
          title="সফল সার্ভিস অনুরোধ (তথ্যভাণ্ডারে)"
          description="service_requests টেবিলে নির্বাচিত সময়ে জমা হওয়া প্রকৃত অনুরোধ, service slug অনুযায়ী।"
          rows={data.requests.serviceRequests}
          labelMap={SERVICE_LABELS}
          emptyText="এই সময়ে কোনো সেবা অনুরোধ জমা হয়নি।"
        />
        <Panel
          title="সফল যানবাহন অনুরোধ"
          description="vehicle_requests টেবিলে নির্বাচিত সময়ে জমা হওয়া প্রকৃত অনুরোধ।"
        >
          <p className="text-2xl font-bold tabular-nums text-admin-text">
            {bn(data.requests.vehicleRequests)}
          </p>
        </Panel>
      </div>
    </>
  );
}

export default async function WebsiteAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const today = localDateString(new Date());
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);
  const from = params.from ?? localDateString(monthAgo);
  const to = params.to ?? today;
  const category = params.category?.trim() || undefined;
  const route = params.route?.trim() || undefined;
  const eventType = params.eventType || undefined;

  const result = await fetchWebsiteAnalytics({ from, to, category, route, eventType });

  return (
    <div className="space-y-5">
      <PageHeader
        title="ওয়েবসাইট অ্যানালিটিক্স"
        description="প্রকৃত site_events ও tolet_listing_events থেকে ডেটাবেজ-স্তরে সংকলিত পরিসংখ্যান। কোনো অনুমান বা নকল ডেটা নেই।"
        breadcrumb={{ href: '/admin/analytics', label: 'অ্যানালিটিক্স' }}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-admin-border bg-white px-3 py-2 text-xs text-admin-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {from} → {to}
          </span>
        }
      />

      <form
        method="get"
        className="grid gap-3 rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto] xl:items-end"
      >
        <label className="grid gap-1.5 text-xs font-semibold text-admin-text">
          শুরু
          <input
            type="date"
            name="from"
            required
            defaultValue={from}
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-admin-text">
          শেষ
          <input
            type="date"
            name="to"
            required
            defaultValue={to}
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-admin-text">
          ক্যাটাগরি
          <input
            type="text"
            name="category"
            defaultValue={category ?? ''}
            placeholder="যেমন: kajer-bua"
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-admin-text">
          রুট
          <input
            type="text"
            name="route"
            defaultValue={route ?? ''}
            placeholder="যেমন: /news/my-post"
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-admin-text">
          ইভেন্ট ধরন
          <select
            name="eventType"
            defaultValue={eventType ?? ''}
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          >
            <option value="">সব ধরন</option>
            <option value="page_view">{EVENT_TYPE_LABELS.page_view}</option>
            <option value="session_start">{EVENT_TYPE_LABELS.session_start}</option>
            <option value="cta_click">{EVENT_TYPE_LABELS.cta_click}</option>
            <option value="form_submit">{EVENT_TYPE_LABELS.form_submit}</option>
          </select>
        </label>
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90 focus:outline-none focus:ring-2 focus:ring-admin-navy/40 focus:ring-offset-2"
        >
          <Filter className="h-4 w-4" aria-hidden="true" />
          প্রয়োগ করুন
        </button>
        <p className="text-[11px] leading-snug text-admin-muted sm:col-span-2 xl:col-span-6">
          category/route/event ফিল্টার পেজ-ভিউ, ভিজিটর ও CTA পরিসংখ্যানকে সংকুচিত করে। বাসা ভাড়া ও
          সফল অনুরোধ বিভাগ শুধু তারিখসীমা ব্যবহার করে।
        </p>
      </form>

      {result.error ? (
        <AdminError
          title={result.unavailable ? 'অ্যানালিটিক্স অনুপলভ্য' : 'তথ্য লোড করা যায়নি'}
          message={result.error}
        />
      ) : result.data ? (
        <WebsiteAnalyticsSections data={result.data} />
      ) : (
        <AdminError title="তথ্য লোড করা যায়নি" message="কোনো অ্যানালিটিক্স ডেটা ফেরত আসেনি।" />
      )}
    </div>
  );
}
