'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { AdminNotice } from '@/components/admin/States';
import { Panel } from '@/components/admin/PageHeader';
import { updateTutorRequest } from '@/app/admin/actions/tutors';
import type { ServiceRequestStatus } from '@/lib/supabase/types';

const REQUEST_STATUSES: Array<{ value: ServiceRequestStatus; label: string }> = [
  { value: 'new', label: 'নতুন' },
  { value: 'submitted', label: 'জমা হয়েছে' },
  { value: 'reviewing', label: 'পর্যালোচনায়' },
  { value: 'assigned', label: 'দায়িত্ব দেওয়া হয়েছে' },
  { value: 'contacted', label: 'যোগাযোগ হয়েছে' },
  { value: 'in_progress', label: 'চলমান' },
  { value: 'completed', label: 'সম্পন্ন' },
  { value: 'cancelled', label: 'বাতিল' },
  { value: 'rejected', label: 'প্রত্যাখ্যাত' },
];

export default function TutorRequestAdminDetail({
  id,
  status: initialStatus,
  adminNotes: initialNotes,
}: {
  id: string;
  status: string;
  adminNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus as ServiceRequestStatus);
  const [adminNotes, setAdminNotes] = useState(initialNotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await updateTutorRequest({ id, status, adminNotes });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message || 'রিকোয়েস্টের অবস্থা সংরক্ষিত হয়েছে।');
    router.refresh();
  };

  return (
    <Panel title="অনুরোধের প্রশাসনিক পর্যালোচনা" description="স্ট্যাটাস পরিবর্তন কোনো ফোনকল, বার্তা বা যোগাযোগ সম্পন্ন হয়েছে বলে প্রমাণ করে না।">
      {error && <AdminNotice tone="danger" title="সংরক্ষণ ব্যর্থ">{error}</AdminNotice>}
      {message && <AdminNotice tone="success">{message}</AdminNotice>}
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
        <label className="text-xs font-semibold text-admin-muted">
          অনুরোধের অবস্থা
          <select value={status} onChange={(event) => setStatus(event.target.value as ServiceRequestStatus)} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text">
            {REQUEST_STATUSES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-admin-muted">
          অভ্যন্তরীণ অ্যাডমিন নোট
          <textarea rows={2} maxLength={2000} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-admin-border bg-white p-3 text-sm font-normal text-admin-text" />
        </label>
        <button type="button" disabled={busy} onClick={save} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-admin-navy px-4 text-sm font-semibold text-white disabled:opacity-50">
          <Save className="h-4 w-4" aria-hidden="true" />{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}
        </button>
      </div>
    </Panel>
  );
}
