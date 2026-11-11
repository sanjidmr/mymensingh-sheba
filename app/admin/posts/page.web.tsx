import { fetchPosts, fetchPostCounts, parseListParams } from '@/lib/admin/queries';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminTable, type AdminColumn } from '@/components/admin/AdminTable';
import { TablePager } from '@/components/admin/TablePager';
import { AdminSearch, ClearFilters } from '@/components/admin/AdminSearch';
import { FilterNav } from '@/components/admin/FilterNav';
import { AdminError, AdminEmpty } from '@/components/admin/States';
import { StatusPill, FeaturedPill, StatCard } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus, STATUS_OPTIONS } from '@/lib/admin/format';
import type { AdminPostRow } from '@/lib/admin/queries';
import PostActions from '@/components/admin/PostActions';
import { DateRangeFilter } from '@/components/admin/DateRangeFilter';
import { JOB_TYPES } from '@/lib/catalog-types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Plus } from 'lucide-react';
import { MARKET_CATEGORIES, NEWS_CATEGORIES, bnTaka, tagLabel } from '@/lib/catalog-types';
import { getAllMCCAreas } from '@/lib/locations';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<AdminPostRow['kind'], string> = {
  news: 'খবর',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
};

const KIND_ROUTES = [
  { value: '', label: 'সব পোস্ট', href: '/admin/posts' },
  { value: 'news', label: 'সংবাদ', href: '/admin/posts?kind=news' },
  { value: 'job', label: 'চাকরি', href: '/admin/posts?kind=job' },
  { value: 'buy_sell', label: 'কেনাবেচা', href: '/admin/posts?kind=buy_sell' },
];

const columns: AdminColumn<AdminPostRow>[] = [
  {
    key: 'image',
    header: 'ছবি',
    render: (row) => row.cover_image_url ? (
      <span className="relative block h-12 w-16 overflow-hidden rounded-md bg-admin-page">
        <Image src={row.cover_image_url} alt="" fill sizes="64px" unoptimized className="object-cover" />
      </span>
    ) : <span className="text-xs text-admin-muted">ছবি নেই</span>,
  },
  {
    key: 'title',
    header: 'শিরোনাম',
    mobilePrimary: true,
    render: (row) => (
      <Link href={`/admin/posts/${row.id}`} className="block min-w-0 text-admin-text hover:text-admin-navy">
        <span className="block break-words font-semibold">{row.title_bn}</span>
        <span className="mt-0.5 block break-all text-[10px] font-mono text-admin-muted">
          ID: {row.id}
        </span>
        <span className="mt-0.5 block text-xs text-admin-muted">
          {KIND_LABEL[row.kind]}{row.category ? ` · ${row.category}` : ''}
        </span>
      </Link>
    ),
  },
  {
    key: 'facts',
    header: 'ক্যাটাগরি / তথ্য',
    render: (row) => {
      if (row.kind === 'buy_sell') {
        return <span className="block max-w-xs whitespace-normal text-xs leading-relaxed text-admin-muted">
          {row.category ? tagLabel(row.category) : 'ক্যাটাগরি উল্লেখ নেই'} · {row.price != null ? `৳${bnTaka(row.price)}` : 'দাম উল্লেখ নেই'}
          {row.condition_label ? ` · ${tagLabel(row.condition_label)}` : ''}
          {row.body_bn ? <span className="mt-1 block">{row.body_bn.slice(0, 100)}{row.body_bn.length > 100 ? '…' : ''}</span> : null}
        </span>;
      }
      if (row.kind === 'job') {
        const salary = row.salary_min != null || row.salary_max != null
          ? `${row.salary_min != null ? bnTaka(row.salary_min) : ''}${row.salary_min != null && row.salary_max != null ? '–' : ''}${row.salary_max != null ? bnTaka(row.salary_max) : ''}`
          : 'বেতন উল্লেখ নেই';
        return <span className="block max-w-xs whitespace-normal text-xs leading-relaxed text-admin-muted">
          {row.organization_bn || 'প্রতিষ্ঠান উল্লেখ নেই'} · {row.job_type || 'চাকরির ধরন উল্লেখ নেই'} · {salary}
          {row.deadline ? <span className="block">শেষ তারিখ: {row.deadline}</span> : null}
          {row.tags?.length ? <span className="block">প্রয়োজনীয়তা: {row.tags.join(', ')}</span> : null}
        </span>;
      }
      return <span className="block whitespace-normal text-xs text-admin-muted">
        {row.category ? tagLabel(row.category) : 'ক্যাটাগরি উল্লেখ নেই'} · {row.author_name || 'লেখক/সূত্র উল্লেখ নেই'}
        {row.summary_bn ? <span className="mt-1 block">{row.summary_bn}</span> : null}
      </span>;
    },
  },
  {
    key: 'author',
    header: 'জমাদানকারী',
    render: (row) => (
      <span className="block">
        <span className="block">{row.author_name || '—'}</span>
        {row.kind === 'buy_sell' && row.author_phone && (
          <span className="block text-xs text-admin-muted">{row.author_phone}</span>
        )}
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
    render: (row) => (
      <span className="text-xs text-admin-muted">{formatDateTime(row.created_at)}</span>
    ),
  },
  {
    key: 'updated',
    header: 'হালনাগাদ',
    render: (row) => (
      <span className="text-xs text-admin-muted">{formatDateTime(row.updated_at)}</span>
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
  const selectedKind = ['news', 'job', 'buy_sell'].includes(String(params.kind)) ? String(params.kind) : undefined;
  const [result, summary] = await Promise.all([
    fetchPosts(params),
    fetchPostCounts(selectedKind),
  ]);
  const categoryOptions = selectedKind === 'news'
    ? NEWS_CATEGORIES
    : selectedKind === 'buy_sell'
      ? MARKET_CATEGORIES
      : [];
  const pageTitle = selectedKind ? KIND_LABEL[selectedKind as AdminPostRow['kind']] : 'পোস্ট ব্যবস্থাপনা';

  if (result.unavailable) {
    return (
      <>
        <PageHeader
          title={pageTitle}
          description="সংবাদ, চাকরি ও কেনাবেচা পোস্ট পরিচালনা করুন।"
        />
        <AdminError
          title={result.error ? 'পোস্ট লোড করা যায়নি' : 'ডেটাবেজ সংযুক্ত নেই'}
          message={result.error}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={pageTitle}
        description="গ্রাহক জমা ও অ্যাডমিন-তৈরি পোস্ট পর্যালোচনা করুন। অনুমোদিত পোস্টই পাবলিক; প্রত্যাখ্যানের কারণ থাকলে লেখক তা দেখতে পাবেন।"
        count={`ফিল্টার ফলাফল ${result.total} টি পোস্ট`}
        actions={
          <Link
            href={`/admin/posts/new${selectedKind ? `?kind=${selectedKind}` : ''}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {selectedKind ? `নতুন ${KIND_LABEL[selectedKind as AdminPostRow['kind']]} পোস্ট` : 'নতুন পোস্ট'}
          </Link>
        }
      />

      <nav aria-label="পোস্টের ধরন" className="mb-4 flex flex-wrap gap-2">
        {KIND_ROUTES.map((item) => {
          const active = item.value === (selectedKind ?? '');
          return (
            <Link
              key={item.value}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-10 items-center rounded-md border px-3 text-sm font-semibold ${active ? 'border-admin-navy bg-admin-navy text-white' : 'border-admin-border bg-white text-admin-text hover:bg-admin-page'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {summary.error ? (
        <AdminError title="পোস্টের সারাংশ লোড করা যায়নি" message={summary.error} className="mb-4" />
      ) : (
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="মোট পোস্ট" value={summary.counts.total} />
          <StatCard label="অপেক্ষমাণ" value={summary.counts.pending} tone="attention" />
          <StatCard label="প্রকাশিত" value={summary.counts.approved} tone="good" />
          <StatCard label="প্রত্যাখ্যাত" value={summary.counts.rejected} tone="alert" />
        </div>
      )}

      <section aria-label="অন্যান্য গ্রাহক তালিকা" className="mb-5">
        <p className="mb-2 text-xs font-bold text-admin-muted">
          অন্যান্য গ্রাহক-তৈরি তালিকা — নিজ নিজ ব্যবস্থাপনা পৃষ্ঠা
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { href: '/admin/tolet', label: 'বাসা ভাড়া', detail: 'To-Let বিজ্ঞাপন' },
            { href: '/admin/verifications', label: 'গৃহশিক্ষক', detail: 'শিক্ষক প্রোফাইল' },
            { href: '/admin/blood/donors', label: 'রক্তদাতা', detail: 'দাতা প্রোফাইল' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-14 items-center justify-between gap-2 rounded-admin-card border border-admin-border bg-white px-3 py-2 hover:border-admin-navy/30 hover:bg-admin-page"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-admin-text">{item.label}</span>
                <span className="block text-xs text-admin-muted">{item.detail}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-admin-muted" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-3">
        <AdminSearch placeholder="শিরোনাম, ID, লেখক বা ফোন খুঁজুন…" />
      </div>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
            clearOnChange={['category', 'jobType']}
        />
        {params.kind === 'job' && (
          <FilterNav
            id="post-job-type"
            label="চাকরির ধরন"
            value={String(params.jobType ?? '')}
            placeholder="সব চাকরির ধরন"
            options={JOB_TYPES.map(({ id, labelBn }) => ({ value: id, label: labelBn }))}
            param="jobType"
            searchParams={resolvedSearchParams}
          />
        )}
        {categoryOptions.length > 0 ? (
          <FilterNav
            id="post-category"
            label="ক্যাটাগরি"
            value={String(params.category ?? '')}
            placeholder="সব ক্যাটাগরি"
            options={categoryOptions.map(({ id, labelBn }) => ({ value: id, label: labelBn }))}
            param="category"
            searchParams={resolvedSearchParams}
          />
        ) : (
          <AdminSearch param="category" placeholder="ক্যাটাগরি (নির্দিষ্ট মান)" className="sm:max-w-none" />
        )}
        <FilterNav
          id="post-area"
          label="এলাকা"
          value={String(params.area ?? '')}
          placeholder="সব এলাকা"
          options={getAllMCCAreas({ activeOnly: true }).map(({ id, nameBn }) => ({ value: id, label: nameBn }))}
          param="area"
          searchParams={resolvedSearchParams}
        />
        <DateRangeFilter />
        <ClearFilters searchParams={resolvedSearchParams} />
      </div>

      <AdminTable
        columns={columns}
        rows={result.rows}
        getKey={(row) => String(row.id)}
        caption={`${pageTitle} তালিকা`}
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