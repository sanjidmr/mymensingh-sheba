'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import type { AdminMediaItem } from '@/lib/admin/queries';
import { deleteMedia, renameMedia } from '@/app/admin/actions/media';
import { uploadSiteImage } from '@/lib/admin/upload-site-image';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';

export default function MediaActions({ item }: { item: AdminMediaItem }) {
  const router = useRouter();
  const { notify } = useToast();
  const replaceInput = useRef<HTMLInputElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.display_name);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(item.public_url);
      notify('success', 'Public URL কপি হয়েছে');
    } catch (error) {
      notify(
        'error',
        'URL কপি করা যায়নি',
        error instanceof Error ? error.message : 'ব্রাউজার ক্লিপবোর্ড অনুমতি দেয়নি।'
      );
    }
  };

  const saveName = async () => {
    setBusy(true);
    try {
      const result = await renameMedia(item.name, name);
      if (!result.ok) {
        notify('error', 'নাম সংরক্ষণ হয়নি', result.error);
        return;
      }
      setEditing(false);
      notify('success', result.message ?? 'নাম সংরক্ষিত হয়েছে');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const replace = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setProgress(0);
    try {
      await uploadSiteImage(file, '', setProgress, item.name);
      notify('success', 'ছবি বদলানো হয়েছে; Public URL অপরিবর্তিত আছে');
      router.refresh();
    } catch (error) {
      notify(
        'error',
        'ছবি বদলানো যায়নি',
        error instanceof Error ? error.message : 'অজানা ত্রুটি হয়েছে।'
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const result = await deleteMedia(item.name);
      if (result.ok) {
        notify('success', result.message ?? 'মুছে ফেলা হয়েছে');
        setDeleting(false);
        router.refresh();
      } else {
        notify('error', 'ছবি মুছে ফেলা যায়নি', result.error);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-w-48 flex-col gap-1.5">
      {editing ? (
        <div className="flex gap-1">
          <input
            value={name}
            maxLength={180}
            onChange={(event) => setName(event.target.value)}
            aria-label="ছবির নাম"
            className="h-8 min-w-0 flex-1 rounded border border-mist-300 px-2 text-xs"
          />
          <button type="button" disabled={busy} onClick={saveName} aria-label="নাম সংরক্ষণ">
            <Check className="h-4 w-4 text-emerald-700" />
          </button>
        </div>
      ) : (
        <span className="flex gap-1">
          <button
            type="button"
            onClick={copyUrl}
            className="inline-flex h-8 items-center gap-1 rounded border border-mist-200 px-2 text-[11px] font-semibold text-ink-700"
          >
            <Copy className="h-3.5 w-3.5" /> URL কপি
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="ছবির নাম বদলান"
            title="নাম বদলান"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-mist-200 text-ink-700"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </span>
      )}

      <input
        ref={replaceInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        disabled={busy}
        onChange={replace}
      />
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => replaceInput.current?.click()}
          disabled={busy}
          className="inline-flex h-8 items-center gap-1 rounded border border-mist-200 px-2 text-[11px] font-semibold text-ink-700 disabled:opacity-60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {busy && progress > 0 ? `${progress}%` : 'Replace'}
        </button>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          aria-label="ছবি মুছুন"
          title="ছবি মুছুন"
          className="inline-flex h-8 w-8 items-center justify-center rounded border border-rose-200 text-rose-600 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <ConfirmDialog
        open={deleting}
        title="ছবিটি মুছে ফেলবেন?"
        description={
          <>
            <span className="font-mono text-xs">{item.display_name}</span> সরানোর আগে
            ওয়েবসাইটের CMS, Hero এবং service listing-এ ব্যবহার যাচাই করা হবে। ব্যবহৃত
            হলে মুছে ফেলা বন্ধ করে warning দেখানো হবে।
          </>
        }
        confirmLabel="ব্যবহার যাচাই করে মুছুন"
        isLoading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
