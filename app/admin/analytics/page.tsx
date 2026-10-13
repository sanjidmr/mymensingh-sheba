import { CalendarDays, ChartNoAxesColumnIncreasing, Users } from 'lucide-react';
import { fetchAdminAnalytics } from '@/lib/admin/queries';
import type { AdminAnalytics, AdminAnalyticsRow } from '@/lib/admin/queries';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminEmpty, AdminError } from '@/components/admin/States';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ from?: string; to?: string }>;

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function displayLabel(key: string): string {
  const directLabels: Record<string, string> = {
    'news': 'সংবাদ',
    'job': 'চাকরি',
    'buy_sell': 'কেনাবেচা',
    'active': 'সক্রিয়',
    'inactive': 'নিষ্ক্রিয়',
    'flat': 'ফ্ল্যাট',
    'room': 'রুম',
    'sublet': 'সাবলেট',
    'family': 'পরিবার',
    'bachelor': 'ব্যাচেলর',
    'mess': 'মেস',
    'hostel': 'হোস্টেল',
    'seat': 'সিট',
    'coaching': 'কোচিং',
    'wifi': 'WiFi',
    'bus': 'বাস',
    'vehicle': 'যানবাহন',
    'home-tutor': 'গৃহশিক্ষক অনুরোধ',
    'pending': 'অপেক্ষমাণ',
    'approved': 'অনুমোদিত',
    'rejected': 'প্রত্যাখ্যাত',
    'new': 'নতুন',
    'reviewing': 'পর্যালোচনাধীন',
    'contacted': 'যোগাযোগ করা হয়েছে',
    'in_progress': 'চলমান',
    'completed': 'সম্পন্ন',
    'cancelled': 'বাতিল',
    'assigned': 'কর্মী বরাদ্দ',
    'submitted': 'জমা',
    'closed': 'বন্ধ',
    'donor_contacted': 'দাতার সঙ্গে যোগাযোগ',
    'pending_review': 'পর্যালোচনাধীন',
    'open': 'খোলা',
    'resolved': 'সমাধান',
    'dismissed': 'নিষ্পত্তি',
    'tolet': 'বাসা ভাড়া',
    'tutor': 'গৃহশিক্ষক',
    'blood_donor': 'রক্তদাতা',
    'staff': 'কর্মী',
    'community_post': 'কমিউনিটি পোস্ট',
    'view': 'তালিকা দেখা',
    'call_click': 'ফোন বোতামে ক্লিক',
    'whatsapp_click': 'WhatsApp বোতামে ক্লিক',
    'favorite': 'পছন্দে যোগ',
    'share': 'শেয়ার',
    'read': 'পঠিত',
    'unread': 'অপঠিত',
    'insert': 'তৈরি',
    'update': 'সম্পাদনা',
    'delete': 'মুছে ফেলা',
  };
  return directLabels[key] ?? key.replaceAll('_', ' ');
}

function formatRowLabel(key: string): string {
  return key.split(':').map((part) => displayLabel(part)).join(' · ');
}

function MetricList({
  title,
  description,
  rows,
  secondaryLabel,
}: {
  title: string;
  description?: string;
  rows: AdminAnalyticsRow[];
  secondaryLabel?: string;
}) {
  return (
    <Panel title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-admin-muted">এই সময়সীমায় কোনো রেকর্ড নেই।</p>
      ) : (
        <div className="divide-y divide-admin-border">
          {rows.map((row) => (
            <div key={row.key} className="flex min-w-0 items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="min-w-0 break-words text-sm text-admin-text">{formatRowLabel(row.key)}</span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-admin-navy">
                {row.count.toLocaleString('bn-BD')}
                {secondaryLabel && row.secondaryCount !== undefined && (
                  <span className="ml-1 text-xs font-normal text-admin-muted">
                    ({secondaryLabel}: {row.secondaryCount.toLocaleString('bn-BD')})
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

function CustomerTrend({ rows }: { rows: AdminAnalyticsRow[] }) {
  const maximum = Math.max(1, ...rows.map((row) => row.count));
  return (
    <Panel
      title="নতুন গ্রাহক নিবন্ধন"
      description="নির্বাচিত সময়ে প্রতিদিনের নতুন customer অ্যাকাউন্ট; শুধু বাস্তবে থাকা দিনগুলো দেখানো হয়েছে।"
    >
      {rows.length === 0 ? (
        <AdminEmpty title="এই সময়ে নতুন নিবন্ধন নেই" />
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs">
              <span className="text-admin-muted">{row.key}</span>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-admin-page"
                role="img"
                aria-label={`${row.key}: ${row.count} new customers`}
              >
                <div
                  className="h-full rounded-full bg-admin-navy"
                  style={{ width: `${Math.max(3, (row.count / maximum) * 100)}%` }}
                />
              </div>
              <span className="text-right font-semibold tabular-nums text-admin-text">{row.count.toLocaleString('bn-BD')}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-admin-page text-admin-navy">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="break-words text-xs text-admin-muted">{label}</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-admin-text">{value.toLocaleString('bn-BD')}</p>
      </div>
    </div>
  );
}

function AnalyticsSections({ data }: { data: AdminAnalytics }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="মোট গ্রাহক (সর্বকাল)" value={data.customerTotal} icon={Users} />
        <SummaryCard
          label="নির্বাচিত সময়ে To-Let দেখা"
          value={data.toletEvents.find((row) => row.key === 'view')?.count ?? 0}
          icon={ChartNoAxesColumnIncreasing}
        />
        <SummaryCard
          label="ফোন বোতামে ক্লিক"
          value={data.toletEvents.find((row) => row.key === 'call_click')?.count ?? 0}
          icon={ChartNoAxesColumnIncreasing}
        />
        <SummaryCard
          label="WhatsApp বোতামে ক্লিক"
          value={data.toletEvents.find((row) => row.key === 'whatsapp_click')?.count ?? 0}
          icon={ChartNoAxesColumnIncreasing}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CustomerTrend rows={data.newCustomersByDay} />
        <MetricList title="To-Let তালিকা" description="property type ও সংরক্ষিত publication status; নির্বাচিত সময়ে তৈরি হয়েছে।" rows={data.toletListings} />
        <MetricList title="সার্ভিস ক্যাটালগ" description="কোচিং, WiFi, বাস ও যানবাহনের তালিকা; সক্রিয়/নিষ্ক্রিয়।" rows={data.serviceListings} />
        <MetricList title="কমিউনিটি পোস্ট" description="বাস্তব news, job ও buy & sell রেকর্ড; status অনুযায়ী।" rows={data.communityPosts} />
        <MetricList title="সার্ভিস অনুরোধ" description="service_slug ও সংরক্ষিত বর্তমান status অনুযায়ী জমা হওয়া অনুরোধ।" rows={data.serviceRequests} />
        <MetricList title="To-Let অনুসন্ধান" rows={data.toletRequests} />
        <MetricList title="যানবাহন অনুরোধ" description="এগুলো অনুরোধের রেকর্ড; completed booking নির্দেশ করে না।" rows={data.vehicleRequests} />
        <MetricList title="রক্তের অনুরোধ" rows={data.bloodRequests} />
        <MetricList title="রক্তদাতা (বর্তমান অবস্থা)" description="তারিখ-ফিল্টারবিহীন বর্তমান profile status; দ্বিতীয় সংখ্যা অনুমোদিত ও উপলভ্য হিসেবে চিহ্নিত দাতা।" rows={data.bloodDonors} secondaryLabel="উপলভ্য" />
        <MetricList title="রিপোর্ট ও অভিযোগ" rows={data.reports} />
        <MetricList title="To-Let engagement events" description="রেকর্ডকৃত view ও button click; এগুলো বাস্তব ফোনকল, বুকিং বা সেবা সম্পন্ন হওয়ার প্রমাণ নয়।" rows={data.toletEvents} />
        <MetricList title="কাস্টমার সাপোর্ট" rows={data.supportMessages} />
        <MetricList title="অ্যাডমিন নোটিফিকেশন" description="নির্বাচিত সময়ে তৈরি হওয়া প্রকৃত admin-targeted notification।" rows={data.adminNotifications} />
        <MetricList title="অডিট লগ" description="বিদ্যমান audit trigger থেকে রেকর্ড হওয়া admin পরিবর্তন।" rows={data.auditActions} />
      </div>

      <Panel title="আয় ও প্ল্যাটফর্ম ফি" description="বর্তমান schema-তে payment বা transaction record নেই; তাই বাস্তব সংগৃহীত আয় গণনা করা যায় না।">
        <p className="text-sm text-admin-muted">আয় এখনো ডেটাবেজে নির্ভরযোগ্যভাবে ট্র্যাক করা হয় না। বিজ্ঞাপনের মূল্য, ফি-নিয়ম, ক্লিক বা অনুরোধকে আয় হিসেবে গণনা করা হয়নি।</p>
      </Panel>
    </>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const today = localDateString(new Date());
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 29);
  const from = params.from ?? localDateString(monthAgo);
  const to = params.to ?? today;
  const result = await fetchAdminAnalytics(from, to);

  return (
    <div className="space-y-5">
      <PageHeader
        title="অ্যানালিটিক্স"
        description="নির্বাচিত সময়সীমায় প্রকৃত ডেটাবেজ রেকর্ড থেকে পরিসংখ্যান।"
        breadcrumb={{ href: '/admin', label: 'ড্যাশবোর্ড' }}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-admin-border bg-white px-3 py-2 text-xs text-admin-muted">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            তারিখ অনুযায়ী
          </span>
        }
      />

      <form method="get" className="flex flex-col gap-3 rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card sm:flex-row sm:items-end">
        <label className="grid flex-1 gap-1.5 text-xs font-semibold text-admin-text">
          শুরু
          <input
            type="date"
            name="from"
            required
            defaultValue={from}
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          />
        </label>
        <label className="grid flex-1 gap-1.5 text-xs font-semibold text-admin-text">
          শেষ
          <input
            type="date"
            name="to"
            required
            defaultValue={to}
            className="min-h-10 rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-navy/30"
          />
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90 focus:outline-none focus:ring-2 focus:ring-admin-navy/40 focus:ring-offset-2">
          প্রয়োগ করুন
        </button>
      </form>

      {result.error ? (
        <AdminError
          title={result.unavailable ? 'অ্যানালিটিক্স অনুপলভ্য' : 'তথ্য লোড করা যায়নি'}
          message={result.error}
        />
      ) : result.data ? (
        <AnalyticsSections data={result.data} />
      ) : (
        <AdminError title="তথ্য লোড করা যায়নি" message="কোনো অ্যানালিটিক্স ডেটা ফেরত আসেনি।" />
      )}
    </div>
  );
}
