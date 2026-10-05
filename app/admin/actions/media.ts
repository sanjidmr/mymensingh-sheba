'use server';

import { revalidatePath } from 'next/cache';
import {
  runAdminAction,
  validateImageFile,
  siteMediaPath,
  type ActionResult,
} from '@/lib/admin/actions';

/**
 * Media library.
 *
 * Uploads land in the `site` bucket under a caller-chosen folder
 * (`hero/`, `homepage/`, `service/`), which is the only organisation the
 * library needs — a folder tree with tags and albums would be a second CMS on
 * top of a storage bucket that already does the job.
 *
 * Deletion removes the storage object, not just a row: there is no row. The
 * library reads `storage.objects` directly, so a delete that only cleared a
 * database record would leave the file downloadable by anyone with the URL.
 */

export async function uploadMedia(
  formData: FormData
): Promise<ActionResult & { url?: string; path?: string }> {
  return runAdminAction(async (client) => {
    const file = formData.get('file');
    const folder = String(formData.get('folder') ?? 'homepage').trim();

    if (!/^[a-z0-9][a-z0-9_\-/]{0,40}$/.test(folder)) {
      return { ok: false, error: 'অবৈধ ফোল্ডার।' };
    }
    if (!(file instanceof File)) {
      return { ok: false, error: 'একটি ফাইল বেছে নিন।' };
    }

    const invalid = validateImageFile(file);
    if (invalid) return { ok: false, error: invalid };

    const path = siteMediaPath(folder, file.name);
    const { error: uploadError } = await client.storage
      .from('site')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { ok: false, error: `আপলোড ব্যর্থ হয়েছে: ${uploadError.message}` };
    }

    const {
      data: { publicUrl },
    } = client.storage.from('site').getPublicUrl(path);

    revalidatePath('/admin/media');
    return { ok: true, message: 'ফাইল আপলোড হয়েছে।', url: publicUrl, path };
  });
}

export async function deleteMedia(
  bucketId: string,
  objectName: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    // Only the admin-writable bucket is deletable from the panel. `documents`
    // holds private verification uploads and prescriptions; removing those from
    // a media screen would be a privacy decision made in the wrong place.
    if (bucketId !== 'site') {
      return {
        ok: false,
        error: 'শুধুমাত্র অ্যাডমিন আপলোড করা ফাইল মুছে ফেলা যাবে।',
      };
    }
    if (!objectName || objectName.includes('..')) {
      return { ok: false, error: 'অবৈধ ফাইল পাথ।' };
    }

    const { error } = await client.storage.from(bucketId).remove([objectName]);
    if (error) {
      return { ok: false, error: `মুছে ফেলা যায়নি: ${error.message}` };
    }

    revalidatePath('/admin/media');
    return { ok: true, message: 'ফাইলটি মুছে ফেলা হয়েছে।' };
  });
}