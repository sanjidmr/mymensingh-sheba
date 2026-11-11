'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteAdminToletListing } from '@/app/admin/actions/tolet';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';

export default function ToletListingDeleteButton({
  listingId,
  redirectAfterDelete = false,
}: {
  listingId: string;
  redirectAfterDelete?: boolean;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      const result = await deleteAdminToletListing(listingId);
      if (!result.ok) {
        notify('error', 'বিজ্ঞাপন মুছে ফেলা হয়নি', result.error);
        return;
      }
      notify('success', 'বিজ্ঞাপন মুছে ফেলা হয়েছে', result.message);
      setOpen(false);
      if (redirectAfterDelete) router.push('/admin/tolet');
      router.refresh();
    } catch (error) {
      notify(
        'error',
        'বিজ্ঞাপন মুছে ফেলা হয়নি',
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
        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        স্থায়ীভাবে মুছুন
      </button>
      <ConfirmDialog
        open={open}
        title="বাসা ভাড়ার বিজ্ঞাপন স্থায়ীভাবে মুছবেন?"
        description="বিজ্ঞাপনটির সঙ্গে যুক্ত ভাড়াটিয়ার অনুরোধ ও রিপোর্টও মুছে যাবে। আপলোড করা ছবিগুলো অন্য কোথাও ব্যবহৃত হতে পারে বলে Storage-এ রাখা হবে। এই কাজ ফেরানো যাবে না।"
        confirmLabel="বিজ্ঞাপন ও সংশ্লিষ্ট তথ্য মুছুন"
        tone="danger"
        isLoading={busy}
        onConfirm={remove}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
