import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, GraduationCap, Inbox } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { StatCard } from '@/components/admin/StatCard';
import { fetchAdminEngagementAnalytics, fetchTutorProfiles, parseListParams, type AdminTutorListRow } from '@/lib/admin/queries';
import { formatDateTime } from '@/lib/admin/format';
import type { TutorProfileStatus } from '@/lib/supabase/types';
import TutorListActions from '@/components/admin/TutorListActions';

export const dynamic = 'force-dynamic';

const TUTOR_STATUSES: Array<{ value: TutorProfileStatus; label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = [
  { value: 'draft', label: 'জমা দেওয়া হয়নি', tone: 'neutral' },
  { value: 'pending_approval', label: 'পর্যালোচনায়', tone: 'warning' },
  { value: 'approved', label: 'প্রকাশিত', tone: 'success' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
  { value: 'paused', label: 'বিরতি', tone: 'info' },
  { value: 'suspended', label: 'স্থগিত', tone: 'danger' },
];

const columns: AdminColumn<AdminTutorListRow>[] = [
  {
    key: 'name',
    header: 'শিক্ষক প্রোফাইল',
    mobilePrimary: true,
    render: (row) => (
      <span className="flex min-w-0 items-start justify-between gap-2">
        <span className="min-w-0">
        <Link href={`/admin/verifications/${row.id}`} className="block break-words font-semibold text-admin-navy hover:underline">
          {row.full_name}
        </Link>
        <span className="mt-0.5 block text-xs text-admin-muted">{row.institution || 'শিক্ষাপ্রতিষ্ঠান উল্লেখ নেই'}</span>
        </span>
        <TutorListActions tutor={row} />
      </span>
    ),
  },
  {
    key: 'subjects',
    header: 'বিষয় / শ্রেণি',
    hideOnMobile: true,
    render: (row) => `${row.preferred_subjects?.join(' · ') || '—'} / ${row.preferred_classes?.join(' · ') || '—'}`,
  },
  {
    key: 'salary',
    header: 'প্রত্যাশিত বেতন',
    render: (row) => row.expected_salary
      ? `৳${Number(row.expected_salary).toLocaleString('bn-BD')}`
      : '—',
  },
  {
    key: 'created',
    header: 'জমার সময়',
    render: (row) => <span className="text-xs text-admin-muted">{formatDateTime(row.created_at)}</span>,
  },
  {
    key: 'phone',
    header: 'ফোন নম্বর',
    render: (row) => row.private_phone
      ? <a href={`tel:${row.private_phone}`} className="whitespace-nowrap font-medium text-admin-navy hover:underline">{row.private_phone}</a>
      : 'নম্বর দেওয়া হয়নি',
  },
  {
    key: 'views',
    header: 'প্রোফাইল ভিউ',
    render: (row) => row.profile_views == null ? '—' : row.profile_views.toLocaleString('bn-BD'),
  },
];

export default async function AdminTutorVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = parseListParams(resolved, { pageSize: 20 });
  const focus = Array.isArray(resolved.focus) ? resolved.focus[0] : resolved.focus;
  if (focus && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(focus)) {
    redirect(`/admin/verifications/${focus}`);
  }
  const [result, analytics] = await Promise.all([
    fetchTutorProfiles(params),
    fetchAdminEngagementAnalytics('home-tutor'),
  ]);
  const rows = result.rows.map((row) => ({
    ...row,
    profile_views: analytics.error ? null : analytics.profiles[row.id]?.views ?? 0,
  }));

  return (
    <>
      <PageHeader
        title="গৃহশিক্ষক ব্যবস্থাপনা"
        description="টিউটর প্রোফাইল, শিক্ষাগত তথ্য ও প্রকাশনার অবস্থা পর্যালোচনা করুন। ব্যক্তিগত যোগাযোগের তথ্য শুধু অনুমোদিত বিস্তারিত পৃষ্ঠায় দেখানো হয়।"
        count={`মোট ${result.total.toLocaleString('bn-BD')} টি প্রোফাইল`}
        actions={
          <>
            <Link href="/admin/tutor-requests" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-xs font-semibold text-admin-text hover:bg-admin-page">
              <Inbox className="h-4 w-4" aria-hidden="true" /> টিউটর অনুরোধ
            </Link>
            <Link href="/home-tutor" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-admin-navy px-3 text-xs font-semibold text-white hover:bg-admin-navy/90">
              <GraduationCap className="h-4 w-4" aria-hidden="true" /> পাবলিক ডিরেক্টরি
            </Link>
          </>
        }
      />
      {result.unavailable ? (
        <AdminError title="টিউটর প্রোফাইল লোড করা যায়নি" message={result.error} />
      ) : (
        <>
          {analytics.error && <AdminError title="টিউটর অ্যানালিটিক্স লোড করা যায়নি" message={analytics.error} className="mb-4" />}
          <section aria-label="গৃহশিক্ষক পেজের পরিসংখ্যান" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCard label="গৃহশিক্ষক পেজ ভিজিট" value={analytics.error ? '—' : analytics.directoryVisits} />
            <StatCard label="শিক্ষক প্রোফাইল ভিজিট" value={analytics.error ? '—' : analytics.profileViews} />
            <StatCard label="যোগাযোগ বাটন চাপ" value={analytics.error ? '—' : analytics.otherClicks} tone="good" />
            <StatCard label="শিক্ষক আবেদন জমা" value={analytics.error ? '—' : analytics.formSubmits} tone="good" />
          </section>
          <section aria-label="টিউটর প্রোফাইলের অবস্থা" className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Link href="/admin/verifications" className="rounded-admin-card border border-admin-border bg-white p-3 hover:border-admin-navy/30">
              <span className="block text-xs text-admin-muted">সব প্রোফাইল</span><span className="mt-1 block text-lg font-bold text-admin-text">{result.counts.all.toLocaleString('bn-BD')}</span>
            </Link>
            {TUTOR_STATUSES.map((status) => (
              <Link key={status.value} href={`/admin/verifications?status=${status.value}`} className="rounded-admin-card border border-admin-border bg-white p-3 hover:border-admin-navy/30">
                <span className="block text-xs text-admin-muted">{status.label}</span><span className="mt-1 block text-lg font-bold text-admin-text">{(result.counts.byStatus[status.value] ?? 0).toLocaleString('bn-BD')}</span>
              </Link>
            ))}
          </section>

          <div className="mb-3 flex flex-col gap-2 sm:flex-row">
            <AdminSearch placeholder="নাম বা প্রতিষ্ঠান খুঁজুন…" className="sm:max-w-md" />
            <FilterNav
              id="tutor-status"
              label="প্রোফাইলের অবস্থা"
              value={String(params.status ?? '')}
              placeholder="সব অবস্থা"
              options={TUTOR_STATUSES.map(({ value, label }) => ({ value, label }))}
              param="status"
              searchParams={resolved}
            />
            <FilterNav
              id="tutor-sort"
              label="সাজান"
              value={String(params.sort ?? '')}
              placeholder="নতুন আগে"
              options={[{ value: 'newest', label: 'নতুন আগে' }, { value: 'oldest', label: 'পুরনো আগে' }]}
              param="sort"
              searchParams={resolved}
            />
          </div>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <DateRangeFilter />
            <ClearFilters searchParams={resolved} />
          </div>
          <AdminTable
            columns={columns}
            rows={rows}
            getKey={(row) => row.id}
            compact
            caption="গৃহ শিক্ষক প্রোফাইল"
            empty={<AdminEmpty title="কোনো টিউটর প্রোফাইল নেই" description="এই সার্চ বা ফিল্টারে কোনো রেকর্ড মেলেনি।" icon={<GraduationCap className="h-5 w-5" />} />}
          />
          <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolved} />
          <p className="mt-3 flex items-center gap-1 text-[11px] text-admin-muted"><ArrowUpRight className="h-3 w-3" /> শিক্ষকের নাম নির্বাচন করে ব্যক্তিগত ও পূর্ণ বিবরণ খুলুন।</p>
        </>
      )}
    </>
  );
}
