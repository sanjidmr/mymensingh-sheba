'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { uploadSiteImage } from '@/lib/admin/upload-site-image';
import { useToast } from '@/components/admin/ToastProvider';

export default function MediaLibraryUpload() {
  const router = useRouter();
  const { notify } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const pick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setProgress(0);
    try {
      await uploadSiteImage(file, 'library', setProgress);
      notify('success', 'ছবি লাইব্রেরিতে যোগ হয়েছে');
      router.refresh();
    } catch (error) {
      notify(
        'error',
        'ছবি আপলোড ব্যর্থ হয়েছে',
        error instanceof Error ? error.message : 'অজানা ত্রুটি হয়েছে।'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="mb-4 rounded-xl border border-mist-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-ink-900">লাইব্রেরিতে ছবি আপলোড</h2>
          <p className="mt-1 text-xs text-ink-500">
            আপনার ওয়েবসাইটের Supabase Storage-এ ছবি সংরক্ষিত হবে এবং পুনরায় ব্যবহারযোগ্য URL তৈরি হবে।
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            disabled={uploading}
            onChange={pick}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {uploading ? `আপলোড হচ্ছে ${progress}%` : 'ছবি বেছে আপলোড করুন'}
          </button>
        </div>
      </div>
      {uploading && (
        <progress className="mt-3 h-2 w-full" max={100} value={progress} aria-label="ছবি আপলোডের অগ্রগতি" />
      )}
    </section>
  );
}
