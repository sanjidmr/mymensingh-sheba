'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { deleteDonorProfile, updateDonorProfile } from '@/app/admin/actions/donor-profiles';
import type { AdminBloodDonorRow } from '@/lib/admin/queries';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';

export default function DonorListActions({ donor }: { donor: AdminBloodDonorRow }) {
  const router = useRouter();
  const { notify } = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const changeStatus = async (status: 'pending_approval' | 'rejected') => {
    if (status === 'rejected' && reason.trim().length === 0) {
      notify('error', 'প্রত্যাখ্যানের কারণ প্রয়োজন', 'কারণ লিখে আবার চেষ্টা করুন।');
      return;
    }
    setBusy(true);
    try {
      const result = await updateDonorProfile(donor.id, {
        status,
        ...(status === 'rejected' ? { rejectionReason: reason.trim() } : {}),
      });
      if (!result.ok) {
        notify('error', 'অবস্থা পরিবর্তন হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'প্রোফাইলের অবস্থা আপডেট হয়েছে।');
      setRejectOpen(false);
      setReason('');
      router.refresh();
    } catch (error) {
      notify('error', 'অবস্থা পরিবর্তন হয়নি', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const result = await deleteDonorProfile(donor.id);
      if (!result.ok) {
        notify('error', 'প্রোফাইল মুছে ফেলা হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'প্রোফাইল মুছে ফেলা হয়েছে।');
      setDeleteOpen(false);
      router.refresh();
    } catch (error) {
      notify('error', 'প্রোফাইল মুছে ফেলা হয়নি', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  const iconClass = 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-admin-border text-admin-muted hover:bg-admin-page hover:text-admin-navy disabled:opacity-40';

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        <Link href={`/admin/blood/donors/${donor.id}`} aria-label="প্রোফাইল সম্পাদনা" title="প্রোফাইল সম্পাদনা" className={iconClass}>
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
        {donor.status === 'rejected' ? (
          <button type="button" onClick={() => void changeStatus('pending_approval')} disabled={busy} aria-label="পর্যালোচনায় ফেরান" title="পর্যালোচনায় ফেরান" className={iconClass}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
          </button>
        ) : (
          <button type="button" onClick={() => setRejectOpen(true)} disabled={busy} aria-label="প্রত্যাখ্যান" title="প্রত্যাখ্যান" className={`${iconClass} border-rose-200 text-rose-700 hover:bg-rose-50`}>
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button type="button" onClick={() => setDeleteOpen(true)} disabled={busy} aria-label="প্রোফাইল মুছুন" title="প্রোফাইল মুছুন" className={`${iconClass} border-rose-200 text-rose-700 hover:bg-rose-50`}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <ConfirmDialog
        open={rejectOpen}
        title="রক্তদাতার প্রোফাইল প্রত্যাখ্যান করবেন?"
        description={<label className="mt-2 grid gap-2 text-sm">কারণ (আবশ্যক)<textarea rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="w-full rounded-lg border border-admin-border px-3 py-2" /></label>}
        confirmLabel="প্রত্যাখ্যান করুন"
        isLoading={busy}
        onConfirm={() => void changeStatus('rejected')}
        onCancel={() => { setRejectOpen(false); setReason(''); }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="রক্তদাতার প্রোফাইল মুছবেন?"
        description="প্রোফাইলটি স্থায়ীভাবে মুছে যাবে এবং ফিরিয়ে আনা যাবে না।"
        confirmLabel="মুছে ফেলুন"
        requireText={donor.full_name}
        isLoading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
