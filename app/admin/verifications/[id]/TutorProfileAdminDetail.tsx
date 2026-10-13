'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Pencil, Save, ShieldCheck, XCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { DetailField, PageHeader, Panel } from '@/components/admin/PageHeader';
import { AdminNotice } from '@/components/admin/States';
import { editTutorProfile, moderateTutorProfile, type TutorProfileEdit } from '@/app/admin/actions/tutors';
import { formatDateTime } from '@/lib/admin/format';
import { getAreaById } from '@/lib/locations';
import type { TutorProfileStatus } from '@/lib/supabase/types';

type ProfileRow = Record<string, unknown>;
type Education = { institution?: string; department?: string; degree?: string; status?: string; year?: string };
type Activity = { roleLabelBn?: string; studyingAt?: string; teachingAt?: string; workingAt?: string; note?: string };

const statusLabel: Record<TutorProfileStatus, string> = {
  draft: 'খসড়া',
  pending_approval: 'পর্যালোচনায়',
  approved: 'প্রকাশিত',
  rejected: 'প্রত্যাখ্যাত',
  paused: 'বিরতি',
  suspended: 'স্থগিত',
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function number(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function educationList(value: unknown): Education[] {
  return Array.isArray(value) ? value.filter((item): item is Education => Boolean(item && typeof item === 'object')) : [];
}

function currentActivity(value: unknown): Activity | undefined {
  return value && typeof value === 'object' ? value as Activity : undefined;
}

function splitLines(value: string): string[] {
  return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

export default function TutorProfileAdminDetail({ row }: { row: ProfileRow }) {
  const router = useRouter();
  const id = text(row.id);
  const status = text(row.status) as TutorProfileStatus;
  const educations = educationList(row.educations);
  const activity = currentActivity(row.current_activity);
  const areas = stringList(row.preferred_areas).map((areaId) => getAreaById(areaId)?.nameBn || areaId);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [nextStatus, setNextStatus] = useState<TutorProfileStatus | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState<TutorProfileEdit>(() => ({
    fullName: text(row.full_name),
    institution: text(row.institution),
    department: text(row.department),
    qualification: text(row.qualification),
    experienceYears: number(row.experience_years),
    preferredAreas: stringList(row.preferred_areas),
    preferredClasses: stringList(row.preferred_classes),
    preferredSubjects: stringList(row.preferred_subjects),
    expectedSalaryMin: number(row.expected_salary_min),
    expectedSalaryMax: number(row.expected_salary_max),
    daysPerWeek: number(row.days_per_week) || 1,
    classDurationMinutes: row.class_duration_minutes == null ? null : number(row.class_duration_minutes),
    preferredStudentType: text(row.preferred_student_type),
    bio: text(row.bio),
  }));

  const photo = text(row.profile_photo_url);
  const profileStatus = statusLabel[status] ?? status;
  const educationRows = useMemo(() => {
    if (educations.length) return educations;
    if (text(row.qualification) || text(row.institution)) {
      return [{ degree: text(row.qualification), institution: text(row.institution), department: text(row.department) }];
    }
    return [];
  }, [educations, row]);

  const requestStatus = (value: TutorProfileStatus) => {
    setError('');
    setMessage('');
    setNextStatus(value);
    setConfirmOpen(true);
  };

  const confirmStatus = async () => {
    if (!nextStatus) return;
    setBusy(true);
    setError('');
    const result = await moderateTutorProfile({
      id,
      status: nextStatus,
      reason: nextStatus === 'rejected' ? reason : undefined,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConfirmOpen(false);
    setMessage(result.message || 'প্রোফাইলের অবস্থা সংরক্ষিত হয়েছে।');
    router.refresh();
  };

  const saveProfile = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await editTutorProfile(id, form);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
    setMessage(result.message || 'প্রোফাইলের তথ্য সংরক্ষিত হয়েছে।');
    router.refresh();
  };

  const update = <K extends keyof TutorProfileEdit>(key: K, value: TutorProfileEdit[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <PageHeader
        title={text(row.full_name) || 'গৃহশিক্ষক প্রোফাইল'}
        description="শিক্ষকের তথ্য, ব্যক্তিগত যোগাযোগ এবং মডারেশন অবস্থা।"
        count={`প্রোফাইল ID: ${id}`}
        actions={<span className="rounded-full border border-admin-border bg-white px-3 py-2 text-xs font-semibold text-admin-text">{profileStatus}</span>}
      />
      {error && <AdminNotice tone="danger" title="কাজটি সম্পন্ন হয়নি">{error}</AdminNotice>}
      {message && <AdminNotice tone="success">{message}</AdminNotice>}

      <Panel title="মডারেশন" description={`বর্তমান অবস্থা: ${profileStatus}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-admin-text sm:col-span-2">
            প্রত্যাখ্যান / সংশোধনের কারণ
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={2} className="mt-1 w-full rounded-lg border border-admin-border bg-white p-3 text-sm font-normal" placeholder="টিউটর যে কারণটি দেখতে পাবেন…" />
          </label>
          <button type="button" disabled={busy || status === 'approved'} onClick={() => requestStatus('approved')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> অনুমোদন ও প্রকাশ
          </button>
          <button type="button" disabled={busy || !reason.trim()} onClick={() => requestStatus('rejected')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 disabled:opacity-50">
            <XCircle className="h-4 w-4" aria-hidden="true" /> সংশোধন / প্রত্যাখ্যান
          </button>
          {status !== 'paused' && status !== 'suspended' && (
            <button type="button" disabled={busy} onClick={() => requestStatus('paused')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-admin-border bg-white px-4 text-sm font-semibold text-admin-text disabled:opacity-50">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> সাময়িক বিরতি
            </button>
          )}
          {status !== 'suspended' && (
            <button type="button" disabled={busy} onClick={() => requestStatus('suspended')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 text-sm font-semibold text-rose-700 disabled:opacity-50">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" /> স্থগিত করুন
            </button>
          )}
          {(status === 'paused' || status === 'suspended' || status === 'rejected') && (
            <button type="button" disabled={busy} onClick={() => requestStatus('pending_approval')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-admin-border bg-white px-4 text-sm font-semibold text-admin-text disabled:opacity-50">
              পুনরায় পর্যালোচনায় পাঠান
            </button>
          )}
        </div>
      </Panel>

      <Panel
        title="প্রোফাইলের বিবরণ"
        actions={
          editing ? (
            <div className="flex gap-2">
              <button type="button" disabled={busy} onClick={() => setEditing(false)} className="min-h-10 rounded-lg border border-admin-border px-3 text-xs font-semibold text-admin-text">বাতিল</button>
              <button type="button" disabled={busy} onClick={saveProfile} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-admin-navy px-3 text-xs font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-admin-border bg-white px-3 text-xs font-semibold text-admin-text"><Pencil className="h-4 w-4" />তথ্য সম্পাদনা</button>
          )
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-admin-page">
            {photo && <Image src={photo} alt="" fill sizes="64px" unoptimized className="object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="break-words text-base font-bold text-admin-text">{text(row.full_name)}</p>
            <p className="break-all font-mono text-[11px] text-admin-muted">{id}</p>
            <p className="text-xs text-admin-muted">জমা: {formatDateTime(text(row.created_at))} · হালনাগাদ: {formatDateTime(text(row.updated_at))}</p>
          </div>
        </div>
        {editing ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              ['fullName', 'নাম'],
              ['institution', 'প্রতিষ্ঠান'],
              ['department', 'বিভাগ / বিষয়'],
              ['qualification', 'যোগ্যতা'],
            ] as const).map(([key, label]) => (
              <label key={key} className="text-xs font-semibold text-admin-muted">{label}<input value={form[key]} onChange={(event) => update(key, event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            ))}
            <label className="text-xs font-semibold text-admin-muted">অভিজ্ঞতা (বছর)<input type="number" min={0} max={60} value={form.experienceYears} onChange={(event) => update('experienceYears', Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            <label className="text-xs font-semibold text-admin-muted">সপ্তাহে দিন<input type="number" min={1} max={7} value={form.daysPerWeek} onChange={(event) => update('daysPerWeek', Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            <label className="text-xs font-semibold text-admin-muted">সর্বনিম্ন বেতন<input type="number" min={0} value={form.expectedSalaryMin} onChange={(event) => update('expectedSalaryMin', Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            <label className="text-xs font-semibold text-admin-muted">সর্বোচ্চ বেতন<input type="number" min={0} value={form.expectedSalaryMax} onChange={(event) => update('expectedSalaryMax', Number(event.target.value))} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            <label className="text-xs font-semibold text-admin-muted">ক্লাসের সময় (মিনিট)<input type="number" min={15} max={480} value={form.classDurationMinutes ?? ''} onChange={(event) => update('classDurationMinutes', event.target.value ? Number(event.target.value) : null)} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            <label className="text-xs font-semibold text-admin-muted">পছন্দের শিক্ষার্থী<input value={form.preferredStudentType ?? ''} onChange={(event) => update('preferredStudentType', event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm text-admin-text" /></label>
            {([
              ['preferredAreas', 'পছন্দের এলাকা (প্রতি লাইনে একটি)'],
              ['preferredClasses', 'শ্রেণি (প্রতি লাইনে একটি)'],
              ['preferredSubjects', 'বিষয় (প্রতি লাইনে একটি)'],
            ] as const).map(([key, label]) => (
              <label key={key} className="text-xs font-semibold text-admin-muted">{label}<textarea rows={3} value={form[key].join('\n')} onChange={(event) => update(key, splitLines(event.target.value))} className="mt-1 w-full rounded-lg border border-admin-border bg-white p-3 text-sm text-admin-text" /></label>
            ))}
            <label className="text-xs font-semibold text-admin-muted sm:col-span-2">পরিচিতি<textarea rows={4} value={form.bio ?? ''} onChange={(event) => update('bio', event.target.value)} className="mt-1 w-full rounded-lg border border-admin-border bg-white p-3 text-sm text-admin-text" /></label>
          </div>
        ) : (
          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="যোগ্যতা">{text(row.qualification) || '—'}</DetailField>
            <DetailField label="প্রতিষ্ঠান">{text(row.institution) || '—'}</DetailField>
            <DetailField label="বিভাগ">{text(row.department) || '—'}</DetailField>
            <DetailField label="অভিজ্ঞতা">{number(row.experience_years).toLocaleString('bn-BD')} বছর</DetailField>
            <DetailField label="বেতন">৳{number(row.expected_salary_min).toLocaleString('bn-BD')}–৳{number(row.expected_salary_max).toLocaleString('bn-BD')}</DetailField>
            <DetailField label="পছন্দের এলাকা">{areas.join(' · ') || '—'}</DetailField>
            <DetailField label="শ্রেণি">{stringList(row.preferred_classes).join(' · ') || '—'}</DetailField>
            <DetailField label="বিষয়">{stringList(row.preferred_subjects).join(' · ') || '—'}</DetailField>
            <DetailField label="পছন্দের শিক্ষার্থী">{text(row.preferred_student_type) || '—'}</DetailField>
            <DetailField label="ক্লাসের সময়">{row.class_duration_minutes ? `${number(row.class_duration_minutes).toLocaleString('bn-BD')} মিনিট` : '—'}</DetailField>
            <DetailField label="সপ্তাহে দিন">{number(row.days_per_week).toLocaleString('bn-BD')}</DetailField>
            <DetailField label="পড়ানোর মাধ্যম">{text(row.teaching_mode) || '—'} · {text(row.availability) || '—'}</DetailField>
            <DetailField label="প্রোফাইলের ফোন">{text(row.private_phone) || '—'}</DetailField>
            <DetailField label="NID">{text(row.nid_number) || '—'}</DetailField>
            <DetailField label="পরিচিতি" wide>{text(row.bio) || '—'}</DetailField>
          </dl>
        )}
      </Panel>

      {educationRows.length > 0 && (
        <Panel title="শিক্ষাগত যোগ্যতার ইতিহাস">
          <ul className="space-y-3">
            {educationRows.map((education, index) => (
              <li key={`${education.degree}-${index}`} className="rounded-lg border border-admin-border bg-admin-page p-3">
                <p className="text-sm font-semibold text-admin-text">{education.degree || 'যোগ্যতা'}{education.status ? ` · ${education.status}` : ''}</p>
                <p className="mt-1 text-xs text-admin-muted">{[education.institution, education.department, education.year].filter(Boolean).join(' · ') || '—'}</p>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {activity && Object.values(activity).some(Boolean) && (
        <Panel title="বর্তমান কাজ / পড়াশোনা">
          <dl className="grid gap-4 sm:grid-cols-2">
            {activity.roleLabelBn && <DetailField label="ভূমিকা">{activity.roleLabelBn}</DetailField>}
            {activity.studyingAt && <DetailField label="পড়াশোনা">{activity.studyingAt}</DetailField>}
            {activity.teachingAt && <DetailField label="পড়ানো">{activity.teachingAt}</DetailField>}
            {activity.workingAt && <DetailField label="কর্মস্থল">{activity.workingAt}</DetailField>}
            {activity.note && <DetailField label="অতিরিক্ত তথ্য" wide>{activity.note}</DetailField>}
          </dl>
        </Panel>
      )}
      {text(row.admin_notes) && <Panel title="অ্যাডমিন নোট"><p className="whitespace-pre-wrap text-sm text-admin-text">{text(row.admin_notes)}</p></Panel>}
      {text(row.rejection_reason) && <Panel title="টিউটরকে জানানো সংশোধনের কারণ"><p className="whitespace-pre-wrap text-sm text-admin-text">{text(row.rejection_reason)}</p></Panel>}

      <ConfirmDialog
        open={confirmOpen}
        title={nextStatus === 'approved' ? 'প্রোফাইল অনুমোদন করবেন?' : nextStatus === 'rejected' ? 'সংশোধন / প্রত্যাখ্যান নিশ্চিত করবেন?' : 'প্রোফাইলের অবস্থা পরিবর্তন করবেন?'}
        description={nextStatus === 'rejected' ? `কারণ: ${reason}` : `এই প্রোফাইলের অবস্থা “${nextStatus ? statusLabel[nextStatus] : ''}” হবে।`}
        confirmLabel={nextStatus === 'approved' ? 'অনুমোদন ও প্রকাশ' : 'নিশ্চিত করুন'}
        tone={nextStatus === 'approved' ? 'primary' : 'danger'}
        isLoading={busy}
        onConfirm={confirmStatus}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
