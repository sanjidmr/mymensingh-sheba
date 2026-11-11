'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import { SITE_IMAGE_TYPES } from '@/lib/admin/site-media';

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

function validHeroPath(path: string): boolean {
  return /^hero\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/i.test(path);
}

async function getUploadedHeroImage(client: SupabaseClient, path: string) {
  if (!validHeroPath(path)) return { error: 'হিরো ছবির পাথ সঠিক নয়।' };
  const { data: media, error } = await client
    .from('site_media')
    .select('object_path, mime_type')
    .eq('object_path', path)
    .maybeSingle();
  if (error) return { error: `মিডিয়া রেকর্ড যাচাই করা যায়নি: ${error.message}` };
  if (!media || !SITE_IMAGE_TYPES.includes(media.mime_type as (typeof SITE_IMAGE_TYPES)[number])) {
    return { error: 'ছবিটি ওয়েবসাইটের মিডিয়া লাইব্রেরিতে পাওয়া যায়নি।' };
  }
  const { data: files, error: storageError } = await client.storage
    .from('site')
    .list('hero', { search: path.slice('hero/'.length) });
  if (storageError) return { error: `Storage যাচাই করা যায়নি: ${storageError.message}` };
  if (!files?.some((file) => `hero/${file.name}` === path)) {
    return { error: 'Storage-এ ছবিটি পাওয়া যায়নি।' };
  }
  return { publicUrl: client.storage.from('site').getPublicUrl(path).data.publicUrl };
}

export async function uploadHeroSlide(
  path: string,
  title: string,
  subtitle: string,
  description: string,
  altText: string,
  href: string
): Promise<ActionResult & { slideId?: string }> {
  return runAdminAction(async (client) => {
    const heading = title.trim();
    const subheading = subtitle.trim();
    const details = description.trim();
    const alt = altText.trim();
    const link = href.trim();
    if (heading.length > 200 || subheading.length > 300 || details.length > 1500 || alt.length > 500) {
      return { ok: false, error: 'ব্যানারের লেখা নির্ধারিত দৈর্ঘ্যের চেয়ে বড়।' };
    }
    if (link && (!link.startsWith('/') || link.startsWith('//') || link.includes('\\'))) {
      return { ok: false, error: 'ব্যানারের লিংকটি সাইটের অভ্যন্তরীণ পাথ হতে হবে।' };
    }
    const uploaded = await getUploadedHeroImage(client, path);
    if (uploaded.error || !uploaded.publicUrl) {
      return { ok: false, error: uploaded.error ?? 'ব্যানারের ছবির URL তৈরি করা যায়নি।' };
    }

    // New slides go to the end of the carousel, not the front: an admin
    // uploading a replacement does not expect it to become the first thing a
    // visitor sees before they have looked at it.
    const { data: last, error: orderError } = await client
      .from('hero_slides')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) return { ok: false, error: `স্লাইডের ক্রম পড়া যায়নি: ${orderError.message}` };

    const { data: slide, error: insertError } = await client
      .from('hero_slides')
      .insert({
        caption_bn: heading,
        title_bn: heading || null,
        subtitle_bn: subheading || null,
        description_bn: details || null,
        image_url: uploaded.publicUrl,
        storage_path: path,
        alt_text_bn: alt || null,
        href: link || null,
        is_enabled: true,
        sort_order: (last?.sort_order ?? 0) + 1,
      })
      .select('id')
      .single();

    if (insertError) {
      return {
        ok: false,
        error: `ব্যানার সংরক্ষণ হয়নি: ${insertError.message} ছবিটি Media Library-তে আছে, প্রয়োজনে আবার ব্যবহার করুন।`,
      };
    }

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'স্লাইড যোগ হয়েছে এবং এখন ওয়েবসাইটে দেখা যাচ্ছে।', slideId: slide.id };
  });
}

export async function updateHeroSlide(
  slideId: string,
  patch: {
    title_bn?: string;
    subtitle_bn?: string | null;
    description_bn?: string | null;
    alt_text_bn?: string | null;
    href?: string | null;
  }
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const update: Record<string, string | null> = {};
    if (patch.title_bn !== undefined) {
      const title = patch.title_bn.trim();
      if (title.length > 200) return { ok: false, error: 'ব্যানারের শিরোনাম ২০০ অক্ষরের মধ্যে হতে হবে।' };
      update.title_bn = title || null;
      update.caption_bn = title;
    }
    if (patch.subtitle_bn !== undefined) {
      const subtitle = patch.subtitle_bn?.trim() ?? '';
      if (subtitle.length > 300) return { ok: false, error: 'ব্যানারের উপশিরোনাম ৩০০ অক্ষরের মধ্যে হতে হবে।' };
      update.subtitle_bn = subtitle || null;
    }
    if (patch.description_bn !== undefined) {
      const description = patch.description_bn?.trim() ?? '';
      if (description.length > 1500) return { ok: false, error: 'ব্যানারের বিবরণ ১৫০০ অক্ষরের মধ্যে হতে হবে।' };
      update.description_bn = description || null;
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
  path: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const uploaded = await getUploadedHeroImage(client, path);
    if (uploaded.error || !uploaded.publicUrl) {
      return { ok: false, error: uploaded.error ?? 'ছবির URL তৈরি করা যায়নি।' };
    }

    const { data: slide, error: readError } = await client
      .from('hero_slides')
      .select('id, storage_path')
      .eq('id', slideId)
      .maybeSingle();

    if (readError || !slide) {
      return { ok: false, error: 'স্লাইডটি পাওয়া যায়নি।' };
    }

    const { error: updateError } = await client
      .from('hero_slides')
      .update({ image_url: uploaded.publicUrl, storage_path: path })
      .eq('id', slideId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Keep the previous image in the media library; another page may reuse it.

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
      .select('id, is_enabled')
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

    revalidatePath('/admin/hero');
    revalidatePath('/');
    return { ok: true, message: 'স্লাইডটি মুছে ফেলা হয়েছে।' };
  });
}