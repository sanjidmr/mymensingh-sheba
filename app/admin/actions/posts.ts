'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

/**
 * Moderation of community posts (news / jobs / buy-sell).
 *
 * Approval is what makes a post publicly visible: every public read path in
 * `lib/catalog-service.ts` filters on `status = 'approved'`. Rejection is
 * recorded with a reason the author can read back through their own profile,
 * which is the difference between "removed" and "removed, and here is why".
 *
 * Each decision also writes a notification for the author. The platform has
 * had a notifications table and an admin hub since the beginning, but nothing
 * ever told a customer their post had been decided — they had to keep
 * refreshing the directory to find out.
 */

export async function setPostStatus(
  postId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<ActionResult> {
  return runAdminAction(async (client, _adminId) => {
    const { data: post, error: readError } = await client
      .from('community_posts')
      .select('id, author_id, title_bn, kind, status')
      .eq('id', postId)
      .maybeSingle();

    if (readError || !post) {
      return { ok: false, error: 'পোস্টটি পাওয়া যায়নি। হয়তো আগে মুছে ফেলা হয়েছে।' };
    }

    if (status === 'rejected' && !rejectionReason?.trim()) {
      return { ok: false, error: 'প্রত্যাখ্যানের কারণ লিখুন — লেখক তা দেখতে পাবেন।' };
    }

    const { error } = await client
      .from('community_posts')
      .update({
        status,
        rejection_reason: status === 'rejected' ? rejectionReason!.trim() : null,
        published_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', postId);

    if (error) return { ok: false, error: error.message };

    // Tell the author. Runs as the admin session, which the INSERT policy
    // permits because `is_admin()` is true.
    if (post.author_id) {
      const kindLabel =
        post.kind === 'news' ? 'খবর' : post.kind === 'job' ? 'চাকরির বিজ্ঞাপন' : 'কেনাবেচা';
      await client.from('notifications').insert({
        user_id: post.author_id,
        target_role: 'customer',
        title:
          status === 'approved'
            ? 'আপনার পোস্ট প্রকাশিত হয়েছে'
            : 'আপনার পোস্ট প্রকাশ করা হয়নি',
        body:
          status === 'approved'
            ? `আপনার ${kindLabel} পোস্ট “${post.title_bn}” এখন সর্বজনীনভাবে দেখা যাচ্ছে।`
            : `আপনার ${kindLabel} পোস্ট “${post.title_bn}” প্রকাশ করা হয়নি। কারণ: ${rejectionReason!.trim()}`,
        type: status === 'approved' ? 'success' : 'warning',
        related_type: 'community_post',
        related_id: post.id,
      });
    }

    revalidatePath('/admin/posts');
    revalidatePath('/news');
    revalidatePath('/jobs');
    revalidatePath('/buy-sell');
    return {
      ok: true,
      message:
        status === 'approved'
          ? 'পোস্টটি এখন সর্বজনীনভাবে দেখা যাচ্ছে।'
          : 'পোস্টটি প্রত্যাখ্যাত হয়েছে এবং কারণ লেখককে জানানো হয়েছে।',
    };
  });
}

export async function togglePostFeatured(postId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { data: post, error: readError } = await client
      .from('community_posts')
      .select('id, is_featured, status')
      .eq('id', postId)
      .maybeSingle();

    if (readError || !post) {
      return { ok: false, error: 'পোস্টটি পাওয়া যায়নি।' };
    }
    if (post.status !== 'approved') {
      return {
        ok: false,
        error: 'শুধুমাত্র অনুমোদিত পোস্ট ফিচার করা যাবে। আগে অনুমোদন করুন।',
      };
    }

    const { error } = await client
      .from('community_posts')
      .update({ is_featured: !post.is_featured })
      .eq('id', postId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/posts');
    return {
      ok: true,
      message: post.is_featured ? 'ফিচার থেকে সরানো হয়েছে।' : 'পোস্টটি ফিচার করা হয়েছে।',
    };
  });
}

export async function deletePost(postId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('community_posts').delete().eq('id', postId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/posts');
    revalidatePath('/news');
    revalidatePath('/jobs');
    revalidatePath('/buy-sell');
    return { ok: true, message: 'পোস্টটি মুছে ফেলা হয়েছে।' };
  });
}