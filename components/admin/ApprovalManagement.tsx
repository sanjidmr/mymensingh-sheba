'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, ExternalLink, Loader2, X } from 'lucide-react';
import { moderateToletProfile } from '@/app/admin/actions/approvals';
import { updateDonorProfile } from '@/app/admin/actions/donor-profiles';
import { setPostStatus } from '@/app/admin/actions/posts';
import { moderateAdminServiceListing } from '@/app/admin/actions/service-listings';
import { moderateToletListing } from '@/app/admin/actions/tolet';
import { moderateTutorProfile } from '@/app/admin/actions/tutors';
import type { ActionResult } from '@/lib/admin/actions';
import type { AdminApprovalKind, AdminApprovalRow } from '@/lib/admin/queries';
import { useToast } from '@/components/admin/ToastProvider';

const KIND_LABEL: Record<AdminApprovalKind, string> = {
  post: 'কমিউনিটি পোস্ট',
  tolet_listing: 'বাসা ভাড়া বিজ্ঞাপন',
  tutor_profile: 'গৃহ শিক্ষক প্রোফাইল',
  donor_profile: 'রক্তদাতা প্রোফাইল',
  service_listing: 'সার্ভিস তালিকা',
  tolet_profile: 'বাসা মালিক প্রোফাইল',
};

const SERVICE_LABEL: Record<string, string> = {
  news: 'খবর',
  job: 'চাকরি',
  buy_sell: 'কেনাবেচা',
  flat: 'ফ্ল্যাট',
  room: 'রুম',
  sublet: 'সাবলেট',
  family: 'পরিবার',
  bachelor: 'ব্যাচেলর',
  mess: 'মেস',
  hostel: 'হোস্টেল',
  seat: 'সিট',
  home_tutor: 'গৃহশিক্ষক',
  blood_donor: 'রক্তদাতা',
  tolet_owner: 'বাসা মালিক',
  wifi: 'WiFi',
  coaching: 'কোচিং',
};

function detailHref(row: AdminApprovalRow): string {
  switch (row.approval_kind) {
    case 'post': return `/admin/posts/${row.id}`;
    case 'tolet_listing': return `/admin/tolet/${row.id}`;
    case 'tutor_profile': return `/admin/verifications/${row.id}`;
    case 'donor_profile': return `/admin/blood/donors/${row.id}`;
    case 'tolet_profile': return row.owner_id ? `/admin/users/${row.owner_id}` : '/admin/users';
    case 'service_listing': return `/admin/directories/${row.service_key}?search=${encodeURIComponent(row.id)}`;
  }
}

export default function ApprovalManagement({ rows: initialRows }: { rows: AdminApprovalRow[] }) {
  const router = useRouter();
  const { notify } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [rejecting, setRejecting] = useState<AdminApprovalRow | null>(null);
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const moderate = async (row: AdminApprovalRow, decision: 'approved' | 'rejected', rejectionReason = '') => {
    setBusyId(row.id);
    setError('');
    let result: ActionResult | null = null;
    try {
      switch (row.approval_kind) {
        case 'post':
          result = await setPostStatus(row.id, decision, rejectionReason);
          break;
        case 'tolet_listing':
          result = await moderateToletListing({
            id: row.id,
            status: decision,
            reason: rejectionReason,
            decision: decision === 'rejected' ? 'reject' : undefined,
          });
          break;
        case 'tutor_profile':
          result = await moderateTutorProfile({ id: row.id, status: decision, reason: rejectionReason });
          break;
        case 'donor_profile':
          result = await updateDonorProfile(row.id, {
            status: decision,
            rejectionReason: decision === 'rejected' ? rejectionReason : undefined,
          });
          break;
        case 'service_listing':
          result = await moderateAdminServiceListing(row.id, decision, rejectionReason);
          break;
        case 'tolet_profile':
          result = await moderateToletProfile({ id: row.id, status: decision, reason: rejectionReason });
          break;
      }
    } catch (moderationError) {
      setBusyId(null);
      setError(moderationError instanceof Error ? moderationError.message : 'অনুমোদনের সিদ্ধান্ত সংরক্ষণ করা যায়নি।');
      return;
    }
    setBusyId(null);
    if (!result) {
      setError('এই ধরনের রেকর্ডের জন্য অনুমোদন প্রক্রিয়া নির্ধারিত নেই।');
      return;
    }
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setRows((current) => current.filter((item) => item.id !== row.id || item.approval_kind !== row.approval_kind));
    setRejecting(null);
    setReason('');
    notify('success', result.message || 'সিদ্ধান্ত সংরক্ষণ হয়েছে।');
    router.refresh();
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      setError('প্রত্যাখ্যানের কারণ অন্তত ৫ অক্ষরের মধ্যে লিখুন।');
      return;
    }
    await moderate(rejecting, 'rejected', reason.trim());
  };

  return (
    <>
      {error && <div role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={`${row.approval_kind}:${row.id}`} className="rounded-admin-card border border-admin-border bg-white p-4 shadow-admin-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">{KIND_LABEL[row.approval_kind]}</span>
                  <span className="text-xs text-admin-muted">{SERVICE_LABEL[row.service_key] ?? row.service_key}</span>
                </div>
                <h2 className="break-words text-base font-bold text-admin-text">{row.title}</h2>
                {row.summary && <p className="mt-1 break-words text-sm text-admin-muted">{row.summary}</p>}
                <p className="mt-2 text-xs text-admin-muted">
                  জমাদানকারী: {row.owner_name || 'নাম পাওয়া যায়নি'}
                  {row.owner_phone ? <> · <a className="font-medium text-admin-navy hover:underline" href={`tel:${row.owner_phone}`}>{row.owner_phone}</a></> : null}
                  {' · '}{new Date(row.created_at).toLocaleString('bn-BD')}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Link href={detailHref(row)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-admin-border px-3 text-xs font-semibold text-admin-text hover:bg-admin-page">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> বিস্তারিত
                </Link>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => void moderate(row, 'approved')}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {busyId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" aria-hidden="true" />} অনুমোদন
                </button>
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => { setError(''); setReason(''); setRejecting(row); }}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 disabled:opacity-60"
                >
                  <X className="h-4 w-4" aria-hidden="true" /> প্রত্যাখ্যান
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <form
            className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl"
            onSubmit={(event) => { event.preventDefault(); void confirmReject(); }}
          >
            <h2 className="text-lg font-bold text-admin-text">প্রত্যাখ্যানের কারণ</h2>
            <p className="mt-1 text-sm text-admin-muted">{rejecting.title} — কারণটি সংশ্লিষ্ট ব্যবহারকারীকে জানানো হবে।</p>
            <label htmlFor="approval-rejection-reason" className="mt-4 block text-sm font-semibold text-admin-text">কারণ (কমপক্ষে ৫ অক্ষর)</label>
            <textarea
              id="approval-rejection-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={4}
              required
              className="mt-1.5 w-full rounded-lg border border-admin-border p-3 text-sm outline-none focus:border-admin-navy"
            />
            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={busyId !== null} onClick={() => setRejecting(null)} className="min-h-11 rounded-lg border border-admin-border px-4 text-sm font-semibold">বাতিল</button>
              <button type="submit" disabled={busyId !== null || reason.trim().length < 5} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
                {busyId === rejecting.id && <Loader2 className="h-4 w-4 animate-spin" />} প্রত্যাখ্যান নিশ্চিত করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
