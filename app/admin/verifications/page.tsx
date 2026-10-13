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
import { StatusPill } from '@/components/admin/StatCard';
import { fetchTutorProfiles, parseListParams, type AdminTutorListRow } from '@/lib/admin/queries';
import { formatDateTime } from '@/lib/admin/format';
import { getAreaById } from '@/lib/locations';
import type { TutorProfileStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const TUTOR_STATUSES: Array<{ value: TutorProfileStatus; label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = [
  { value: 'draft', label: 'খসড়া', tone: 'neutral' },
  { value: 'pending_approval', label: 'পর্যালোচনায়', tone: 'warning' },
  { value: 'approved', label: 'প্রকাশিত', tone: 'success' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত', tone: 'danger' },
  { value: 'paused', label: 'বিরতি', tone: 'info' },
  { value: 'suspended', label: 'স্থগিত', tone: 'danger' },
];

function Status({ value }: { value: string }) {
  const status = TUTOR_STATUSES.find((item) => item.value === value);
  return <StatusPill label={status?.label ?? value} tone={status?.tone ?? 'neutral'} />;
}

const columns: AdminColumn<AdminTutorListRow>[] = [
  {
    key: 'name',
    header: 'শিক্ষক প্রোফাইল',
    mobilePrimary: true,
    render: (row) => (
      <span className="block min-w-0">
        <span className="block break-words font-semibold">{row.full_name}</span>
        <span className="mt-0.5 block break-all font-mono text-[10px] text-admin-muted">{row.id}</span>
        <span className="mt-0.5 block text-xs text-admin-muted">{row.qualification} · {row.institution}</span>
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
    key: 'areas',
    header: 'এলাকা',
    hideOnMobile: true,
    render: (row) => row.preferred_areas?.map((id) => getAreaById(id)?.nameBn || id).join(' · ') || '—',
  },
  {
    key: 'salary',
    header: 'প্রত্যাশিত বেতন',
    render: (row) => row.expected_salary_min || row.expected_salary_max
      ? `৳${Number(row.expected_salary_min ?? 0).toLocaleString('bn-BD')}–${Number(row.expected_salary_max ?? 0).toLocaleString('bn-BD')}`
      : '—',
  },
  { key: 'status', header: 'অবস্থা', render: (row) => <Status value={row.status} /> },
  {
    key: 'created',
    header: 'জমার সময়',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-admin-muted">{formatDateTime(row.created_at)}</span>,
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
  const result = await fetchTutorProfiles(params);

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
            <AdminSearch placeholder="নাম, প্রোফাইল ID, প্রতিষ্ঠান খুঁজুন…" className="sm:max-w-md" />
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
            rows={result.rows}
            getKey={(row) => row.id}
            getHref={(row) => `/admin/verifications/${row.id}`}
            caption="গৃহশিক্ষক প্রোফাইল"
            empty={<AdminEmpty title="কোনো টিউটর প্রোফাইল নেই" description="এই সার্চ বা ফিল্টারে কোনো রেকর্ড মেলেনি।" icon={<GraduationCap className="h-5 w-5" />} />}
          />
          <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolved} />
          <p className="mt-3 flex items-center gap-1 text-[11px] text-admin-muted"><ArrowUpRight className="h-3 w-3" /> কোনো প্রোফাইলের সারিতে চাপ দিয়ে ব্যক্তিগত ও পূর্ণ বিবরণ খুলুন।</p>
        </>
      )}
    </>
  );
}
