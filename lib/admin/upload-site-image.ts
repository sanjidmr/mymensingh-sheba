'use client';

import { Upload } from 'tus-js-client';
import { createClient } from '@/lib/supabase/client';
import { siteMediaPath, validateSiteImage } from './site-media';

export interface SiteImageUpload {
  path: string;
  url: string;
}

export async function uploadSiteImage(
  file: File,
  folder: string,
  onProgress?: (percentage: number) => void,
  existingPath?: string
): Promise<SiteImageUpload> {
  const validationError = validateSiteImage(file);
  if (validationError) throw new Error(validationError);

  const client = createClient();
  if (!client) throw new Error('Supabase সংযোগ কনফিগার করা নেই।');

  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw new Error(`সেশন যাচাই করা যায়নি: ${sessionError.message}`);
  if (!sessionData.session) throw new Error('ছবি আপলোডের জন্য অ্যাডমিন হিসেবে লগইন করুন।');

  const path = existingPath ?? siteMediaPath(folder, file);
  if (existingPath && (existingPath.length > 512 || existingPath.includes('..') || existingPath.startsWith('/'))) {
    throw new Error('ছবির Storage path সঠিক নয়।');
  }
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !apiKey) throw new Error('Supabase Storage কনফিগার করা নেই।');
  const accessToken = sessionData.session.access_token;

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${baseUrl.replace(/\/+$/, '')}/storage/v1/upload/resumable`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: apiKey,
        ...(existingPath ? { 'x-upsert': 'true' } : {}),
      },
      metadata: {
        bucketName: 'site',
        objectName: path,
        contentType: file.type,
        cacheControl: '0',
      },
      chunkSize: 6 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 5000],
      removeFingerprintOnSuccess: true,
      onProgress(bytesSent, bytesTotal) {
        onProgress?.(Math.min(100, Math.round((bytesSent / bytesTotal) * 100)));
      },
      onError(error) {
        reject(new Error(`ছবি আপলোড ব্যর্থ হয়েছে: ${error.message}`));
      },
      onSuccess() {
        resolve();
      },
    });

    upload.start();
  });

  const { error: recordError } = await client.from('site_media').upsert(
    {
      object_path: path,
      display_name: file.name.slice(0, 180) || 'image',
      mime_type: file.type,
      size_bytes: file.size,
    },
    { onConflict: 'object_path' }
  );

  if (recordError) {
    if (!existingPath) {
      const { error: cleanupError } = await client.storage.from('site').remove([path]);
      if (cleanupError) {
        console.error('Uploaded site image could not be rolled back after its media record failed.', cleanupError.message);
      }
    }
    throw new Error(`ছবির রেকর্ড সংরক্ষণ করা যায়নি: ${recordError.message}`);
  }

  const { data } = client.storage.from('site').getPublicUrl(path);
  onProgress?.(100);
  return { path, url: data.publicUrl };
}
