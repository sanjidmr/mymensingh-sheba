'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Edit3, Loader2, Power, Trash2, X } from 'lucide-react';
import type { AdminServiceListingRow } from '@/lib/admin/queries';
import { deleteAdminServiceListing, moderateAdminServiceListing, setAdminServiceListingActive } from '@/app/admin/actions/service-listings';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export default function ServiceListingActions({ row }: { row: AdminServiceListingRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<'publish' | 'delete' | null>(null);
  const [message, setMessage] = useState('');
  const category = row.category;

  const confirm = async () => {
    if (!dialog) return;
    setBusy(true);
    setMessage('');
    const result = dialog === 'publish'
      ? await setAdminServiceListingActive(row.id, !row.is_active)
      : await deleteAdminServiceListing(row.id);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setDialog(null);
    setMessage(result.message ?? 'পরিবর্তন সংরক্ষিত হয়েছে।');
    router.refresh();
  };

  const moderate = async (status: 'approved' | 'rejected') => {
    const rejectionReason = status === 'rejected'
      ? window.prompt('প্রত্যাখ্যানের কারণ লিখুন (গ্রাহক এটি দেখতে পাবেন):')?.trim()
      : undefined;
    if (status === 'rejected' && !rejectionReason) return;
    setBusy(true);
    setMessage('');
    const result = await moderateAdminServiceListing(row.id, status, rejectionReason);
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(result.message ?? 'পরিবর্তন সংরক্ষিত হয়েছে।');
    router.refresh();
  };

  return (
    <div className="flex min-w-0 items-center justify-end gap-1">
      <Link href={`/admin/directories/${category}/${row.id}/edit`} aria-label="সম্পাদনা" title="সম্পাদনা" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-admin-navy hover:bg-admin-page">
        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      {row.owner_id && row.status !== 'approved' && (
        <>
          <button type="button" onClick={() => void moderate('approved')} disabled={busy} aria-label="অনুমোদন" title="অনুমোদন" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50 disabled:opacity-60">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {row.status !== 'rejected' && <button type="button" onClick={() => void moderate('rejected')} disabled={busy} aria-label="প্রত্যাখ্যান" title="প্রত্যাখ্যান" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 disabled:opacity-60">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>}
        </>
      )}
      <button type="button" onClick={() => setDialog('publish')} disabled={busy} aria-label={row.is_active ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'} title={row.is_active ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-admin-text hover:bg-admin-page disabled:opacity-60">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Power className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <button type="button" onClick={() => setDialog('delete')} disabled={busy} aria-label="স্থায়ীভাবে মুছুন" title="স্থায়ীভাবে মুছুন" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 disabled:opacity-60">
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      {message && <span role="status" className="max-w-56 text-xs text-admin-muted">{message}</span>}
      <ConfirmDialog
        open={dialog !== null}
        title={dialog === 'delete' ? 'তালিকাটি স্থায়ীভাবে মুছবেন?' : row.is_active ? 'তালিকাটি অপ্রকাশিত করবেন?' : 'তালিকাটি প্রকাশ করবেন?'}
        description={
          dialog === 'delete'
            ? category === 'vehicle'
              ? 'তালিকাটি স্থায়ীভাবে মুছে যাবে। আগের রিকোয়েস্টের ইতিহাস থাকবে, তবে এই যানবাহনের সঙ্গে সম্পর্ক বিচ্ছিন্ন হবে।'
              : 'এই তালিকাটি স্থায়ীভাবে মুছে যাবে।'
            : row.is_active
              ? 'এই তালিকাটি পাবলিক ডিরেক্টরি থেকে সরানো হবে; পুরোনো যানবাহন রিকোয়েস্ট অক্ষত থাকবে।'
              : 'তথ্য যাচাই করে তবেই প্রকাশ করুন। সক্রিয় মান কোনো যাচাইকরণ বা প্রাপ্যতার নিশ্চয়তা নয়।'
        }
        confirmLabel={dialog === 'delete' ? 'স্থায়ীভাবে মুছুন' : row.is_active ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
        tone={row.is_active && dialog === 'publish' ? 'danger' : dialog === 'delete' ? 'danger' : 'primary'}
        isLoading={busy}
        onConfirm={confirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
