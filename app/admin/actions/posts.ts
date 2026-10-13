'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, toActionError, type ActionResult } from '@/lib/admin/actions';
import type { AdminPostInput } from '@/lib/admin/post-input';
import { normalizeBdPhone } from '@/lib/contact-types';
import {
  JOB_TYPES,
  MARKET_CATEGORIES,
  MARKET_CONDITIONS,
  NEWS_CATEGORIES,
  uniqueSlug,
} from '@/lib/catalog-types';

type PostKind = AdminPostInput['kind'];
type NormalizedPostInput = Omit<AdminPostInput, 'salaryMin' | 'salaryMax' | 'price'> & {
  salaryMin: number | null;
  salaryMax: number | null;
  price: number | null;
};

type ValidationResult =
  | { ok: true; value: NormalizedPostInput }
  | { ok: false; error: string };
type ExistingPostFacets = {
  category: string | null;
  job_type: string | null;
  condition_label: string | null;
};

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizePostInput(
  input: AdminPostInput,
  existing?: ExistingPostFacets
): ValidationResult {
  if (!input || typeof input !== 'object' || !['news', 'job', 'buy_sell'].includes(input.kind)) {
    return { ok: false, error: 'পোস্টের ধরন সঠিক নয়।' };
  }

  const titleBn = cleanText(input.titleBn);
  const summaryBn = cleanText(input.summaryBn);
  const bodyBn = cleanText(input.bodyBn);
  const category = cleanText(input.category);
  const areaId = cleanText(input.areaId);
  const tags = Array.isArray(input.tags)
    ? input.tags.filter((tag): tag is string => typeof tag === 'string')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
  const coverImageUrl = cleanText(input.coverImageUrl);
  const gallery = Array.isArray(input.gallery)
    ? input.gallery
        .filter((url): url is string => typeof url === 'string')
        .map((url) => url.trim())
        .filter(Boolean)
    : [];
  const authorName = cleanText(input.authorName);
  const authorPhoneRaw = cleanText(input.authorPhone);
  const whatsappRaw = cleanText(input.whatsappNumber);
  const organizationBn = cleanText(input.organizationBn);
  const jobType = cleanText(input.jobType);
  const conditionLabel = cleanText(input.conditionLabel);
  const deadline = cleanText(input.deadline);

  if (
    titleBn.length > 180 ||
    summaryBn.length > 500 ||
    bodyBn.length > 12000 ||
    category.length > 100 ||
    areaId.length > 120 ||
    tags.length > 12 ||
    tags.some((tag) => tag.length > 60) ||
    coverImageUrl.length > 2048 ||
    gallery.length > 4 ||
    gallery.some((url) => url.length > 2048) ||
    authorName.length > 120 ||
    authorPhoneRaw.length > 30 ||
    whatsappRaw.length > 30 ||
    organizationBn.length > 160 ||
    jobType.length > 40 ||
    conditionLabel.length > 40
  ) {
    return { ok: false, error: 'এক বা একাধিক ঘরের তথ্য নির্ধারিত দৈর্ঘ্যের বেশি।' };
  }

  if (titleBn.length < 8) return { ok: false, error: 'শিরোনাম কমপক্ষে ৮ অক্ষরের হতে হবে।' };
  if (summaryBn && summaryBn.length < 20) {
    return { ok: false, error: 'সংক্ষিপ্ত বিবরণ কমপক্ষে ২০ অক্ষরের হলে ভালো হয়।' };
  }
  const minimumBodyLength = input.kind === 'news' ? 40 : input.kind === 'job' ? 20 : 10;
  if (bodyBn.length < minimumBodyLength) {
    return {
      ok: false,
      error: input.kind === 'news'
        ? 'সংবাদের মূল বিষয়বস্তু কমপক্ষে ৪০ অক্ষরের হতে হবে।'
        : input.kind === 'job'
          ? 'কাজের বিবরণ কমপক্ষে ২০ অক্ষরের হতে হবে।'
          : 'পণ্যের বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে।',
    };
  }

  const priceText = cleanText(input.price);
  const salaryMinText = cleanText(input.salaryMin);
  const salaryMaxText = cleanText(input.salaryMax);
  const price = priceText ? Number(priceText) : null;
  const salaryMin = salaryMinText ? Number(salaryMinText) : null;
  const salaryMax = salaryMaxText ? Number(salaryMaxText) : null;
  const validAmount = (amount: number | null) =>
    amount === null || (Number.isSafeInteger(amount) && amount >= 0);

  if (input.kind === 'buy_sell') {
    if (
      !category ||
      (!MARKET_CATEGORIES.some((item) => item.id === category) &&
        category !== existing?.category &&
        category !== 'vehicle')
    ) {
      return { ok: false, error: 'পণ্যের ক্যাটাগরি বেছে নিন।' };
    }
    if (
      !MARKET_CONDITIONS.some((item) => item.id === conditionLabel) &&
      conditionLabel !== existing?.condition_label
    ) {
      return { ok: false, error: 'পণ্যের অবস্থা বেছে নিন।' };
    }
    if (price === null || !validAmount(price)) {
      return { ok: false, error: 'পণ্যের সঠিক দাম লিখুন।' };
    }
    if (!authorName) return { ok: false, error: 'বিক্রেতার নাম লিখুন।' };
    if (!/^01[3-9]\d{8}$/.test(normalizeBdPhone(authorPhoneRaw))) {
      return { ok: false, error: 'সঠিক বিক্রেতার মোবাইল নম্বর দিন।' };
    }
    if (whatsappRaw && !/^01[3-9]\d{8}$/.test(normalizeBdPhone(whatsappRaw))) {
      return { ok: false, error: 'সঠিক হোয়াটসঅ্যাপ নম্বর দিন।' };
    }
    if (!coverImageUrl && gallery.length === 0) {
      return { ok: false, error: 'পণ্যের অন্তত একটি ছবি দিন।' };
    }
  }

  if (
    input.kind === 'news' &&
    category &&
    !NEWS_CATEGORIES.some((item) => item.id === category) &&
    category !== existing?.category
  ) {
    return { ok: false, error: 'সংবাদের ক্যাটাগরি সঠিক নয়।' };
  }
  if (input.kind === 'job') {
    if (organizationBn.length < 2) return { ok: false, error: 'প্রতিষ্ঠানের নাম লিখুন।' };
    if (!JOB_TYPES.some((item) => item.id === jobType) && jobType !== existing?.job_type) {
      return { ok: false, error: 'চাকরির ধরন বেছে নিন।' };
    }
    if (!validAmount(salaryMin) ||
        !validAmount(salaryMax) ||
        (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin)) {
      return { ok: false, error: 'বেতনের সীমা পূর্ণসংখ্যা ও শূন্য বা তার বেশি হতে হবে; সর্বোচ্চ বেতন সর্বনিম্নের চেয়ে কম হতে পারবে না।' };
    }
  }

  const imageUrls = [coverImageUrl, ...gallery].filter(Boolean);
  if (imageUrls.length > 5 || imageUrls.some((value) => {
    try {
      const url = new URL(value);
      return url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === 'localhost');
    } catch {
      return true;
    }
  })) {
    return { ok: false, error: 'ছবির লিংক সঠিক নয় অথবা ছবির সংখ্যা ৫টির বেশি।' };
  }
  if (deadline) {
    const [year, month, day] = deadline.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(deadline) ||
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      return { ok: false, error: 'আবেদনের শেষ তারিখ সঠিক নয়।' };
    }
  }

  return {
    ok: true,
    value: {
      kind: input.kind,
      titleBn,
      summaryBn,
      bodyBn,
      category,
      areaId,
      tags,
      coverImageUrl,
      gallery,
      authorName,
      authorPhone: input.kind === 'buy_sell' ? normalizeBdPhone(authorPhoneRaw) : '',
      whatsappNumber: input.kind === 'buy_sell' && whatsappRaw ? normalizeBdPhone(whatsappRaw) : '',
      price: input.kind === 'buy_sell' ? price : null,
      conditionLabel: input.kind === 'buy_sell' ? conditionLabel : '',
      organizationBn: input.kind === 'job' ? organizationBn : '',
      jobType: input.kind === 'job' ? jobType : '',
      salaryMin: input.kind === 'job' ? salaryMin : null,
      salaryMax: input.kind === 'job' ? salaryMax : null,
      deadline: input.kind === 'job' ? deadline : '',
    },
  };
}

function postContent(value: NormalizedPostInput) {
  return {
    title_bn: value.titleBn,
    summary_bn: value.summaryBn || null,
    body_bn: value.bodyBn,
    cover_image_url: value.coverImageUrl || null,
    gallery: value.gallery,
    category: value.category || null,
    area_id: value.areaId || null,
    tags: value.tags,
    salary_min: value.salaryMin,
    salary_max: value.salaryMax,
    price: value.price,
    job_type: value.jobType || null,
    organization_bn: value.organizationBn || null,
    deadline: value.deadline || null,
    condition_label: value.conditionLabel || null,
    ...(value.kind === 'buy_sell'
      ? {
          author_name: value.authorName,
          author_phone: value.authorPhone,
          whatsapp_number: value.whatsappNumber || null,
        }
      : value.kind === 'news'
        ? { author_name: value.authorName || null }
        : {}),
  };
}

function revalidatePosts(id?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/posts');
  if (id) revalidatePath(`/admin/posts/${id}`);
  revalidatePath('/news');
  revalidatePath('/jobs');
  revalidatePath('/buy-sell');
}

/**
 * Moderation of community posts (news / jobs / buy-sell).
 *
 * Approval is what makes a post publicly visible: every public read path in
 * `lib/catalog-service.ts` filters on `status = 'approved'`. Rejection is
 * recorded with a reason the author can read back through their own profile,
 * which is the difference between "removed" and "removed, and here is why".
 *
 * Status-change notifications are written by the existing database trigger.
 * Keeping notification delivery in that transaction avoids duplicates and
 * ensures a failed notification also fails the moderation update.
 */

export async function setPostStatus(
  postId: string,
  status: 'pending' | 'approved' | 'rejected',
  rejectionReason?: string
): Promise<ActionResult> {
  return runAdminAction(async (client, _adminId) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
      return { ok: false, error: 'পোস্টের পরিচিতি সঠিক নয়।' };
    }
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return { ok: false, error: 'এই স্ট্যাটাসটি কমিউনিটি পোস্টে সমর্থিত নয়।' };
    }
    const { data: post, error: readError } = await client
      .from('community_posts')
      .select('id, status')
      .eq('id', postId)
      .maybeSingle();

    if (readError) return { ok: false, error: toActionError(readError) };
    if (!post) return { ok: false, error: 'পোস্টটি পাওয়া যায়নি। হয়তো আগে মুছে ফেলা হয়েছে।' };

    const reason = typeof rejectionReason === 'string' ? rejectionReason.trim() : '';
    if (status === 'rejected' && (reason.length < 5 || reason.length > 500)) {
      return { ok: false, error: 'প্রত্যাখ্যানের কারণ ৫ থেকে ৫০০ অক্ষরের মধ্যে লিখুন।' };
    }

    const { data: updated, error } = await client
      .from('community_posts')
      .update({
        status,
        rejection_reason: status === 'rejected' ? reason : null,
        published_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', postId)
      .eq('status', post.status)
      .select('id')
      .maybeSingle();

    if (error) return { ok: false, error: toActionError(error) };
    if (!updated) return { ok: false, error: 'পোস্টটি অন্য কেউ পরিবর্তন করেছেন। রিফ্রেশ করে আবার চেষ্টা করুন।' };

    revalidatePosts(postId);
    return {
      ok: true,
      message:
        status === 'approved'
          ? 'পোস্টটি এখন সর্বজনীনভাবে দেখা যাচ্ছে।'
          : status === 'rejected'
            ? 'পোস্টটি প্রত্যাখ্যাত হয়েছে এবং কারণ লেখককে জানানো হয়েছে।'
            : 'পোস্টটি আবার পর্যালোচনার জন্য অপেক্ষমাণ।',
    };
  });
}

export async function createAdminPost(input: AdminPostInput): Promise<ActionResult & { postId?: string }> {
  return runAdminAction(async (client, adminId) => {
    const validated = normalizePostInput(input);
    if (!validated.ok) return validated;
    const value = validated.value;
    const { data, error } = await client
      .from('community_posts')
      .insert({
        ...postContent(value),
        kind: value.kind,
        slug: uniqueSlug(value.titleBn, value.kind),
        author_id: adminId,
        status: 'pending',
        is_featured: false,
        published_at: null,
        rejection_reason: null,
      })
      .select('id')
      .single();
    if (error || !data) {
      return {
        ok: false,
        error: error ? toActionError(error) : 'পোস্ট তৈরি করা যায়নি।',
      };
    }
    revalidatePosts(data.id);
    return { ok: true, postId: data.id, message: 'পোস্টটি অপেক্ষমাণ হিসেবে তৈরি হয়েছে।' };
  });
}

export async function updateAdminPost(
  postId: string,
  input: AdminPostInput
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
      return { ok: false, error: 'পোস্টের পরিচিতি সঠিক নয়।' };
    }
    if (!input || typeof input !== 'object') {
      return { ok: false, error: 'পোস্টের তথ্য সঠিক নয়।' };
    }
    const { data: current, error: readError } = await client
      .from('community_posts')
      .select('id, kind, updated_at, category, job_type, condition_label')
      .eq('id', postId)
      .maybeSingle();
    if (readError) return { ok: false, error: toActionError(readError) };
    if (!current) return { ok: false, error: 'পোস্টটি পাওয়া যায়নি।' };
    if (input.kind !== current.kind) {
      return { ok: false, error: 'পোস্টের ধরন সম্পাদনার সময় পরিবর্তন করা যাবে না।' };
    }
    const validated = normalizePostInput(input, current);
    if (!validated.ok) return validated;

    const { data, error } = await client
      .from('community_posts')
      .update(postContent(validated.value))
      .eq('id', postId)
      .eq('updated_at', current.updated_at)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: toActionError(error) };
    if (!data) return { ok: false, error: 'পোস্টটি অন্য কেউ পরিবর্তন করেছেন। রিফ্রেশ করে আবার চেষ্টা করুন।' };
    revalidatePosts(postId);
    return { ok: true, message: 'পোস্টের তথ্য সংরক্ষণ হয়েছে।' };
  });
}

export async function togglePostFeatured(postId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
      return { ok: false, error: 'পোস্টের পরিচিতি সঠিক নয়।' };
    }
    const { data: post, error: readError } = await client
      .from('community_posts')
      .select('id, is_featured, status')
      .eq('id', postId)
      .maybeSingle();

    if (readError) return { ok: false, error: toActionError(readError) };
    if (!post) return { ok: false, error: 'পোস্টটি পাওয়া যায়নি।' };
    if (post.status !== 'approved') {
      return {
        ok: false,
        error: 'শুধুমাত্র অনুমোদিত পোস্ট ফিচার করা যাবে। আগে অনুমোদন করুন।',
      };
    }

    let query = client
      .from('community_posts')
      .update({ is_featured: !post.is_featured })
      .eq('id', postId)
      .eq('status', 'approved');
    query = post.is_featured === null
      ? query.is('is_featured', null)
      : query.eq('is_featured', post.is_featured);
    const { data: updated, error } = await query.select('id').maybeSingle();

    if (error) return { ok: false, error: toActionError(error) };
    if (!updated) return { ok: false, error: 'পোস্টটি পরিবর্তিত হয়েছে। রিফ্রেশ করে আবার চেষ্টা করুন।' };

    revalidatePosts(postId);
    return {
      ok: true,
      message: post.is_featured ? 'ফিচার থেকে সরানো হয়েছে।' : 'পোস্টটি ফিচার করা হয়েছে।',
    };
  });
}

export async function deletePost(postId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
      return { ok: false, error: 'পোস্টের পরিচিতি সঠিক নয়।' };
    }
    const { data, error } = await client
      .from('community_posts')
      .delete()
      .eq('id', postId)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: toActionError(error) };
    if (!data) return { ok: false, error: 'পোস্টটি পাওয়া যায়নি বা ইতিমধ্যে মুছে ফেলা হয়েছে।' };

    revalidatePosts();
    return { ok: true, message: 'পোস্টটি মুছে ফেলা হয়েছে।' };
  });
}