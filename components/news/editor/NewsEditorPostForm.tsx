'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoaderCircle, Save } from 'lucide-react';
import { NEWS_CATEGORIES } from '@/lib/catalog-types';
import { saveNewsEditorPost } from '@/app/news/editor/actions';

type NewsEditorPost = {
  id: string;
  slug: string;
  titleBn: string;
  category: string;
  summaryBn: string;
  bodyBn: string;
  coverImageUrl: string;
  status: string;
};

export default function NewsEditorPostForm({
  post,
  canPublish,
}: {
  post?: NewsEditorPost;
  canPublish: boolean;
}) {
  const [titleBn, setTitleBn] = useState(post?.titleBn ?? '');
  const [category, setCategory] = useState(post?.category ?? '');
  const [summaryBn, setSummaryBn] = useState(post?.summaryBn ?? '');
  const [bodyBn, setBodyBn] = useState(post?.bodyBn ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const publish = submitter?.value === 'publish';
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await saveNewsEditorPost({
        ...(post ? { id: post.id } : {}),
        titleBn,
        category,
        summaryBn,
        bodyBn,
        coverImageUrl,
        publish,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      if (!post) {
        router.replace('/news/editor?saved=1');
      } else {
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'সংবাদ সংরক্ষণ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 border border-[#ded9ce] bg-white p-4 sm:p-6">
      {post && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#6d685f]">বর্তমান অবস্থা: <strong className="text-[#141414]">{post.status === 'approved' ? 'প্রকাশিত' : post.status === 'pending' ? 'অনুমোদনের অপেক্ষায়' : post.status === 'draft' ? 'খসড়া' : 'অনুমোদিত নয়'}</strong></span>
          <Link href={`/news/editor/${post.id}/preview`} className="font-semibold text-[#0c3b2e] hover:underline">প্রিভিউ দেখুন ↗</Link>
        </div>
      )}
      <label className="block space-y-1.5 text-sm font-bold text-[#38352f]">
        শিরোনাম <span className="text-rose-600">*</span>
        <input value={titleBn} onChange={(event) => setTitleBn(event.target.value)} required minLength={8} maxLength={180} className="min-h-11 w-full border border-[#ded9ce] px-3 text-sm font-normal outline-none focus:border-[#0c3b2e]" />
      </label>
      <label className="block space-y-1.5 text-sm font-bold text-[#38352f]">
        সংবাদ বিভাগ
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 w-full border border-[#ded9ce] bg-white px-3 text-sm font-normal outline-none focus:border-[#0c3b2e]">
          <option value="">বিভাগ বেছে নিন</option>
          {NEWS_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.labelBn}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm font-bold text-[#38352f]">
        সংক্ষিপ্ত বিবরণ
        <textarea value={summaryBn} onChange={(event) => setSummaryBn(event.target.value)} rows={3} maxLength={500} className="w-full border border-[#ded9ce] px-3 py-2 text-sm font-normal leading-relaxed outline-none focus:border-[#0c3b2e]" />
        <span className="block text-[11px] font-normal text-[#8a857b]">সর্বোচ্চ ৫০০ অক্ষর; চাইলে ফাঁকা রাখতে পারেন।</span>
      </label>
      <label className="block space-y-1.5 text-sm font-bold text-[#38352f]">
        সংবাদ <span className="text-rose-600">*</span>
        <textarea value={bodyBn} onChange={(event) => setBodyBn(event.target.value)} rows={12} maxLength={12000} className="w-full border border-[#ded9ce] px-3 py-2 text-sm font-normal leading-relaxed outline-none focus:border-[#0c3b2e]" />
        <span className="block text-[11px] font-normal text-[#8a857b]">প্রকাশ বা অনুমোদনের জন্য জমা দিতে কমপক্ষে ৪০ অক্ষর লিখুন।</span>
      </label>
      <label className="block space-y-1.5 text-sm font-bold text-[#38352f]">
        কভার ছবির URL (ঐচ্ছিক)
        <input type="url" value={coverImageUrl} onChange={(event) => setCoverImageUrl(event.target.value)} maxLength={2048} placeholder="https://…" className="min-h-11 w-full border border-[#ded9ce] px-3 text-sm font-normal outline-none focus:border-[#0c3b2e]" />
      </label>

      {error && <p role="alert" className="border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}

      <div className="flex flex-col-reverse gap-2 border-t border-[#e8e4db] pt-4 sm:flex-row sm:justify-between">
        <Link href="/news/editor" className="inline-flex min-h-11 items-center justify-center border border-[#ded9ce] px-4 text-sm font-bold text-[#38352f] hover:bg-[#faf8f2]">বাতিল</Link>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="submit" value="draft" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#0c3b2e] px-4 text-sm font-bold text-[#0c3b2e] hover:bg-[#f4f7f2] disabled:opacity-60">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            খসড়া সংরক্ষণ
          </button>
          <button type="submit" value="publish" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#0c3b2e] px-4 text-sm font-bold text-white hover:bg-[#0a3227] disabled:opacity-60">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {busy ? 'সংরক্ষণ হচ্ছে…' : canPublish ? 'প্রকাশ করুন' : 'অ্যাডমিন অনুমোদনে পাঠান'}
          </button>
        </div>
      </div>
    </form>
  );
}
