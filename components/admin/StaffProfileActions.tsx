'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Loader2, Power, Trash2 } from 'lucide-react';
import type { AdminStaffListRow } from '@/lib/admin/queries';
import { removeStaffProfile, setStaffActive } from '@/app/admin/actions/staff';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

export default function StaffProfileActions({ profile }: { profile: AdminStaffListRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');

  const toggleActive = async () => {
    setBusy(true);
    setMessage('');
    const result = await setStaffActive(profile.id, !profile.is_active);
    setBusy(false);
    setMessage(result.ok ? result.message ?? 'অবস্থা সংরক্ষিত হয়েছে।' : result.error);
    if (result.ok) router.refresh();
  };

  const deleteProfile = async () => {
    setBusy(true);
    const result = await removeStaffProfile(profile.id);
    setBusy(false);
    setConfirmDelete(false);
    setMessage(result.ok ? result.message ?? 'প্রোফাইল মুছে ফেলা হয়েছে।' : result.error);
    if (result.ok) router.refresh();
  };

  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <div className="flex items-center justify-end gap-1">
      <Link href={`/admin/services/${profile.id}/edit`} aria-label="সম্পাদনা" title="সম্পাদনা" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-admin-navy hover:bg-admin-page">
        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
      <button type="button" onClick={toggleActive} disabled={busy} aria-label={profile.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'} title={profile.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-admin-text hover:bg-admin-page disabled:opacity-60">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Power className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} aria-label="প্রোফাইল সরান" title="প্রোফাইল সরান" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50 disabled:opacity-60">
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      </div>
      {message && <span role="status" className="max-w-48 text-xs text-admin-muted">{message}</span>}
      <ConfirmDialog
        open={confirmDelete}
        title="কর্মী প্রোফাইল সরাবেন?"
        description="প্রোফাইলের সঙ্গে কোনো রিকোয়েস্ট যুক্ত থাকলে ইতিহাস রক্ষার জন্য মুছে ফেলা বন্ধ হবে।"
        confirmLabel="প্রোফাইল সরান"
        isLoading={busy}
        onConfirm={deleteProfile}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
