'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { deleteAdminToletListing } from '@/app/admin/actions/tolet';

export default function ToletListingDeleteAction({
  id,
  title,
  onDeleted,
}: {
  id: string;
  title: string;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await deleteAdminToletListing(id);
      if (!result.ok) {
        setError(result.error);
        setOpen(false);
        return;
      }
      setOpen(false);
      onDeleted();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'বিজ্ঞাপনটি মুছে ফেলা যায়নি।');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        aria-label="স্থায়ীভাবে মুছুন"
        title="স্থায়ীভাবে মুছুন"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      >
        {busy
          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          : <Trash2 className="h-4 w-4" aria-hidden="true" />}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p>}
      <ConfirmDialog
        open={open}
        title="To-Let বিজ্ঞাপনটি স্থায়ীভাবে মুছবেন?"
        description="বিজ্ঞাপনটি এবং এর সঙ্গে যুক্ত ভাড়ার অনুরোধগুলো স্থায়ীভাবে মুছে যাবে। এই কাজ ফিরিয়ে আনা যাবে না। নিশ্চিত করতে বিজ্ঞাপনের শিরোনাম লিখুন।"
        confirmLabel="স্থায়ীভাবে মুছুন"
        isLoading={busy}
        requireText={title}
        onConfirm={() => void remove()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
