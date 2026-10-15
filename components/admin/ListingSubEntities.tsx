'use client';

/**
 * ListingSubEntities — the admin editors for everything that hangs off a
 * curated listing rather than living on it:
 *
 *   * coaching — teachers and batch announcements
 *   * wifi     — packages (what a visitor actually compares)
 *   * both     — review moderation (publish / unpublish / delete)
 *
 * They are separate from `ServiceListingForm` because they need a listing row
 * that already exists: there is nothing to attach a teacher or a package to
 * until the listing is saved for the first time. The edit page therefore mounts
 * this below the form.
 *
 * Every write goes through `lib/catalog-service`, which re-checks the admin
 * session and lets RLS refuse anything a crafted request tries; the UI never
 * assumes the button it rendered is sufficient authorisation.
 *
 * Batch announcements deliberately have no expiry control: an announcement
 * stays visible and editable until an admin deactivates or deletes it, which is
 * exactly the "still editable after two days" requirement.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { Panel } from '@/components/admin/PageHeader';
import { AdminEmpty, AdminError } from '@/components/admin/States';
import {
  adminCreateCoachingBatch,
  adminCreateCoachingTeacher,
  adminCreateWifiPackage,
  adminDeleteCoachingBatch,
  adminDeleteCoachingTeacher,
  adminDeleteDirectoryReview,
  adminDeleteWifiPackage,
  adminFetchCoachingBatches,
  adminFetchCoachingTeachers,
  adminFetchDirectoryReviews,
  adminFetchWifiPackages,
  adminSetDirectoryReviewPublished,
  adminUpdateCoachingBatch,
  adminUpdateCoachingTeacher,
  adminUpdateWifiPackage,
} from '@/lib/catalog-service';
import {
  COACHING_SUBJECTS,
  bnDate,
  tagLabel,
  toBn,
  type CoachingBatch,
  type CoachingTeacher,
  type DirectoryReview,
  type ServiceCategory,
  type WifiPackage,
} from '@/lib/catalog-types';

const inputClass =
  'h-10 w-full rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text';
const textAreaClass =
  'w-full rounded-md border border-admin-border bg-white px-3 py-2 text-sm text-admin-text';
const primaryBtn =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-admin-navy px-3 text-sm font-semibold text-white disabled:opacity-60';
const ghostBtn =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md border border-admin-border px-3 text-sm font-semibold text-admin-text';

function StarRow({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${toBn(value)} / ৫`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= rounded ? 'h-3.5 w-3.5 fill-amber-400 text-amber-400' : 'h-3.5 w-3.5 text-admin-border'}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-semibold text-admin-text">{label}</span>
      {children}
    </label>
  );
}

function useMessage() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  return { error, notice, setError, setNotice };
}

/* ------------------------------------------------------------------ */
/* Coaching teachers                                                   */
/* ------------------------------------------------------------------ */

function TeachersEditor({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<CoachingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { error, notice, setError, setNotice } = useMessage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');

  const load = useCallback(async () => {
    setRows(await adminFetchCoachingTeachers(listingId));
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await adminFetchCoachingTeachers(listingId);
      if (!active) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const reset = () => {
    setEditingId(null);
    setName('');
    setSubjects([]);
    setQualification('');
    setExperience('');
  };

  const commit = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      nameBn: name,
      subjects,
      qualificationBn: qualification,
      experienceBn: experience,
    };
    const result = editingId
      ? await adminUpdateCoachingTeacher(editingId, payload)
      : await adminCreateCoachingTeacher(listingId, { ...payload, sortOrder: rows.length });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(editingId ? 'শিক্ষকের তথ্য হালনাগাদ হয়েছে।' : 'শিক্ষক যোগ করা হয়েছে।');
    reset();
    await load();
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError('');
    const result = await adminDeleteCoachingTeacher(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (editingId === id) reset();
    setNotice('শিক্ষক মুছে ফেলা হয়েছে।');
    await load();
  };

  return (
    <Panel title="শিক্ষকমণ্ডলী">
      <p className="mb-3 text-xs leading-relaxed text-admin-muted">
        নাম, বিষয় ও যোগ্যতা কেবল সরবরাহকৃত হলে লিখুন। কোনো তথ্য অনুমান করে লিখবেন না।
      </p>
      {error && <AdminError title="সংরক্ষণ ব্যর্থ" message={error} className="mb-3" />}
      {notice && (
        <p role="status" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          {notice}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="শিক্ষকের নাম *">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="যোগ্যতা / ডিগ্রি">
          <input value={qualification} onChange={(e) => setQualification(e.target.value)} className={inputClass} />
        </Field>
        <Field label="অভিজ্ঞতা">
          <input value={experience} onChange={(e) => setExperience(e.target.value)} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold text-admin-text">বিষয়</span>
          <div className="flex flex-wrap gap-2">
            {COACHING_SUBJECTS.map((s) => (
              <label key={s.id} className="inline-flex min-h-9 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={subjects.includes(s.id)}
                  onChange={() =>
                    setSubjects((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]))
                  }
                  className="h-4 w-4 accent-admin-navy"
                />
                {s.labelBn}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void commit()} disabled={busy} className={primaryBtn}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? 'হালনাগাদ' : 'যোগ করুন'}
        </button>
        {editingId && (
          <button type="button" onClick={reset} className={ghostBtn}>
            <X className="h-4 w-4" /> বাতিল
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-admin-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty title="এখনো কোনো শিক্ষক যোগ করা হয়নি" description="উপরের ফর্ম থেকে শিক্ষকের নাম ও বিষয় যোগ করুন।" />
        ) : (
          rows.map((t) => (
            <div key={t.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-admin-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-admin-text">{t.nameBn}</p>
                {t.subjects.length > 0 && (
                  <p className="mt-0.5 text-xs text-admin-muted">বিষয়: {t.subjects.map(tagLabel).join(', ')}</p>
                )}
                {t.qualificationBn && <p className="text-xs text-admin-muted">যোগ্যতা: {t.qualificationBn}</p>}
                {t.experienceBn && <p className="text-xs text-admin-muted">অভিজ্ঞতা: {t.experienceBn}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(t.id);
                    setName(t.nameBn);
                    setSubjects(t.subjects);
                    setQualification(t.qualificationBn ?? '');
                    setExperience(t.experienceBn ?? '');
                  }}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold"
                >
                  <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                </button>
                <button
                  type="button"
                  onClick={() => void remove(t.id)}
                  disabled={busy}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold text-status-danger disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Coaching batches                                                    */
/* ------------------------------------------------------------------ */

function BatchesEditor({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<CoachingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { error, notice, setError, setNotice } = useMessage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setRows(await adminFetchCoachingBatches(listingId));
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await adminFetchCoachingBatches(listingId);
      if (!active) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const reset = () => {
    setEditingId(null);
    setTitle('');
    setStartDate('');
    setStartTime('');
    setNote('');
    setIsActive(true);
  };

  const commit = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      titleBn: title,
      startDate: startDate || undefined,
      startTime,
      noteBn: note,
      isActive,
    };
    const result = editingId
      ? await adminUpdateCoachingBatch(editingId, payload)
      : await adminCreateCoachingBatch(listingId, payload);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(editingId ? 'ব্যাচ হালনাগাদ হয়েছে।' : 'নতুন ব্যাচ যোগ করা হয়েছে।');
    reset();
    await load();
  };

  const toggleActive = async (batch: CoachingBatch) => {
    setBusy(true);
    setError('');
    const result = await adminUpdateCoachingBatch(batch.id, { isActive: !batch.isActive });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(!batch.isActive ? 'ব্যাচ প্রকাশ করা হয়েছে।' : 'ব্যাচ অপ্রকাশিত করা হয়েছে।');
    await load();
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError('');
    const result = await adminDeleteCoachingBatch(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (editingId === id) reset();
    setNotice('ব্যাচ মুছে ফেলা হয়েছে।');
    await load();
  };

  return (
    <Panel title="নতুন ব্যাচের ঘোষণা">
      <p className="mb-3 text-xs leading-relaxed text-admin-muted">
        ঘোষণা জমা দেওয়ার দুই দিন পরেও সম্পাদনাযোগ্য থাকে — কোনো স্বয়ংক্রিয় মেয়াদ শেষ বা মুছে ফেলা হয় না। প্রকাশ বন্ধ করতে চাইলে অপ্রকাশিত করুন।
      </p>
      {error && <AdminError title="সংরক্ষণ ব্যর্থ" message={error} className="mb-3" />}
      {notice && (
        <p role="status" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          {notice}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="ব্যাচের নাম *">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="শুরুর তারিখ">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="শুরুর সময়">
          <input value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} placeholder="যেমন: সকাল ৯টা" />
        </Field>
        <label className="flex min-h-10 items-center gap-2 self-end text-sm font-semibold text-admin-text">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-admin-navy" />
          {isActive ? 'প্রকাশিত' : 'অপ্রকাশিত'}
        </label>
        <div className="sm:col-span-2">
          <Field label="অন্যান্য তথ্য">
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={textAreaClass} />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void commit()} disabled={busy} className={primaryBtn}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? 'হালনাগাদ' : 'যোগ করুন'}
        </button>
        {editingId && (
          <button type="button" onClick={reset} className={ghostBtn}>
            <X className="h-4 w-4" /> বাতিল
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-admin-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty title="কোনো ব্যাচ ঘোষণা নেই" description="উপরের ফর্ম থেকে নতুন ব্যাচের নাম, তারিখ ও সময় যোগ করুন।" />
        ) : (
          rows.map((b) => (
            <div key={b.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-admin-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-admin-text">
                  {b.titleBn}
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] ${b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-admin-page text-admin-muted'}`}>
                    {b.isActive ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-admin-muted">
                  {[bnDate(b.startDate), b.startTime].filter(Boolean).join(' · ') || 'তারিখ/সময় দেওয়া হয়নি'}
                </p>
                {b.noteBn && <p className="text-xs text-admin-muted">{b.noteBn}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void toggleActive(b)} disabled={busy} className="inline-flex h-9 items-center rounded-md border border-admin-border px-2 text-xs font-semibold disabled:opacity-60">
                  {b.isActive ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(b.id);
                    setTitle(b.titleBn);
                    setStartDate(b.startDate ?? '');
                    setStartTime(b.startTime ?? '');
                    setNote(b.noteBn ?? '');
                    setIsActive(b.isActive);
                  }}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold"
                >
                  <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                </button>
                <button type="button" onClick={() => void remove(b.id)} disabled={busy} className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold text-status-danger disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* WiFi packages                                                       */
/* ------------------------------------------------------------------ */

function PackagesEditor({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<WifiPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { error, notice, setError, setNotice } = useMessage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [speed, setSpeed] = useState('');
  const [price, setPrice] = useState('');
  const [offerLabel, setOfferLabel] = useState('');
  const [offerConditions, setOfferConditions] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    setRows(await adminFetchWifiPackages(listingId));
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await adminFetchWifiPackages(listingId);
      if (!active) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const toNum = (value: string) => {
    if (!value.trim()) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  };

  const reset = () => {
    setEditingId(null);
    setName('');
    setSpeed('');
    setPrice('');
    setOfferLabel('');
    setOfferConditions('');
    setIsActive(true);
  };

  const commit = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const speedMbps = toNum(speed);
    const priceValue = toNum(price);
    const payload = {
      nameBn: name,
      speedMbps: speedMbps ?? undefined,
      price: priceValue ?? undefined,
      offerLabelBn: offerLabel,
      offerConditionsBn: offerConditions,
      isActive,
      sortOrder: editingId ? rows.find((r) => r.id === editingId)?.sortOrder ?? 0 : rows.length,
    };
    const result = editingId
      ? await adminUpdateWifiPackage(editingId, payload)
      : await adminCreateWifiPackage(listingId, payload);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(editingId ? 'প্যাকেজ হালনাগাদ হয়েছে।' : 'প্যাকেজ যোগ করা হয়েছে।');
    reset();
    await load();
  };

  const toggleActive = async (pkg: WifiPackage) => {
    setBusy(true);
    setError('');
    const result = await adminUpdateWifiPackage(pkg.id, { isActive: !pkg.isActive });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError('');
    const result = await adminDeleteWifiPackage(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (editingId === id) reset();
    setNotice('প্যাকেজ মুছে ফেলা হয়েছে।');
    await load();
  };

  return (
    <Panel title="প্যাকেজ ও অফার">
      <p className="mb-3 text-xs leading-relaxed text-admin-muted">
        প্রতিটি প্যাকেজের স্পিড, দাম ও অফারের শর্ত আলাদা করে লিখুন। ভিজিটর এই তালিকা পাশাপাশি তুলনা করবে।
      </p>
      {error && <AdminError title="সংরক্ষণ ব্যর্থ" message={error} className="mb-3" />}
      {notice && (
        <p role="status" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          {notice}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="প্যাকেজের নাম *">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="স্পিড (Mbps)">
          <input type="number" min={1} value={speed} onChange={(e) => setSpeed(e.target.value)} className={inputClass} />
        </Field>
        <Field label="মাসিক দাম (৳)">
          <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
        </Field>
        <Field label="অফার / ছাড়">
          <input value={offerLabel} onChange={(e) => setOfferLabel(e.target.value)} className={inputClass} placeholder="যেমন: ২ মাস ফ্রি" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="অফারের শর্ত">
            <textarea rows={2} value={offerConditions} onChange={(e) => setOfferConditions(e.target.value)} className={textAreaClass} />
          </Field>
        </div>
        <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-admin-text">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-admin-navy" />
          {isActive ? 'প্রকাশিত' : 'অপ্রকাশিত'}
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void commit()} disabled={busy} className={primaryBtn}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? 'হালনাগাদ' : 'যোগ করুন'}
        </button>
        {editingId && (
          <button type="button" onClick={reset} className={ghostBtn}>
            <X className="h-4 w-4" /> বাতিল
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-xs text-admin-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <AdminEmpty title="কোনো প্যাকেজ যোগ করা হয়নি" description="উপরের ফর্ম থেকে স্পিড, দাম ও অফার যোগ করুন।" />
        ) : (
          rows.map((p) => (
            <div key={p.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-admin-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-admin-text">
                  {p.nameBn}
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-admin-page text-admin-muted'}`}>
                    {p.isActive ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-admin-muted">
                  {[p.speedMbps != null ? `${toBn(p.speedMbps)} Mbps` : null, p.price != null ? `৳${toBn(p.price)}` : null].filter(Boolean).join(' · ') || 'স্পিড/দাম দেওয়া হয়নি'}
                </p>
                {p.offerLabelBn && <p className="text-xs text-emerald-700">অফার: {p.offerLabelBn}</p>}
                {p.offerConditionsBn && <p className="text-xs text-admin-muted">শর্ত: {p.offerConditionsBn}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void toggleActive(p)} disabled={busy} className="inline-flex h-9 items-center rounded-md border border-admin-border px-2 text-xs font-semibold disabled:opacity-60">
                  {p.isActive ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(p.id);
                    setName(p.nameBn);
                    setSpeed(p.speedMbps != null ? String(p.speedMbps) : '');
                    setPrice(p.price != null ? String(p.price) : '');
                    setOfferLabel(p.offerLabelBn ?? '');
                    setOfferConditions(p.offerConditionsBn ?? '');
                    setIsActive(p.isActive);
                  }}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold"
                >
                  <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                </button>
                <button type="button" onClick={() => void remove(p.id)} disabled={busy} className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold text-status-danger disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Review moderation                                                   */
/* ------------------------------------------------------------------ */

function ReviewsModerator({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<DirectoryReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { error, notice, setError, setNotice } = useMessage();

  const load = useCallback(async () => {
    setRows(await adminFetchDirectoryReviews(listingId));
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await adminFetchDirectoryReviews(listingId);
      if (!active) return;
      setRows(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listingId]);

  const setPublished = async (review: DirectoryReview, publish: boolean) => {
    setBusy(true);
    setError('');
    const result = await adminSetDirectoryReviewPublished(review.id, publish);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice(publish ? 'রিভিউ প্রকাশ করা হয়েছে।' : 'রিভিউ অপ্রকাশিত করা হয়েছে।');
    await load();
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError('');
    const result = await adminDeleteDirectoryReview(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice('রিভিউ মুছে ফেলা হয়েছে।');
    await load();
  };

  return (
    <Panel title="রিভিউ ব্যবস্থাপনা">
      <p className="mb-3 text-xs leading-relaxed text-admin-muted">
        প্রকাশিত রিভিউ থেকেই গড় রেটিং স্বয়ংক্রিয়ভাবে হিসাব হয়। অনুপযুক্ত রিভিউ অপ্রকাশিত বা মুছে ফেলা যায়।
      </p>
      {error && <AdminError title="ব্যর্থ" message={error} className="mb-3" />}
      {notice && (
        <p role="status" className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
          {notice}
        </p>
      )}
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-admin-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…</p>
      ) : rows.length === 0 ? (
        <AdminEmpty title="এখনো কোনো রিভিউ নেই" description="ভিজিটর রেটিং ও মন্তব্য জমা দিলে এখানে দেখা যাবে।" />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-admin-border p-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StarRow value={r.rating} />
                  <span className="text-xs font-semibold text-admin-text">{r.authorName || 'নাম নেই'}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[11px] ${r.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-admin-page text-admin-muted'}`}>
                    {r.isPublished ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                  </span>
                </div>
                {r.commentBn && <p className="mt-1 text-xs leading-relaxed text-admin-muted">{r.commentBn}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void setPublished(r, !r.isPublished)} disabled={busy} className="inline-flex h-9 items-center rounded-md border border-admin-border px-2 text-xs font-semibold disabled:opacity-60">
                  {r.isPublished ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
                </button>
                <button type="button" onClick={() => void remove(r.id)} disabled={busy} className="inline-flex h-9 items-center gap-1 rounded-md border border-admin-border px-2 text-xs font-semibold text-status-danger disabled:opacity-60">
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Manager                                                             */
/* ------------------------------------------------------------------ */

export default function ListingSubEntities({
  category,
  listingId,
}: {
  category: ServiceCategory;
  listingId: string;
}) {
  if (category === 'coaching') {
    return (
      <div className="space-y-4">
        <TeachersEditor listingId={listingId} />
        <BatchesEditor listingId={listingId} />
        <ReviewsModerator listingId={listingId} />
      </div>
    );
  }
  if (category === 'wifi') {
    return (
      <div className="space-y-4">
        <PackagesEditor listingId={listingId} />
        <ReviewsModerator listingId={listingId} />
      </div>
    );
  }
  return null;
}
