import { fetchMessages } from '@/lib/admin/queries';
import { parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import type { AdminMessageRow } from '@/lib/admin/queries';
import MessageActions from '@/components/admin/MessageActions';

export const dynamic = 'force-dynamic';

const columns: AdminColumn<AdminMessageRow>[] = [
  {
    key: 'name',
    header: 'নাম',
    mobilePrimary: true,
    render: (row) => row.name,
  },
  {
    key: 'contact',
    header: 'যোগাযোগ',
    render: (row) => (
      <span className="block">
        <span className="block">{row.phone}</span>
        {row.email && <span className="block text-xs text-ink-400">{row.email}</span>}
      </span>
    ),
  },
  {
    key: 'subject',
    header: 'বিষয়',
    render: (row) => row.subject,
  },
  {
    key: 'message',
    header: 'বার্তা',
    hideOnMobile: true,
    render: (row) => (
      <span className="line-clamp-2 block max-w-xs text-xs text-ink-500">{row.message}</span>
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
    render: (row) => <MessageActions message={row} />,
  },
];

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchMessages(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader title="মেসেজ" description="যোগাযোগ ফর্মে পাঠানো সব বার্তা।" />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  const statusOptions = STATUS_OPTIONS.contact_messages;

  return (
    <>
      <PageHeader
        title="মেসেজ"
        description="যোগাযোগ ফর্মে পাঠানো সব বার্তা। নতুন বার্তা উল্লেখযোগ্যভাবে চিহ্নিত থাকে।"
        count={`মোট ${result.total} টি বার্তা`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="নাম, নম্বর বা বার্তা খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterNav
            id="message-status"
            label="স্ট্যাটাস"
            value={String(params.status ?? '')}
            placeholder="সব স্ট্যাটাস"
            options={statusOptions}
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
        getHref={(row) => `/admin/messages/${row.id}`}
        caption="যোগাযোগ বার্তার তালিকা"
        empty={
          <AdminEmpty
            title="কোনো বার্তা পাওয়া যায়নি"
            description="যোগাযোগ ফর্মে নতুন বার্তা এলে এখানে দেখা যাবে।"
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