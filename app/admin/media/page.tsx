import { fetchMediaItems, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterSelect } from '@/components/admin/PageSizeSelect';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { formatDateTime } from '@/lib/admin/format';
import type { AdminMediaItem } from '@/lib/admin/queries';
import MediaActions from '@/components/admin/MediaActions';

export const dynamic = 'force-dynamic';

const BUCKETS = [
  { value: 'site', label: 'সাইট মিডিয়া' },
  { value: 'listings', label: 'বাসা ভাড়া ছবি' },
  { value: 'staff', label: 'কর্মী ছবি' },
  { value: 'avatars', label: 'প্রোফাইল ছবি' },
  { value: 'documents', label: 'ডকুমেন্ট (ব্যক্তিগত)' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const columns: AdminColumn<AdminMediaItem>[] = [
  {
    key: 'preview',
    header: 'প্রিভিউ',
    mobilePrimary: true,
    render: (row) => (
      <span className="flex items-center gap-2.5">
        {row.public_url ? (
          <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-md bg-mist-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.public_url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
        ) : (
          <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-mist-100 text-[10px] font-semibold text-ink-400">
            ব্যক্তিগত
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-ink-800">
            {row.name.split('/').pop()}
          </span>
          <span className="block text-[11px] text-ink-400">
            {row.bucket_id} · {formatSize(row.size)}
          </span>
        </span>
      </span>
    ),
  },
  {
    key: 'path',
    header: 'পাথ',
    hideOnMobile: true,
    render: (row) => (
      <span className="block max-w-xs truncate font-mono text-xs text-ink-500">{row.name}</span>
    ),
  },
  {
    key: 'type',
    header: 'ধরন',
    hideOnMobile: true,
    render: (row) => <span className="text-xs text-ink-500">{row.mime_type ?? '—'}</span>,
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
    render: (row) => <MediaActions item={row} />,
  },
];

export default async function AdminMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchMediaItems(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader title="মিডিয়া" description="আপলোড করা ছবি ও ফাইলের লাইব্রেরি।" />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="মিডিয়া"
        description="স্টোরেজে আপলোড করা সব ফাইল। শুধুমাত্র অ্যাডমিন আপলোড করা ফাইল মুছে ফেলা যাবে।"
        count={`মোট ${result.total} টি ফাইল`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="ফাইলের নাম খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterSelect
            id="media-bucket"
            label="বাকেট"
            value={String(params.category ?? '')}
            placeholder="সব বাকেট"
            options={BUCKETS}
            onChange={() => {}}
          />
          <ClearFilters searchParams={new URLSearchParams()} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => String(row.id)}
        caption="মিডিয়া ফাইলের তালিকা"
        empty={
          <AdminEmpty
            title="কোনো ফাইল পাওয়া যায়নি"
            description="হিরো বা ওয়েবসাইট মিডিয়া থেকে আপলোড করলে এখানে দেখা যাবে।"
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