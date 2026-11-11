import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { PageHeader } from '@/components/admin/PageHeader';
import PostActions from '@/components/admin/PostActions';
import { FeaturedPill, StatCard, StatusPill } from '@/components/admin/StatCard';
import { TablePager } from '@/components/admin/TablePager';
import { formatDateTime, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import {
  fetchPostCounts,
  fetchPosts,
  getAdminDataClient,
  parseListParams,
  type AdminPostRow,
} from '@/lib/admin/queries';
import { NEWS_CATEGORIES } from '@/lib/catalog-types';

export const dynamic = 'force-dynamic';

const columns: AdminColumn<AdminPostRow>[] = [
  {
    key: 'headline',
    header: 'শিরোনাম',
    mobilePrimary: true,
    render: (post) => (
      <span className="block min-w-0">
        <span className="block break-words font-semibold text-admin-text">{post.title_bn}</span>
        <span className="mt-1 block text-xs text-admin-muted">{post.author_name || 'লেখক উল্লেখ নেই'}</span>
      </span>
    ),
  },
  {
    key: 'category',
    header: 'বিভাগ',
    render: (post) => NEWS_CATEGORIES.find((category) => category.id === post.category)?.labelBn ?? post.category ?? '—',
  },
  {
    key: 'status',
    header: 'প্রকাশনা',
    render: (post) => {
      const status = lookupStatus(post.status);
      return (
        <span className="flex flex-wrap items-center gap-1.5">
          <StatusPill label={status.label} tone={status.tone} />
          {post.is_featured && <FeaturedPill />}
        </span>
      );
    },
  },
  {
    key: 'date',
    header: 'তারিখ',
    render: (post) => <span className="text-xs text-admin-muted">{formatDateTime(post.published_at ?? post.created_at)}</span>,
  },
  {
    key: 'views',
    header: 'দেখা',
    render: (post) => <span className="tabular-nums text-xs text-admin-muted">{post.view_count ?? '—'}</span>,
  },
  {
    key: 'actions',
    header: 'কাজ',
    headerClassName: 'w-1',
    render: (post) => <PostActions post={post} />,
  },
];

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const params = { ...parseListParams(resolved, { pageSize: 20 }), kind: 'news' };
  const [result, summary, admin] = await Promise.all([
    fetchPosts(params),
    fetchPostCounts('news'),
    getAdminDataClient(),
  ]);

  if (result.unavailable || !admin) {
    return (
      <>
        <PageHeader title="সংবাদ ব্যবস্থাপনা" description="ময়মনসিংহের নিউজের সংবাদ ও প্রকাশনা পরিচালনা করুন।" />
        <AdminError title="সংবাদ লোড করা যায়নি" message={result.error ?? 'অ্যাডমিন অনুমতি যাচাই করা যায়নি।'} />
      </>
    );
  }

  const { data: viewRows, error: viewError } = await admin.client.rpc('fn_news_post_views');
  const viewCounts = new Map<string, number>();
  if (!viewError && Array.isArray(viewRows)) {
    for (const row of viewRows as { post_slug?: unknown; view_count?: unknown }[]) {
      if (typeof row.post_slug === 'string') viewCounts.set(row.post_slug, Number(row.view_count ?? 0));
    }
  }
  const rows = result.rows.map((post) => ({
    ...post,
    view_count: viewCounts.get(post.slug),
  }));
  const tableColumns = columns as AdminColumn<(typeof rows)[number]>[];

  return (
    <>
      <PageHeader
        title="সংবাদ ব্যবস্থাপনা"
        description="ময়মনসিংহের নিউজের সংবাদ, বিভাগ, ফিচার ও প্রকাশনা পরিচালনা করুন। ক্যাটাগরি নিবন্ধ সম্পাদনার সময় নির্ধারিত হয়।"
        count={`${result.total} টি সংবাদ`}
        actions={
          <Link
            href="/admin/posts/new?kind=news"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            নতুন সংবাদ
          </Link>
        }
      />

      {summary.error ? (
        <AdminError title="সংবাদের সারাংশ লোড করা যায়নি" message={summary.error} className="mb-4" />
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="মোট সংবাদ" value={summary.counts.total} />
          <StatCard label="প্রকাশিত" value={summary.counts.approved} tone="good" />
          <StatCard label="খসড়া" value={summary.counts.draft} hint="সম্পাদনার জন্য সংরক্ষিত" />
          <StatCard label="অনুমোদনের অপেক্ষায়" value={summary.counts.pending} tone="attention" />
        </div>
      )}

      {viewError && (
        <p role="status" className="mb-4 rounded-md border border-status-warning/30 bg-status-warning/5 p-3 text-sm text-admin-muted">
          নিবন্ধের দেখা-সংখ্যা লোড করা যায়নি। {viewError.message}
        </p>
      )}

      <div className="mb-3">
        <AdminSearch placeholder="শিরোনাম, লেখক বা সংবাদ খুঁজুন…" />
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        <FilterNav
          id="news-status"
          label="প্রকাশনা"
          value={String(params.status ?? '')}
          placeholder="সব স্ট্যাটাস"
          options={STATUS_OPTIONS.community_posts}
          param="status"
          searchParams={resolved}
        />
        <FilterNav
          id="news-category"
          label="বিভাগ"
          value={String(params.category ?? '')}
          placeholder="সব বিভাগ"
          options={NEWS_CATEGORIES.map(({ id, labelBn }) => ({ value: id, label: labelBn }))}
          param="category"
          searchParams={resolved}
        />
        <ClearFilters searchParams={resolved} />
      </div>

      <AdminTable
        columns={tableColumns}
        rows={rows}
        getKey={(post) => post.id}
        caption="সংবাদের তালিকা"
        empty={<AdminEmpty title="কোনো সংবাদ পাওয়া যায়নি" description="ফিল্টার বদলান, অথবা নতুন সংবাদ তৈরি করুন।" />}
      />
      <TablePager
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={resolved}
      />
      <Link href="/news" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-admin-navy hover:underline">
        পাবলিক নিউজ পোর্টাল দেখুন <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </>
  );
}
