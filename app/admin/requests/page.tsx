import { fetchServiceRequests, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import type { AdminRequestRow } from '@/lib/admin/queries';
import RequestActions from '@/components/admin/RequestActions';

export const dynamic = 'force-dynamic';

const SERVICE_LABEL: Record<string, string> = {
  'kajer-bua': 'কাজের বুয়া',
  electrician: 'ইলেকট্রিশিয়ান',
  plumber: 'প্লাম্বার',
  'basha-paltano': 'বাসা পাল্টানো',
  'ac-fridge': 'এসি/ফ্রিজ',
  'home-moving': 'বাসা পাল্টানো',
};

const columns: AdminColumn<AdminRequestRow>[] = [
  {
    key: 'service',
    header: 'সেবা',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">
          {SERVICE_LABEL[row.service_slug] ?? row.service_slug}
        </span>
        {row.profile_title && (
          <span className="mt-0.5 block text-xs text-ink-400">{row.profile_title}</span>
        )}
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
    key: 'area',
    header: 'এলাকা',
    render: (row) => row.area_id || '—',
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
    key: 'date',
    header: 'তারিখ',
    hideOnMobile: true,
    render: (row) => (
      <span className="text-xs text-ink-500">{formatDateTime(row.created_at)}</span>
    ),
  },
  {
    key: 'actions',
    header: '',
    headerClassName: 'w-1',
    render: (row) => <RequestActions request={row} />,
  },
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
        <PageHeader
          title="রিকোয়েস্ট"
          description="সব সেবা রিকোয়েস্ট এক জায়গায় — স্ট্যাটাস আপডেট ও মুছে ফেলা।"
        />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="রিকোয়েস্ট"
        description="সব সেবা রিকোয়েস্ট এক জায়গায়। স্ট্যাটাস পরিবর্তন করলে গ্রাহকের পেজেও সেটি দেখা যায়।"
        count={`মোট ${result.total} টি রিকোয়েস্ট`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="নাম, নম্বর বা সেবা খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterNav
            id="request-status"
            label="স্ট্যাটাস"
            value={String(params.status ?? '')}
            placeholder="সব স্ট্যাটাস"
            options={STATUS_OPTIONS.service_requests}
            param="status"
            searchParams={resolvedSearchParams}
          />
          <FilterNav
            id="request-service"
            label="সেবা"
            value={String(params.service ?? '')}
            placeholder="সব সেবা"
            options={Object.entries(SERVICE_LABEL).map(([value, label]) => ({
              value,
              label,
            }))}
            param="service"
            searchParams={resolvedSearchParams}
          />
          <ClearFilters searchParams={new URLSearchParams()} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => String(row.id)}
        caption="সেবা রিকোয়েস্টের তালিকা"
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