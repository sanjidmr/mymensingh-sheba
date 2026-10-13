'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Pencil, PauseCircle, RotateCcw, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import { updateDonorProfile } from '@/app/admin/actions/donor-profiles';
import type { DonorProfileUpdate } from '@/app/admin/actions/donor-profiles';
import type { AdminBloodDonorRow } from '@/lib/admin/queries';
import type { BloodDonorStatus, BloodGroup } from '@/lib/supabase/types';

type DonorProfile = AdminBloodDonorRow & { admin_notes: string | null };

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const fieldClass =
  'min-h-11 w-full rounded-lg border border-admin-border bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export default function DonorProfileActions({ donor }: { donor: DonorProfile }) {
  const router = useRouter();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<BloodDonorStatus | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState({
    fullName: donor.full_name,
    bloodGroup: donor.blood_group as BloodGroup,
    areaId: donor.area_id,
    gender: donor.gender as 'male' | 'female',
    birthYear: donor.birth_year == null ? '' : String(donor.birth_year),
    weightKg: donor.weight_kg == null ? '' : String(donor.weight_kg),
    lastDonationDate: donor.last_donation_date ?? '',
    donationCount: String(donor.donation_count),
    intro: donor.intro ?? '',
    adminNotes: donor.admin_notes ?? '',
    isAvailable: donor.is_available,
    isVerified: donor.is_verified,
  });

  const save = async (patch: DonorProfileUpdate) => {
    setBusy(true);
    try {
      const result = await updateDonorProfile(donor.id, patch);
      if (!result.ok) {
        notify('error', 'পরিবর্তন সংরক্ষণ হয়নি', result.error);
        return false;
      }
      notify('success', result.message ?? 'পরিবর্তন সংরক্ষিত হয়েছে।');
      setConfirmStatus(null);
      setEditing(false);
      router.refresh();
      return true;
    } catch (error) {
      notify('error', 'পরিবর্তন সংরক্ষণ হয়নি', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await save({
      fullName: form.fullName,
      bloodGroup: form.bloodGroup,
      areaId: form.areaId,
      gender: form.gender,
      birthYear: form.birthYear ? Number(form.birthYear) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      lastDonationDate: form.lastDonationDate || null,
      donationCount: Number(form.donationCount),
      intro: form.intro,
      adminNotes: form.adminNotes,
      isAvailable: form.isAvailable,
      isVerified: form.isVerified,
    });
  };

  const confirmAction = async () => {
    if (!confirmStatus) return;
    if (confirmStatus === 'rejected') {
      if (!rejectReason.trim()) {
        notify('error', 'কারণ প্রয়োজন', 'প্রত্যাখ্যানের কারণ লিখুন।');
        return;
      }
      await save({ status: confirmStatus, rejectionReason: rejectReason });
      setRejectReason('');
      return;
    }
    const patch: DonorProfileUpdate = { status: confirmStatus };
    if (confirmStatus === 'approved') patch.isAvailable = true;
    if (confirmStatus === 'paused' || confirmStatus === 'suspended') patch.isAvailable = false;
    await save(patch);
  };

  const field = (label: string, _key: keyof typeof form, input: ReactNode) => (
    <label className="grid gap-1.5 text-xs font-semibold text-ink-700">
      {label}
      {input}
    </label>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold text-ink-700 hover:bg-mist-50"
        >
          <Pencil className="h-4 w-4" /> {editing ? 'সম্পাদনা বন্ধ' : 'তথ্য সম্পাদনা'}
        </button>
        {donor.status !== 'approved' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmStatus('approved')}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> অনুমোদন ও প্রকাশ
          </button>
        )}
        {donor.status === 'approved' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmStatus('paused')}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800 disabled:opacity-50"
          >
            <PauseCircle className="h-4 w-4" /> বিরতিতে রাখুন
          </button>
        )}
        {donor.status !== 'rejected' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmStatus('rejected')}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" /> প্রত্যাখ্যান
          </button>
        )}
        {donor.status === 'rejected' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmStatus('pending_approval')}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-admin-border bg-white px-3 text-sm font-semibold text-ink-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" /> পর্যালোচনায় ফেরান
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={submitEdit} className="grid gap-4 rounded-xl border border-admin-border bg-white p-4 sm:grid-cols-2">
          {field('নাম', 'fullName', (
            <input required maxLength={120} className={fieldClass} value={form.fullName}
              onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
          ))}
          {field('রক্তের গ্রুপ', 'bloodGroup', (
            <select className={fieldClass} value={form.bloodGroup}
              onChange={(event) => setForm({ ...form, bloodGroup: event.target.value as BloodGroup })}>
              {BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}
            </select>
          ))}
          {field('এলাকা আইডি', 'areaId', (
            <input required maxLength={100} className={fieldClass} value={form.areaId}
              onChange={(event) => setForm({ ...form, areaId: event.target.value })} />
          ))}
          {field('লিঙ্গ', 'gender', (
            <select className={fieldClass} value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value as 'male' | 'female' })}>
              <option value="male">পুরুষ</option><option value="female">নারী</option>
            </select>
          ))}
          {field('জন্মসাল', 'birthYear', (
            <input type="number" min={1900} max={new Date().getFullYear()} className={fieldClass} value={form.birthYear}
              onChange={(event) => setForm({ ...form, birthYear: event.target.value })} />
          ))}
          {field('ওজন (কেজি)', 'weightKg', (
            <input type="number" min={1} max={500} step="0.1" className={fieldClass} value={form.weightKg}
              onChange={(event) => setForm({ ...form, weightKg: event.target.value })} />
          ))}
          {field('সর্বশেষ রক্তদানের তারিখ', 'lastDonationDate', (
            <input type="date" className={fieldClass} value={form.lastDonationDate}
              onChange={(event) => setForm({ ...form, lastDonationDate: event.target.value })} />
          ))}
          {field('রক্তদানের সংখ্যা', 'donationCount', (
            <input type="number" min={0} max={1000} className={fieldClass} value={form.donationCount}
              onChange={(event) => setForm({ ...form, donationCount: event.target.value })} />
          ))}
          {field('পরিচিতি', 'intro', (
            <textarea maxLength={1000} rows={3} className={fieldClass} value={form.intro}
              onChange={(event) => setForm({ ...form, intro: event.target.value })} />
          ))}
          {field('অ্যাডমিন নোট', 'adminNotes', (
            <textarea maxLength={1000} rows={3} className={fieldClass} value={form.adminNotes}
              onChange={(event) => setForm({ ...form, adminNotes: event.target.value })} />
          ))}
          <div className="flex flex-wrap gap-5 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} />
              রক্তদাতা বর্তমানে উপলভ্য
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={form.isVerified} onChange={(event) => setForm({ ...form, isVerified: event.target.checked })} />
              তথ্য যাচাই সম্পন্ন
            </label>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" disabled={busy} onClick={() => setEditing(false)} className="min-h-10 rounded-lg px-3 text-sm text-ink-600">বাতিল</button>
            <button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'সংরক্ষণ হচ্ছে…' : 'পরিবর্তন সংরক্ষণ'}
            </button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={confirmStatus !== null}
        title={confirmStatus === 'approved' ? 'প্রোফাইল অনুমোদন করবেন?' : confirmStatus === 'rejected' ? 'প্রোফাইল প্রত্যাখ্যান করবেন?' : confirmStatus === 'paused' ? 'প্রোফাইল বিরতিতে রাখবেন?' : 'পর্যালোচনায় ফেরাবেন?'}
        description={
          confirmStatus === 'rejected' ? (
            <label className="mt-2 grid gap-2 text-sm">
              কারণ (আবশ্যক)
              <textarea rows={3} maxLength={500} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)}
                className="w-full rounded-lg border border-admin-border px-3 py-2" />
            </label>
          ) : confirmStatus === 'approved'
            ? 'প্রোফাইলটি পাবলিক ডিরেক্টরিতে প্রকাশিত হবে এবং উপলভ্য হিসেবে চিহ্নিত হবে।'
            : confirmStatus === 'paused'
              ? 'প্রোফাইলটি পাবলিক ডিরেক্টরি থেকে সরবে এবং উপলভ্যতা বন্ধ হবে।'
              : 'প্রোফাইলটি আবার মডারেশন কিউতে যাবে।'
        }
        confirmLabel="নিশ্চিত করুন"
        tone={confirmStatus === 'rejected' || confirmStatus === 'paused' ? 'danger' : 'primary'}
        isLoading={busy}
        onConfirm={() => void confirmAction()}
        onCancel={() => { setConfirmStatus(null); setRejectReason(''); }}
      />
    </section>
  );
}
