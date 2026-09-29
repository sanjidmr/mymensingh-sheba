'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Loader2,
  MapPin,
  Phone,
  User,
  Calendar,
  Clock,
  Paperclip,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  ImagePlus,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';
import { submitServiceRequest, type ServiceRequestDraft } from '@/lib/service-request-service';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

export interface ServiceRequestFormProps {
  serviceSlug: string;
  serviceLabelBn: string;
  /** Problem / work types, from lib/filter-definitions. */
  serviceTypes: { id: string; labelBn: string }[];
  serviceTypesLabel?: string;
  /** Prefers showing the date+time row. */
  showSchedule?: boolean;
  /** Prefers the photo field. */
  showPhoto?: boolean;
  placeholderDetails?: string;
  timeOptions?: string[];
  /** Replaces the default "এলাকা" area question. */
  areaPrompt?: string;
  onSubmitted?: () => void;
}

/**
 * ServiceRequestForm — the single request funnel for the repair and moving
 * categories (Electrician, Plumber, AC/Fridge, Basha Paltano).
 *
 * These services are not inventory: there is no listing to browse, so a
 * browse-first page would be a dead end. The form is therefore the page's
 * primary content, which is why it is built as a plain bordered surface rather
 * than a decorative card.
 *
 * Auth is enforced honestly. `service_requests.customer_id` is NOT NULL, so a
 * signed-out visitor is offered a sign-in instead of a form that would fail on
 * submit.
 */
export default function ServiceRequestForm({
  serviceSlug,
  serviceLabelBn,
  serviceTypes,
  serviceTypesLabel = 'কাজ / সমস্যার ধরন',
  showSchedule = true,
  showPhoto = true,
  placeholderDetails,
  timeOptions = [
    'যত তাড়াতাড়ি সম্ভব',
    'সকাল (৯টা – ১২টা)',
    'দুপুর (১২টা – ৩টা)',
    'বিকেল (৩টা – ৬টা)',
    'সন্ধ্যা (৬টা – ৮টা)',
  ],
  areaPrompt = 'যে এলাকায় কাজ দরকার',
  onSubmitted,
}: ServiceRequestFormProps) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const areas = getAllMCCAreas();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    areaId: '',
    addressLine: '',
    serviceType: serviceTypes[0]?.id ?? '',
    details: '',
    preferredDate: '',
    preferredTime: timeOptions[0] ?? '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const pickFile = (next: File | null) => {
    setFieldErrors((prev) => {
      if (!prev.file) return prev;
      const copy = { ...prev };
      delete copy.file;
      return copy;
    });
    if (!next) {
      setFile(null);
      setFilePreview(null);
      return;
    }
    setFile(next);
    setFilePreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(next);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!user) {
      setFormError('অনুরোধ পাঠাতে লগইন করতে হবে।');
      return;
    }

    const draft: ServiceRequestDraft = {
      serviceSlug,
      areaId: form.areaId,
      addressLine: form.addressLine,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      serviceType: form.serviceType,
      details: form.details,
      preferredDate: form.preferredDate || undefined,
      preferredTime: form.preferredTime || undefined,
      file,
    };

    // Validate before touching the network so the user is not told "sending…"
    // for a form that was never going to submit.
    const result = await submitServiceRequest(draft, user.id);
    if (!result.ok) {
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      setFormError(result.error);
      return;
    }

    setDone(true);
    onSubmitted?.();
  };

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-8 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white"
        >
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-3.5 text-base font-extrabold text-emerald-950 sm:text-lg">
          আপনার অনুরোধ পাঠানো হয়েছে
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-emerald-900/80">
          অ্যাডমিন আপনার অনুরোধটি দেখে যত দ্রুত সম্ভব ফোনে যোগাযোগ করবেন। অনুরোধের অবস্থা
          “যোগাযোগ হয়েছে”, “কাজ চলছে” ও “সম্পন্ন” — এই ধাপগুলোতে আপডেট হবে।
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setForm((prev) => ({ ...prev, addressLine: '', details: '', preferredDate: '' }));
            setFile(null);
            setFilePreview(null);
          }}
          className={`mt-5 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-5 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-50 sm:w-auto ${LIGHT_FOCUS}`}
        >
          আরেকটি অনুরোধ পাঠান
        </button>
      </div>
    );
  }

  if (!authLoading && !user) {
    return (
      <div className="rounded-xl border border-brand-200 bg-white px-5 py-7 text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-mist-50 text-brand-600"
        >
          <User className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-[15px] font-extrabold text-ink-900">
          অনুরোধ পাঠাতে লগইন করুন
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-500">
          আপনার অনুরোধ, ঠিকানা ও ফোন নম্বর শুধু আপনার অ্যাকাউন্টে সংরক্ষিত থাকে, যাতে
          ভুল নম্বরে কেউ না পৌঁছে যায়।
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
          >
            লগইন করুন
          </Link>
          <Link
            href="/register"
            className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-brand-200 bg-white px-5 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
          >
            অ্যাকাউন্ট খুলুন
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-extrabold text-ink-900 sm:text-base">
          {serviceLabelBn} অনুরোধ পাঠান
        </h2>
        <span className="shrink-0 text-[11px] font-semibold text-ink-400">ফ্রি</span>
      </div>

      {formError && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-relaxed text-rose-900"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {formError}
        </p>
      )}

      <div className="mt-4 space-y-3.5">
        {serviceTypes.length > 0 && (
          <Field
            id={`${serviceSlug}-type`}
            label={serviceTypesLabel}
            error={fieldErrors.serviceType}
            icon={<Calendar className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            <select
              id={`${serviceSlug}-type`}
              value={form.serviceType}
              onChange={(e) => set('serviceType')(e.target.value)}
              className={inputClass(fieldErrors.serviceType)}
            >
              {serviceTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.labelBn}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field
            id={`${serviceSlug}-name`}
            label="আপনার নাম"
            required
            error={fieldErrors.contactName}
            icon={<User className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            <input
              id={`${serviceSlug}-name`}
              type="text"
              autoComplete="name"
              value={form.contactName}
              onChange={(e) => set('contactName')(e.target.value)}
              placeholder="যেমন: রহিমা বেগম"
              className={inputClass(fieldErrors.contactName)}
            />
          </Field>

          <Field
            id={`${serviceSlug}-phone`}
            label="মোবাইল নম্বর"
            required
            error={fieldErrors.contactPhone}
            icon={<Phone className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            <input
              id={`${serviceSlug}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={form.contactPhone}
              onChange={(e) => set('contactPhone')(e.target.value)}
              placeholder="০১৭১২৩৪৫৬৭৮"
              className={inputClass(fieldErrors.contactPhone)}
            />
          </Field>
        </div>

        <Field
          id={`${serviceSlug}-area`}
          label={areaPrompt}
          required
          error={fieldErrors.areaId}
          icon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          <select
            id={`${serviceSlug}-area`}
            value={form.areaId}
            onChange={(e) => {
              set('areaId')(e.target.value);
              set('addressLine')(e.target.value ? getAreaById(e.target.value)?.nameBn ?? '' : '');
            }}
            className={inputClass(fieldErrors.areaId)}
          >
            <option value="">এলাকা নির্বাচন করুন</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nameBn}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={`${serviceSlug}-address`}
          label="বিস্তারিত ঠিকানা / ল্যান্ডমার্ক"
          required
          error={fieldErrors.addressLine}
          icon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          <input
            id={`${serviceSlug}-address`}
            type="text"
            value={form.addressLine}
            onChange={(e) => set('addressLine')(e.target.value)}
            placeholder="বাড়ি/ফ্ল্যাট নম্বর, রোড, পাশের দোকান"
            className={inputClass(fieldErrors.addressLine)}
          />
        </Field>

        <Field
          id={`${serviceSlug}-details`}
          label="সমস্যার বিবরণ"
          error={fieldErrors.details}
          hint={placeholderDetails}
          icon={<Paperclip className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          <textarea
            id={`${serviceSlug}-details`}
            rows={3}
            value={form.details}
            onChange={(e) => set('details')(e.target.value)}
            placeholder="কী সমস্যা, কোন ফ্লোরে, কতদিন ধরে — যত বিস্তারিত তত দ্রুত সমাধান"
            className={`${inputClass(fieldErrors.details)} resize-y`}
          />
        </Field>

        {showSchedule && (
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id={`${serviceSlug}-date`}
              label="সম্ভাব্য তারিখ"
              error={fieldErrors.preferredDate}
              icon={<Calendar className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              <input
                id={`${serviceSlug}-date`}
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.preferredDate}
                onChange={(e) => set('preferredDate')(e.target.value)}
                className={inputClass(fieldErrors.preferredDate)}
              />
            </Field>

            <Field
              id={`${serviceSlug}-time`}
              label="সম্ভাব্য সময়"
              error={fieldErrors.preferredTime}
              icon={<Clock className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              <select
                id={`${serviceSlug}-time`}
                value={form.preferredTime}
                onChange={(e) => set('preferredTime')(e.target.value)}
                className={inputClass(fieldErrors.preferredTime)}
              >
                {timeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {showPhoto && (
          <Field
            id={`${serviceSlug}-photo`}
            label="সমস্যার ছবি (ঐচ্ছিক)"
            error={fieldErrors.file}
            hint="ছবি থাকলে টেকনিশিয়ান আগেই বুঝে নিতে পারবেন"
            icon={<ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {filePreview ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-brand-200 bg-mist-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={filePreview}
                  alt="নির্বাচিত সমস্যার ছবির প্রিভিউ"
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-[12px] text-ink-600">
                  {file?.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    pickFile(null);
                    if (fileRef.current) fileRef.current.value = '';
                  }}
                  className={`shrink-0 rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-rose-700 ${LIGHT_FOCUS}`}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">ছবি সরান</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300 bg-mist-50/60 px-3 text-[12.5px] font-semibold text-brand-700 transition-colors hover:border-brand-400 hover:bg-mist-50 ${LIGHT_FOCUS}`}
              >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                ছবি বেছে নিন
              </button>
            )}
            <input
              ref={fileRef}
              id={`${serviceSlug}-photo`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </Field>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting || authLoading}
        className={`mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 ${LIGHT_FOCUS}`}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            পাঠানো হচ্ছে…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            অনুরোধ পাঠান
          </>
        )}
      </button>

      <p className="mt-2.5 text-center text-[11px] leading-relaxed text-ink-400">
        অ্যাডমিন আপনার অনুরোধটি সরাসরি কল করে কাজের দাম ও সময় জানাবেন।
      </p>
    </form>
  );
}

function inputClass(error?: string): string {
  return `w-full rounded-lg border bg-white px-3 py-2.5 text-[13.5px] text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none ${
    error ? 'border-rose-300 bg-rose-50/40' : 'border-brand-200'
  }`;
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  icon,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-bold text-ink-700"
      >
        {icon && <span className="text-brand-500">{icon}</span>}
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11.5px] font-semibold text-rose-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}
