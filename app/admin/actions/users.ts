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
  return setAdminRole(userId, 'admin');
}

/** Add or remove a platform administrator with last-admin protections. */
export async function setAdminRole(
  userId: string,
  role: 'customer' | 'admin'
): Promise<ActionResult> {
  return runAdminAction(async (client, adminId) => {
    if (userId === adminId) {
      return {
        ok: false,
        error: role === 'admin'
          ? 'আপনার নিজের অ্যাডমিন ভূমিকা পরিবর্তন করা যাবে না।'
          : 'আপনি নিজের অ্যাডমিন ভূমিকা সরাতে পারবেন না।',
      };
    }

    const { data: target, error: readError } = await client
      .from('profiles')
      .select('id, full_name, role, status')
      .eq('id', userId)
      .maybeSingle();

    if (readError || !target) {
      return { ok: false, error: 'ইউজারটি পাওয়া যায়নি।' };
    }
    if (target.role === role) {
      return {
        ok: false,
        error: role === 'admin'
          ? 'এই অ্যাকাউন্টে ইতিমধ্যে অ্যাডমিন ভূমিকা আছে।'
          : 'এই অ্যাকাউন্টে ইতিমধ্যে কাস্টমার ভূমিকা আছে।',
      };
    }

    if (role === 'admin' && target.status !== 'active') {
      return { ok: false, error: 'নিষ্ক্রিয় বা ব্লক করা অ্যাকাউন্টকে অ্যাডমিন করা যাবে না।' };
    }

    if (role === 'customer' && target.status === 'active') {
      const { count, error: countError } = await client
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('status', 'active');
      if (countError) return { ok: false, error: countError.message };
      if ((count ?? 0) <= 1) {
        return { ok: false, error: 'সর্বশেষ সক্রিয় অ্যাডমিনের ভূমিকা সরানো যাবে না।' };
      }
    }

    const { error } = await client
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/users');
    return {
      ok: true,
      message: role === 'admin'
        ? 'অ্যাডমিন ভূমিকা দেওয়া হয়েছে।'
        : 'অ্যাডমিন ভূমিকা সরিয়ে কাস্টমার করা হয়েছে।',
    };
  });
}