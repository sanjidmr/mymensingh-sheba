'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Loader2, Power, Trash2 } from 'lucide-react';
import type { AdminServiceListingRow } from '@/lib/admin/queries';
import { deleteAdminServiceListing, setAdminServiceListingActive } from '@/app/admin/actions/service-listings';
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

  return (
    <div className="flex min-w-36 flex-col items-start gap-1.5">
      <Link href={`/admin/catalog/${category}/${row.id}/edit`} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-admin-navy hover:bg-admin-page">
        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
        সম্পাদনা
      </Link>
      <button type="button" onClick={() => setDialog('publish')} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-admin-text hover:bg-admin-page disabled:opacity-60">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Power className="h-3.5 w-3.5" aria-hidden="true" />}
        {row.is_active ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
      </button>
      <button type="button" onClick={() => setDialog('delete')} disabled={busy} className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        মুছুন
      </button>
      {message && <span role="status" className="max-w-56 text-xs text-admin-muted">{message}</span>}
      <ConfirmDialog
        open={dialog !== null}
        title={dialog === 'delete' ? 'তালিকাটি স্থায়ীভাবে মুছবেন?' : row.is_active ? 'তালিকাটি অপ্রকাশিত করবেন?' : 'তালিকাটি প্রকাশ করবেন?'}
        description={
          dialog === 'delete'
            ? category === 'vehicle'
              ? 'যানবাহন রিকোয়েস্ট যুক্ত থাকলে সেগুলোর সম্পর্ক রক্ষায় মুছে ফেলা বন্ধ হবে; সেক্ষেত্রে অপ্রকাশিত করুন।'
              : 'এই তালিকাটি স্থায়ীভাবে মুছে যাবে; কোনো গ্রাহক রিকোয়েস্ট এতে সংযুক্ত নেই।'
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
