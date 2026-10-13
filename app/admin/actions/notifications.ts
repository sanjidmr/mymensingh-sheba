'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import { fetchAdminNotifications } from '@/lib/admin/queries';

export async function getRecentAdminNotifications() {
  return fetchAdminNotifications({ page: 1, pageSize: 5 }, true);
}

export async function markAdminNotificationRead(notificationId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!notificationId || notificationId.length > 80) {
      return { ok: false, error: 'নোটিফিকেশন আইডি সঠিক নয়।' };
    }

    const { data, error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('target_role', 'admin')
      .select('id');
    if (error) return { ok: false, error: error.message };
    if (data?.length) {
      revalidatePath('/admin');
      revalidatePath('/admin/notifications');
      return { ok: true };
    }

    const { data: existing, error: readError } = await client
      .from('notifications')
      .select('id, is_read')
      .eq('id', notificationId)
      .eq('target_role', 'admin')
      .maybeSingle();
    if (readError) return { ok: false, error: readError.message };
    if (!existing) return { ok: false, error: 'নোটিফিকেশনটি পাওয়া যায়নি।' };
    if (existing.is_read) return { ok: true };
    return { ok: false, error: 'নোটিফিকেশনটি আপডেট করা যায়নি।' };
  });
}

export async function markAllAdminNotificationsRead(): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client
      .from('notifications')
      .update({ is_read: true })
      .eq('target_role', 'admin')
      .eq('is_read', false);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin');
    revalidatePath('/admin/notifications');
    return { ok: true, message: 'সব নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে।' };
  });
}
