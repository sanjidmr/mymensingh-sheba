'use client';

/**
 * OwnerCoachingSections — the coaching-only editors an owner uses after the
 * listing itself is saved: teachers and batch announcements.
 *
 * It mirrors the admin `ListingSubEntities` UX but talks to the owner-scoped
 * service functions, and RLS on the parent row is what actually authorises each
 * write. A batch has no expiry control on purpose: an announcement stays visible
 * and editable until the owner deactivates or deletes it, which is the "still
 * editable after two days" requirement.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  createOwnCoachingBatch,
  createOwnCoachingTeacher,
  deleteOwnCoachingBatch,
  deleteOwnCoachingTeacher,
  fetchOwnCoachingBatches,
  fetchOwnCoachingTeachers,
  updateOwnCoachingBatch,
  updateOwnCoachingTeacher,
} from '@/lib/catalog-service';
import {
  bnDate,
  coachingTimeRange,
  coachingWeekdayLabel,
  COACHING_WEEKDAY_GROUPS,
  COACHING_SUBJECTS,
  tagLabel,
  type CoachingBatch,
  type CoachingTeacher,
} from '@/lib/catalog-types';

const inputClass =
  'min-h-11 w-full rounded-lg border border-brand-200 bg-white px-3 text-[14px] text-ink-900 focus:border-brand-500 focus:outline-none';
const textAreaClass =
  'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-[14px] leading-relaxed text-ink-900 focus:border-brand-500 focus:outline-none';
const primaryBtn =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-3 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-60';
const ghostBtn =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-[13px] font-bold text-brand-700 transition-colors hover:bg-mist-50';

function Message({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] font-semibold text-rose-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12.5px] font-semibold text-emerald-800">
          {notice}
        </p>
      )}
    </>
  );
}

function TeachersEditor({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<CoachingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await fetchOwnCoachingTeachers(listingId, true));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'শিক্ষকের তালিকা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchOwnCoachingTeachers(listingId, true);
        if (active) {
          setRows(data);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'শিক্ষকের তালিকা লোড করা যায়নি।');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
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
    const payload = { nameBn: name, subjects, qualificationBn: qualification, experienceBn: experience };
    const result = editingId
      ? await updateOwnCoachingTeacher(editingId, payload)
      : await createOwnCoachingTeacher(listingId, { ...payload, sortOrder: rows.length });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice('শিক্ষকের তথ্য সংরক্ষিত হয়েছে। তালিকাটি পুনরায় অনুমোদনের জন্য জমা হয়েছে।');
    reset();
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('শিক্ষকের তথ্য মুছে ফেলবেন?')) return;
    setBusy(true);
    setError('');
    const result = await deleteOwnCoachingTeacher(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (editingId === id) reset();
    setNotice('শিক্ষক মুছে ফেলা হয়েছে। তালিকাটি পুনরায় অনুমোদনের জন্য জমা হয়েছে।');
    await load();
  };

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
      <h2 className="text-[14px] font-extrabold text-ink-900">শিক্ষকমণ্ডলী</h2>
      <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-ink-400">
        নাম, বিষয় ও যোগ্যতা কেবল জানা থাকলে লিখুন। অনুমান করে লিখবেন না।
      </p>
      <Message error={error} notice={notice} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">শিক্ষকের নাম *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">যোগ্যতা / ডিগ্রি</span>
          <input value={qualification} onChange={(e) => setQualification(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">অভিজ্ঞতা</span>
          <input value={experience} onChange={(e) => setExperience(e.target.value)} className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">বিষয়</span>
          <div className="flex flex-wrap gap-1.5">
            {COACHING_SUBJECTS.map((s) => {
              const checked = subjects.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setSubjects((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]))
                  }
                  aria-pressed={checked}
                  className={`min-h-9 rounded-full border px-3 text-[12px] font-semibold transition-colors ${
                    checked ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-ink-600 hover:bg-mist-50'
                  }`}
                >
                  {s.labelBn}
                </button>
              );
            })}
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
          <p className="flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-200 px-3 py-4 text-center text-[12.5px] text-ink-500">
            এখনো কোনো শিক্ষক যোগ করা হয়নি।
          </p>
        ) : (
          rows.map((t) => (
            <div key={t.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-brand-100 p-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink-900">{t.nameBn}</p>
                {t.subjects.length > 0 && (
                  <p className="mt-0.5 text-[12px] text-ink-500">বিষয়: {t.subjects.map(tagLabel).join(', ')}</p>
                )}
                {t.qualificationBn && <p className="text-[12px] text-ink-500">যোগ্যতা: {t.qualificationBn}</p>}
                {t.experienceBn && <p className="text-[12px] text-ink-500">অভিজ্ঞতা: {t.experienceBn}</p>}
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
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-brand-200 px-2 text-[12px] font-bold text-brand-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                </button>
                <button
                  type="button"
                  onClick={() => void remove(t.id)}
                  disabled={busy}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-brand-200 px-2 text-[12px] font-bold text-rose-700 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function BatchesEditor({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<CoachingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [weekdayIds, setWeekdayIds] = useState<CoachingBatch['weekdayIds']>([]);
  const [startTimeLocal, setStartTimeLocal] = useState('');
  const [endTimeLocal, setEndTimeLocal] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await fetchOwnCoachingBatches(listingId, true));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ব্যাচের তালিকা লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchOwnCoachingBatches(listingId, true);
        if (active) {
          setRows(data);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'ব্যাচের তালিকা লোড করা যায়নি।');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [listingId]);

  const reset = () => {
    setEditingId(null);
    setStartDate('');
    setWeekdayIds([]);
    setStartTimeLocal('');
    setEndTimeLocal('');
    setNote('');
    setIsActive(true);
  };

  const commit = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    const payload = {
      titleBn: 'নতুন ব্যাচ',
      startDate,
      weekdayIds,
      startTimeLocal,
      endTimeLocal,
      noteBn: note,
      isActive,
    };
    const result = editingId
      ? await updateOwnCoachingBatch(editingId, payload)
      : await createOwnCoachingBatch(listingId, payload);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice('ব্যাচের তথ্য সংরক্ষিত হয়েছে। তালিকাটি পুনরায় অনুমোদনের জন্য জমা হয়েছে।');
    reset();
    await load();
  };

  const toggleActive = async (batch: CoachingBatch) => {
    setBusy(true);
    setError('');
    const result = await updateOwnCoachingBatch(batch.id, { isActive: !batch.isActive });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice('ব্যাচের প্রকাশনা হালনাগাদ হয়েছে। তালিকাটি পুনরায় অনুমোদনের জন্য জমা হয়েছে।');
    await load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('ব্যাচটি মুছে ফেলবেন?')) return;
    setBusy(true);
    setError('');
    const result = await deleteOwnCoachingBatch(id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (editingId === id) reset();
    setNotice('ব্যাচ মুছে ফেলা হয়েছে। তালিকাটি পুনরায় অনুমোদনের জন্য জমা হয়েছে।');
    await load();
  };

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
      <h2 className="text-[14px] font-extrabold text-ink-900">নতুন ব্যাচের সময়সূচি</h2>
      <p className="mb-3 mt-1 text-[11.5px] leading-relaxed text-ink-400">
        ব্যাচ শুরুর তারিখ যেকোনো সময় হালনাগাদ করতে পারবেন। পুরোনো ঘোষণা মুছে না দিয়ে
        অপ্রকাশিতও করতে পারেন।
      </p>
      <Message error={error} notice={notice} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">শুরুর তারিখ *</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">শুরুর সময় *</span>
          <input type="time" value={startTimeLocal} onChange={(e) => setStartTimeLocal(e.target.value)} className={inputClass} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">শেষের সময় *</span>
          <input type="time" value={endTimeLocal} onChange={(e) => setEndTimeLocal(e.target.value)} className={inputClass} required />
        </label>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">সপ্তাহের দিন *</span>
          <div className="flex flex-wrap gap-1.5">
            {COACHING_WEEKDAY_GROUPS.map((group) => {
              const selected = group.weekdayIds.every((day) => weekdayIds.includes(day)) &&
                weekdayIds.length === group.weekdayIds.length;
              return (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setWeekdayIds(selected ? [] : group.weekdayIds)}
                  className={`min-h-9 rounded-full border px-3 text-[12px] font-semibold ${
                    selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-ink-600'
                  }`}
                >
                  {group.labelBn}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex min-h-11 items-center gap-2 self-end text-[13px] font-bold text-ink-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-brand-700" />
          {isActive ? 'প্রকাশিত' : 'অপ্রকাশিত'}
        </label>
        <div className="sm:col-span-2">
          <label className="block">
            <span className="mb-1 block text-[12.5px] font-bold text-ink-700">অন্যান্য তথ্য</span>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={textAreaClass} />
          </label>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void commit()} disabled={busy} className={primaryBtn}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {editingId ? 'হালনাগাদ' : 'ব্যাচ যোগ করুন'}
        </button>
        {editingId && (
          <button type="button" onClick={reset} className={ghostBtn}>
            <X className="h-4 w-4" /> বাতিল
          </button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="flex items-center gap-2 text-[12.5px] text-ink-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> লোড হচ্ছে…
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-brand-200 px-3 py-4 text-center text-[12.5px] text-ink-500">
            কোনো ব্যাচ ঘোষণা নেই।
          </p>
        ) : (
          rows.map((b) => (
            <div key={b.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-brand-100 p-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink-900">
                  নতুন ব্যাচ
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${b.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-mist-50 text-ink-500'}`}>
                    {b.isActive ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                  </span>
                </p>
                {b.startDate && <p className="mt-0.5 text-[12px] text-ink-500">শুরু: {bnDate(b.startDate)}</p>}
                {b.weekdayIds.length > 0 && (
                  <p className="text-[12px] text-ink-500">দিন: {coachingWeekdayLabel(b.weekdayIds)}</p>
                )}
                {(b.startTimeLocal || b.startTime) && (
                  <p className="text-[12px] text-ink-500">
                    সময়: {b.startTimeLocal && b.endTimeLocal
                      ? coachingTimeRange(b.startTimeLocal, b.endTimeLocal)
                      : b.startTime}
                  </p>
                )}
                {b.noteBn && <p className="text-[12px] text-ink-500">{b.noteBn}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void toggleActive(b)}
                  disabled={busy}
                  className="inline-flex min-h-9 items-center rounded-md border border-brand-200 px-2 text-[12px] font-bold text-brand-700 disabled:opacity-60"
                >
                  {b.isActive ? 'অপ্রকাশিত করুন' : 'প্রকাশ করুন'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(b.id);
                    setStartDate(b.startDate ?? '');
                    setWeekdayIds(b.weekdayIds);
                    setStartTimeLocal(b.startTimeLocal ?? '');
                    setEndTimeLocal(b.endTimeLocal ?? '');
                    setNote(b.noteBn ?? '');
                    setIsActive(b.isActive);
                  }}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-brand-200 px-2 text-[12px] font-bold text-brand-700"
                >
                  <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                </button>
                <button
                  type="button"
                  onClick={() => void remove(b.id)}
                  disabled={busy}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-brand-200 px-2 text-[12px] font-bold text-rose-700 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" /> মুছুন
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function OwnerCoachingSections({ listingId }: { listingId: string }) {
  return (
    <div className="space-y-4">
      <BatchesEditor listingId={listingId} />
      <TeachersEditor listingId={listingId} />
    </div>
  );
}
