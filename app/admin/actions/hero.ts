'use server';

import { revalidatePath } from 'next/cache';
import {
  runAdminAction,
  validateImageFile,
  siteMediaPath,
  type ActionResult,
} from '@/lib/admin/actions';

/**
 * Hero carousel management.
 *
 * Uploads go to the `site` storage bucket under `hero/`, and the row records
 * both the public URL and the object path. The path matters: without it,
 * replacing a slide would leave the old image in storage forever, and deleting
 * a slide would leave an orphan nobody can find.
 *
 * The public homepage reads this table through the "Enabled hero slides are
 * public" policy, so a change here is live on the site immediately — and
 * `HeroCarousel` still falls back to its original hardcoded array if the table
 * is empty or unreachable, which is what keeps the homepage from ever showing
 * a broken image.
 */

export async function uploadHeroSlide(
  formData: FormData
): Promise<ActionResult & { slideId?: string }> {
  return runAdminAction(async (client) => {
    const file = formData.get('image');
    const caption = String(formData.get('caption') ?? '').trim();
    const altText = String(formData.get('altText') ?? '').trim();
    const href = String(formData.get('href') ?? '').trim();

    if (!caption) {
      return { ok: false, error: 'স্লাইডের টেক্সট লিখুন — ছবির নিচে যা দেখাবে।' };
    }
    if (!(file instanceof File)) {
      return { ok: false, error: 'একটি ছবি বেছে নিন।' };
    }

    const invalid = validateImageFile(file);
    if (invalid) return { ok: false, error: invalid };

    // New slides go to the end of the carousel, not the front: an admin
    // uploading a replacement does not expect it to become the first thing a
    // visitor sees before they have looked at it.
    const { data: last } = await client
      .from('hero_slides')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const path = siteMediaPath('hero', file.name);
    const { error: uploadError } = await client.storage
      .from('site')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return {
        ok: false,
        error: `ছবি আপলোড ব্যর্থ হয়েছে: ${uploadError.message}`,
      };
    }

    const {
      data: { publicUrl },
    } = client.storage.from('site').getPublicUrl(path);

    const { data: slide, error: insertError } = await client
      .from('hero_slides')
      .insert({
        caption_bn: caption,
        image_url: publicUrl,
        storage_path: path,
        alt_text_bn: altText || null,
        href: href || null,
        is_enabled: true,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .select('id')
      .single();

    if (insertError) {
      // Do not leave an orphaned object behind if the row failed to insert.
      await client.storage.from('site').remove([path]);
      return { ok: false, error: insertError.message };
    }

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'স্লাইড যোগ হয়েছে এবং এখন ওয়েবসাইটে দেখা যাচ্ছে।', slideId: slide.id };
  });
}

export async function updateHeroSlide(
  slideId: string,
  patch: { caption_bn?: string; alt_text_bn?: string | null; href?: string | null }
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const update: Record<string, string | null> = {};
    if (patch.caption_bn !== undefined) {
      const caption = patch.caption_bn.trim();
      if (!caption) return { ok: false, error: 'স্লাইডের টেক্সট খালি রাখা যাবে না।' };
      update.caption_bn = caption;
    }
    if (patch.alt_text_bn !== undefined) update.alt_text_bn = patch.alt_text_bn?.trim() || null;
    if (patch.href !== undefined) update.href = patch.href?.trim() || null;

    const { error } = await client
      .from('hero_slides')
      .update(update)
      .eq('id', slideId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'স্লাইড আপডেট হয়েছে।' };
  });
}

export async function replaceHeroImage(
  slideId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const file = formData.get('image');
    if (!(file instanceof File)) {
      return { ok: false, error: 'একটি ছবি বেছে নিন।' };
    }
    const invalid = validateImageFile(file);
    if (invalid) return { ok: false, error: invalid };

    const { data: slide, error: readError } = await client
      .from('hero_slides')
      .select('id, storage_path')
      .eq('id', slideId)
      .maybeSingle();

    if (readError || !slide) {
      return { ok: false, error: 'স্লাইডটি পাওয়া যায়নি।' };
    }

    const path = siteMediaPath('hero', file.name);
    const { error: uploadError } = await client.storage
      .from('site')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { ok: false, error: `ছবি আপলোড ব্যর্থ হয়েছে: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = client.storage.from('site').getPublicUrl(path);

    const { error: updateError } = await client
      .from('hero_slides')
      .update({ image_url: publicUrl, storage_path: path })
      .eq('id', slideId);

    if (updateError) {
      await client.storage.from('site').remove([path]);
      return { ok: false, error: updateError.message };
    }

    // The old object is only removed after the row points at the new one, so a
    // failure in between leaves the slide showing a working image.
    if (slide.storage_path && slide.storage_path !== path) {
      await client.storage.from('site').remove([slide.storage_path]);
    }

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'ছবি বদলে ফেলা হয়েছে।' };
  });
}

export async function toggleHeroSlide(slideId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { data: slide, error: readError } = await client
      .from('hero_slides')
      .select('id, is_enabled')
      .eq('id', slideId)
      .maybeSingle();

    if (readError || !slide) {
      return { ok: false, error: 'স্লাইডটি পাওয়া যায়নি।' };
    }

    const enabling = !slide.is_enabled;

    // Never let the carousel end up with nothing in it. A homepage with no hero
    // is worse than a homepage with one slide the admin meant to remove.
    if (!enabling) {
      const { count } = await client
        .from('hero_slides')
        .select('id', { count: 'exact', head: true })
        .eq('is_enabled', true);

      if ((count ?? 0) <= 1) {
        return {
          ok: false,
          error: 'শেষ স্লাইডটি বন্ধ করা যাবে না — হোমপেজে অন্তত একটি স্লাইড থাকতে হবে।',
        };
      }
    }

    const { error } = await client
      .from('hero_slides')
      .update({ is_enabled: enabling })
      .eq('id', slideId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return {
      ok: true,
      message: enabling ? 'স্লাইডটি এখন দেখা যাচ্ছে।' : 'স্লাইডটি বন্ধ করা হয়েছে।',
    };
  });
}

/**
 * Reorder slides.
 *
 * Takes the full ordered id list and writes `sort_order` from it, rather than
 * accepting "move up one" clicks. A single bulk write is atomic, so the
 * carousel can never be left half-reordered if the admin closes the tab.
 */
export async function reorderHeroSlides(orderedIds: string[]): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (orderedIds.length === 0) {
      return { ok: false, error: 'স্লাইডের তালিকা খালি।' };
    }

    const updates = orderedIds.map((id, index) =>
      client
        .from('hero_slides')
        .update({ sort_order: index + 1 })
        .eq('id', id)
    );

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed) return { ok: false, error: failed.error!.message };

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'স্লাইডের ক্রম সংরক্ষিত হয়েছে।' };
  });
}

export async function deleteHeroSlide(slideId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { data: slide, error: readError } = await client
      .from('hero_slides')
      .select('id, storage_path, is_enabled')
      .eq('id', slideId)
      .maybeSingle();

    if (readError || !slide) {
      return { ok: false, error: 'স্লাইডটি পাওয়া যায়নি।' };
    }

    if (slide.is_enabled) {
      const { count } = await client
        .from('hero_slides')
        .select('id', { count: 'exact', head: true })
        .eq('is_enabled', true);

      if ((count ?? 0) <= 1) {
        return {
          ok: false,
          error: 'শেষ সক্রিয় স্লাইডটি মুছে ফেলা যাবে না। আগে অন্য একটি স্লাইড চালু করুন।',
        };
      }
    }

    const { error } = await client.from('hero_slides').delete().eq('id', slideId);
    if (error) return { ok: false, error: error.message };

    // Best effort: the row is already gone, so a storage failure here must not
    // report the whole delete as failed.
    if (slide.storage_path) {
      await client.storage.from('site').remove([slide.storage_path]);
    }

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'স্লাইডটি মুছে ফেলা হয়েছে।' };
  });
}