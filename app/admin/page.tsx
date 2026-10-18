import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Eye,
  FileText,
  Flag,
  Heart,
  MessageCircle,
  MousePointerClick,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminEmpty, AdminError, AdminNotice } from '@/components/admin/States';
import { StatCard, StatGrid, StatusPill } from '@/components/admin/StatCard';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { DashboardRangeTabs } from '@/components/admin/DashboardRangeTabs';
import { BarChart } from '@/components/admin/charts/BarChart';
import type { BarChartRow } from '@/components/admin/charts/BarChart';
import { DonutChart } from '@/components/admin/charts/DonutChart';
import type { DonutSlice } from '@/components/admin/charts/DonutChart';
import { LineChart } from '@/components/admin/charts/LineChart';
import type { LineChartSeries } from '@/components/admin/charts/LineChart';
import { TrendBadge } from '@/components/admin/charts/TrendBadge';
import { CHART_COLORS } from '@/components/admin/charts/colors';
import {
  fetchAdminNotifications,
  fetchDashboardPendingItems,
  fetchDashboardStats,
  fetchRecentActivity,
} from '@/lib/admin/queries';
import {
  DEVICE_LABELS,
  SERVICE_LABELS,
  fetchWebsiteAnalytics,
} from '@/lib/admin/website-analytics';
import type { WebsiteAnalyticsData, WebsiteAnalyticsRow } from '@/lib/admin/website-analytics';
import { formatDateTime, formatRelative, lookupStatus } from '@/lib/admin/format';
import {
  formatBnNumber,
  metricTrend,
  percentOf,
  resolveDashboardRange,
  sumRows,
} from '@/lib/admin/dashboard-metrics';
import type { MetricTrend, ResolvedDashboardRange } from '@/lib/admin/dashboard-metrics';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ range?: string; from?: string; to?: string }>;

export default async function AdminDashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const range = resolveDashboardRange(params);
  const query = range.isCustom ? `from=${range.from}&to=${range.to}` : `range=${range.key}`;

  return (
    <>
      <PageHeader
        title="অ্যাডমিন ড্যাশবোর্ড"
        description="ওয়েবসাইট ট্রাফিক, নিবন্ধন, অনুরোধ ও মডারেশনের প্রকৃত ডেটা এক নজরে। প্রতিটি সংখ্যা ডেটাবেজ থেকে সরাসরি গণনা করা — কোনো নকল বা অনুমান করা মান নেই।"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            <DashboardRangeTabs
              activeKey={range.key}
              customLabel={range.isCustom ? range.label : undefined}
            />
            <Suspense fallback={null}>
              <details className="admin-menu relative" data-admin-menu>
                <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1.5 rounded-md border border-admin-border bg-white px-3 text-xs font-semibold text-admin-navy hover:bg-admin-page [&::-webkit-details-marker]:hidden">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  কাস্টম তারিখ
                </summary>
                <div className="absolute right-0 top-11 z-50 w-64 rounded-admin-card border border-admin-border bg-white p-3 shadow-admin-popover">
                  <DateRangeFilter />
                  <p className="mt-2 text-[11px] leading-snug text-admin-muted">
                    তারিখ নির্বাচন করলে প্রিসেট ট্যাবের বদলে এই সময়সীমা ব্যবহার হবে।
                  </p>
                </div>
              </details>
            </Suspense>
            <Link
              href={`/admin?${query}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control border border-admin-border bg-white px-3 text-sm font-semibold text-admin-navy hover:bg-admin-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              রিফ্রেশ
            </Link>
            <Link
              href="/admin/services/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              নতুন কর্মী/সেবা
            </Link>
          </div>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent range={range} />
      </Suspense>
    </>
  );
}

async function DashboardContent({ range }: { range: ResolvedDashboardRange }) {
  const [stats, currentResult, previousResult, activity, pending, notifications] = await Promise.all([
    fetchDashboardStats(),
    fetchWebsiteAnalytics({ from: range.from, to: range.to }),
    fetchWebsiteAnalytics({ from: range.previousFrom, to: range.previousTo }),
    fetchRecentActivity(10),
    fetchDashboardPendingItems(10),
    fetchAdminNotifications({ page: 1, pageSize: 6 }, true),
  ]);

  if (stats.unavailable) {
    return (
      <AdminError
        title={stats.issue?.title ?? 'ড্যাশবোর্ডের তথ্য লোড করা যায়নি'}
        message={stats.issue?.message}
      />
    );
  }

  const current = currentResult.data;
  const previous = previousResult.data;
  const pendingContent =
    stats.pending_posts + stats.pending_tolet_listings + stats.pending_verifications;

  // Comparisons are only produced when the previous window was actually read.
  // A missing denominator is shown as "no comparison", never as 0%.
  const trendOf = (
    currentValue: number,
    previousValue: number,
    options?: { higherIsBetter?: boolean }
  ): MetricTrend | undefined =>
    previous ? metricTrend(currentValue, previousValue, options) : undefined;

  const getServiceClicks = current
    ? current.ctaClicks.find((row) => row.key === 'get_service')?.count ?? 0
    : 0;
  const prevServiceClicks = previous
    ? previous.ctaClicks.find((row) => row.key === 'get_service')?.count ?? 0
    : 0;
  const confirmedRequests = current ? sumRows(current.requests.serviceRequests) : 0;
  const prevConfirmedRequests = previous ? sumRows(previous.requests.serviceRequests) : 0;
  const conversionRate = current ? percentOf(confirmedRequests, getServiceClicks) : null;
  const prevConversionRate = previous ? percentOf(prevConfirmedRequests, prevServiceClicks) : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      {stats.empty && (
        <AdminNotice tone="info" title="প্ল্যাটফর্মে এখনো কোনো রেকর্ড নেই">
          Supabase সংযুক্ত, কিন্তু ড্যাশবোর্ডে দেখানোর মতো কোনো রেকর্ড এখনো তৈরি হয়নি।
        </AdminNotice>
      )}

      {!current && (
        <AdminNotice tone="warning" title="ওয়েবসাইট অ্যানালিটিক্স অনুপলভ্য">
          {currentResult.error ??
            previousResult.error ??
            'ওয়েবসাইট অ্যানালিটিক্স মাইগ্রেশন এখনো চালানো হয়নি, অথবা RLS অনুমতি দিচ্ছে না। মাইগ্রেশন চালানোর পর এখানে ভিজিট, পেজ ভিউ ও ক্লিকের প্রকৃত পরিসংখ্যান দেখা যাবে।'}
        </AdminNotice>
      )}

      {current && (
        <section aria-labelledby="website-performance-title">
          <SectionHeading
            id="website-performance-title"
            title={`ওয়েবসাইট পারফরম্যান্স · ${range.label}`}
            description="নির্বাচিত সময়ের প্রকৃত কাউন্ট; পাশের চিহ্নটি আগের সমপরিমাণ সময়ের সাথে তুলনা।"
          />
          <StatGrid>
            <MetricCard
              label="মোট ভিজিট (সেশন)"
              value={current.totals.sessions}
              hint="এক ট্যাব-সেশনে একবার"
              icon={TrendingUp}
              href="/admin/analytics/website"
              trend={trendOf(current.totals.sessions, previous?.totals.sessions ?? 0)}
            />
            <MetricCard
              label="অনন্য ভিজিটর"
              value={current.totals.uniqueVisitors}
              hint={`নতুন ${formatBnNumber(current.totals.newVisitors)} · ফিরে আসা ${formatBnNumber(current.totals.returningVisitors)}`}
              icon={Users}
              href="/admin/analytics/website"
              trend={trendOf(current.totals.uniqueVisitors, previous?.totals.uniqueVisitors ?? 0)}
            />
            <MetricCard
              label="পেজ ভিউ"
              value={current.totals.pageViews}
              hint={`আজ ${formatBnNumber(current.totals.todayPageViews)}`}
              icon={Eye}
              href="/admin/analytics/website"
              trend={trendOf(current.totals.pageViews, previous?.totals.pageViews ?? 0)}
            />
            <MetricCard
              label="“সেবা নিন” ক্লিক"
              value={getServiceClicks}
              hint="বাটন চাপা, সম্পন্ন অনুরোধ নয়"
              icon={MousePointerClick}
              href="/admin/analytics/website"
              trend={trendOf(getServiceClicks, prevServiceClicks)}
            />
            <MetricCard
              label="সেবা অনুরোধ (নিশ্চিত)"
              value={confirmedRequests}
              hint="ডেটাবেজে জমা হওয়া প্রকৃত অনুরোধ"
              icon={ClipboardList}
              href="/admin/requests"
              trend={trendOf(confirmedRequests, prevConfirmedRequests)}
            />
            <MetricCard
              label="কনভার্সন হার"
              value={conversionRate === null ? '—' : `${formatBnNumber(conversionRate, 1)}%`}
              hint={
                prevConversionRate === null
                  ? '“সেবা নিন” ক্লিক ÷ নিশ্চিত অনুরোধ'
                  : `আগের সময়: ${formatBnNumber(prevConversionRate, 1)}%`
              }
              icon={TrendingUp}
              href="/admin/requests"
              trend={
                conversionRate !== null && prevConversionRate !== null
                  ? metricTrend(conversionRate, prevConversionRate)
                  : undefined
              }
            />
            <MetricCard
              label="To-Let “কল করুন” ক্লিক"
              value={current.tolet.callClicks}
              hint={`তালিকা দেখা ${formatBnNumber(current.tolet.views)}`}
              icon={Phone}
              href="/admin/analytics/website"
              trend={trendOf(current.tolet.callClicks, previous?.tolet.callClicks ?? 0)}
            />
            <MetricCard
              label="WhatsApp ক্লিক"
              value={current.tolet.whatsappClicks}
              hint={`বাসা ভাড়ার তালিকা থেকে ${formatBnNumber(current.tolet.favorites)} পছন্দ`}
              icon={MessageCircle}
              href="/admin/analytics/website"
              trend={trendOf(current.tolet.whatsappClicks, previous?.tolet.whatsappClicks ?? 0)}
            />
          </StatGrid>
          <p className="mt-3 text-[11px] leading-relaxed text-admin-muted">
            সংজ্ঞা: সেশন = একটি ট্যাব-সেশনে একবার · অনন্য ভিজিটর = বেনামী আইডি অনুযায়ী · কনভার্সন
            হার = নিশ্চিত সেবা অনুরোধ ÷ “সেবা নিন” ক্লিক · “কল করুন” মানে বাটন চাপা, সম্পন্ন ফোনকল নয়।
          </p>
        </section>
      )}

      {current && (
        <Panel
          title="দৈনিক ভিজিটর ও পেজ ভিউ"
          description={`${range.label} · শূন্য দিনসহ প্রতিদিনের প্রকৃত কাউন্ট${
            previous && previous.daily.length === current.daily.length
              ? '; ছোট ড্যাশ-লাইনটি আগের সময়ের অনন্য ভিজিটর'
              : ''
          }।`}
        >
          <LineChart
            ariaLabel={`${range.label}: দৈনিক অনন্য ভিজিটর ও পেজ ভিউ`}
            labels={current.daily.map((point) => shortDate(point.key))}
            series={buildDailySeries(current, previous)}
          />
        </Panel>
      )}

      {current && (
        <Panel
          title="সেবা অনুযায়ী ক্লিক ও অনুরোধ"
          description="“সেবা নিন” বাটন চাপা এবং ডেটাবেজে নিশ্চিত হওয়া সেবা অনুরোধ। বাটন চাপা মানেই সম্পন্ন অনুরোধ নয়।"
        >
          <BarChart
            ariaLabel="সেবা ক্যাটাগরি অনুযায়ী “সেবা নিন” ক্লিক ও নিশ্চিত অনুরোধ"
            rows={servicePerformanceRows(current)}
            primaryLabel="“সেবা নিন” ক্লিক"
            secondaryLabel="নিশ্চিত অনুরোধ"
            primaryColor={CHART_COLORS.navy}
            secondaryColor={CHART_COLORS.accent}
            emptyText="এই সময়ে কোনো সেবা ক্লিক বা অনুরোধ নেই।"
          />
        </Panel>
      )}

      {current && (
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <Panel
            title="ট্রাফিক সোর্স"
            description="ল্যান্ডিং সেশনের হোস্টনেম। শুধু হোস্ট সংরক্ষিত হয়, সম্পূর্ণ URL নয়।"
          >
            <DonutChart
              ariaLabel="রেফারেল সোর্স অনুযায়ী সেশন"
              centerLabel="সেশন"
              slices={referrerSlices(current)}
              emptyText="এই সময়ে কোনো রেফারেল ডেটা নেই।"
            />
          </Panel>
          <Panel
            title="ডিভাইস বিভাজন"
            description="স্ক্রিন প্রস্থ থেকে অনুমান করা ডিভাইস; সেশন অনুযায়ী।"
          >
            <DonutChart
              ariaLabel="ডিভাইস অনুযায়ী সেশন"
              centerLabel="সেশন"
              slices={deviceSlices(current)}
              emptyText="এই সময়ে কোনো ডিভাইস ডেটা নেই।"
            />
          </Panel>
        </div>
      )}

      {current && (
        <div className="grid min-w-0 gap-6 xl:grid-cols-2">
          <Panel
            title="সর্বাধিক দেখা কনটেন্ট ও তালিকা"
            description="পোস্ট, বাসা ভাড়া ও সার্ভিস পেজ; বন্ধনীতে অনন্য ভিজিটর।"
          >
            <RankedRows
              rows={current.topContent.slice(0, 6)}
              secondaryLabel="ভিজিটর"
              emptyText="এই সময়ে কোনো কনটেন্ট দেখা হয়নি।"
              renderLabel={(row) => {
                const rich = row as WebsiteAnalyticsRow & {
                  kind?: string | null;
                  contentId?: string | null;
                };
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
          </Panel>
          <Panel
            title="জনপ্রিয় সার্ভিস ক্যাটাগরি"
            description="সার্ভিস পেজের ভিজিট অনুযায়ী; বন্ধনীতে অনন্য ভিজিটর।"
          >
            <RankedRows
              rows={current.topCategories.slice(0, 6)}
              labelMap={SERVICE_LABELS}
              secondaryLabel="ভিজিটর"
              emptyText="এই সময়ে কোনো সার্ভিস পেজ দেখা হয়নি।"
            />
          </Panel>
        </div>
      )}

      <section aria-labelledby="platform-snapshot-title">
        <SectionHeading
          id="platform-snapshot-title"
          title="প্ল্যাটফর্ম স্ন্যাপশট (বর্তমান)"
          description="এগুলো সর্বমোট গণনা; সক্রিয় ভিজিটর গত ৫ মিনিটে ওয়েবসাইট ব্যবহার করেছেন। তথ্য প্রতি ৩০ সেকেন্ডে আপডেট হয়।"
        />
        <StatGrid>
          <StatCard
            label="এখন সক্রিয় ভিজিটর"
            value={stats.active_users}
            hint="গত ৫ মিনিটের অনন্য ব্রাউজার"
            icon={Users}
            tone="good"
          />
          <StatCard
            label="নিবন্ধিত কাস্টমার"
            value={stats.total_customers}
            hint="কাস্টমার অ্যাকাউন্ট"
            icon={Users}
            href="/admin/users"
          />
          <StatCard
            label="মোট পোস্ট"
            value={stats.total_posts}
            hint="সব ধরন ও স্ট্যাটাস"
            icon={FileText}
            href="/admin/posts"
          />
          <StatCard
            label="অপেক্ষমাণ পোস্ট"
            value={stats.pending_posts}
            hint="অ্যাডমিন পর্যালোচনা প্রয়োজন"
            icon={ShieldCheck}
            href="/admin/posts?status=pending"
            tone="attention"
          />
          <StatCard
            label="প্রকাশিত পোস্ট"
            value={stats.approved_posts}
            hint="খবর, চাকরি ও কেনাবেচা"
            icon={FileText}
            href="/admin/posts?status=approved"
            tone="good"
          />
          <StatCard
            label="প্রত্যাখ্যাত পোস্ট"
            value={stats.rejected_posts}
            hint="সব পোস্টের ধরন"
            icon={FileText}
            href="/admin/posts?status=rejected"
            tone="attention"
          />
          <StatCard
            label="খবর পোস্ট"
            value={stats.post_kind_counts.news}
            hint="সব স্ট্যাটাস"
            icon={FileText}
            href="/admin/posts?kind=news"
          />
          <StatCard
            label="চাকরি পোস্ট"
            value={stats.post_kind_counts.job}
            hint="সব স্ট্যাটাস"
            icon={FileText}
            href="/admin/posts?kind=job"
          />
          <StatCard
            label="কেনাবেচা পোস্ট"
            value={stats.post_kind_counts.buy_sell}
            hint="সব স্ট্যাটাস"
            icon={FileText}
            href="/admin/posts?kind=buy_sell"
          />
          <StatCard
            label="পর্যালোচনার অপেক্ষায়"
            value={pendingContent}
            hint="পোস্ট, বাসা ভাড়া ও শিক্ষক"
            icon={ShieldCheck}
            href="#pending-approvals"
            tone={pendingContent > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="প্রকাশিত To-Let"
            value={stats.active_tolet_listings}
            hint="অনুমোদিত বাসা ভাড়া"
            icon={Building2}
            href="/admin/tolet?status=approved"
            tone="good"
          />
          <StatCard
            label="সক্রিয় কর্মী"
            value={stats.active_staff}
            hint="সেবা প্রদানকারী প্রোফাইল"
            icon={Wrench}
            href="/admin/services"
            tone="good"
          />
          <StatCard
            label="নতুন সেবা অনুরোধ"
            value={stats.new_service_requests}
            hint="স্ট্যাটাস: নতুন"
            icon={ClipboardList}
            href="/admin/requests?status=new"
            tone={stats.new_service_requests > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="অমীমাংসিত অভিযোগ"
            value={stats.open_reports}
            hint="সব রিপোর্টের ধরন"
            icon={Flag}
            href="/admin/reports?status=open"
            tone={stats.open_reports > 0 ? 'alert' : 'neutral'}
          />
          <StatCard
            label="প্রকাশিত রক্তদাতা"
            value={stats.approved_blood_donors}
            hint="অনুমোদিত donor profile"
            icon={Heart}
            href="/admin/blood/donors"
            tone="good"
          />
        </StatGrid>
      </section>

      <section id="pending-approvals" aria-labelledby="pending-title" className="scroll-mt-24">
        <SectionHeading
          id="pending-title"
          title="পর্যালোচনার অপেক্ষায়"
          description="সাম্প্রতিক পোস্ট, বাসা ভাড়ার বিজ্ঞাপন, শিক্ষক ও রক্তদাতা প্রোফাইল।"
          action={
            <Link
              href="/admin/posts?status=pending"
              className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-admin-navy hover:bg-white"
            >
              পোস্টের queue
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        />
        {pending.unavailable ? (
          <AdminError
            title={pending.issue?.title ?? 'পর্যালোচনার তালিকা লোড করা যায়নি'}
            message={pending.issue?.message}
          />
        ) : pending.items.length === 0 ? (
          <div className="rounded-admin-card border border-dashed border-admin-border bg-white px-5 py-8 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-admin-muted" aria-hidden="true" />
            <p className="mt-2 text-sm font-semibold text-admin-text">পর্যালোচনার জন্য নতুন কিছু নেই</p>
            <p className="mt-1 text-xs text-admin-muted">নতুন জমা পড়লে এখানে দেখা যাবে।</p>
          </div>
        ) : (
          <ul className="grid gap-2 lg:grid-cols-2">
            {pending.items.map((item) => {
              const status = lookupStatus(item.status);
              return (
                <li
                  key={`${item.category}-${item.id}`}
                  className="min-w-0 rounded-admin-card border border-admin-border bg-white p-3 shadow-admin-card sm:p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-admin-page text-admin-navy">
                      <FileText className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="min-w-0 flex-1 break-words text-sm font-semibold leading-snug text-admin-text">
                          {item.title}
                        </h3>
                        <StatusPill label={status.label} tone={status.tone} />
                      </div>
                      <p className="mt-1 break-words text-xs text-admin-muted">
                        {item.category} <span aria-hidden="true">·</span> {item.submitter}
                      </p>
                      <p className="mt-1 text-[11px] text-admin-muted" title={formatDateTime(item.created_at)}>
                        জমা: {formatRelative(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    className="mt-3 flex min-h-10 items-center justify-center gap-1 rounded-md border border-admin-border px-3 text-xs font-semibold text-admin-navy hover:bg-admin-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                  >
                    বিস্তারিত দেখুন
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section aria-labelledby="activity-title" className="min-w-0">
          <SectionHeading
            id="activity-title"
            title="সাম্প্রতিক কার্যক্রম"
            description="পোস্ট, অনুরোধ, বার্তা, রিপোর্ট ও নতুন অ্যাকাউন্ট"
            action={
              <Link
                href="/admin/activity"
                className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-admin-navy hover:bg-white"
              >
                অডিট লগ
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {activity.unavailable ? (
            <AdminError
              title={activity.issue?.title ?? 'কার্যক্রম লোড করা যায়নি'}
              message={activity.issue?.message}
            />
          ) : activity.items.length === 0 ? (
            <div className="rounded-admin-card border border-dashed border-admin-border bg-white px-5 py-8 text-center">
              <p className="text-sm font-semibold text-admin-text">এখনো কোনো কার্যক্রম নেই</p>
              <p className="mt-1 text-xs text-admin-muted">নতুন রেকর্ড তৈরি হলে এখানে দেখা যাবে।</p>
            </div>
          ) : (
            <ol className="overflow-hidden rounded-admin-card border border-admin-border bg-white shadow-admin-card">
              {activity.items.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    'flex min-w-0 items-start gap-3 px-3 py-3 sm:px-4',
                    index > 0 && 'border-t border-admin-border'
                  )}
                >
                  <StatusPill
                    label={activityCategoryLabel(item.category)}
                    tone={activityCategoryTone(item.category)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold leading-snug text-admin-text">{item.title}</p>
                    <p className="mt-0.5 break-words text-xs text-admin-muted">{item.detail}</p>
                    <p className="mt-1 text-[11px] text-admin-muted" title={formatDateTime(item.occurred_at)}>
                      {activityActionLabel(item.action)} · {formatRelative(item.occurred_at)}
                    </p>
                  </div>
                  <Link
                    href={item.href}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-admin-muted hover:bg-admin-page hover:text-admin-navy"
                    aria-label={`${item.title} খুলুন`}
                  >
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="notifications-title" className="min-w-0">
          <SectionHeading
            id="notifications-title"
            title="নোটিফিকেশন"
            description={`অ্যাডমিনের জন্য সাম্প্রতিক আপডেট · অপঠিত ${formatBnNumber(stats.unread_admin_notifications)}`}
            action={
              <Link
                href="/admin/notifications"
                className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-admin-navy hover:bg-white"
              >
                সব দেখুন
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          {notifications.unavailable ? (
            <AdminError title="নোটিফিকেশন লোড করা যায়নি" />
          ) : notifications.rows.length === 0 ? (
            <AdminEmpty
              title="কোনো নোটিফিকেশন নেই"
              description="নতুন অ্যাডমিন আপডেট এলে এখানে দেখা যাবে।"
              icon={<Bell className="h-5 w-5" aria-hidden="true" />}
            />
          ) : (
            <ul className="overflow-hidden rounded-admin-card border border-admin-border bg-white shadow-admin-card">
              {notifications.rows.map((row, index) => (
                <li
                  key={row.id}
                  className={cn(
                    'flex min-w-0 items-start gap-3 px-3 py-3 sm:px-4',
                    index > 0 && 'border-t border-admin-border'
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      row.is_read ? 'bg-admin-border' : 'bg-status-info'
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={row.link_href}
                      className="break-words text-sm font-semibold leading-snug text-admin-text hover:text-admin-navy hover:underline"
                    >
                      {row.title}
                    </Link>
                    <p className="mt-0.5 break-words text-xs text-admin-muted">{row.body}</p>
                    <p className="mt-1 text-[11px] text-admin-muted" title={formatDateTime(row.created_at)}>
                      {formatRelative(row.created_at)}
                      {!row.is_read && <span className="ml-1 font-semibold text-status-info">· অপঠিত</span>}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="moderation-title">
        <SectionHeading
          id="moderation-title"
          title="মডারেশন ও অনুরোধ অবস্থা"
          description="কমিউনিটি পোস্ট ও সেবা অনুরোধের বর্তমান স্ট্যাটাস (সর্বমোট গণনা)।"
        />
        <Panel className="min-w-0">
          <div className="grid gap-6 sm:grid-cols-2">
            <StatusBars
              title="পোস্ট মডারেশন"
              items={[
                { label: 'অনুমোদিত', value: stats.approved_posts, color: 'bg-status-success' },
                { label: 'অপেক্ষমাণ', value: stats.pending_posts, color: 'bg-status-warning' },
                { label: 'প্রত্যাখ্যাত', value: stats.rejected_posts, color: 'bg-status-danger' },
              ]}
            />
            <StatusBars
              title="সেবা অনুরোধ"
              items={[
                { label: 'চলমান', value: stats.open_requests, color: 'bg-status-info' },
                { label: 'সম্পন্ন', value: stats.completed_requests, color: 'bg-status-success' },
                { label: 'বাতিল', value: stats.cancelled_requests, color: 'bg-status-disabled' },
                { label: 'প্রত্যাখ্যাত', value: stats.rejected_requests, color: 'bg-status-danger' },
              ]}
            />
          </div>
        </Panel>
      </section>

      <section aria-labelledby="quick-actions-title">
        <SectionHeading
          id="quick-actions-title"
          title="দ্রুত কাজ"
          description="প্রতিদিনের পরিচালনার জন্য সরাসরি লিংক"
        />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction href="/admin/services/new" icon={Plus} label="কর্মী বা সেবা যোগ করুন" />
          <QuickAction href="/admin/posts/new" icon={FileText} label="নতুন পোস্ট/লিস্টিং" />
          <QuickAction href="/admin/analytics/website" icon={MousePointerClick} label="ওয়েবসাইট অ্যানালিটিক্স" />
          <QuickAction href="/admin/directories/coaching" icon={Wrench} label="কোচিং ও WiFi তালিকা" />
          <QuickAction href="#pending-approvals" icon={ShieldCheck} label="অপেক্ষমাণ বিষয় দেখুন" />
          <QuickAction href="/admin/requests" icon={ClipboardList} label="সেবা অনুরোধ দেখুন" />
          <QuickAction href="/admin/users" icon={Users} label="কাস্টমার পরিচালনা" />
          <QuickAction href="/admin/posts" icon={FileText} label="পোস্ট পরিচালনা" />
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-admin-muted">
        এই ড্যাশবোর্ড রিয়েল-টাইম নয়: ডেটা পেজ লোড বা “রিফ্রেশ”-এ সর্বশেষ অবস্থা দেখায়। কোনো live
        subscription নেই, তাই “লাইভ” দাবি করা হয় না।
      </p>
    </div>
  );
}

/** A dashboard counter that also carries its period-over-period change. */
function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  tone = 'neutral',
  trend,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
  tone?: 'neutral' | 'attention' | 'alert' | 'good';
  trend?: MetricTrend;
}) {
  const valueTone = {
    neutral: 'text-ink-900',
    attention: 'text-accent-600',
    alert: 'text-rose-600',
    good: 'text-status-success',
  }[tone];

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">{label}</span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />}
      </div>
      <p className={cn('mt-2 text-2xl font-bold leading-none tabular-nums', valueTone)}>
        {typeof value === 'number' ? formatBnNumber(value) : value}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {trend && <TrendBadge trend={trend} />}
        {hint && <span className="text-xs leading-snug text-ink-500">{hint}</span>}
      </div>
    </>
  );

  const className =
    'block rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card transition-colors';

  if (href) {
    return (
      <Link href={href} className={cn(className, 'hover:border-admin-navy/30 hover:bg-admin-page')}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="break-words text-sm font-bold text-admin-text sm:text-base">
          {title}
        </h2>
        {description && <p className="mt-1 break-words text-xs leading-relaxed text-admin-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** A ranked label/value list that never invents a row when the list is empty. */
function RankedRows({
  rows,
  labelMap,
  secondaryLabel,
  emptyText,
  renderLabel,
}: {
  rows: WebsiteAnalyticsRow[];
  labelMap?: Record<string, string>;
  secondaryLabel?: string;
  emptyText: string;
  renderLabel?: (row: WebsiteAnalyticsRow) => ReactNode;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-admin-muted">{emptyText}</p>;
  }
  return (
    <div className="divide-y divide-admin-border">
      {rows.map((row, index) => (
        <div
          key={`${row.key}-${index}`}
          className="flex min-w-0 items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
        >
          <span className="min-w-0 break-words text-sm text-admin-text">
            {renderLabel
              ? renderLabel(row)
              : labelMap
                ? labelMap[row.key] ?? row.key.replaceAll('_', ' ')
                : row.key}
          </span>
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-admin-navy">
            {formatBnNumber(row.count)}
            {secondaryLabel && row.secondaryCount !== undefined && (
              <span className="ml-1 text-xs font-normal text-admin-muted">
                ({secondaryLabel}: {formatBnNumber(row.secondaryCount)})
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusBars({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(0, ...items.map((item) => item.value));
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-bold text-admin-text">{title}</h3>
        <span className="text-[11px] tabular-nums text-admin-muted">মোট {formatBnNumber(total)}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-admin-muted">{item.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-admin-text">
                {formatBnNumber(item.value)}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-admin-page"
              role="img"
              aria-label={`${item.label}: ${item.value}`}
            >
              <div
                className={cn('h-full rounded-full', item.color)}
                style={{ width: max > 0 ? `${(item.value / max) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center gap-3 rounded-admin-card border border-admin-border bg-white px-3 text-xs font-semibold text-admin-text shadow-admin-card hover:border-admin-navy/30 hover:bg-admin-page focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
    >
      <Icon className="h-4 w-4 shrink-0 text-admin-navy" aria-hidden="true" />
      <span className="min-w-0 flex-1 break-words">{label}</span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-admin-muted" aria-hidden="true" />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-label="ড্যাশবোর্ড লোড হচ্ছে">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-admin-card border border-admin-border bg-white"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-admin-card border border-admin-border bg-white" />
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-admin-card border border-admin-border bg-white"
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart data shaping
// ---------------------------------------------------------------------------

const SHORT_DATE = new Intl.DateTimeFormat('bn-BD', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

function shortDate(key: string): string {
  const date = new Date(`${key}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? key : SHORT_DATE.format(date);
}

function buildDailySeries(
  current: WebsiteAnalyticsData,
  previous: WebsiteAnalyticsData | null
): LineChartSeries[] {
  const series: LineChartSeries[] = [
    {
      key: 'visitors',
      label: 'অনন্য ভিজিটর',
      color: CHART_COLORS.navy,
      area: true,
      values: current.daily.map((point) => point.visitors),
    },
    {
      key: 'pageViews',
      label: 'পেজ ভিউ',
      color: CHART_COLORS.accent,
      values: current.daily.map((point) => point.pageViews),
    },
  ];
  // Align the previous window by position only when it has the same length, so
  // the dashed line is a true day-for-day comparison and never a guess.
  if (previous && previous.daily.length === current.daily.length) {
    series.push({
      key: 'previousVisitors',
      label: 'আগের সময়ের ভিজিটর',
      color: CHART_COLORS.muted,
      dashed: true,
      values: previous.daily.map((point) => point.visitors),
    });
  }
  return series;
}

function servicePerformanceRows(data: WebsiteAnalyticsData): BarChartRow[] {
  const clicks = new Map<string, number>();
  for (const row of data.serviceCtas) {
    if (!row.category) continue;
    clicks.set(row.category, (clicks.get(row.category) ?? 0) + row.count);
  }
  const requests = new Map<string, number>();
  for (const row of data.requests.serviceRequests) {
    requests.set(row.key, row.count);
  }
  return [...new Set([...clicks.keys(), ...requests.keys()])]
    .map((key) => ({
      key,
      label: SERVICE_LABELS[key] ?? key.replaceAll('_', ' '),
      primary: clicks.get(key) ?? 0,
      secondary: requests.get(key) ?? 0,
      total: (clicks.get(key) ?? 0) + (requests.get(key) ?? 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map(({ label, primary, secondary }) => ({ label, primary, secondary }));
}

function referrerSlices(data: WebsiteAnalyticsData): DonutSlice[] {
  const rows = data.referrers.filter((row) => row.count > 0);
  const slices: DonutSlice[] = rows.slice(0, 5).map((row) => ({
    label: row.key === 'direct' ? 'সরাসরি প্রবেশ' : row.key,
    value: row.count,
  }));
  const rest = rows.slice(5).reduce((sum, row) => sum + row.count, 0);
  if (rest > 0) slices.push({ label: 'অন্যান্য', value: rest, color: CHART_COLORS.muted });
  return slices;
}

function deviceSlices(data: WebsiteAnalyticsData): DonutSlice[] {
  return data.devices
    .filter((row) => row.count > 0)
    .map((row) => ({
      label: DEVICE_LABELS[row.key] ?? row.key.replaceAll('_', ' '),
      value: row.count,
    }));
}

// ---------------------------------------------------------------------------
// Activity labels
// ---------------------------------------------------------------------------

function activityCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    post: 'পোস্ট',
    request: 'অনুরোধ',
    message: 'বার্তা',
    report: 'রিপোর্ট',
    user: 'কাস্টমার',
  };
  return labels[category] ?? 'কার্যক্রম';
}

function activityCategoryTone(category: string) {
  const tones = {
    post: 'info',
    request: 'accent',
    message: 'info',
    report: 'danger',
    user: 'neutral',
  } as const;
  return tones[category as keyof typeof tones] ?? 'neutral';
}

function activityActionLabel(action: string) {
  const labels: Record<string, string> = {
    submitted: 'জমা হয়েছে',
    approved: 'অনুমোদিত',
    rejected: 'প্রত্যাখ্যাত',
    registered: 'নিবন্ধিত',
  };
  return labels[action] ?? action;
}
