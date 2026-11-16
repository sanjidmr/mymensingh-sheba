'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus } from 'lucide-react';
import type { AdminStaffListRow } from '@/lib/admin/queries';
import { adjustStaffCompletedJobs } from '@/app/admin/actions/staff';
import { useToast } from '@/components/admin/ToastProvider';

export default function StaffCompletedJobsControl({ profile }: { profile: AdminStaffListRow }) {
  const router = useRouter();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const count = Number(profile.completed_job_count ?? 0);

  const adjust = async (delta: -1 | 1) => {
    setBusy(true);
    try {
      const result = await adjustStaffCompletedJobs(profile.id, delta);
      if (!result.ok) {
        notify('error', 'কাজের সংখ্যা পরিবর্তন হয়নি', result.error);
        return;
      }
      notify('success', result.message ?? 'কাজের সংখ্যা আপডেট হয়েছে।');
      router.refresh();
    } catch (error) {
      notify('error', 'কাজের সংখ্যা পরিবর্তন হয়নি', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1 whitespace-nowrap">
      <button
        type="button"
        onClick={() => void adjust(-1)}
        disabled={busy || count === 0}
        aria-label={`${profile.name_bn} এর সম্পন্ন কাজ এক কমান`}
        title="একটি কাজ কমান"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-admin-border text-admin-muted hover:bg-admin-page disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Minus className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <span className="min-w-6 text-center font-semibold tabular-nums">{count.toLocaleString('bn-BD')}</span>
      <button
        type="button"
        onClick={() => void adjust(1)}
        disabled={busy}
        aria-label={`${profile.name_bn} এর সম্পন্ন কাজ এক বাড়ান`}
        title="একটি কাজ বাড়ান"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-admin-border text-admin-navy hover:bg-admin-page disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
    </div>
  );
}
