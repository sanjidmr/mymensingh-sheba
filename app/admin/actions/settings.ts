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
    const text = (item: unknown) => typeof item === 'string' ? item.trim() : '';
    const publicPath = (item: unknown) =>
      typeof item === 'string' && item.startsWith('/') && !item.startsWith('//') && !item.includes('\\');
    if (
      ['announcement', 'about_content', 'faq_content', 'footer_content', 'seo'].includes(key) &&
      (!value || typeof value !== 'object')
    ) {
      return { ok: false, error: 'কনটেন্টের বিন্যাস সঠিক নয়।' };
    }
    if (key === 'site_contact') {
      if (!value || typeof value !== 'object') {
        return { ok: false, error: 'যোগাযোগের তথ্যের বিন্যাস সঠিক নয়।' };
      }
      const item = value as {
        phone?: unknown;
        email?: unknown;
        officeAddress?: unknown;
        serviceAreaBn?: unknown;
        hoursBn?: unknown;
        socials?: unknown;
      };
      const phone = text(item.phone);
      const email = text(item.email);
      const validHttps = (href: string) => {
        try {
          return new URL(href).protocol === 'https:';
        } catch {
          return false;
        }
      };
      if (
        (phone && !/^[+\d\s()-]{7,24}$/.test(phone)) ||
        (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
        text(item.officeAddress).length > 240 ||
        text(item.serviceAreaBn).length > 160 ||
        text(item.hoursBn).length > 160
      ) {
        return { ok: false, error: 'ফোন, ইমেইল বা যোগাযোগের তথ্য সঠিক নয়।' };
      }
      if (
        !Array.isArray(item.socials) ||
        item.socials.length > 6 ||
        item.socials.some((social) =>
          !social ||
          typeof social !== 'object' ||
          !['facebook', 'messenger'].includes(String((social as { icon?: unknown }).icon)) ||
          text((social as { labelBn?: unknown }).labelBn).length > 60 ||
          (text((social as { href?: unknown }).href) &&
            !validHttps(text((social as { href?: unknown }).href)))
        )
      ) {
        return { ok: false, error: 'সোশ্যাল মিডিয়ার নাম বা HTTPS লিংক সঠিক নয়।' };
      }
    }
    if (key === 'announcement') {
      const item = value as { enabled?: unknown; title?: unknown; body?: unknown; href?: unknown; linkLabel?: unknown };
      if (typeof item.enabled !== 'boolean' || text(item.title).length > 120 || text(item.body).length > 500) {
        return { ok: false, error: 'ঘোষণার শিরোনাম, বার্তা বা চালু/বন্ধের তথ্য সঠিক নয়।' };
      }
      if (text(item.title) && !text(item.body)) {
        return { ok: false, error: 'শিরোনাম দিলে ঘোষণার বার্তাও লিখুন।' };
      }
      if (item.enabled && (!text(item.title) || !text(item.body))) {
        return { ok: false, error: 'প্রকাশের আগে ঘোষণার শিরোনাম ও বার্তা লিখুন।' };
      }
      if (item.href && !publicPath(item.href)) {
        return { ok: false, error: 'ঘোষণার লিংকটি সাইটের অভ্যন্তরীণ পাথ হতে হবে।' };
      }
    }
    if (key === 'about_content') {
      const item = value as { heading?: unknown; intro?: unknown };
      if (text(item.heading).length > 160 || text(item.intro).length > 1500) {
        return { ok: false, error: 'About Us শিরোনাম বা পরিচিতি নির্ধারিত দৈর্ঘ্যের বেশি।' };
      }
      if (text(item.heading).length < 3 || text(item.intro).length < 20) {
        return { ok: false, error: 'About Us শিরোনাম ও কমপক্ষে ২০ অক্ষরের পরিচিতি দিন।' };
      }
    }
    if (key === 'faq_content') {
      if (!Array.isArray(value) || value.length > 30) {
        return { ok: false, error: 'FAQ তালিকায় সর্বোচ্চ ৩০টি প্রশ্ন রাখা যাবে।' };
      }
      if (value.some((item) => (
        !item || typeof item !== 'object' ||
        text((item as { question?: unknown }).question).length < 5 ||
        text((item as { question?: unknown }).question).length > 240 ||
        text((item as { answer?: unknown }).answer).length < 10 ||
        text((item as { answer?: unknown }).answer).length > 1500
      ))) {
        return { ok: false, error: 'প্রতিটি FAQ-তে ৫–২৪০ অক্ষরের প্রশ্ন ও ১০–১৫০০ অক্ষরের উত্তর দিন।' };
      }
    }
    if (key === 'footer_content') {
      const item = value as { description?: unknown; companyLinks?: unknown; supportLinks?: unknown };
      const validLinks = (links: unknown) => Array.isArray(links) && links.length <= 12 && links.every((link) => (
        link && typeof link === 'object' &&
        text((link as { label?: unknown }).label).length >= 2 &&
        text((link as { label?: unknown }).label).length <= 60 &&
        publicPath((link as { href?: unknown }).href)
      ));
      if (text(item.description).length > 500 || !validLinks(item.companyLinks) || !validLinks(item.supportLinks)) {
        return { ok: false, error: 'ফুটারের বিবরণ বা লিংক সঠিক নয়; লিংক সাইটের অভ্যন্তরীণ পাথ হতে হবে।' };
      }
    }
    if (key === 'seo') {
      const item = value as { title?: unknown; description?: unknown; ogImage?: unknown };
      const image = text(item.ogImage);
      if (text(item.title).length > 120 || text(item.description).length > 320) {
        return { ok: false, error: 'SEO শিরোনাম বা বিবরণ নির্ধারিত দৈর্ঘ্যের বেশি।' };
      }
      if (image && !(image.startsWith('/') && !image.startsWith('//')) && !/^https:\/\/\S+$/i.test(image)) {
        return { ok: false, error: 'সামাজিক শেয়ারিং ছবির ঠিকানা HTTPS বা সাইটের অভ্যন্তরীণ পাথ হতে হবে।' };
      }
    }

    const { error } = await client
      .from('platform_settings')
      .upsert({ key, value: value as unknown as Record<string, unknown> });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/website');
    revalidatePath('/');
    revalidatePath('/services');
    revalidatePath('/about');
    revalidatePath('/help');
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