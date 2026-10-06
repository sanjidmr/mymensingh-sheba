import { fetchToletRequests, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import type { AdminToletRequestRow } from '@/lib/admin/queries';
import ToletRequestActions from '@/components/admin/ToletRequestActions';

export const dynamic = 'force-dynamic';

const columns: AdminColumn<AdminToletRequestRow>[] = [
  {
    key: 'customer',
    header: 'গ্রাহক',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">{row.customer_name}</span>
        <span className="block text-xs text-ink-400">{row.customer_phone}</span>
      </span>
    ),
  },
  {
    key: 'listing',
    header: 'বিজ্ঞাপন',
    render: (row) => row.listing_title || '—',
  },
  {
    key: 'area',
    header: 'এলাকা',
    render: (row) => row.area_id || '—',
  },
  {
    key: 'message',
    header: 'বার্তা',
    hideOnMobile: true,
    render: (row) => (
      <span className="line-clamp-2 block max-w-xs text-xs text-ink-500">
        {row.message || '—'}
      </span>
    ),
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
    render: (row) => <ToletRequestActions request={row} />,
  },
];

export default async function AdminToletRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchToletRequests(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader
          title="বাসা ভাড়া অনুসন্ধান"
          description="বাসা ভাড়ার বিজ্ঞাপনে আসা সব ইনকোয়ারি।"
        />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="বাসা ভাড়া অনুসন্ধান"
        description="বাসা ভাড়ার বিজ্ঞাপনে আসা সব ইনকোয়ারি। স্ট্যাটাস পরিবর্তন করুন বা মুছে ফেলুন।"
        count={`মোট ${result.total} টি অনুসন্ধান`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="নাম, নম্বর বা বার্তা খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterNav
            id="tolet-request-status"
            label="স্ট্যাটাস"
            value={String(params.status ?? '')}
            placeholder="সব স্ট্যাটাস"
            options={STATUS_OPTIONS.tolet_requests}
            param="status"
            searchParams={resolvedSearchParams}
          />
          <ClearFilters searchParams={new URLSearchParams()} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => row.id}
        caption="বাসা ভাড়া অনুসন্ধানের তালিকা"
        empty={
          <AdminEmpty
            title="কোনো অনুসন্ধান পাওয়া যায়নি"
            description="বাসা ভাড়ার বিজ্ঞাপনে নতুন অনুসন্ধান এলে এখানে দেখা যাবে।"
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