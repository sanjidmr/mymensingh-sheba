'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import type { AdminRequestRow, AdminStaffListRow } from '@/lib/admin/queries';
import { SERVICE_REQUEST_STATUSES } from '@/lib/admin/service-request-constants';
import { STAFF_SERVICE_KEYS, type StaffServiceKey } from '@/lib/staff-types';
import { updateHomeServiceRequest } from '@/app/admin/actions/requests';

const STATUS_LABELS: Record<string, string> = {
  new: 'নতুন',
  submitted: 'জমা দেওয়া',
  reviewing: 'পর্যালোচনাধীন',
  assigned: 'কর্মী নির্ধারিত',
  contacted: 'যোগাযোগ হয়েছে',
  in_progress: 'কাজ চলছে',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
  rejected: 'প্রত্যাখ্যাত',
};

export default function HomeServiceRequestEditor({
  request,
  workers,
}: {
  request: AdminRequestRow;
  workers: AdminStaffListRow[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState(request.status);
  const [workerId, setWorkerId] = useState(request.profile_id ?? '');
  const [notes, setNotes] = useState(request.admin_notes ?? '');
  const [quotation, setQuotation] = useState(request.quotation ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supportedAssignment = STAFF_SERVICE_KEYS.includes(request.service_slug as StaffServiceKey);
  const workerOptions = useMemo(() => {
    if (!request.area_id) return workers;
    // A worker with no recorded areas is available everywhere, not nowhere.
    return workers.filter(
      (worker) => worker.areas.length === 0 || worker.areas.includes(request.area_id!)
    );
  }, [request.area_id, workers]);

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const workerChanged = workerId !== (request.profile_id ?? '');
    const result = await updateHomeServiceRequest({
      requestId: request.id,
      status,
      adminNotes: notes,
      quotation,
      ...(supportedAssignment && (workerChanged || status === 'assigned')
        ? { workerId: workerId || null }
        : {}),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message ?? 'রিকোয়েস্ট সংরক্ষিত হয়েছে।');
    router.refresh();
  };

  return (
    <section className="rounded-admin-card border border-admin-border bg-white p-4 sm:p-5">
      <h2 className="text-base font-bold text-admin-text">অবস্থা, কর্মী ও অভ্যন্তরীণ নোট</h2>
      <p className="mt-1 text-sm text-admin-muted">স্ট্যাটাস পরিবর্তন গ্রাহকের রিকোয়েস্ট ট্র্যাকিংয়ে প্রতিফলিত হবে।</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-admin-text">রিকোয়েস্টের অবস্থা</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text">
            {SERVICE_REQUEST_STATUSES.map((value) => (
              <option key={value} value={value}>{STATUS_LABELS[value] ?? value}</option>
            ))}
          </select>
        </label>
        {request.service_slug === 'home-moving' && (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-admin-text">কোটেশন (ঐচ্ছিক)</span>
            <input value={quotation} onChange={(event) => setQuotation(event.target.value)} maxLength={500} className="h-11 w-full rounded-md border border-admin-border px-3 text-sm" placeholder="যেমন: ৳২,৫০০" />
          </label>
        )}
        {supportedAssignment && (
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-admin-text">কর্মী</span>
            <select value={workerId} onChange={(event) => setWorkerId(event.target.value)} className="h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text">
              <option value="">কর্মী নির্ধারিত নয়</option>
              {request.profile_id && !workers.some((worker) => worker.id === request.profile_id) && (
                <option value={request.profile_id}>{request.profile_title ?? 'বর্তমানে নির্ধারিত কর্মী'}</option>
              )}
              {workerOptions.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name_bn} · {worker.title_bn} ({worker.availability === 'limited' ? 'সীমিত' : 'উপলভ্য'})
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-admin-muted">
              কেবল সক্রিয়, ব্যস্ত নন ও একই সেবার কর্মী নির্ধারণ করা যায়। এলাকা লেখা না থাকলে কর্মীকে সব এলাকার জন্য উপযুক্ত ধরা হয়।
            </span>
          </label>
        )}
        {!supportedAssignment && (
          <p className="rounded-md border border-admin-border bg-admin-page p-3 text-sm text-admin-muted sm:col-span-2">
            এই সেবার জন্য উপযুক্ত কর্মী ক্যাটাগরি এখনো ডেটাবেজে নেই; তাই কর্মী নির্ধারণ বন্ধ রাখা হয়েছে।
          </p>
        )}
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-admin-text">অভ্যন্তরীণ নোট (শুধু অ্যাডমিনদের জন্য)</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={5000} rows={4} className="w-full rounded-md border border-admin-border px-3 py-2.5 text-sm" placeholder="অপারেশন-সংক্রান্ত নোট লিখুন" />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={save} disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
          {busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}
        </button>
      </div>
    </section>
  );
}
