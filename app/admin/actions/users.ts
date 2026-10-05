'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

/**
 * Account status changes.
 *
 * There is deliberately no "delete account" action. Deleting a `profiles` row
 * cascades into every listing, request, review and notification the person
 * ever created, and it leaves an orphaned `auth.users` row behind — so the
 * account still exists, just with no profile, which is the one state the rest
 * of the app cannot handle. Suspending is reversible and achieves the actual
 * goal: the person stops being able to use the platform.
 *
 * Role changes are not exposed either. Granting admin is a decision about who
 * can read every customer's phone number, and it belongs in a conversation, not
 * in a dropdown next to "suspend".
 */

export async function setUserStatus(
  userId: string,
  status: 'active' | 'suspended' | 'blocked'
): Promise<ActionResult> {
  return runAdminAction(async (client, adminId) => {
    if (userId === adminId) {
      return { ok: false, error: 'আপনি নিজের অ্যাকাউন্ট বন্ধ করতে পারবেন না।' };
    }

    const { data: target, error: readError } = await client
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('id', userId)
      .maybeSingle();

    if (readError || !target) {
      return { ok: false, error: 'ইউজারটি পাওয়া যায়নি।' };
    }

    if (target.role === 'admin') {
      return {
        ok: false,
        error: 'অন্য অ্যাডমিনের অ্যাকাউন্ট বন্ধ করা যাবে না।',
      };
    }

    const { error } = await client
      .from('profiles')
      .update({ status })
      .eq('id', userId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/users');
    return {
      ok: true,
      message:
        status === 'active'
          ? 'অ্যাকাউন্ট আবার সক্রিয় করা হয়েছে।'
          : status === 'suspended'
            ? 'অ্যাকাউন্ট স্থগিত করা হয়েছে।'
            : 'অ্যাকাউন্ট বন্ধ করা হয়েছে।',
    };
  });
}

/**
 * Promote a customer to admin.
 *
 * Separate from the status action on purpose: it is the single most powerful
 * change available in the panel, and it should not be reachable by the same
 * click that suspends someone.
 */
export async function grantAdminRole(userId: string): Promise<ActionResult> {
  return runAdminAction(async (client, adminId) => {
    if (userId === adminId) {
      return { ok: false, error: 'আপনি নিজেকে অ্যাডমিন করতে পারবেন না।' };
    }

    const { data: target, error: readError } = await client
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (readError || !target) {
      return { ok: false, error: 'ইউজারটি পাওয়া যায়নি।' };
    }
    if (target.role === 'admin') {
      return { ok: false, error: 'এই অ্যাকাউন্টে ইতিমধ্যে অ্যাডমিন ভূমিকা আছে।' };
    }

    const { error } = await client
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/users');
    return { ok: true, message: 'অ্যাডমিন ভূমিকা দেওয়া হয়েছে।' };
  });
}