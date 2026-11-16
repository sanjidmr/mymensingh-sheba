'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteEmergencyContact } from '@/app/admin/actions/catalog';
import type { AdminEmergencyContactRow } from '@/lib/admin/queries';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';

export default function EmergencyContactRowActions({ contact }: { contact: AdminEmergencyContactRow }) {
  const router = useRouter();
  const { notify } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      const result = await deleteEmergencyContact(contact.id);
      if (!result.ok) {
        notify('error', 'যোগাযোগ মুছে ফেলা হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'যোগাযোগ মুছে ফেলা হয়েছে।');
      setConfirming(false);
      router.refresh();
    } catch (error) {
      notify('error', 'যোগাযোগ মুছে ফেলা হয়নি', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy}
        aria-label="জরুরি যোগাযোগ মুছুন"
        title="মুছুন"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <ConfirmDialog
        open={confirming}
        title="জরুরি যোগাযোগটি মুছবেন?"
        description="রেকর্ডটি পাবলিক ডিরেক্টরি থেকেও স্থায়ীভাবে সরবে।"
        confirmLabel="মুছে ফেলুন"
        isLoading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
