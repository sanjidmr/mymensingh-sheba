'use server';

import { revalidatePath } from 'next/cache';
import { NEWS_CATEGORIES, uniqueSlug } from '@/lib/catalog-types';
import { getActiveNewsEditor } from '@/lib/news/news-authorization.server';

export type NewsEditorFormInput = {
  id?: string;
  titleBn: string;
  category: string;
  summaryBn: string;
  bodyBn: string;
  coverImageUrl: string;
  publish: boolean;
};

export type NewsEditorWriteResult =
  | { ok: true; message: string; id: string; slug: string }
  | { ok: false; error: string };

function validId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function normalizeInput(input: NewsEditorFormInput) {
  if (!input || typeof input !== 'object') return { error: 'সংবাদের তথ্য সঠিক নয়।' } as const;
  const titleBn = typeof input.titleBn === 'string' ? input.titleBn.trim() : '';
  const category = typeof input.category === 'string' ? input.category.trim() : '';
  const summaryBn = typeof input.summaryBn === 'string' ? input.summaryBn.trim() : '';
  const bodyBn = typeof input.bodyBn === 'string' ? input.bodyBn.trim() : '';
  const coverImageUrl = typeof input.coverImageUrl === 'string' ? input.coverImageUrl.trim() : '';

  if (titleBn.length < 8 || titleBn.length > 180) {
    return { error: 'শিরোনাম ৮ থেকে ১৮০ অক্ষরের মধ্যে লিখুন।' } as const;
  }
  if (category && !NEWS_CATEGORIES.some((item) => item.id === category)) {
    return { error: 'নিউজের তালিকা থেকে সঠিক বিভাগ বেছে নিন।' } as const;
  }
  if (summaryBn.length > 500 || (summaryBn.length > 0 && summaryBn.length < 20)) {
    return { error: 'সংক্ষিপ্ত বিবরণ ফাঁকা রাখুন, অথবা ২০ থেকে ৫০০ অক্ষর লিখুন।' } as const;
  }
  if (bodyBn.length > 12000) return { error: 'লেখা সর্বোচ্চ ১২,০০০ অক্ষরের মধ্যে রাখুন।' } as const;
  if (input.publish && bodyBn.length < 40) return { error: 'প্রকাশের জন্য মূল লেখা কমপক্ষে ৪০ অক্ষরের হতে হবে।' } as const;
  if (coverImageUrl.length > 2048) return { error: 'ছবির ঠিকানা অনেক বড়।' } as const;
  if (coverImageUrl) {
    try {
      const url = new URL(coverImageUrl);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        return { error: 'ছবির ঠিকানা HTTP বা HTTPS হতে হবে।' } as const;
      }
    } catch {
      return { error: 'ছবির ঠিকানা সঠিক নয়।' } as const;
    }
  }
  if (input.publish && !category) return { error: 'প্রকাশের আগে সংবাদ বিভাগ বেছে নিন।' } as const;
  return { value: { titleBn, category, summaryBn, bodyBn, coverImageUrl } } as const;
}

export async function saveNewsEditorPost(input: NewsEditorFormInput): Promise<NewsEditorWriteResult> {
  const editor = await getActiveNewsEditor();
  if (!editor) return { ok: false, error: 'সক্রিয় নিউজ এডিটর অনুমতি পাওয়া যায়নি। আবার লগইন করুন।' };
  if (!input || typeof input !== 'object') return { ok: false, error: 'সংবাদের তথ্য সঠিক নয়।' };
  if (typeof input.publish !== 'boolean') return { ok: false, error: 'প্রকাশনার অবস্থা সঠিক নয়।' };
  if (input.id !== undefined && (typeof input.id !== 'string' || !validId(input.id))) {
    return { ok: false, error: 'সংবাদের পরিচিতি সঠিক নয়।' };
  }

  const normalized = normalizeInput(input);
  if ('error' in normalized && typeof normalized.error === 'string') {
    return { ok: false, error: normalized.error };
  }
  if (input.publish && !editor.canPublish && !normalized.value.bodyBn) {
    return { ok: false, error: 'অনুমোদনের জন্য পাঠাতে মূল সংবাদ লিখুন।' };
  }

  const status = input.publish ? (editor.canPublish ? 'approved' : 'pending') : 'draft';
  const postFields = {
    title_bn: normalized.value.titleBn,
    category: normalized.value.category || null,
    summary_bn: normalized.value.summaryBn || null,
    body_bn: normalized.value.bodyBn || null,
    cover_image_url: normalized.value.coverImageUrl || null,
    status,
    published_at: status === 'approved' ? new Date().toISOString() : null,
  };

  if (input.id) {
    const { data: current, error: readError } = await editor.client
      .from('community_posts')
      .select('id, slug, kind')
      .eq('id', input.id)
      .eq('kind', 'news')
      .maybeSingle();
    if (readError) return { ok: false, error: `সংবাদ লোড হয়নি: ${readError.message}` };
    if (!current) return { ok: false, error: 'সংবাদটি পাওয়া যায়নি বা সম্পাদনার অনুমতি নেই।' };

    const { data, error } = await editor.client
      .from('community_posts')
      .update(postFields)
      .eq('id', current.id)
      .eq('kind', 'news')
      .select('id, slug')
      .maybeSingle();
    if (error) return { ok: false, error: `সংবাদ সংরক্ষণ হয়নি: ${error.message}` };
    if (!data) return { ok: false, error: 'সংবাদটি অন্য কেউ পরিবর্তন করেছেন। আবার লোড করে চেষ্টা করুন।' };
    revalidateNews(data.slug);
    return {
      ok: true,
      id: data.id,
      slug: data.slug,
      message: status === 'approved' ? 'সংবাদ সম্পাদনা করে প্রকাশ করা হয়েছে।' : status === 'pending' ? 'সংবাদ অ্যাডমিন অনুমোদনের জন্য পাঠানো হয়েছে।' : 'খসড়া সংরক্ষণ হয়েছে।',
    };
  }

  const { data, error } = await editor.client
    .from('community_posts')
    .insert({
      ...postFields,
      kind: 'news',
      slug: uniqueSlug(normalized.value.titleBn, 'news'),
      author_id: editor.userId,
      author_name: editor.fullName,
      tags: [],
      gallery: [],
      is_featured: false,
    })
    .select('id, slug')
    .single();
  if (error || !data) return { ok: false, error: `সংবাদ তৈরি হয়নি: ${error?.message ?? 'ডেটাবেজ নিশ্চিত করেনি।'}` };
  revalidateNews(data.slug);
  return {
    ok: true,
    id: data.id,
    slug: data.slug,
    message: status === 'approved' ? 'সংবাদ প্রকাশিত হয়েছে।' : status === 'pending' ? 'সংবাদ অ্যাডমিন অনুমোদনের জন্য পাঠানো হয়েছে।' : 'খসড়া সংরক্ষণ হয়েছে।',
  };
}

export async function setNewsEditorPostStatus(
  postId: string,
  status: 'draft' | 'pending' | 'approved'
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const editor = await getActiveNewsEditor();
  if (!editor) return { ok: false, error: 'সক্রিয় নিউজ এডিটর অনুমতি পাওয়া যায়নি।' };
  if (!validId(postId) || !['draft', 'pending', 'approved'].includes(status)) {
    return { ok: false, error: 'সংবাদ বা প্রকাশনা-অবস্থা সঠিক নয়।' };
  }
  if (status === 'approved' && !editor.canPublish) {
    return { ok: false, error: 'এই অ্যাকাউন্টের সংবাদ প্রকাশের আগে অ্যাডমিন অনুমোদন প্রয়োজন।' };
  }

  const { data, error } = await editor.client
    .from('community_posts')
    .update({
      status,
      published_at: status === 'approved' ? new Date().toISOString() : null,
    })
    .eq('id', postId)
    .eq('kind', 'news')
    .select('slug')
    .maybeSingle();
  if (error) return { ok: false, error: `প্রকাশনার অবস্থা বদলানো যায়নি: ${error.message}` };
  if (!data) return { ok: false, error: 'সংবাদটি পাওয়া যায়নি বা অনুমতি নেই।' };
  revalidateNews(data.slug);
  return {
    ok: true,
    message: status === 'approved'
      ? 'সংবাদ প্রকাশিত হয়েছে।'
      : status === 'pending'
        ? 'সংবাদ অনুমোদনের জন্য পাঠানো হয়েছে।'
        : 'সংবাদ খসড়ায় সরানো হয়েছে।',
  };
}

export async function deleteNewsEditorPost(
  postId: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const editor = await getActiveNewsEditor();
  if (!editor) return { ok: false, error: 'সক্রিয় নিউজ এডিটর অনুমতি পাওয়া যায়নি।' };
  if (!validId(postId)) return { ok: false, error: 'সংবাদের পরিচিতি সঠিক নয়।' };

  const { data, error } = await editor.client
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('kind', 'news')
    .select('slug')
    .maybeSingle();
  if (error) return { ok: false, error: `সংবাদ মুছে ফেলা যায়নি: ${error.message}` };
  if (!data) return { ok: false, error: 'সংবাদটি পাওয়া যায়নি বা অনুমতি নেই।' };
  revalidateNews(data.slug);
  return { ok: true, message: 'সংবাদটি মুছে ফেলা হয়েছে।' };
}

function revalidateNews(slug: string) {
  revalidatePath('/news');
  revalidatePath('/news/editor');
  revalidatePath(`/news/${slug}`);
}
