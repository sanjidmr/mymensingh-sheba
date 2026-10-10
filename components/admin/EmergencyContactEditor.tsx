'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/admin/ToastProvider';
import { saveEmergencyContact, type EmergencyContactFormData } from '@/app/admin/actions/emergency-contacts';
import type { AdminEmergencyContactRow } from '@/lib/admin/queries';
import type { EmergencyService } from '@/lib/catalog-types';

const SERVICES: { value: EmergencyService; label: string }[] = [
  { value: 'doctor', label: 'ডাক্তার' },
  { value: 'police', label: 'পুলিশ' },
  { value: 'ambulance', label: 'অ্যাম্বুলেন্স' },
  { value: 'fire_service', label: 'ফায়ার সার্ভিস' },
];

const EMPTY_FORM: EmergencyContactFormData = {
  service: 'doctor',
  nameBn: '',
  organizationBn: '',
  areaId: '',
  addressBn: '',
  phone: '',
  sourceNote: '',
  sortOrder: 0,
};

export default function EmergencyContactEditor({
  contact,
}: {
  contact?: AdminEmergencyContactRow;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<EmergencyContactFormData>(() =>
    contact
      ? {
          service: contact.service,
          nameBn: contact.name_bn,
          organizationBn: contact.organization_bn ?? '',
          areaId: contact.area_id ?? '',
          addressBn: contact.address_bn ?? '',
          phone: contact.phone,
          sourceNote: contact.source_note ?? '',
          sortOrder: contact.sort_order,
        }
      : EMPTY_FORM
  );

  const update = <K extends keyof EmergencyContactFormData>(
    key: K,
    value: EmergencyContactFormData[K]
  ) => setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await saveEmergencyContact(contact?.id ?? null, form);
      if (!result.ok) {
        notify('error', 'সংরক্ষণ ব্যর্থ হয়েছে', result.error);
        return;
      }
      notify('success', result.message ?? 'সংরক্ষিত হয়েছে।');
      setOpen(false);
      router.refresh();
    } catch (error) {
      notify('error', 'সংরক্ষণ ব্যর্থ হয়েছে', error instanceof Error ? error.message : 'আবার চেষ্টা করুন।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={contact ? 'secondary' : 'primary'}
        leftIcon={contact ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-4 w-4" />}
        onClick={() => setOpen(true)}
      >
        {contact ? 'সম্পাদনা' : 'নম্বর যোগ করুন'}
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busy) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="emergency-contact-title"
            className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="emergency-contact-title" className="text-base font-bold text-ink-900">
                {contact ? 'জরুরি যোগাযোগ সম্পাদনা' : 'জরুরি যোগাযোগ যোগ করুন'}
              </h2>
              <button
                type="button"
                aria-label="বন্ধ করুন"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 hover:bg-mist-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-semibold text-ink-700">
                সেবার ধরন
                <select
                  value={form.service}
                  onChange={(event) => update('service', event.target.value as EmergencyService)}
                  className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm"
                >
                  {SERVICES.map((service) => (
                    <option key={service.value} value={service.value}>{service.label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700">
                নাম / ইউনিট
                <input required maxLength={120} value={form.nameBn} onChange={(event) => update('nameBn', event.target.value)} className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700">
                ফোন নম্বর
                <input required type="tel" maxLength={30} value={form.phone} onChange={(event) => update('phone', event.target.value)} className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700">
                প্রতিষ্ঠান
                <input maxLength={160} value={form.organizationBn} onChange={(event) => update('organizationBn', event.target.value)} className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700">
                এলাকা আইডি
                <input maxLength={100} value={form.areaId} onChange={(event) => update('areaId', event.target.value)} className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700">
                তালিকায় ক্রম
                <input required type="number" min={0} max={9999} value={form.sortOrder} onChange={(event) => update('sortOrder', Number(event.target.value))} className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700 sm:col-span-2">
                ঠিকানা
                <input maxLength={300} value={form.addressBn} onChange={(event) => update('addressBn', event.target.value)} className="min-h-11 rounded-lg border border-brand-100 px-3 text-sm" />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-ink-700 sm:col-span-2">
                যাচাইকৃত নম্বরের উৎস
                <textarea required maxLength={500} rows={3} value={form.sourceNote} onChange={(event) => update('sourceNote', event.target.value)} className="rounded-lg border border-brand-100 px-3 py-2 text-sm" />
                <span className="font-normal text-ink-500">যেমন: প্রতিষ্ঠানের অফিসিয়াল ওয়েবসাইট বা সরাসরি নিশ্চিতকরণ। নতুন নম্বর প্রথমে বন্ধ থাকবে; যাচাই শেষে চালু করুন।</span>
              </label>
              <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>বাতিল</Button>
                <Button type="submit" disabled={busy}>{busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}</Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
