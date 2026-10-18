'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  createOwnWifiPackage,
  deleteOwnWifiPackage,
  fetchOwnWifiPackages,
  updateOwnWifiPackage,
} from '@/lib/catalog-service';
import type { WifiPackage } from '@/lib/catalog-types';

interface PackageForm {
  nameBn: string;
  speedMbps: string;
  price: string;
  connectionFee: string;
  offerLabelBn: string;
  offerConditionsBn: string;
  offerExpiresOn: string;
}

const emptyForm: PackageForm = {
  nameBn: '', speedMbps: '', price: '', connectionFee: '',
  offerLabelBn: '', offerConditionsBn: '', offerExpiresOn: '',
};

const inputClass = 'min-h-11 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm text-ink-900';

export default function OwnerWifiPackages({ listingId }: { listingId: string }) {
  const [rows, setRows] = useState<WifiPackage[]>([]);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await fetchOwnWifiPackages(listingId, true));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'প্যাকেজ লোড করা যায়নি।');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await fetchOwnWifiPackages(listingId, true);
        if (active) {
          setRows(data);
          setError('');
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'প্যাকেজ লোড করা যায়নি।');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [listingId]);

  const edit = (row: WifiPackage) => {
    setEditingId(row.id);
    setForm({
      nameBn: row.nameBn,
      speedMbps: row.speedMbps == null ? '' : String(row.speedMbps),
      price: row.price == null ? '' : String(row.price),
      connectionFee: row.connectionFee == null ? '' : String(row.connectionFee),
      offerLabelBn: row.offerLabelBn ?? '',
      offerConditionsBn: row.offerConditionsBn ?? '',
      offerExpiresOn: row.offerExpiresOn ?? '',
    });
    setError('');
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const numberValue = (value: string) => value.trim() ? Number(value) : undefined;
    const speed = numberValue(form.speedMbps);
    const price = numberValue(form.price);
    const install = numberValue(form.connectionFee);
    if ([speed, price, install].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0))) {
      setError('স্পিড, মূল্য ও ইনস্টলেশন চার্জ শূন্য বা তার বেশি বৈধ সংখ্যা হতে হবে।');
      setBusy(false);
      return;
    }
    const input = {
      nameBn: form.nameBn.trim(),
      speedMbps: speed,
      price,
      connectionFee: install,
      offerLabelBn: form.offerLabelBn.trim() || undefined,
      offerConditionsBn: form.offerConditionsBn.trim() || undefined,
      offerExpiresOn: form.offerExpiresOn || undefined,
      isActive: true,
      sortOrder: rows.length,
    };
    const result = editingId
      ? await updateOwnWifiPackage(editingId, input)
      : await createOwnWifiPackage(listingId, input);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice('প্যাকেজ/অফার সংরক্ষিত হয়েছে। প্রকাশের আগে পরিবর্তনটি অ্যাডমিন অনুমোদন করবেন।');
    setEditingId('');
    setForm(emptyForm);
    await load();
  };

  const remove = async (row: WifiPackage) => {
    if (!window.confirm(`“${row.nameBn}” প্যাকেজটি মুছে ফেলবেন?`)) return;
    setBusy(true);
    setError('');
    const result = await deleteOwnWifiPackage(row.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNotice('প্যাকেজ মুছে ফেলা হয়েছে; পরিবর্তনটি অনুমোদনের পর প্রকাশ পাবে।');
    if (editingId === row.id) {
      setEditingId('');
      setForm(emptyForm);
    }
    await load();
  };

  return (
    <section className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5">
      <h2 className="text-base font-extrabold text-ink-900">ইন্টারনেট প্যাকেজ ও অফার</h2>
      <p className="mt-1 text-sm text-ink-500">প্যাকেজ যোগ, সম্পাদনা বা মুছলে তালিকা পুনরায় অনুমোদনের জন্য যাবে।</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {notice && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {loading ? <p className="py-4 text-sm text-ink-500">প্যাকেজ লোড হচ্ছে…</p> : rows.length === 0 ? <p className="py-4 text-sm text-ink-500">এখনো কোনো প্যাকেজ নেই।</p> : (
        <ul className="mt-3 divide-y divide-brand-100">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="font-bold text-ink-800">{row.nameBn}</p>
                <p className="text-xs text-ink-500">{row.speedMbps ? `${row.speedMbps} Mbps` : 'স্পিড উল্লেখ নেই'} · {row.price != null ? `৳${row.price}/মাস` : 'মূল্য উল্লেখ নেই'}{row.offerLabelBn ? ` · ${row.offerLabelBn}` : ''}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => edit(row)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-brand-200 px-3 text-xs font-bold text-brand-800"><Pencil className="h-3.5 w-3.5" />সম্পাদনা</button>
                <button type="button" disabled={busy} onClick={() => void remove(row)} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-rose-200 px-3 text-xs font-bold text-rose-700 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" />মুছুন</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={(event) => void save(event)} className="mt-4 space-y-3 border-t border-brand-100 pt-4">
        <h3 className="text-sm font-extrabold text-ink-800">{editingId ? 'প্যাকেজ সম্পাদনা' : 'নতুন প্যাকেজ যোগ করুন'}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-ink-700">প্যাকেজের নাম *<input required minLength={2} maxLength={160} className={`${inputClass} mt-1`} value={form.nameBn} onChange={(event) => setForm({ ...form, nameBn: event.target.value })} /></label>
          <label className="text-xs font-bold text-ink-700">স্পিড (Mbps)<input type="number" min="0" step="any" className={`${inputClass} mt-1`} value={form.speedMbps} onChange={(event) => setForm({ ...form, speedMbps: event.target.value })} /></label>
          <label className="text-xs font-bold text-ink-700">মাসিক মূল্য (৳)<input type="number" min="0" step="any" className={`${inputClass} mt-1`} value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
          <label className="text-xs font-bold text-ink-700">ইনস্টলেশন চার্জ (৳)<input type="number" min="0" step="any" className={`${inputClass} mt-1`} value={form.connectionFee} onChange={(event) => setForm({ ...form, connectionFee: event.target.value })} /></label>
          <label className="text-xs font-bold text-ink-700">বর্তমান অফার<input maxLength={240} className={`${inputClass} mt-1`} value={form.offerLabelBn} onChange={(event) => setForm({ ...form, offerLabelBn: event.target.value })} /></label>
          <label className="text-xs font-bold text-ink-700">অফারের শেষ তারিখ<input type="date" className={`${inputClass} mt-1`} value={form.offerExpiresOn} onChange={(event) => setForm({ ...form, offerExpiresOn: event.target.value })} /></label>
        </div>
        <label className="block text-xs font-bold text-ink-700">অফারের শর্ত<textarea rows={2} maxLength={1000} className={`${inputClass} mt-1 py-2`} value={form.offerConditionsBn} onChange={(event) => setForm({ ...form, offerConditionsBn: event.target.value })} /></label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white disabled:opacity-60"><Plus className="h-4 w-4" />{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(''); setForm(emptyForm); }} className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-brand-200 px-4 text-sm font-bold text-brand-800"><X className="h-4 w-4" />বাতিল</button>}
        </div>
      </form>
    </section>
  );
}
