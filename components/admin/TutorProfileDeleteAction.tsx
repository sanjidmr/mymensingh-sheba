'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteTutorProfile } from '@/app/admin/actions/tutors';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';

export default function TutorProfileDeleteAction({ id }: { id: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      const result = await deleteTutorProfile(id);
      if (!result.ok) {
        notify('error', 'প্রোফাইল মুছে ফেলা হয়নি', result.error);
        return;
      }
      notify('success', 'প্রোফাইল মুছে ফেলা হয়েছে', result.message);
      setOpen(false);
      router.refresh();
    } catch (error) {
      notify(
        'error',
        'প্রোফাইল মুছে ফেলা হয়নি',
        error instanceof Error ? error.message : 'আবার চেষ্টা করুন।'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        মুছুন
      </button>
      <ConfirmDialog
        open={open}
        title="টিউটর প্রোফাইল স্থায়ীভাবে মুছবেন?"
        description="অনুরোধ যুক্ত থাকলে ইতিহাস রক্ষায় মুছে ফেলা বন্ধ হবে। প্রোফাইলের সঙ্গে যুক্ত রিভিউ ও রিপোর্ট মুছে যাবে।"
        confirmLabel="প্রোফাইল মুছুন"
        tone="danger"
        isLoading={busy}
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
