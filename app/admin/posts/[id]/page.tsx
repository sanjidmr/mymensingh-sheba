import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, ExternalLink, Pencil } from 'lucide-react';
import { AdminError } from '@/components/admin/States';
import { DetailField, PageHeader, Panel } from '@/components/admin/PageHeader';
import PostActions from '@/components/admin/PostActions';
import { StatusPill, Tag } from '@/components/admin/StatCard';
import { formatDateTime, lookupStatus } from '@/lib/admin/format';
import { fetchAdminPostById } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

const KIND_LABEL = {
  news: 'সংবাদ',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
} as const;

const PUBLIC_ROUTE = {
  news: '/news',
  job: '/jobs',
  buy_sell: '/buy-sell',
} as const;

export default async function AdminPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchAdminPostById(id);

  if (result.unavailable) {
    return <AdminError title="পোস্ট লোড করা যায়নি" message={result.error} />;
  }
  if (!result.post) notFound();

  const post = result.post;
  const status = lookupStatus(post.status);
  const publicHref = `${PUBLIC_ROUTE[post.kind]}/${encodeURIComponent(post.slug)}`;
  const whatsappDigits = post.whatsapp_number?.replace(/\D/g, '') ?? '';
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits.startsWith('0') ? `88${whatsappDigits}` : whatsappDigits}`
    : null;
  const photos = [post.cover_image_url, ...(post.gallery ?? [])].filter(
    (url): url is string => Boolean(url)
  );

  return (
    <>
      <PageHeader
        title={post.title_bn}
        description={`${KIND_LABEL[post.kind]} পোস্ট · ${post.id}`}
        breadcrumb={{ href: '/admin/posts', label: 'পোস্ট ও লিস্টিং' }}
        actions={
          <>
            <Link
              href={`/admin/posts/${post.id}/edit`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-admin-border bg-white px-3 text-sm font-semibold text-admin-text hover:bg-admin-page"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              সম্পাদনা
            </Link>
            {post.status === 'approved' && (
              <a
                href={publicHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-admin-navy px-3 text-sm font-semibold text-white hover:bg-admin-navy/90"
              >
                সর্বসাধারণের পৃষ্ঠা
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </>
        }
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <Panel
            title="পোস্টের বিষয়বস্তু"
            actions={<StatusPill label={status.label} tone={status.tone} />}
          >
            {post.summary_bn && (
              <p className="mb-4 break-words rounded-md bg-admin-page p-3 text-sm font-semibold leading-relaxed text-admin-text">
                {post.summary_bn}
              </p>
            )}
            <div className="whitespace-pre-wrap break-words text-sm leading-7 text-admin-text">
              {post.body_bn || 'কোনো বিস্তারিত বিবরণ দেওয়া হয়নি।'}
            </div>
            {post.rejection_reason && (
              <div className="mt-5 rounded-md border border-status-danger/25 bg-status-danger/5 p-3">
                <p className="text-xs font-bold text-status-danger">প্রত্যাখ্যানের কারণ</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-admin-text">
                  {post.rejection_reason}
                </p>
              </div>
            )}
          </Panel>

          {photos.length > 0 && (
            <Panel title={`ছবি (${photos.length})`}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-md border border-admin-border bg-admin-page"
                  >
                    <Image
                      src={url}
                      alt={`${post.title_bn} — ছবি ${index + 1}`}
                      width={480}
                      height={320}
                      unoptimized
                      className="aspect-[3/2] w-full object-cover transition-transform group-hover:scale-[1.02]"
                    />
                    <span className="flex items-center justify-between gap-2 px-2 py-1.5 text-[11px] text-admin-muted">
                      <span>{index === 0 ? 'প্রচ্ছদ' : `ছবি ${index + 1}`}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  </a>
                ))}
              </div>
            </Panel>
          )}

          {post.tags?.length > 0 && (
            <Panel title="ট্যাগ">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
              </div>
            </Panel>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          <Panel title="প্রকাশনা ও জমাদান">
            <dl className="grid gap-3">
              <DetailField label="ধরন">{KIND_LABEL[post.kind]}</DetailField>
              <DetailField label="ক্যাটাগরি">{post.category || '—'}</DetailField>
              <DetailField label="এলাকা">{post.area_id || '—'}</DetailField>
              <DetailField label="স্লাগ">{post.slug}</DetailField>
              <DetailField label="ফিচার">{post.is_featured ? 'হ্যাঁ' : 'না'}</DetailField>
              <DetailField label="জমা দেওয়ার সময়">{formatDateTime(post.created_at)}</DetailField>
              <DetailField label="সর্বশেষ হালনাগাদ">{formatDateTime(post.updated_at)}</DetailField>
              <DetailField label="প্রকাশের সময়">{formatDateTime(post.published_at)}</DetailField>
              <DetailField label="রেকর্ড আইডি">{post.id}</DetailField>
              <DetailField label="মালিকের আইডি">{post.author_id}</DetailField>
            </dl>
          </Panel>

          <Panel title="জমাদানকারী ও যোগাযোগ">
            <dl className="grid gap-3">
              <DetailField label="নাম">{post.author_name || '—'}</DetailField>
              <DetailField label="ফোন">
                {post.kind === 'buy_sell' && post.author_phone ? (
                  <a href={`tel:${post.author_phone}`} className="font-semibold text-admin-navy underline">
                    {post.author_phone}
                  </a>
                ) : '—'}
              </DetailField>
              <DetailField label="হোয়াটসঅ্যাপ">
                {post.kind === 'buy_sell' && post.whatsapp_number && whatsappHref ? (
                  <a href={whatsappHref} className="font-semibold text-admin-navy underline">
                    {post.whatsapp_number}
                  </a>
                ) : '—'}
              </DetailField>
            </dl>
            {post.kind === 'job' && (
              <dl className="mt-4 grid gap-3 border-t border-admin-border pt-4">
                <DetailField label="প্রতিষ্ঠান">{post.organization_bn || '—'}</DetailField>
                <DetailField label="চাকরির ধরন">{post.job_type || '—'}</DetailField>
                <DetailField label="বেতন">
                  {post.salary_min == null && post.salary_max == null
                    ? '—'
                    : `${post.salary_min ?? '—'} – ${post.salary_max ?? '—'}`}
                </DetailField>
                <DetailField label="আবেদনের শেষ তারিখ">{post.deadline || '—'}</DetailField>
              </dl>
            )}
            {post.kind === 'buy_sell' && (
              <dl className="mt-4 grid gap-3 border-t border-admin-border pt-4">
                <DetailField label="দাম">{post.price == null ? '—' : `৳ ${post.price.toLocaleString('en-BD')}`}</DetailField>
                <DetailField label="পণ্যের অবস্থা">{post.condition_label || '—'}</DetailField>
              </dl>
            )}
          </Panel>

          <Panel title="পোস্ট পরিচালনা">
            <PostActions post={post} />
          </Panel>
          <p className="rounded-md border border-admin-border bg-admin-page p-3 text-xs leading-relaxed text-admin-muted">
            মডারেশন ইতিহাসের আলাদা টেবিল নেই। এখানে বর্তমান স্ট্যাটাস ও সংরক্ষিত প্রত্যাখ্যানের কারণ দেখানো হয়েছে।
          </p>
        </aside>
      </div>
    </>
  );
}
