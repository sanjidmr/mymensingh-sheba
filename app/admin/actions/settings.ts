'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

/**
 * Platform settings.
 *
 * `platform_settings` is a key/value JSONB table that already holds the to-let
 * fee slabs, the per-service availability switches and the notification
 * preferences. New admin-editable site settings go in as new keys rather than
 * as new tables — a second settings store would immediately disagree with the
 * first about what "the settings" are.
 *
 * The values are validated here as well as in the UI: this is the only writer
 * besides the SQL console, so a malformed fee object should be impossible to
 * save rather than merely unlikely.
 */

export interface ToletFeeRulesInput {
  messSeatFee: number;
  tier1Max10k: number;
  tier2Max20k: number;
  tier3Above20k: number;
}

export async function saveToletFeeRules(rules: ToletFeeRulesInput): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const values = [
      rules.messSeatFee,
      rules.tier1Max10k,
      rules.tier2Max20k,
      rules.tier3Above20k,
    ];

    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      return { ok: false, error: 'সব ফি অবশ্যই অ-ঋণাত্মক সংখ্যা হতে হবে।' };
    }
    if (values.some((v) => v > 1_000_000)) {
      return { ok: false, error: 'ফি এত বড় হতে পারে না।' };
    }

    const { error } = await client
      .from('platform_settings')
      .upsert({ key: 'tolet_fee_rules', value: rules as unknown as Record<string, unknown> });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/settings');
    revalidatePath('/admin/tolet');
    return { ok: true, message: 'ফি সংরক্ষিত হয়েছে।' };
  });
}

export async function saveServiceAvailability(
  availability: Record<string, boolean>
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const clean: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(availability)) {
      if (typeof key !== 'string' || key.length > 80) continue;
      clean[key] = Boolean(value);
    }

    const { error } = await client
      .from('platform_settings')
      .upsert({ key: 'service_availability', value: clean as unknown as Record<string, unknown> });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/settings');
    revalidatePath('/admin/website');
    return { ok: true, message: 'সেবার উপলব্ধতা সংরক্ষিত হয়েছে।' };
  });
}

export async function saveNotificationSettings(settings: {
  notifyOnRequestSubmitted: boolean;
  notifyOnStatusChange: boolean;
  notifyAdminOnNewRequest: boolean;
  notifyCustomerOnStatusChange: boolean;
}): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('platform_settings').upsert({
      key: 'notification_settings',
      value: settings as unknown as Record<string, unknown>,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/settings');
    return { ok: true, message: 'নোটিফিকেশন সেটিংস সংরক্ষিত হয়েছে।' };
  });
}

/**
 * Save a homepage / service-catalog override.
 *
 * The public catalog is still the TypeScript constants in
 * `lib/homepage-catalog.ts` and `lib/services-data.ts`; this writes an override
 * that `lib/site-content.ts` layers on top. When no override exists the site
 * renders exactly as it did before the admin panel existed, which is the whole
 * point: the panel can change the site without the site having been rebuilt
 * around the panel.
 */
export async function saveSiteContent(key: string, value: unknown): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[a-z0-9_]{1,80}$/.test(key)) {
      return { ok: false, error: 'অবৈধ সেটিংস কী।' };
    }
    const serialized = JSON.stringify(value);
    if (serialized.length > 200_000) {
      return { ok: false, error: 'ডেটা খুব বড় হয়ে গেছে।' };
    }

    const { error } = await client
      .from('platform_settings')
      .upsert({ key, value: value as unknown as Record<string, unknown> });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/website');
    revalidatePath('/');
    revalidatePath('/services');
    return { ok: true, message: 'ওয়েবসাইটের তথ্য সংরক্ষিত হয়েছে।' };
  });
}

/** Remove an override, returning the site to its built-in content. */
export async function deleteSiteContent(key: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client
      .from('platform_settings')
      .delete()
      .eq('key', key);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/website');
    revalidatePath('/');
    revalidatePath('/services');
    return { ok: true, message: 'মুছে ফেলা হয়েছে — এখন ওয়েবসাইটের আসল তথ্য দেখাচ্ছে।' };
  });
}