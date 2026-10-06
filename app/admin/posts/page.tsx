import { fetchPosts, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill, FeaturedPill, Tag } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus, STATUS_OPTIONS, truncate } from '@/lib/admin/format';
import type { AdminPostRow } from '@/lib/admin/queries';
import PostActions from '@/components/admin/PostActions';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<AdminPostRow['kind'], string> = {
  news: 'খবর',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
};

const columns: AdminColumn<AdminPostRow>[] = [
  {
    key: 'title',
    header: 'শিরোনাম',
    mobilePrimary: true,
    render: (row) => (
      <span className="block">
        <span className="block">{row.title_bn}</span>
        <span className="mt-0.5 block text-xs text-ink-400">
          {KIND_LABEL[row.kind]}
          {row.category ? ` · ${row.category}` : ''}
        </span>
      </span>
    ),
  },
  {
    key: 'author',
    header: 'লেখক',
    render: (row) => (
      <span className="block">
        <span className="block">{row.author_name || '—'}</span>
        {row.author_phone && (
          <span className="block text-xs text-ink-400">{row.author_phone}</span>
        )}
      </span>
    ),
  },
  {
    key: 'area',
    header: 'এলাকা',
    hideOnMobile: true,
    render: (row) => row.area_id || '—',
  },
  {
    key: 'status',
    header: 'স্ট্যাটাস',
    render: (row) => {
      const status = lookupStatus(row.status);
      return (
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusPill label={status.label} tone={status.tone} />
          {row.is_featured && <FeaturedPill />}
        </span>
      );
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
    render: (row) => <PostActions post={row} />,
  },
];

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const params = parseListParams(resolvedSearchParams, { pageSize: 20 });
  const result = await fetchPosts(params);

  if (result.unavailable) {
    return (
      <>
        <PageHeader
          title="সার্ভিস পোস্ট"
          description="খবর, চাকরি ও কেনাবেচা পোস্ট — অনুমোদন, ফিচার ও মুছে ফেলা।"
        />
        <AdminError title="ডেটাবেজ সংযুক্ত নেই" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="সার্ভিস পোস্ট"
        description="খবর, চাকরি ও কেনাবেচা পোস্ট। অনুমোদন করলে পোস্টটি সর্বজনীনভাবে দেখা যায়।"
        count={`মোট ${result.total} টি পোস্ট`}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <AdminSearch placeholder="শিরোনাম, লেখক বা স্লাগ খুঁজুন…" />
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <FilterNav
            id="post-status"
            label="স্ট্যাটাস"
            value={String(params.status ?? '')}
            placeholder="সব স্ট্যাটাস"
            options={STATUS_OPTIONS.community_posts}
            param="status"
            searchParams={resolvedSearchParams}
          />
          <FilterNav
            id="post-kind"
            label="ধরন"
            value={String(params.kind ?? '')}
            placeholder="সব ধরন"
            options={[
              { value: 'news', label: 'খবর' },
              { value: 'job', label: 'চাকরি' },
              { value: 'buy_sell', label: 'কেনাবেচা' },
            ]}
            param="kind"
            searchParams={resolvedSearchParams}
          />
          <ClearFilters searchParams={new URLSearchParams()} />
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => String(row.id)}
        caption="কমিউনিটি পোস্টের তালিকা"
        empty={
          <AdminEmpty
            title="কোনো পোস্ট পাওয়া যায়নি"
            description="নতুন পোস্ট জমা দিলে এখানে দেখা যাবে।"
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