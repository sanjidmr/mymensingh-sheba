'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { normalizeBdPhone } from '@/lib/contact-types';
import { apiFetch } from '@/lib/api-fetch';
import type { ServiceRequestSuccessData } from '@/components/service-request/SubmissionSuccess';
import { safeUUID } from '@/lib/safe';

type BookingService = 'car' | 'auto' | 'cng';
type BookingFields = {
  passengerName: string;
  mobileNumber: string;
  pickupLocation: string;
  destination: string;
  passengerCount: string;
  travelDate: string;
  travelTime: string;
  vehiclePreference: string;
  customVehiclePreference: string;
  additionalInfo: string;
};

const EMPTY_FIELDS: BookingFields = {
  passengerName: '',
  mobileNumber: '',
  pickupLocation: '',
  destination: '',
  passengerCount: '1',
  travelDate: '',
  travelTime: '',
  vehiclePreference: '',
  customVehiclePreference: '',
  additionalInfo: '',
};

const OTHER_VEHICLE = '__other__';
const SERVICE_CONFIG: Record<BookingService, { title: string; tone: string; suggestions: string[] }> = {
  car: {
    title: 'গাড়ি ভাড়া করুন',
    tone: 'border-b border-brand-100 bg-mist-50',
    suggestions: ['প্রাইভেট কার', 'মাইক্রোবাস', 'নোয়া / হাইএস', 'এসইউভি'],
  },
  auto: {
    title: 'অটো ভাড়া করুন',
    tone: 'border-b border-orange-100 bg-orange-50/70',
    suggestions: ['রিজার্ভ অটো', 'ইজিবাইক', 'ব্যাটারিচালিত অটো'],
  },
  cng: {
    title: 'CNG ভাড়া করুন',
    tone: 'border-b border-emerald-100 bg-emerald-50/70',
    suggestions: ['রিজার্ভ CNG', 'CNG অটোরিকশা'],
  },
};

const inputClass =
  'mt-1 min-h-11 w-full min-w-0 rounded-md border border-brand-200 bg-white px-3 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:mt-1.5 sm:min-h-12 sm:px-3.5 sm:text-[15px]';
const labelClass = 'block min-w-0 text-xs font-semibold text-ink-800 sm:text-sm';

export default function VehicleBookingForm({
  service,
  onSubmitted,
}: {
  service: BookingService;
  onSubmitted: (submission: ServiceRequestSuccessData) => void;
}) {
  const config = SERVICE_CONFIG[service];
  const accentText = service === 'car' ? 'text-brand-800' : service === 'auto' ? 'text-orange-800' : 'text-emerald-800';
  const [values, setValues] = useState(EMPTY_FIELDS);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requiresLogin, setRequiresLogin] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setIdempotencyKey(safeUUID()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = (field: keyof BookingFields, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setRequiresLogin(false);
    const phone = normalizeBdPhone(values.mobileNumber);
    if (!/^01[3-9]\d{8}$/.test(phone)) {
      setError('সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।');
      return;
    }
    const passengerCount = Number(values.passengerCount);
    if (!Number.isInteger(passengerCount) || passengerCount < 1 || passengerCount > 50) {
      setError('যাত্রীর সংখ্যা ১ থেকে ৫০-এর মধ্যে লিখুন।');
      return;
    }
    if (values.pickupLocation.trim().toLocaleLowerCase() === values.destination.trim().toLocaleLowerCase()) {
      setError('পিকআপ ও গন্তব্য আলাদা হতে হবে।');
      return;
    }
    const vehiclePreference = values.vehiclePreference === OTHER_VEHICLE
      ? values.customVehiclePreference.trim()
      : values.vehiclePreference;
    if (service === 'car' && (vehiclePreference.length < 2 || vehiclePreference.length > 100)) {
      setError('গাড়ির ধরন বেছে নিন অথবা নিজের পছন্দ লিখুন।');
      return;
    }
    const requestIdempotencyKey = idempotencyKey || safeUUID();
    if (!idempotencyKey) setIdempotencyKey(requestIdempotencyKey);
    const requestedAt = `${values.travelDate}T${values.travelTime}`;
    if (!values.travelDate || !values.travelTime || new Date(`${requestedAt}:00+06:00`).getTime() <= Date.now()) {
      setError('ভবিষ্যতের যাত্রার তারিখ ও সময় বেছে নিন।');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/vehicle-bookings/${service}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerName: values.passengerName,
          mobileNumber: phone,
          pickupLocation: values.pickupLocation,
          destination: values.destination,
          passengerCount,
          requestedAt,
          ...(service === 'car' ? { vehiclePreference } : {}),
          additionalInfo: values.additionalInfo,
          idempotencyKey: requestIdempotencyKey,
        }),
      });
      const payload = await response.json() as { success?: boolean; error?: string; referenceCode?: string; bookingId?: string };
      if (!response.ok || !payload.success) {
        setRequiresLogin(response.status === 401);
        setError(payload.error || 'অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      const reference = payload.referenceCode ?? payload.bookingId;
      if (!reference) {
        setError('বুকিংটি সংরক্ষণ করা হয়েছে, কিন্তু রেফারেন্স আইডি পাওয়া যায়নি।');
        return;
      }
      onSubmitted({
        reference,
        summary: [
          `যাত্রীর নাম: ${values.passengerName.trim()}`,
          `মোবাইল: ${phone}`,
          `পিকআপ: ${values.pickupLocation.trim()}`,
          `গন্তব্য: ${values.destination.trim()}`,
          `যাত্রী: ${passengerCount} জন`,
          ...(service === 'car' ? [`গাড়ির ধরন: ${vehiclePreference}`] : []),
        ],
        preferredDate: values.travelDate,
        preferredTime: values.travelTime,
        details: values.additionalInfo.trim(),
      });
      setIdempotencyKey(safeUUID());
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
        <div className={`${config.tone} px-3 py-3 sm:px-7 sm:py-6`}>
          <p className={`text-[10px] font-bold tracking-wide sm:text-xs ${accentText}`}>ময়মনসিংহ শেবা · যাত্রার অনুরোধ</p>
          <h2 className="mt-0.5 text-lg font-extrabold text-ink-900 sm:mt-1 sm:text-3xl">{config.title}</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-ink-600 sm:mt-2 sm:text-sm sm:leading-6">
            আপনার যাত্রার তথ্য দিন। অনুরোধটি পাওয়ার পর আমাদের প্রতিনিধি আপনার সঙ্গে যোগাযোগ করবেন।
          </p>
        </div>

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
              <label className={labelClass}>
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-brand-700" aria-hidden="true" /> কোথা থেকে যাবেন</span> <span className="text-rose-700">*</span>
                <input required minLength={2} maxLength={160} value={values.pickupLocation} onChange={(event) => update('pickupLocation', event.target.value)} className={inputClass} placeholder="পিকআপের স্থান" />
              </label>
              <label className={labelClass}>
                কোথায় যাবেন <span className="text-rose-700">*</span>
                <input required minLength={2} maxLength={160} value={values.destination} onChange={(event) => update('destination', event.target.value)} className={inputClass} placeholder="গন্তব্যের স্থান" />
              </label>
              <label className={labelClass}>
                কতজন যাত্রী <span className="text-rose-700">*</span>
                <input required type="number" inputMode="numeric" min={1} max={50} value={values.passengerCount} onChange={(event) => update('passengerCount', event.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                যাত্রার তারিখ <span className="text-rose-700">*</span>
                <input required type="date" value={values.travelDate} onChange={(event) => update('travelDate', event.target.value)} className={inputClass} />
              </label>
              <label className={labelClass}>
                যাত্রার সময় <span className="text-rose-700">*</span>
                <input required type="time" value={values.travelTime} onChange={(event) => update('travelTime', event.target.value)} className={inputClass} />
              </label>
              {service === 'car' && (
                <label className={`${labelClass} min-[360px]:col-span-2`}>
                  কী ধরনের গাড়ি প্রয়োজন <span className="text-rose-700">*</span>
                  <select required value={values.vehiclePreference} onChange={(event) => update('vehiclePreference', event.target.value)} className={inputClass}>
                    <option value="">গাড়ির ধরন বেছে নিন</option>
                    {config.suggestions.map((suggestion) => <option key={suggestion} value={suggestion}>{suggestion}</option>)}
                    <option value={OTHER_VEHICLE}>অন্যান্য (নিজে লিখুন)</option>
                  </select>
                  {values.vehiclePreference === OTHER_VEHICLE && (
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={values.customVehiclePreference}
                      onChange={(event) => update('customVehiclePreference', event.target.value)}
                      className={inputClass}
                      placeholder="আপনার পছন্দের গাড়ির ধরন লিখুন"
                    />
                  )}
                </label>
              )}
              <label className={`${labelClass} min-[360px]:col-span-2`}>
                অতিরিক্ত নির্দেশনা <span className="font-normal text-ink-500">(ঐচ্ছিক)</span>
                <textarea maxLength={1000} rows={3} value={values.additionalInfo} onChange={(event) => update('additionalInfo', event.target.value)} className={`${inputClass} min-h-20 py-2 sm:min-h-28 sm:py-3`} placeholder="যাত্রা বা গাড়ি সম্পর্কে বিশেষ কোনো চাহিদা থাকলে লিখুন" />
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
              <button type="submit" disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-brand-800 px-4 text-xs font-bold text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-12 sm:w-auto sm:px-5 sm:text-sm">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> পাঠানো হচ্ছে…</> : 'ভাড়ার অনুরোধ পাঠান'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
