import Link from 'next/link';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard, StatusPill } from '@/components/admin/StatCard';
import { TablePager } from '@/components/admin/TablePager';
import { fetchServiceRequests, fetchStaffAssignmentFilterOptions, parseListParams, type AdminRequestRow } from '@/lib/admin/queries';
import { formatDateTime, lookupStatus } from '@/lib/admin/format';
import { getAllMCCAreas } from '@/lib/locations';

export const dynamic = 'force-dynamic';

const SERVICE_LABEL: Record<string, string> = {
  'kajer-bua': 'কাজের বুয়া',
  electrician: 'ইলেকট্রিশিয়ান',
  plumber: 'প্লাম্বার',
  'basha-paltano': 'বাসা বদলানো',
  'home-moving': 'বাসা বদলানো (পুরোনো রেকর্ড)',
  'ac-fridge': 'AC ও ফ্রিজ মেরামত',
  'home-tutor': 'গৃহশিক্ষক',
};

const columns: AdminColumn<AdminRequestRow>[] = [
  {
    key: 'request',
    header: 'রিকোয়েস্ট',
    mobilePrimary: true,
    render: (row) => (
      <span className="block min-w-0">
        <span className="block break-all font-mono text-xs text-admin-muted">{row.id}</span>
        <span className="mt-1 block break-words font-semibold">{SERVICE_LABEL[row.service_slug] ?? row.service_slug}</span>
        {row.service_type && <span className="block break-words text-xs text-admin-muted">{row.service_type}</span>}
      </span>
    ),
  },
  {
    key: 'customer',
    header: 'গ্রাহক',
    render: (row) => (
      <span className="block min-w-32">
        <span className="block break-words">{row.contact_name || row.customer_full_name || 'নাম উল্লেখ নেই'}</span>
        <span className="block text-xs text-admin-muted">{row.contact_phone || 'নম্বর উল্লেখ নেই'}</span>
      </span>
    ),
  },
  {
    key: 'area',
    header: 'এলাকা',
    render: (row) => row.area_id || 'উল্লেখ নেই',
  },
  {
    key: 'worker',
    header: 'নির্ধারিত কর্মী',
    render: (row) => row.assigned_worker_name || row.profile_title || 'নির্ধারিত নয়',
  },
  {
    key: 'status',
    header: 'স্টատուս',
    render: (row) => {
      const status = lookupStatus(row.status);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
  },
  {
    key: 'date',
    header: 'জমার সময়',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-admin-muted">{formatDateTime(row.created_at)}</span>,
  },
];

const STATUS_OPTIONS = [
  { value: 'new', label: 'নতুন' },
  { value: 'submitted', label: 'জমা দেওয়া' },
  { value: 'reviewing', label: 'পর্যালোচনাধীন' },
  { value: 'assigned', label: 'কর্মী নির্ধারিত' },
  { value: 'contacted', label: 'যোগাযোগ হয়েছে' },
  { value: 'in_progress', label: 'কাজ চলছে' },
  { value: 'completed', label: 'সম্পন্ন' },
  { value: 'cancelled', label: 'বাতিল' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত' },
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchServiceRequests(params);
  if (result.unavailable) {
    return (
      <>
        <PageHeader title="হোম সার্ভিস রিকোয়েস্ট" description="বাসাবাড়ির সেবা অনুরোধ পর্যালোচনা, কর্মী নির্ধারণ ও অগ্রগতি পরিচালনা করুন।" />
        <AdminError title="রিকোয়েস্ট লোড করা যায়নি" message={result.error} />
      </>
    );
  }

  let workerOptions: { value: string; label: string }[] = [];
  let workerLoadError = '';
  try {
    const workers = await fetchStaffAssignmentFilterOptions();
    workerOptions = workers.map((worker) => ({
      value: worker.id,
      label: `${worker.name_bn} · ${SERVICE_LABEL[worker.service_slug] ?? worker.service_slug}`,
    }));
  } catch (error) {
    workerLoadError = error instanceof Error ? error.message : 'কর্মী তালিকা লোড করা যায়নি।';
  }
  const areaOptions = getAllMCCAreas({ activeOnly: true }).map(({ id, nameBn }) => ({ value: id, label: nameBn }));
  const counts = result.counts.statuses;
  const otherCount = ['reviewing', 'contacted', 'rejected'].reduce((total, status) => total + (counts[status] ?? 0), 0);

  return (
    <>
      <PageHeader
        title="হোম সার্ভিস রিকোয়েস্ট"
        description="বাসাবাড়ির সেবা অনুরোধ পর্যালোচনা, উপযুক্ত কর্মী নির্ধারণ এবং অগ্রগতি ট্র্যাক করুন। গ্রাহকের স্ট্যাটাস কেবল সংরক্ষিত ডেটা থেকেই দেখানো হয়।"
        count={`মোট ${result.counts.total} টি রিকোয়েস্ট`}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="নতুন / জমা" value={(counts.new ?? 0) + (counts.submitted ?? 0)} tone="attention" />
        <StatCard label="কর্মী নির্ধারিত" value={counts.assigned ?? 0} />
        <StatCard label="কাজ চলছে" value={counts.in_progress ?? 0} tone="attention" />
        <StatCard label="সম্পন্ন" value={counts.completed ?? 0} tone="good" />
        <StatCard label="বাতিল" value={counts.cancelled ?? 0} />
        <StatCard label="অন্যান্য অবস্থা" value={otherCount} />
        <StatCard label="মোট" value={result.counts.total} />
      </div>

      {workerLoadError && <AdminError title="কর্মী ফিল্টার লোড করা যায়নি" message={workerLoadError} className="mb-4" />}
      <div className="mb-4 grid grid-cols-1 gap-2 rounded-admin-card border border-admin-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminSearch placeholder="রিকোয়েস্ট আইডি, গ্রাহক বা ফোন খুঁজুন…" />
        <FilterNav id="request-status" label="স্ট্যাটাস" value={params.status ?? ''} placeholder="সব স্ট্যাটাস" options={STATUS_OPTIONS} param="status" searchParams={resolvedSearchParams} />
        <FilterNav id="request-service" label="সেবা" value={params.service ?? ''} placeholder="সব সেবা" options={Object.entries(SERVICE_LABEL).map(([value, label]) => ({ value, label }))} param="service" searchParams={resolvedSearchParams} />
        <FilterNav id="request-area" label="এলাকা" value={params.area ?? ''} placeholder="সব এলাকা" options={areaOptions} param="area" searchParams={resolvedSearchParams} />
        <FilterNav
          id="request-worker"
          label="কর্মী"
          value={typeof params.worker === 'string' ? params.worker : ''}
          placeholder="সব কর্মী"
          options={[{ value: 'unassigned', label: 'কর্মী নির্ধারিত নয়' }, ...workerOptions]}
          param="worker"
          searchParams={resolvedSearchParams}
        />
        <div className="lg:col-span-2"><DateRangeFilter /></div>
        <div className="sm:col-span-2 lg:col-span-4"><ClearFilters searchParams={resolvedSearchParams} /></div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => row.id}
        getHref={(row) => `/admin/requests/${row.id}/operations`}
        caption="হোম সার্ভিস রিকোয়েস্ট তালিকা"
        empty={<AdminEmpty title="কোনো রিকোয়েস্ট পাওয়া যায়নি" description="সার্চ বা ফিল্টার পরিবর্তন করুন। নতুন রিকোয়েস্ট এলে এখানে দেখাবে।" />}
      />
      <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolvedSearchParams} />
      <p className="mt-3 text-xs text-admin-muted">
        Worker assignment is currently supported only for housemaid, electrician, and plumber categories.{' '}
        <Link href="/admin/services" className="font-semibold text-admin-navy underline">কর্মী ব্যবস্থাপনা</Link>
      </p>
    </>
  );
}
