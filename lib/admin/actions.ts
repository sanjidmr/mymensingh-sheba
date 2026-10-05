import type { SupabaseClient } from '@supabase/supabase-js';
import { getAdminDataClient } from './queries';

/**
 * Server Actions for the admin console.
 *
 * The single rule this module exists to enforce: **a Server Action must never
 * trust the browser's claim to be an admin.** Every action calls
 * `getAdminDataClient()` first, which re-reads the session cookie and the
 * caller's `profiles.role` through RLS. If that fails, the action returns an
 * error — it does not fall back to "the button was only shown to admins".
 *
 * RLS is the second layer: even a forged request that reached the database
 * would be stopped by the `USING (public.is_admin())` policies. The two layers
 * are independent, so a bug in either one alone is not a breach.
 */

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/** A Supabase client for a verified admin, or an error result. */
export type AdminActionContext =
  | { ok: true; client: SupabaseClient; userId: string }
  | { ok: false; error: string };

export async function requireAdminAction(): Promise<AdminActionContext> {
  const admin = await getAdminDataClient();
  if (!admin) {
    return {
      ok: false,
      error:
        'অ্যাডমিন অনুমতি যাচাই করা যায়নি। সেশন শেষ হয়ে গেছে বা আপনার অ্যাকাউন্টে অ্যাডমিন ভূমিকা নেই। আবার লগইন করে চেষ্টা করুন।',
    };
  }
  return { ok: true, client: admin.client, userId: admin.userId };
}

/**
 * Run a mutation as an admin, translating failures into a message a
 * non-technical owner can act on.
 *
 * The callback closes over its own arguments rather than receiving them as
 * rest parameters, which keeps the types simple and lets each action declare
 * exactly the parameters it needs.
 *
 * A raw Postgres error string is useless to the person running the site, and
 * silently swallowing the error is worse: the previous admin pages did exactly
 * that, so a failed approve looked identical to a successful one.
 */
export async function runAdminAction(
  fn: (client: SupabaseClient, userId: string) => Promise<ActionResult>
): Promise<ActionResult> {
  const ctx = await requireAdminAction();
  if (!ctx.ok) return ctx;

  try {
    return await fn(ctx.client, ctx.userId);
  } catch (error) {
    return { ok: false, error: toActionError(error) };
  }
}

/** Map a thrown error to a short, honest Bengali message. */
export function toActionError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';

  switch (code) {
    case '23505':
      return 'এই নামে আরেকটি রেকর্ড আছে। একটি ভিন্ন নাম ব্যবহার করুন।';
    case '23503':
      return 'এই রেকর্ডটি মুছে ফেলা যাবে না কারণ অন্য কোনো তথ্য এর ওপর নির্ভর করছে।';
    case '23514':
      return 'দেওয়া মানটি গ্রহণযোগ্য নয়। ঘরগুলো ঠিক করে আবার চেষ্টা করুন।';
    case '42501':
      return 'এই কাজের জন্য আপনার অনুমতি নেই।';
    case 'PGRST116':
      return 'অনুরোধকৃত তথ্য পাওয়া যায়নি। পেজটি রিফ্রেশ করে আবার চেষ্টা করুন।';
    case 'storage/object_not_found':
      return 'ফাইলটি পাওয়া যায়নি। হয়তো আগে মুছে ফেলা হয়েছে।';
    default:
      break;
  }

  if (message) {
    // Keep it short: a full constraint dump is not something an owner can act on.
    const short = message.split('\n')[0].slice(0, 160);
    return `কাজটি সম্পন্ন হয়নি: ${short}`;
  }

  return 'কাজটি সম্পন্ন হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।';
}

/** Clamp a file to the limits the storage bucket also enforces. */
export const ADMIN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const ADMIN_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function validateImageFile(file: File): string | null {
  if (!ADMIN_IMAGE_TYPES.includes(file.type)) {
    return 'শুধুমাত্র JPG, PNG, WebP বা AVIF ছবি আপলোড করা যাবে।';
  }
  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    return 'ছবির সাইজ ৫MB-এর মধ্যে হতে হবে।';
  }
  if (file.size === 0) {
    return 'ফাইলটি খালি, অনুগ্রহ করে আরেকটি ছবি বেছে নিন।';
  }
  return null;
}

/** A collision-resistant object path inside the `site` bucket. */
export function siteMediaPath(folder: string, fileName: string): string {
  const safe = fileName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-80);
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${stamp}-${rand}-${safe || 'file'}`;
}