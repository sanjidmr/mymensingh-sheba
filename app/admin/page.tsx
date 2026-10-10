import Link from 'next/link';
import {
  Users,
  FileText,
  Clock,
  Flag,
  MessageSquare,
  ShieldCheck,
  Heart,
  Bell,
  ArrowRight,
  ClipboardList,
  Home,
  Car,
  Star,
  Inbox,
  Wrench,
  LayoutGrid,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { fetchDashboardStats, fetchRecentActivity } from '@/lib/admin/queries';
import { formatRelative } from '@/lib/admin/format';
import { StatCard, StatGrid } from '@/components/admin/StatCard';
import { AdminError, AdminNotice } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { ADMIN_NAV_FLAT } from '@/lib/admin/nav';

export const dynamic = 'force-dynamic';

/** Shortcuts to the queues an owner checks first, with live counts. */
const QUEUE_LINKS = [
  { href: '/admin/posts', label: 'অপেক্ষমাণ পোস্ট', icon: FileText, stat: 'pending_posts' as const },
  { href: '/admin/requests', label: 'চলমান রিকোয়েস্ট', icon: ClipboardList, stat: 'open_requests' as const },
  { href: '/admin/messages', label: 'নতুন মেসেজ', icon: MessageSquare, stat: 'unread_messages' as const },
  { href: '/admin/reports', label: 'খোলা রিপোর্ট', icon: Flag, stat: 'open_reports' as const },
  { href: '/admin/verifications', label: 'ভেরিফিকেশন', icon: ShieldCheck, stat: 'pending_verifications' as const },
  { href: '/admin/blood', label: 'রক্ত রিকোয়েস্ট', icon: Heart, stat: 'open_blood_requests' as const },
];

const ACTIVITY_LABEL: Record<string, { label: string; className: string }> = {
  post: { label: 'পোস্ট', className: 'bg-sky-50 text-sky-800 border-sky-200' },
  request: { label: 'রিকোয়েস্ট', className: 'bg-brand-50 text-brand-800 border-brand-200' },
  message: { label: 'মেসেজ', className: 'bg-violet-50 text-violet-800 border-violet-200' },
  report: { label: 'রিপোর্ট', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  user: { label: 'ইউজার', className: 'bg-mist-100 text-ink-600 border-mist-200' },
};

const ACTION_LABEL: Record<string, string> = {
  submitted: 'জমা হয়েছে',
  approved: 'অনুমোদিত',
  rejected: 'প্রত্যাখ্যাত',
  registered: 'নিবন্ধিত',
};

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentActivity(14),
  ]);

  if (stats.unavailable) {
    return (
      <>
        <PageHeader
          title="অ্যাডমিন কন্ট্রোল সেন্টার"
          description="পুরো ওয়েবসাইটের লাইভ পরিসংখ্যান ও সাম্প্রতিক কার্যক্রম।"
        />
        <AdminNotice tone="warning" title="ডেটাবেজ সংযুক্ত নেই">
          Supabase কনফিগার করা নেই বা টেবিলগুলো এখনো তৈরি করা হয়নি। নিচের
          গাইড অনুসরণ করে মাইগ্রেশন চালান। এখন কোনো পরিসংখ্যান দেখানো হচ্ছে না —
          কোনো কৃত্রিম সংখ্যা নয়।
        </AdminNotice>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="অ্যাডমিন কন্ট্রোল সেন্টার"
        description="পুরো ওয়েবসাইটের লাইভ পরিসংখ্যান — সব সংখ্যা সরাসরি ডেটাবেজ থেকে।"
      />

      {/* Counters that need attention first */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-bold text-ink-900">যেগুলোতে এখন দৃষ্টি দিন</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUEUE_LINKS.map((queue) => {
            const Icon = queue.icon;
            const value = stats[queue.stat] ?? 0;
            return (
              <Link
                key={queue.href}
                href={queue.href}
                className="block rounded-xl border border-mist-200 bg-white p-3.5 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                    {queue.label}
                  </span>
                  <Icon className="h-4 w-4 shrink-0 text-ink-300" aria-hidden="true" />
                </div>
                <p
                  className={`mt-2 text-2xl font-bold leading-none tabular-nums ${
                    value > 0 ? 'text-rose-600' : 'text-ink-300'
                  }`}
                >
                  {value}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Full statistics */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-bold text-ink-900">সার্বিক পরিসংখ্যান</h2>
        <StatGrid>
          <StatCard label="মোট ইউজার" value={stats.total_users} icon={Users} href="/admin/users" />
          <StatCard
            label="সক্রিয় অ্যাকাউন্ট"
            value={stats.active_users}
            icon={Users}
            tone="good"
          />
          <StatCard
            label="নতুন (৭ দিন)"
            value={stats.new_users_7d}
            icon={Users}
            hint="সাম্প্রতিক সাইনআপ"
          />
          <StatCard
            label="বন্ধ/স্থগিত"
            value={stats.blocked_users}
            icon={Users}
            tone={stats.blocked_users > 0 ? 'alert' : 'neutral'}
          />

          <StatCard
            label="মোট পোস্ট"
            value={stats.total_posts}
            icon={FileText}
            href="/admin/posts"
          />
          <StatCard
            label="অপেক্ষমাণ পোস্ট"
            value={stats.pending_posts}
            icon={Clock}
            href="/admin/posts?status=pending"
            tone={stats.pending_posts > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="প্রকাশিত পোস্ট"
            value={stats.approved_posts}
            icon={FileText}
            tone="good"
          />
          <StatCard
            label="ফিচার্ড পোস্ট"
            value={stats.featured_posts}
            icon={Star}
            href="/admin/posts"
          />

          <StatCard
            label="মোট রিকোয়েস্ট"
            value={stats.total_requests}
            icon={ClipboardList}
            href="/admin/requests"
          />
          <StatCard
            label="চলমান রিকোয়েস্ট"
            value={stats.open_requests}
            icon={ClipboardList}
            href="/admin/requests"
            tone={stats.open_requests > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="সম্পন্ন রিকোয়েস্ট"
            value={stats.completed_requests}
            icon={CheckCircle2}
            href="/admin/requests?status=completed"
            tone="good"
          />
          <StatCard
            label="বাতিল রিকোয়েস্ট"
            value={stats.cancelled_requests}
            icon={XCircle}
            href="/admin/requests?status=cancelled"
          />
          <StatCard
            label="বাসা ভাড়া অনুসন্ধান"
            value={stats.total_tolet_requests}
            icon={Home}
            href="/admin/tolet-requests"
          />
          <StatCard
            label="গাড়ি রিকোয়েস্ট"
            value={stats.total_vehicle_requests}
            icon={Car}
            href="/admin/vehicle-requests"
          />

          <StatCard
            label="মোট মেসেজ"
            value={stats.total_messages}
            icon={MessageSquare}
            href="/admin/messages"
          />
          <StatCard
            label="নতুন মেসেজ"
            value={stats.unread_messages}
            icon={Inbox}
            href="/admin/messages?status=new"
            tone={stats.unread_messages > 0 ? 'alert' : 'neutral'}
          />
          <StatCard
            label="মোট রিপোর্ট"
            value={stats.total_reports}
            icon={Flag}
            href="/admin/reports"
          />
          <StatCard
            label="খোলা রিপোর্ট"
            value={stats.open_reports}
            icon={Flag}
            href="/admin/reports?status=open"
            tone={stats.open_reports > 0 ? 'alert' : 'neutral'}
          />

          <StatCard
            label="অপেক্ষমাণ ভেরিফিকেশন"
            value={stats.pending_verifications}
            icon={ShieldCheck}
            href="/admin/verifications"
            tone={stats.pending_verifications > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="প্রকাশিত বাসা ভাড়া"
            value={stats.active_tolet_listings}
            icon={Home}
            href="/admin/tolet"
          />
          <StatCard
            label="সক্রিয় কর্মী"
            value={stats.active_staff}
            icon={Wrench}
            href="/admin/services"
          />
          <StatCard
            label="সক্রিয় ক্যাটালগ"
            value={stats.active_service_listings}
            icon={LayoutGrid}
            href="/admin/catalog"
          />

          <StatCard
            label="জরুরি নম্বর"
            value={stats.active_emergency_contacts}
            icon={Heart}
            href="/admin/catalog"
          />
          <StatCard
            label="অনপঠিত নোটিফিকেশন"
            value={stats.unread_admin_notifications}
            icon={Bell}
            href="/admin/notifications"
            tone={stats.unread_admin_notifications > 0 ? 'attention' : 'neutral'}
          />
          <StatCard
            label="রক্ত রিকোয়েস্ট"
            value={stats.total_blood_requests}
            icon={Heart}
            href="/admin/blood"
          />
          <StatCard
            label="অপেক্ষমাণ রক্ত"
            value={stats.open_blood_requests}
            icon={Heart}
            href="/admin/blood"
            tone={stats.open_blood_requests > 0 ? 'alert' : 'neutral'}
          />
        </StatGrid>
      </div>

      {/* Recent activity */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink-900">সাম্প্রতিক কার্যক্রম</h2>
          <span className="text-xs text-ink-400">ডেটাবেজের প্রকৃত রেকর্ড</span>
        </div>

        {activity.unavailable ? (
          <AdminError title="কার্যক্রম লোড করা যায়নি" />
        ) : activity.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-mist-200 bg-white px-5 py-8 text-center">
            <p className="text-sm font-semibold text-ink-700">এখনো কোনো কার্যক্রম নেই</p>
            <p className="mt-1 text-xs text-ink-500">
              নতুন পোস্ট, রিকোয়েস্ট, মেসেজ বা রিপোর্ট এলে এখানে দেখা যাবে।
            </p>
          </div>
        ) : (
          <ol className="overflow-hidden rounded-xl border border-mist-200 bg-white">
            {activity.items.map((item, index) => {
              const category = ACTIVITY_LABEL[item.category] ?? ACTIVITY_LABEL.post;
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 px-4 py-3 ${
                    index > 0 ? 'border-t border-mist-100' : ''
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${category.className}`}
                  >
                    {category.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-snug text-ink-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-500">{item.detail}</p>
                    <p className="mt-0.5 text-[11px] text-ink-400">
                      {ACTION_LABEL[item.action] ?? item.action} · {formatRelative(item.occurred_at)}
                    </p>
                  </div>
                  <Link
                    href={item.href}
                    className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-400 hover:bg-mist-100 hover:text-brand-700"
                    aria-label="খুলুন"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Management modules */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-ink-900">ম্যানেজমেন্ট মডিউল</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_NAV_FLAT.filter((item) => item.href !== '/admin').map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group block rounded-xl border border-mist-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mist-100 text-ink-600 transition-colors group-hover:bg-brand-100 group-hover:text-brand-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-ink-900">{item.label}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-700">
                  খুলুন
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}