'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

export async function moderateToletProfile(input: {
  id: string;
  status: 'approved' | 'rejected';
  reason?: string;
}): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)) {
      return { ok: false, error: 'প্রোফাইল আইডি সঠিক নয়।' };
    }
    const reason = input.reason?.trim() ?? '';
    if (input.status === 'rejected' && (reason.length < 5 || reason.length > 500)) {
      return { ok: false, error: 'প্রত্যাখ্যানের কারণ ৫ থেকে ৫০০ অক্ষরের মধ্যে লিখুন।' };
    }

    const { data, error } = await client
      .from('tolet_profiles')
      .update({
        status: input.status,
        is_verified: input.status === 'approved',
        rejection_reason: input.status === 'rejected' ? reason : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .eq('status', 'pending_approval')
      .select('id,user_id,owner_name')
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'অপেক্ষমাণ বাসা মালিকের প্রোফাইলটি পাওয়া যায়নি বা অন্য কেউ পরিবর্তন করেছেন।' };

    const { error: notificationError } = await client.from('notifications').insert({
      user_id: data.user_id,
      target_role: 'customer',
      title: input.status === 'approved' ? 'বাসা মালিকের প্রোফাইল অনুমোদিত' : 'বাসা মালিকের প্রোফাইল প্রত্যাখ্যাত',
      body: input.status === 'rejected' ? reason : 'আপনার বাসা মালিকের প্রোফাইল যাচাই সম্পন্ন হয়েছে।',
      type: input.status === 'approved' ? 'success' : 'warning',
      related_type: 'tolet_profile',
      related_id: data.id,
    });

    revalidatePath('/admin/approvals');
    revalidatePath('/admin/verifications');
    revalidatePath('/admin/users');
    revalidatePath('/profile/tolet');
    revalidatePath('/admin');
    return {
      ok: true,
      message: notificationError
        ? 'প্রোফাইলের সিদ্ধান্ত সংরক্ষিত হয়েছে, তবে নোটিফিকেশন পাঠানো যায়নি।'
        : input.status === 'approved'
          ? 'বাসা মালিকের প্রোফাইল অনুমোদিত হয়েছে।'
          : 'প্রোফাইল প্রত্যাখ্যাত হয়েছে এবং কারণটি ব্যবহারকারীকে জানানো হয়েছে।',
    };
  });
}
