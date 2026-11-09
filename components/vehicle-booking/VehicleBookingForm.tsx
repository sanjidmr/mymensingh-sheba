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
  'mt-1 min-h-11 w-full min-w-0 rounded-md border border-brand-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:mt-1.5 sm:min-h-12 sm:px-3.5 sm:text-[15px]';
const labelClass = 'block min-w-0 text-xs font-semibold text-ink-800 sm:text-sm';

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
        className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-brand-800 sm:min-h-10 sm:gap-2 sm:text-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" /> গাড়ি ও ভাড়ার পাতায় ফিরুন
      </Link>

      <div className="mt-2 overflow-hidden rounded-lg border border-brand-100 bg-white shadow-sm sm:mt-4 sm:rounded-xl">
        <div className={`${isAuto ? 'border-b border-orange-100 bg-orange-50/70' : 'border-b border-emerald-100 bg-emerald-50/70'} px-3 py-3 sm:px-7 sm:py-6`}>
          <p className={`text-[10px] font-bold tracking-wide sm:text-xs ${isAuto ? 'text-orange-800' : 'text-emerald-800'}`}>ময়মনসিংহ শেবা · যাত্রার অনুরোধ</p>
          <h1 className="mt-0.5 text-lg font-extrabold text-ink-900 sm:mt-1 sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-xl text-xs leading-5 text-ink-600 sm:mt-2 sm:text-sm sm:leading-6">
            আপনার যাত্রার তথ্য দিন। অনুরোধটি পাওয়ার পর আমাদের প্রতিনিধি আপনার সঙ্গে যোগাযোগ করবেন।
          </p>
        </div>

        {submitted ? (
          <div className="px-3 py-7 text-center sm:px-8 sm:py-14">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700 sm:h-12 sm:w-12" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-extrabold text-ink-900 sm:mt-4 sm:text-xl">আপনার অনুরোধ জমা হয়েছে</h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-ink-600 sm:text-sm sm:leading-6">
              অনুরোধটি সংরক্ষণ করা হয়েছে। যাত্রার বিষয়ে নিশ্চিত হতে আমাদের প্রতিনিধি আপনার দেওয়া নম্বরে যোগাযোগ করবেন।
            </p>
            <Link href="/gari-auto-cng" className="mt-4 inline-flex min-h-10 items-center rounded-md bg-brand-800 px-4 text-xs font-bold text-white hover:bg-brand-900 sm:mt-6 sm:min-h-11 sm:px-5 sm:text-sm">
              গাড়ির তালিকায় ফিরুন
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 px-3 py-3 sm:space-y-5 sm:px-7 sm:py-7">
            <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4">
              <label className={labelClass}>
                যাত্রীর নাম <span className="text-rose-700">*</span>
                <input required minLength={3} maxLength={80} autoComplete="name" value={values.passengerName} onChange={(event) => update('passengerName', event.target.value)} className={inputClass} placeholder="আপনার পূর্ণ নাম" />
              </label>
              <label className={labelClass}>
                মোবাইল নম্বর <span className="text-rose-700">*</span>
                <input required type="tel" inputMode="tel" autoComplete="tel" maxLength={18} value={values.mobileNumber} onChange={(event) => update('mobileNumber', event.target.value)} className={inputClass} placeholder="০১৭১২৩৪৫৬৭৮" />
              </label>
              <label className={`${labelClass} min-[360px]:col-span-2`}>
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
              <label className={`${labelClass} min-[360px]:col-span-2`}>
                কখন গাড়ি প্রয়োজন <span className="text-rose-700">*</span>
                <input required type="datetime-local" value={values.requestedAt} onChange={(event) => update('requestedAt', event.target.value)} className={inputClass} />
                <span className="mt-0.5 block text-[10px] font-normal leading-4 text-ink-500 sm:mt-1 sm:text-xs">তারিখ ও সময় ময়মনসিংহের স্থানীয় সময় অনুযায়ী দিন।</span>
              </label>
              <label className={`${labelClass} min-[360px]:col-span-2`}>
                প্রয়োজনীয় অতিরিক্ত তথ্য <span className="font-normal text-ink-500">(ঐচ্ছিক)</span>
                <textarea maxLength={1000} rows={3} value={values.additionalInfo} onChange={(event) => update('additionalInfo', event.target.value)} className={`${inputClass} min-h-20 py-2 sm:min-h-28 sm:py-3`} placeholder="যাত্রা বা গাড়ি সম্পর্কে বিশেষ কোনো তথ্য থাকলে লিখুন" />
              </label>
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 sm:px-3.5 sm:py-3 sm:text-sm">
                <p>{error}</p>
                {requiresLogin && (
                  <Link
                    href={`/login?next=${encodeURIComponent(`/gari-auto-cng/book/${service}`)}`}
                    className="mt-1 inline-flex min-h-9 items-center font-bold underline underline-offset-2 sm:mt-2 sm:min-h-10"
                  >
                    লগইন করুন
                  </Link>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 border-t border-brand-100 pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-4">
              <p className="inline-flex items-start gap-1.5 text-[10px] leading-4 text-ink-500 sm:gap-2 sm:text-xs sm:leading-5">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-700 sm:h-4 sm:w-4" aria-hidden="true" />
                আপনার তথ্য শুধু এই বুকিং অনুরোধ পরিচালনার জন্য ব্যবহার করা হবে।
              </p>
              <button type="submit" disabled={submitting} className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:w-auto sm:px-5 sm:text-sm ${isAuto ? 'bg-orange-800 hover:bg-orange-900' : 'bg-emerald-800 hover:bg-emerald-900'}`}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> পাঠানো হচ্ছে…</> : 'বুকিং অনুরোধ পাঠান'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
