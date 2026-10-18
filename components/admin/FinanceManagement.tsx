'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Plus, Trash2, Wallet } from 'lucide-react';
import { createFinancialRecord, deleteFinancialRecord, updateFinancialRecord } from '@/app/admin/actions/financial-records';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import type { ActionResult } from '@/lib/admin/actions';
import type { AdminFinancialRecord, AdminFinancialService, AdminFinancialSummary } from '@/lib/admin/queries';

const SERVICE_OPTIONS: Array<{ value: AdminFinancialService; label: string }> = [
  { value: 'tolet', label: 'বাসা ভাড়া' },
  { value: 'tutor', label: 'গৃহশিক্ষক' },
  { value: 'blood_donor', label: 'রক্তদাতা' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'coaching', label: 'কোচিং' },
  { value: 'vehicle', label: 'যানবাহন' },
  { value: 'staff', label: 'কর্মী / সেবা' },
  { value: 'other', label: 'অন্যান্য' },
];

interface EntryForm {
  serviceKey: AdminFinancialService;
  incomeAmount: string;
  dueAmount: string;
  recordDate: string;
  notes: string;
}

function amount(value: number | string): string {
  return Number(value || 0).toLocaleString('bn-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function dateLabel(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('bn-BD');
}

function blankForm(today: string): EntryForm {
  return { serviceKey: 'tolet', incomeAmount: '', dueAmount: '', recordDate: today, notes: '' };
}

export default function FinanceManagement({
  records,
  summary,
  today,
}: {
  records: AdminFinancialRecord[];
  summary: AdminFinancialSummary[];
  today: string;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [editing, setEditing] = useState<AdminFinancialRecord | null>(null);
  const [form, setForm] = useState<EntryForm>(() => blankForm(today));
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<AdminFinancialRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const totalIncome = summary.reduce((sum, row) => sum + Number(row.income_total || 0), 0);
  const totalDue = summary.reduce((sum, row) => sum + Number(row.due_total || 0), 0);
  const serviceLabel = (key: string) => SERVICE_OPTIONS.find((item) => item.value === key)?.label ?? key;

  const openNew = () => {
    setEditing(null);
    setForm(blankForm(today));
    setError('');
    setModalOpen(true);
  };

  const openEdit = (record: AdminFinancialRecord) => {
    setEditing(record);
    setForm({
      serviceKey: record.service_key,
      incomeAmount: String(record.income_amount),
      dueAmount: String(record.due_amount),
      recordDate: record.record_date,
      notes: record.notes,
    });
    setError('');
    setModalOpen(true);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const input = {
      serviceKey: form.serviceKey,
      incomeAmount: Number(form.incomeAmount || 0),
      dueAmount: Number(form.dueAmount || 0),
      recordDate: form.recordDate,
      notes: form.notes,
    };
    let result: ActionResult;
    try {
      result = editing
        ? await updateFinancialRecord(editing.id, input)
        : await createFinancialRecord(input);
    } catch (saveError) {
      setBusy(false);
      setError(saveError instanceof Error ? saveError.message : 'হিসাব সংরক্ষণ করা যায়নি।');
      return;
    }
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setModalOpen(false);
    notify('success', result.message ?? 'হিসাব সংরক্ষণ হয়েছে।');
    router.refresh();
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    let result: ActionResult;
    try {
      result = await deleteFinancialRecord(deleting.id);
    } catch (deleteError) {
      setBusy(false);
      setError(deleteError instanceof Error ? deleteError.message : 'হিসাব মুছে ফেলা যায়নি।');
      setDeleting(null);
      return;
    }
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setDeleting(null);
      return;
    }
    setDeleting(null);
    notify('success', result.message ?? 'হিসাব মুছে ফেলা হয়েছে।');
    router.refresh();
  };

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <section className="rounded-admin-card border border-admin-border bg-white p-4">
          <p className="text-xs font-semibold text-admin-muted">মোট আয়</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">৳{amount(totalIncome)}</p>
          <p className="mt-1 text-[11px] text-admin-muted">এ পর্যন্ত রেকর্ড করা প্রাপ্ত অর্থ</p>
        </section>
        <section className="rounded-admin-card border border-admin-border bg-white p-4">
          <p className="text-xs font-semibold text-admin-muted">মোট বকেয়া</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">৳{amount(totalDue)}</p>
          <p className="mt-1 text-[11px] text-admin-muted">রেকর্ডে উল্লেখ করা বাকি অর্থ</p>
        </section>
        <section className="flex flex-col justify-between rounded-admin-card border border-admin-border bg-white p-4">
          <div>
            <p className="text-xs font-semibold text-admin-muted">হিসাব যোগ করুন</p>
            <p className="mt-1 text-sm text-admin-text">সার্ভিস, আয়, বকেয়া, তারিখ ও নোট সংরক্ষণ করুন।</p>
          </div>
          <button type="button" onClick={openNew} className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-admin-navy px-4 text-sm font-semibold text-white hover:bg-admin-navy/90">
            <Plus className="h-4 w-4" aria-hidden="true" /> নতুন হিসাব
          </button>
        </section>
      </div>

      <section className="mb-5 rounded-admin-card border border-admin-border bg-white">
        <div className="border-b border-admin-border px-4 py-3">
          <h2 className="text-sm font-bold text-admin-text">সার্ভিসভিত্তিক হিসাব</h2>
          <p className="mt-0.5 text-xs text-admin-muted">প্রতিটি সার্ভিসের মোট প্রাপ্ত আয় ও বকেয়া।</p>
        </div>
        {summary.length === 0 ? (
          <p className="p-4 text-sm text-admin-muted">এখনও কোনো হিসাব যোগ করা হয়নি।</p>
        ) : (
          <ul className="grid grid-cols-1 divide-y divide-admin-border sm:grid-cols-2 sm:divide-y-0">
            {summary.map((row, index) => (
              <li key={row.service_key} className={`flex items-center justify-between gap-3 p-4 ${index > 1 ? 'sm:border-t sm:border-admin-border' : ''} ${index % 2 === 1 ? 'sm:border-l sm:border-admin-border' : ''}`}>
                <div className="flex min-w-0 items-center gap-2">
                  <span className="rounded-lg bg-admin-page p-2 text-admin-navy"><Wallet className="h-4 w-4" aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-admin-text">{serviceLabel(row.service_key)}</p>
                    <p className="text-[11px] text-admin-muted">{Number(row.record_count).toLocaleString('bn-BD')} টি হিসাব</p>
                  </div>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="font-semibold text-emerald-800">আয় ৳{amount(row.income_total)}</p>
                  <p className="mt-0.5 text-amber-800">বকেয়া ৳{amount(row.due_total)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-admin-card border border-admin-border bg-white">
        <div className="border-b border-admin-border px-4 py-3">
          <h2 className="text-sm font-bold text-admin-text">হিসাবের রেকর্ড</h2>
        </div>
        {records.length === 0 ? (
          <p className="p-6 text-center text-sm text-admin-muted">এখনও কোনো হিসাব নেই। নতুন হিসাব যোগ করে শুরু করুন।</p>
        ) : (
          <ul className="divide-y divide-admin-border">
            {records.map((record) => (
              <li key={record.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-sm font-bold text-admin-text">{serviceLabel(record.service_key)}</h3>
                    <span className="text-xs text-admin-muted">{dateLabel(record.record_date)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="font-semibold text-emerald-800">আয় ৳{amount(record.income_amount)}</span>
                    <span className="font-semibold text-amber-800">বকেয়া ৳{amount(record.due_amount)}</span>
                  </div>
                  {record.notes && <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-admin-muted">{record.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEdit(record)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-admin-border px-3 text-xs font-semibold text-admin-text hover:bg-admin-page">
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> সম্পাদনা
                  </button>
                  <button type="button" onClick={() => { setError(''); setDeleting(record); }} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> মুছুন
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
          <form onSubmit={(event) => void save(event)} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-admin-text">{editing ? 'হিসাব সম্পাদনা' : 'নতুন হিসাব'}</h2>
            <p className="mt-1 text-xs text-admin-muted">প্রাপ্ত আয় ও বকেয়া আলাদা করে লিখুন। বকেয়া হলো এখনো আদায় না হওয়া অর্থ।</p>
            {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-admin-text sm:col-span-2">
                সার্ভিস
                <select value={form.serviceKey} onChange={(event) => setForm((current) => ({ ...current, serviceKey: event.target.value as AdminFinancialService }))} className="mt-1 block h-11 w-full rounded-lg border border-admin-border bg-white px-3 text-sm font-normal">
                  {SERVICE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-admin-text">
                প্রাপ্ত আয় (৳)
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.incomeAmount} onChange={(event) => setForm((current) => ({ ...current, incomeAmount: event.target.value }))} className="mt-1 block h-11 w-full rounded-lg border border-admin-border px-3 text-sm font-normal" placeholder="০" />
              </label>
              <label className="text-xs font-semibold text-admin-text">
                বকেয়া (৳)
                <input type="number" min="0" step="0.01" inputMode="decimal" value={form.dueAmount} onChange={(event) => setForm((current) => ({ ...current, dueAmount: event.target.value }))} className="mt-1 block h-11 w-full rounded-lg border border-admin-border px-3 text-sm font-normal" placeholder="০" />
              </label>
              <label className="text-xs font-semibold text-admin-text sm:col-span-2">
                হিসাবের তারিখ
                <input type="date" required value={form.recordDate} onChange={(event) => setForm((current) => ({ ...current, recordDate: event.target.value }))} className="mt-1 block h-11 w-full rounded-lg border border-admin-border px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-semibold text-admin-text sm:col-span-2">
                বিস্তারিত নোট
                <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} maxLength={2000} className="mt-1 block w-full rounded-lg border border-admin-border p-3 text-sm font-normal" placeholder="লেনদেন বা বকেয়ার প্রাসঙ্গিক বিবরণ" />
              </label>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" disabled={busy} onClick={() => setModalOpen(false)} className="min-h-11 rounded-lg border border-admin-border px-4 text-sm font-semibold">বাতিল</button>
              <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-admin-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? 'পরিবর্তন সংরক্ষণ' : 'হিসাব সংরক্ষণ'}
              </button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={deleting !== null}
        title="হিসাবটি মুছে ফেলবেন?"
        description={deleting ? `${serviceLabel(deleting.service_key)} · ${dateLabel(deleting.record_date)} — এই হিসাবটি স্থায়ীভাবে মুছে যাবে।` : undefined}
        confirmLabel="হিসাব মুছুন"
        isLoading={busy}
        onConfirm={() => void remove()}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
