import { fetchMediaItems, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { formatDateTime } from '@/lib/admin/format';
import type { AdminMediaItem } from '@/lib/admin/queries';
import MediaActions from '@/components/admin/MediaActions';
import MediaLibraryUpload from '@/components/admin/MediaLibraryUpload';

export const dynamic = 'force-dynamic';

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
          <span className="block truncate text-xs font-semibold text-ink-800">{row.display_name}</span>
          <span className="block text-[11px] text-ink-400">
            ওয়েবসাইট মিডিয়া · {formatSize(row.size)}
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
    render: (row) =>     <span className="text-xs text-ink-500">{row.mime_type}</span>,
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
        <PageHeader title="মিডিয়া" description="ওয়েবসাইটে আপলোড করা ছবির লাইব্রেরি।" />
        <AdminError
          title={result.error ? 'মিডিয়া লাইব্রেরি লোড করা যায়নি' : 'ডেটাবেজ সংযুক্ত নেই'}
          message={result.error}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="মিডিয়া"
        description="শুধুমাত্র ওয়েবসাইটের নিজস্ব Supabase Storage ছবিগুলো এখানে দেখানো হয়।"
        count={`মোট ${result.total} টি ফাইল`}
      />

      <MediaLibraryUpload />

      <div className="mb-4">
        <AdminSearch placeholder="ফাইলের নাম খুঁজুন…" />
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => String(row.id)}
        caption="মিডিয়া ফাইলের তালিকা"
        empty={
          <AdminEmpty
            title="কোনো ফাইল পাওয়া যায়নি"
            description="এই লাইব্রেরির আপলোড সুবিধা ব্যবহার করে ছবি যোগ করুন।"
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