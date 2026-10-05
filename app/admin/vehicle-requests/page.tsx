import { fetchVehicleRequests, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterSelect } from '@/components/admin/PageSizeSelect';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDate, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import type { AdminVehicleRequestRow } from '@/lib/admin/queries';
import VehicleRequestActions from '@/components/admin/VehicleRequestActions';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  'গাড়ি': 'গাড়ি',
  'অটো': 'অটো',
  CNG: 'CNG',
};

const columns: AdminColumn<AdminVehicleRequestRow>[] = [
  {
    key: 'vehicle',
    header: 'গাড়ি',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">{row.vehicle_name || KIND_LABEL[row.vehicle_kind] || row.vehicle_kind}</span>
        <span className="mt-0.5 block text-xs text-ink-400">
          {row.pickup_area_id || '—'} → {row.destination_area_id || '—'}
        </span>
      </span>
    ),
  },
  {
    key: 'contact',
    header: 'যোগাযোগ',
    render: (row) => (
      <span className="block">
        <span className="block">{row.contact_name}</span>
        <span className="block text-xs text-ink-400">{row.contact_phone}</span>
      </span>
    ),
  },
  {
    key: 'date',
    header: 'ভ্রমণের তারিখ',
    render: (row) => <span className="text-xs text-ink-500">{formatDate(row.travel_date)}</span>,
  },
  {
    key: 'budget',
    header: 'বাজেট',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-ink-500">{row.budget ? `৳${row.budget}` : '—'}</span>,
  },
  {
    key: 'status',
    header: 'স্ট্যাটাস',
    render: (row) => {
      const status = lookupStatus(row.status);
      return <StatusPill label={status.label} tone={status.tone} />;
    },
  },
  {
    key: 'actions',
    header: '',
    headerClassName: 'w-1',
    render: (row) => <VehicleRequestActions request={row} />,
  },
];

export default async function AdminVehicleRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchVehicleRequests(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader
          title="গাড়ি রিকোয়েস্ট"
          description="গাড়ি, অটো ও সিএনজি ভাড়ার অনুরোধ।"
        />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="গাড়ি রিকোয়েস্ট"
        description="গাড়ি, অটো ও সিএনজি ভাড়ার অনুরোধ। স্ট্যাটাস পরিবর্তন বা মুছে ফেলুন।"
        count={`মোট ${result.total} টি রিকোয়েস্ট`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="নাম, নম্বর বা গাড়ির নাম খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterSelect
            id="vehicle-request-status"
            label="স্ট্যাটাস"
            value={String(params.status ?? '')}
            placeholder="সব স্ট্যাটাস"
            options={STATUS_OPTIONS.vehicle_requests}
            onChange={() => {}}
          />
          <ClearFilters searchParams={new URLSearchParams()} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => row.id}
        caption="গাড়ি রিকোয়েস্টের তালিকা"
        empty={
          <AdminEmpty
            title="কোনো রিকোয়েস্ট পাওয়া যায়নি"
            description="নতুন রিকোয়েস্ট এলে এখানে দেখা যাবে।"
          />
        }
      />

      <TablePager
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={resolvedSearchParams}
      />
    </>
  );
}