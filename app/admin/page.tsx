import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowUpRight,
  ClipboardList,
  FileText,
  Flag,
  Heart,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminError, AdminNotice } from '@/components/admin/States';
import { StatusPill, StatCard, StatGrid } from '@/components/admin/StatCard';
import {
  fetchDashboardPendingItems,
  fetchDashboardStats,
  fetchRecentActivity,
} from '@/lib/admin/queries';
import { formatDateTime, formatRelative, lookupStatus } from '@/lib/admin/format';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="অ্যাডমিন ড্যাশবোর্ড"
        description="ময়মনসিংহ সেবা প্ল্যাটফর্মের কার্যক্রম, পর্যালোচনা ও গুরুত্বপূর্ণ আপডেট এক নজরে।"
        actions={
          <Link
            href="/admin/services/new"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-admin-control bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            নতুন কর্মী/সেবা
          </Link>
        }
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function DashboardContent() {
  const [stats, activity, pending] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentActivity(10),
    fetchDashboardPendingItems(10),
  ]);

  if (stats.unavailable) {
    return (
      <AdminError
        title={stats.issue?.title ?? 'ড্যাশবোর্ডের তথ্য লোড করা যায়নি'}
        message={stats.issue?.message}
      />
    );
  }

  const pendingContent = stats.pending_posts + stats.pending_tolet_listings;

  return (
    <div className="space-y-6 sm:space-y-8">
      {stats.empty && (
        <AdminNotice tone="info" title="প্ল্যাটফর্মে এখনো কোনো রেকর্ড নেই">
          Supabase সংযুক্ত, কিন্তু ড্যাশবোর্ডে দেখানোর মতো কোনো রেকর্ড এখনো তৈরি হয়নি।
        </AdminNotice>
      )}

      <section aria-labelledby="dashboard-summary-title">
        <SectionHeading
          id="dashboard-summary-title"
          title="প্ল্যাটফর্মের সারসংক্ষেপ"
          description="সর্বশেষ ডেটাবেজ গণনা; বিস্তারিত দেখতে কার্ড নির্বাচন করুন।"
        />
        <StatGrid>
          <StatCard
            label="মোট কাস্টমার"
            value={stats.total_customers}
            hint="কাস্টমার অ্যাকাউন্ট"
            icon={Users}
            href="/admin/users"
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
            label="প্রকাশিত To-Let"
            value={stats.active_tolet_listings}
            hint="অনুমোদিত বাসা ভাড়া"
            icon={FileText}
            href="/admin/tolet?status=approved"
            tone="good"
          />
          <StatCard
            label="পর্যালোচনার অপেক্ষায়"
            value={pendingContent}
            hint="পোস্ট ও To-Let বিজ্ঞাপন"
            icon={ShieldCheck}
            href="#pending-approvals"
            tone={pendingContent > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="প্রত্যাখ্যাত পোস্ট"
            value={stats.rejected_posts}
            hint="পর্যালোচনা করা পোস্ট"
            icon={FileText}
            href="/admin/posts?status=rejected"
            tone={stats.rejected_posts > 0 ? 'alert' : 'neutral'}
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
          <StatCard
            label="সক্রিয় কর্মী"
            value={stats.active_staff}
            hint="সেবা প্রদানকারী প্রোফাইল"
            icon={Wrench}
            href="/admin/services"
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
        <section aria-labelledby="analytics-title" className="min-w-0">
          <SectionHeading
            id="analytics-title"
            title="অ্যানালিটিক্স স্ন্যাপশট"
            description="কমিউনিটি পোস্ট ও সেবা অনুরোধের বর্তমান স্ট্যাটাস"
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
            <p className="mt-5 border-t border-admin-border pt-3 text-[11px] leading-relaxed text-admin-muted">
              চার্টের সংখ্যা সব সময় ডেটাবেজের বর্তমান গণনা; কোনো সময়ভিত্তিক trend অনুমান করা হয়নি।
            </p>
          </Panel>
        </section>

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
                  className={`flex min-w-0 items-start gap-3 px-3 py-3 sm:px-4 ${
                    index > 0 ? 'border-t border-admin-border' : ''
                  }`}
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
      </div>

      <section aria-labelledby="quick-actions-title">
        <SectionHeading
          id="quick-actions-title"
          title="দ্রুত কাজ"
          description="প্রতিদিনের পরিচালনার জন্য সরাসরি লিংক"
        />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <QuickAction href="/admin/services/new" icon={Plus} label="কর্মী বা সেবা যোগ করুন" />
          <QuickAction href="/admin/posts/new" icon={FileText} label="নতুন পোস্ট/লিস্টিং" />
          <QuickAction href="/admin/catalog" icon={Wrench} label="ডিরেক্টরি পরিচালনা" />
          <QuickAction href="#pending-approvals" icon={ShieldCheck} label="অপেক্ষমাণ বিষয় দেখুন" />
          <QuickAction href="/admin/requests" icon={ClipboardList} label="সেবা অনুরোধ দেখুন" />
          <QuickAction href="/admin/users" icon={Users} label="কাস্টমার পরিচালনা" />
          <QuickAction href="/admin/posts" icon={FileText} label="পোস্ট পরিচালনা" />
        </div>
      </section>
    </div>
  );
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
  action?: React.ReactNode;
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
        <span className="text-[11px] tabular-nums text-admin-muted">মোট {total}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-admin-muted">{item.label}</span>
              <span className="shrink-0 font-semibold tabular-nums text-admin-text">{item.value}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-admin-page"
              role="img"
              aria-label={`${item.label}: ${item.value}`}
            >
              <div
                className={`h-full rounded-full ${item.color}`}
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
  icon: typeof Plus;
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
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-admin-card border border-admin-border bg-white"
          />
        ))}
      </div>
    </div>
  );
}

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
