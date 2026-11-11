'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

async function findMediaReferences(
  client: SupabaseClient,
  objectPath: string
): Promise<{ references?: string[]; error?: string }> {
  const { data: media, error: mediaError } = await client
    .from('site_media')
    .select('object_path')
    .eq('object_path', objectPath)
    .maybeSingle();
  if (mediaError) return { error: mediaError.message };
  if (!media) return { error: 'মিডিয়া রেকর্ডটি পাওয়া যায়নি।' };

  const publicUrl = client.storage.from('site').getPublicUrl(objectPath).data.publicUrl;
  const [settings, slides, serviceListings] = await Promise.all([
    client.from('platform_settings').select('key, value'),
    client.from('hero_slides').select('caption_bn, image_url, storage_path'),
    client.from('service_listings').select('title_bn, image_url, logo_url, photos'),
  ]);
  const failed = [settings, slides, serviceListings].find((result) => result.error);
  if (failed?.error) return { error: failed.error.message };

  const references: string[] = [];
  for (const row of settings.data ?? []) {
    const serialized = JSON.stringify(row.value);
    if (serialized.includes(objectPath) || serialized.includes(publicUrl)) {
      references.push(`Website settings: ${row.key}`);
    }
  }
  for (const row of slides.data ?? []) {
    if (row.storage_path === objectPath || row.image_url === publicUrl) {
      references.push(`Hero banner: ${row.caption_bn || 'Untitled slide'}`);
    }
  }
  for (const row of serviceListings.data ?? []) {
    const photos = Array.isArray(row.photos) ? row.photos : [];
    if (
      row.image_url === publicUrl ||
      row.logo_url === publicUrl ||
      photos.includes(publicUrl) ||
      photos.includes(objectPath)
    ) {
      references.push(`Service listing: ${row.title_bn || 'Untitled listing'}`);
    }
  }

  return { references };
}

function isValidObjectPath(path: string): boolean {
  return path.length > 0 && path.length <= 512 && !path.includes('..') && !path.startsWith('/');
}

export async function renameMedia(
  objectPath: string,
  displayName: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const name = displayName.trim();
    if (!isValidObjectPath(objectPath) || !name || name.length > 180) {
      return { ok: false, error: 'ছবির নাম সঠিক নয়।' };
    }

    const { data, error } = await client
      .from('site_media')
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq('object_path', objectPath)
      .select('object_path')
      .maybeSingle();

    if (error) return { ok: false, error: `নাম সংরক্ষণ করা যায়নি: ${error.message}` };
    if (!data) return { ok: false, error: 'মিডিয়া রেকর্ডটি পাওয়া যায়নি।' };

    revalidatePath('/admin/media');
    return { ok: true, message: 'ছবির নাম সংরক্ষিত হয়েছে।' };
  });
}

export async function deleteMedia(objectPath: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isValidObjectPath(objectPath)) {
      return { ok: false, error: 'অবৈধ ফাইল পাথ।' };
    }

    const usage = await findMediaReferences(client, objectPath);
    if (usage.error) return { ok: false, error: `ব্যবহার যাচাই করা যায়নি: ${usage.error}` };
    if (usage.references && usage.references.length > 0) {
      return {
        ok: false,
        error: `এই ছবি ${usage.references.slice(0, 5).join(', ')}-এ ব্যবহৃত হচ্ছে। আগে সেখান থেকে ছবিটি বদলান; এখনো কিছু মুছে ফেলা হয়নি।`,
      };
    }

    const { error: storageError } = await client.storage.from('site').remove([objectPath]);
    if (storageError) {
      return { ok: false, error: `স্টোরেজ থেকে মুছে ফেলা যায়নি: ${storageError.message}` };
    }

    const { error: recordError } = await client
      .from('site_media')
      .delete()
      .eq('object_path', objectPath);
    if (recordError) {
      return {
        ok: false,
        error: `ছবি স্টোরেজ থেকে মুছে গেছে, কিন্তু লাইব্রেরির রেকর্ড পরিষ্কার করা যায়নি: ${recordError.message}`,
      };
    }

    revalidatePath('/admin/media');
    return { ok: true, message: 'ছবিটি মুছে ফেলা হয়েছে।' };
  });
}
