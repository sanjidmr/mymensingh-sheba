'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowUpRight, Eye, FilePlus2, LoaderCircle, Pencil, Search, Star } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { NEWS_CATEGORIES } from '@/lib/catalog-types';
import { formatDateTime } from '@/lib/admin/format';
import { deleteNewsEditorPost, setNewsEditorPostStatus } from '@/app/news/editor/actions';
import type { NewsEditorArticle } from '@/app/news/editor/page';

function statusLabel(status: NewsEditorArticle['status']) {
  if (status === 'approved') return 'প্রকাশিত';
  if (status === 'pending') return 'অ্যাডমিন অনুমোদনের অপেক্ষায়';
  if (status === 'draft') return 'খসড়া';
  return 'অনুমোদিত নয়';
}

function statusStyle(status: NewsEditorArticle['status']) {
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-800';
  if (status === 'draft') return 'border-stone-200 bg-stone-100 text-stone-700';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

export default function NewsEditorDashboard({
  editorName,
  canPublish,
  posts,
  viewCounts,
  viewsError,
  saved,
}: {
  editorName: string;
  canPublish: boolean;
  posts: NewsEditorArticle[];
  viewCounts: Record<string, number>;
  viewsError: string;
  saved: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workingId, setWorkingId] = useState('');
  const [message, setMessage] = useState(saved ? 'সংবাদ সংরক্ষণ হয়েছে।' : '');
  const [error, setError] = useState('');
  const [confirmAction, setConfirmAction] = useState<{
    article: NewsEditorArticle;
    status?: 'draft' | 'pending' | 'approved';
    remove?: boolean;
  } | null>(null);

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return posts.filter((post) => {
      if (statusFilter && post.status !== statusFilter) return false;
      if (!term) return true;
      return [post.title_bn, post.author_name ?? '', post.category ?? '']
        .join(' ')
        .toLocaleLowerCase()
        .includes(term);
    });
  }, [posts, query, statusFilter]);

  const counts = {
    total: posts.length,
    published: posts.filter((post) => post.status === 'approved').length,
    drafts: posts.filter((post) => post.status === 'draft').length,
    pending: posts.filter((post) => post.status === 'pending').length,
  };

  const performAction = async () => {
    if (!confirmAction) return;
    const { article, status, remove } = confirmAction;
    setWorkingId(article.id);
    setMessage('');
    setError('');
    const result = remove
      ? await deleteNewsEditorPost(article.id)
      : await setNewsEditorPostStatus(article.id, status ?? 'draft');
    if (result.ok) {
      setMessage(result.message ?? 'কাজটি সম্পন্ন হয়েছে।');
      setConfirmAction(null);
      router.refresh();
    } else {
      setError(result.error ?? 'কাজটি সম্পন্ন হয়নি।');
    }
    setWorkingId('');
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6b2f]">স্বাগতম, {editorName}</p>
          <h1 className="mt-1 font-[family-name:var(--font-news-serif)] text-2xl font-black sm:text-3xl">সংবাদ ডেস্ক</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#6d685f]">
            আপনার নিউজরুমের নিবন্ধ তৈরি, সম্পাদনা ও পর্যালোচনার অবস্থা এখান থেকে পরিচালনা করুন।
          </p>
        </div>
        <Link href="/news/editor/create" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-[#0c3b2e] px-4 text-sm font-bold text-white hover:bg-[#0a3227]">
          <FilePlus2 className="h-4 w-4" aria-hidden="true" /> নতুন সংবাদ
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'মোট সংবাদ', value: counts.total },
          { label: 'প্রকাশিত', value: counts.published },
          { label: 'খসড়া', value: counts.drafts },
          { label: 'অনুমোদনের অপেক্ষায়', value: counts.pending },
        ].map((item) => (
          <div key={item.label} className="border border-[#ded9ce] bg-white p-4">
            <p className="text-[11px] font-bold text-[#6d685f]">{item.label}</p>
            <p className="mt-2 text-2xl font-black tabular-nums text-[#0c3b2e]">{item.value}</p>
          </div>
        ))}
      </div>

      {!canPublish && (
        <p className="mt-4 border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
          এই অ্যাকাউন্ট থেকে সরাসরি প্রকাশ করা যাবে না। জমা দেওয়া সংবাদ প্রধান অ্যাডমিন অনুমোদন করলে প্রকাশিত হবে।
        </p>
      )}
      {viewsError && (
        <p role="status" className="mt-4 border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-900">
          দেখা-সংখ্যা লোড করা যায়নি: {viewsError}
        </p>
      )}
      {message && <p role="status" className="mt-4 border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">{error}</p>}

      <section className="mt-5 border border-[#ded9ce] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#ded9ce] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div>
            <h2 className="font-[family-name:var(--font-news-serif)] text-lg font-black">নিউজরুমের সংবাদ</h2>
            <p className="mt-0.5 text-xs text-[#6d685f]">সর্বশেষ পরিবর্তিত ১০০টি নিবন্ধ</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(190px,1fr)_190px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a857b]" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="শিরোনাম বা লেখক খুঁজুন" aria-label="সংবাদ খুঁজুন" className="h-10 w-full border border-[#ded9ce] pl-9 pr-3 text-sm outline-none focus:border-[#0c3b2e]" />
            </label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="প্রকাশনা অবস্থা" className="h-10 border border-[#ded9ce] bg-white px-3 text-sm outline-none focus:border-[#0c3b2e]">
              <option value="">সব অবস্থা</option>
              <option value="draft">খসড়া</option>
              <option value="pending">অনুমোদনের অপেক্ষায়</option>
              <option value="approved">প্রকাশিত</option>
              <option value="rejected">অনুমোদিত নয়</option>
            </select>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-bold text-[#141414]">এখনো কোনো সংবাদ নেই</p>
            <p className="mt-1 text-sm text-[#6d685f]">প্রথম সংবাদটি তৈরি করতে “নতুন সংবাদ” বেছে নিন।</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-8 text-center text-sm text-[#6d685f]">এই অনুসন্ধান বা ফিল্টারে কোনো সংবাদ পাওয়া যায়নি।</p>
        ) : (
          <ul className="divide-y divide-[#e8e4db]">
            {filtered.map((post) => (
              <li key={post.id} className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words font-bold leading-snug text-[#141414]">{post.title_bn}</h3>
                      {post.is_featured && <span className="inline-flex items-center gap-1 border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800"><Star className="h-3 w-3" aria-hidden="true" /> ফিচার্ড</span>}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#6d685f]">
                      <span>{NEWS_CATEGORIES.find((category) => category.id === post.category)?.labelBn ?? post.category ?? 'বিভাগহীন'}</span>
                      <span>লেখক: {post.author_name || '—'}</span>
                      <span>{formatDateTime(post.published_at ?? post.created_at)}</span>
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" aria-hidden="true" /> {viewCounts[post.slug] ?? '—'} দেখা</span>
                    </div>
                    <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyle(post.status)}`}>{statusLabel(post.status)}</span>
                    {post.summary_bn && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#6d685f]">{post.summary_bn}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <Link href={`/news/editor/${post.id}/preview`} aria-label="প্রিভিউ দেখুন" title="প্রিভিউ" className="inline-flex h-9 w-9 items-center justify-center border border-[#ded9ce] text-[#0c3b2e] hover:bg-[#faf8f2]"><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
                    <Link href={`/news/editor/${post.id}/edit`} aria-label="সম্পাদনা" title="সম্পাদনা" className="inline-flex h-9 w-9 items-center justify-center border border-[#ded9ce] text-[#0c3b2e] hover:bg-[#faf8f2]"><Pencil className="h-4 w-4" aria-hidden="true" /></Link>
                    {post.status === 'approved' ? (
                      <button type="button" onClick={() => setConfirmAction({ article: post, status: canPublish ? 'pending' : 'draft' })} disabled={Boolean(workingId)} className="min-h-9 border border-[#ded9ce] px-3 text-xs font-bold text-[#5c4a24] hover:bg-[#faf8f2] disabled:opacity-50">
                        {canPublish ? 'অপ্রকাশিত করুন' : 'খসড়ায় সরান'}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setConfirmAction({ article: post, status: canPublish ? 'approved' : 'pending' })} disabled={Boolean(workingId)} className="min-h-9 bg-[#0c3b2e] px-3 text-xs font-bold text-white hover:bg-[#0a3227] disabled:opacity-50">
                        {workingId === post.id ? <LoaderCircle className="inline h-4 w-4 animate-spin" /> : canPublish ? 'প্রকাশ করুন' : 'অনুমোদনে পাঠান'}
                      </button>
                    )}
                    <button type="button" onClick={() => setConfirmAction({ article: post, remove: true })} disabled={Boolean(workingId)} className="min-h-9 border border-rose-200 px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50">মুছুন</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.remove ? 'এই সংবাদটি মুছে দেবেন?' : confirmAction?.status === 'approved' ? 'সংবাদটি প্রকাশ করবেন?' : confirmAction?.status === 'pending' ? 'অ্যাডমিন অনুমোদনে পাঠাবেন?' : 'খসড়ায় সরাবেন?'}
        description={confirmAction?.remove
          ? 'এই কাজটি ফিরিয়ে নেওয়া যাবে না। সংবাদটি স্থায়ীভাবে মুছে যাবে।'
          : confirmAction?.status === 'approved'
            ? 'নিবন্ধটি এখনই পাবলিক নিউজ পোর্টালে দেখা যাবে।'
            : confirmAction?.status === 'pending'
              ? 'প্রধান অ্যাডমিন অনুমোদন না করা পর্যন্ত এটি পাবলিক নিউজে দেখা যাবে না।'
              : 'সংবাদটি পাবলিক পোর্টাল থেকে সরিয়ে খসড়া হিসেবে রাখা হবে।'}
        confirmLabel={confirmAction?.remove ? 'সংবাদ মুছুন' : 'নিশ্চিত করুন'}
        isLoading={Boolean(confirmAction && workingId === confirmAction.article.id)}
        onConfirm={() => void performAction()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
