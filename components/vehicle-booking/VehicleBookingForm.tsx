'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { normalizeBdPhone } from '@/lib/contact-types';

type BookingService = 'auto' | 'cng';
type BookingFields = {
  passengerName: string;
  mobileNumber: string;
  currentAddress: string;
  pickupLocation: string;
  destination: string;
  requestedAt: string;
  additionalInfo: string;
};

const EMPTY_FIELDS: BookingFields = {
  passengerName: '',
  mobileNumber: '',
  currentAddress: '',
  pickupLocation: '',
  destination: '',
  requestedAt: '',
  additionalInfo: '',
};

const inputClass =
  'mt-1.5 min-h-12 w-full rounded-md border border-brand-200 bg-white px-3.5 text-[15px] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelClass = 'block text-sm font-semibold text-ink-800';

export default function VehicleBookingForm({ service }: { service: BookingService }) {
  const isAuto = service === 'auto';
  const title = isAuto ? 'অটো ভাড়া করুন' : 'CNG ভাড়া করুন';
  const [values, setValues] = useState(EMPTY_FIELDS);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof BookingFields, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || submitted) return;
    setError('');
    setRequiresLogin(false);
    const phone = normalizeBdPhone(values.mobileNumber);
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      setError('সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।');
      return;
    }
    if (values.pickupLocation.trim().toLocaleLowerCase() === values.destination.trim().toLocaleLowerCase()) {
      setError('পিকআপ ও গন্তব্য আলাদা হতে হবে।');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/vehicle-bookings/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, mobileNumber: phone, idempotencyKey }),
      });
      const payload = await response.json() as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) {
        setRequiresLogin(response.status === 401);
        setError(payload.error || 'অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setSubmitted(true);
      setIdempotencyKey(crypto.randomUUID());
    } catch {
      setError('ইন্টারনেট সংযোগে সমস্যা হয়েছে। সংযোগ যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/gari-auto-cng"
        className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-600 hover:text-brand-800"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> গাড়ি ও ভাড়ার পাতায় ফিরুন
      </Link>

      <div className="mt-4 overflow-hidden rounded-xl border border-brand-100 bg-white shadow-sm">
        <div className={`${isAuto ? 'border-b border-orange-100 bg-orange-50/70' : 'border-b border-emerald-100 bg-emerald-50/70'} px-5 py-5 sm:px-7 sm:py-6`}>
          <p className={`text-xs font-bold tracking-wide ${isAuto ? 'text-orange-800' : 'text-emerald-800'}`}>ময়মনসিংহ শেবা · যাত্রার অনুরোধ</p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ink-600">
            আপনার যাত্রার তথ্য দিন। অনুরোধটি পাওয়ার পর আমাদের প্রতিনিধি আপনার সঙ্গে যোগাযোগ করবেন।
          </p>
        </div>

        {submitted ? (
          <div className="px-5 py-10 text-center sm:px-8 sm:py-14">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-extrabold text-ink-900">আপনার অনুরোধ জমা হয়েছে</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600">
              অনুরোধটি সংরক্ষণ করা হয়েছে। যাত্রার বিষয়ে নিশ্চিত হতে আমাদের প্রতিনিধি আপনার দেওয়া নম্বরে যোগাযোগ করবেন।
            </p>
            <Link href="/gari-auto-cng" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-brand-800 px-5 text-sm font-bold text-white hover:bg-brand-900">
              গাড়ির তালিকায় ফিরুন
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 px-5 py-6 sm:px-7 sm:py-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                যাত্রীর নাম <span className="text-rose-700">*</span>
                <input required minLength={3} maxLength={80} autoComplete="name" value={values.passengerName} onChange={(event) => update('passengerName', event.target.value)} className={inputClass} placeholder="আপনার পূর্ণ নাম" />
              </label>
              <label className={labelClass}>
                মোবাইল নম্বর <span className="text-rose-700">*</span>
                <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={18} value={values.mobileNumber} onChange={(event) => update('mobileNumber', event.target.value)} className={inputClass} placeholder="০১৭১২৩৪৫৬৭৮" />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                বর্তমান ঠিকানা <span className="text-rose-700">*</span>
                <input required minLength={3} maxLength={240} autoComplete="street-address" value={values.currentAddress} onChange={(event) => update('currentAddress', event.target.value)} className={inputClass} placeholder="এলাকা, বাসা বা পরিচিত স্থান" />
              </label>
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" /> কোথা থেকে যাবেন</span> <span className="text-rose-700">*</span>
                <input required minLength={2} maxLength={160} value={values.pickupLocation} onChange={(event) => update('pickupLocation', event.target.value)} className={inputClass} placeholder="পিকআপের স্থান" />
              </label>
              <label className={labelClass}>
                কোথায় যাবেন <span className="text-rose-700">*</span>
                <input required minLength={2} maxLength={160} value={values.destination} onChange={(event) => update('destination', event.target.value)} className={inputClass} placeholder="গন্তব্যের স্থান" />
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                কখন গাড়ি প্রয়োজন <span className="text-rose-700">*</span>
                <input required type="datetime-local" value={values.requestedAt} onChange={(event) => update('requestedAt', event.target.value)} className={inputClass} />
                <span className="mt-1 block text-xs font-normal text-ink-500">তারিখ ও সময় ময়মনসিংহের স্থানীয় সময় অনুযায়ী দিন।</span>
              </label>
              <label className={`${labelClass} sm:col-span-2`}>
                প্রয়োজনীয় অতিরিক্ত তথ্য <span className="font-normal text-ink-500">(ঐচ্ছিক)</span>
                <textarea maxLength={1000} rows={4} value={values.additionalInfo} onChange={(event) => update('additionalInfo', event.target.value)} className={`${inputClass} min-h-28 py-3`} placeholder="যাত্রা বা গাড়ি সম্পর্কে বিশেষ কোনো তথ্য থাকলে লিখুন" />
              </label>
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800">
                <p>{error}</p>
                {requiresLogin && (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/gari-auto-cng/book/${service}`)}`}
                    className="mt-2 inline-flex min-h-10 items-center font-bold underline underline-offset-2"
                  >
                    লগইন করুন
                  </Link>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-brand-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="inline-flex items-start gap-2 text-xs leading-5 text-ink-500">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                আপনার তথ্য শুধু এই বুকিং অনুরোধ পরিচালনার জন্য ব্যবহার করা হবে।
              </p>
              <button type="submit" disabled={submitting} className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${isAuto ? 'bg-orange-800 hover:bg-orange-900' : 'bg-emerald-800 hover:bg-emerald-900'}`}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> পাঠানো হচ্ছে…</> : 'বুকিং অনুরোধ পাঠান'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
