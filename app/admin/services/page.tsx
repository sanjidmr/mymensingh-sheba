import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard, StatusPill } from '@/components/admin/StatCard';
import { TablePager } from '@/components/admin/TablePager';
import StaffProfileActions from '@/components/admin/StaffProfileActions';
import { fetchAdminStaffPage, parseListParams, type AdminStaffListRow } from '@/lib/admin/queries';
import { STAFF_SERVICE_UI, STAFF_AVAILABILITY_LABELS } from '@/lib/staff-types';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';

export const dynamic = 'force-dynamic';

const columns: AdminColumn<AdminStaffListRow>[] = [
  {
    key: 'name',
    header: 'কর্মী',
    mobilePrimary: true,
    render: (row) => (
      <span className="block min-w-0">
        <span className="block break-words font-semibold">{row.name_bn}</span>
      {row.phone_private
        ? <a href={`tel:${row.phone_private}`} className="block break-words text-xs text-admin-muted">{row.phone_private}</a>
        : <span className="block text-xs text-admin-muted">ফোন নম্বর দেওয়া হয়নি</span>}
      </span>
    ),
  },
  {
    key: 'service',
    header: 'সেবা',
    render: (row) => STAFF_SERVICE_UI[row.service_slug as keyof typeof STAFF_SERVICE_UI]?.nameBn ?? row.service_slug,
  },
  {
    key: 'areas',
    header: 'কর্ম-এলাকা',
    render: (row) => row.areas.map((id) => getAreaById(id)?.nameBn ?? id).join(', ') || '—',
  },
  {
    key: 'availability',
    header: 'প্রাপ্যতা',
    render: (row) => (
      <StatusPill
        label={STAFF_AVAILABILITY_LABELS[row.availability as keyof typeof STAFF_AVAILABILITY_LABELS] ?? row.availability}
        tone={row.availability === 'available' ? 'success' : row.availability === 'busy' ? 'neutral' : 'warning'}
      />
    ),
  },
  {
    key: 'verification',
    header: 'যাচাই / অবস্থা',
    render: (row) => (
      <div className="flex flex-wrap gap-1.5">
        <StatusPill label={row.is_verified ? 'যাচাইকৃত' : 'যাচাই হয়নি'} tone={row.is_verified ? 'success' : 'warning'} />
        <StatusPill label={row.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} tone={row.is_active ? 'info' : 'neutral'} />
      </div>
    ),
  },
  {
    key: 'actions',
    header: 'অ্যাকশন',
    headerClassName: 'w-1',
    render: (row) => <StaffProfileActions profile={row} />,
  },
];

const SERVICE_OPTIONS = Object.values(STAFF_SERVICE_UI).map(({ key, nameBn }) => ({ value: key, label: nameBn }));
const STATUS_OPTIONS = [
  { value: 'active', label: 'সক্রিয়' },
  { value: 'inactive', label: 'নিষ্ক্রিয়' },
  { value: 'verified', label: 'যাচাইকৃত' },
];

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchAdminStaffPage(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader title="কর্মী ব্যবস্থাপনা" description="কর্মী প্রোফাইল, প্রাপ্যতা ও যাচাই পরিচালনা করুন।" />
        <AdminError title="কর্মী তালিকা লোড করা যায়নি" message={result.error} />
      </>
    );
  }

  const areaOptions = getAllMCCAreas({ activeOnly: true }).map(({ id, nameBn }) => ({ value: id, label: nameBn }));
  return (
    <>
      <PageHeader
        title="কর্মী ব্যবস্থাপনা"
        description="কাজের বুয়া, ইলেকট্রিশিয়ান, প্লাম্বার ও এসি/ফ্রিজ মেরামত প্রোফাইল পরিচালনা করুন। কর্মীদের ব্যক্তিগত ফোন নম্বর শুধু এই অ্যাডমিন তালিকায় ও সুরক্ষিত ব্যবস্থাপনায় দেখা যায়।"
        count={`ফিল্টার করা ${result.total} টি প্রোফাইল`}
        actions={
          <Link href="/admin/services/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90">
            <Plus className="h-4 w-4" aria-hidden="true" />
            নতুন কর্মী
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="সক্রিয় কর্মী" value={result.total_active} tone="good" />
        <StatCard label="নিষ্ক্রিয় কর্মী" value={result.total_inactive} />
        <StatCard label="যাচাইকৃত কর্মী" value={result.total_verified} tone="attention" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 rounded-admin-card border border-admin-border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminSearch placeholder="নাম, ফোন বা কর্মী আইডি খুঁজুন…" />
        <FilterNav id="staff-service" label="সেবা" value={params.service ?? ''} options={SERVICE_OPTIONS} placeholder="সব সেবা" param="service" searchParams={resolvedSearchParams} />
        <FilterNav id="staff-status" label="অবস্থা" value={params.status ?? ''} options={STATUS_OPTIONS} placeholder="সব অবস্থা" param="status" searchParams={resolvedSearchParams} />
        <FilterNav id="staff-area" label="এলাকা" value={params.area ?? ''} options={areaOptions} placeholder="সব এলাকা" param="area" searchParams={resolvedSearchParams} />
        <div className="sm:col-span-2 lg:col-span-4">
          <ClearFilters searchParams={resolvedSearchParams} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => row.id}
        caption="কর্মী প্রোফাইল তালিকা"
        empty={<AdminEmpty title="কোনো কর্মী পাওয়া যায়নি" description="সার্চ বা ফিল্টার পরিবর্তন করুন, অথবা নতুন কর্মী যোগ করুন।" />}
      />
      <TablePager page={result.page} pageSize={result.pageSize} total={result.total} searchParams={resolvedSearchParams} />
    </>
  );
}
