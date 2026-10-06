'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Crosshair,
  ExternalLink,
  ImagePlus,
  Loader2,
  Lock,
  MapPin,
  RotateCcw,
  Send,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';
import {
  REQUEST_TIME_OPTIONS,
  formatAnswersBn,
  type ServiceField,
  type ServiceLocationBlock,
  type ServiceRequestPageConfig,
} from '@/lib/service-request-pages';
import {
  formatLocationBn,
  submitServiceRequest,
  validateBdPhone,
  type ServiceLocationKey,
  type ServiceRequestLocationInput,
} from '@/lib/service-request-service';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

/* -------------------------------------------------------------------------- */
/* Shared control chrome                                                      */
/* -------------------------------------------------------------------------- */

/**
 * 52px minimum height: comfortably above the 44px touch target the design
 * tokens require, and large enough that the Bangla text does not look cramped.
 * `text-[16px]` on phones keeps iOS from zooming the viewport on focus.
 */
const CONTROL =
  'w-full min-h-[52px] rounded-lg border bg-white px-3.5 py-2.5 text-[16px] text-ink-900 placeholder:text-ink-300 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/25 sm:text-sm';

function controlClass(error?: string): string {
  return `${CONTROL} ${
    error
      ? 'border-red-400 bg-red-50/40 focus:border-red-500'
      : 'border-brand-200 hover:border-brand-300 focus:border-brand-600'
  }`;
}

const CHEVRON_BG = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d8b81' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
};

/** One card / chip surface used by every radio and checkbox option. */
function optionClass(active: boolean): string {
  return `flex min-h-[48px] w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13.5px] leading-snug transition-colors sm:text-[13.5px] ${
    active
      ? 'border-brand-600 bg-brand-50 font-bold text-brand-900'
      : 'border-brand-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-mist-50'
  }`;
}

/* -------------------------------------------------------------------------- */
/* State shape                                                                */
/* -------------------------------------------------------------------------- */

type AnswerValue = string | string[];
type Answers = Record<string, AnswerValue>;

interface LocationState extends ServiceRequestLocationInput {
  geo: { lat: number; lng: number } | null;
}

type LocationMap = Record<ServiceLocationKey, LocationState>;

type GeoState = 'idle' | 'loading' | 'ok' | 'error';

const emptyLocation = (): LocationState => ({
  areaId: '',
  road: '',
  house: '',
  landmark: '',
  geo: null,
});

interface FormState {
  name: string;
  phone: string;
  altPhone: string;
  serviceType: string;
  answers: Answers;
  locations: LocationMap;
  preferredDate: string;
  preferredTime: string;
  details: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export interface ServiceRequestFormCardProps {
  config: ServiceRequestPageConfig;
}

/**
 * ServiceRequestFormCard — the request form for all five service pages.
 *
 * It is rendered from `config` rather than written five times: the field list,
 * the number of address blocks and the labels all come from
 * `lib/service-request-pages.ts`. Adding a question to a service is a data edit.
 *
 * Notable decisions
 * -----------------
 * No listings. These categories have nothing to browse, so this form is the
 * page's primary content and the page shows no provider cards at all.
 *
 * Auth is enforced honestly but not as a wall. `service_requests.customer_id`
 * is NOT NULL, so a signed-out visitor cannot submit. Rather than replacing the
 * whole form with a sign-in card — which hides the questions and wastes the
 * visit — the form stays fully readable and the submit button turns into a
 * sign-in prompt. Anon the visitor learns what the service needs, and one tap
 * from the login page returns them here with the answers intact on submit.
 *
 * Geolocation is opt-in and never required. The browser only shares a
 * coordinate if the user taps the button and accepts the prompt; if they
 * decline, nothing else changes.
 */
export default function ServiceRequestFormCard({ config }: ServiceRequestFormCardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const areas = useMemo(() => getAllMCCAreas(), []);

  const [form, setForm] = useState<FormState>(() => ({
    name: '',
    phone: '',
    altPhone: '',
    serviceType: '',
    answers: {},
    locations: { work: emptyLocation(), destination: emptyLocation() },
    preferredDate: '',
    preferredTime: '',
    details: '',
  }));

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [reference, setReference] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [geo, setGeo] = useState<Record<string, { state: GeoState; message: string }>>({});

  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const prefilled = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  /* -- Prefill from the signed-in account, once --------------------------- */
  useEffect(() => {
    if (prefilled.current || !user) return;
    prefilled.current = true;
    setForm((prev) => ({
      ...prev,
      name: prev.name || user.fullName || '',
      phone: prev.phone || user.phone || '',
      locations: {
        ...prev.locations,
        work: {
          ...prev.locations.work,
          // Only prefill when it is a real MCC area — the picker rejects
          // anything outside the City Corporation. Note the parentheses: `||`
          // binds tighter than `?:`, so without them this silently overwrites
          // an existing selection.
          areaId:
            prev.locations.work.areaId ||
            (getAreaById(user.primaryAreaId) ? (user.primaryAreaId ?? '') : ''),
        },
      },
    }));
  }, [user]);

  /* -- Release the object URL when the component unmounts ----------------- */
  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    []
  );

  /* -- State helpers ------------------------------------------------------ */

  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const setTop = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K], errorKey?: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearError(errorKey ?? String(key));
    },
    [clearError]
  );

  const setAnswer = useCallback(
    (name: string, value: AnswerValue) => {
      setForm((prev) => ({
        ...prev,
        answers: { ...prev.answers, [name]: value },
      }));
      clearError(name);
    },
    [clearError]
  );

  const setLocation = useCallback(
    (key: ServiceLocationKey, patch: Partial<LocationState>) => {
      setForm((prev) => ({
        ...prev,
        locations: { ...prev.locations, [key]: { ...prev.locations[key], ...patch } },
      }));
      clearError(`${key}.areaId`);
      clearError(`${key}.address`);
    },
    [clearError]
  );

  const toggleMulti = useCallback(
    (name: string, value: string) => {
      setForm((prev) => {
        const current = prev.answers[name];
        const list = Array.isArray(current) ? current : [];
        const next = list.includes(value)
          ? list.filter((item) => item !== value)
          : [...list, value];
        return { ...prev, answers: { ...prev.answers, [name]: next } };
      });
      clearError(name);
    },
    [clearError]
  );

  const pickFile = useCallback(
    (next: File | null) => {
      clearError('file');
      if (!next) {
        setFile(null);
        setFilePreview(null);
        return;
      }
      setFile(next);
      const url = URL.createObjectURL(next);
      previewUrlRef.current = url;
      setFilePreview(url);
    },
    [clearError]
  );

  /* -- Geolocation (opt-in) ----------------------------------------------- */

  const shareLocation = useCallback(
    (key: ServiceLocationKey) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGeo((prev) => ({
          ...prev,
          [key]: { state: 'error', message: 'এই ব্রাউজারে লোকেশন পাওয়া যায় না।' },
        }));
        return;
      }
      setGeo((prev) => ({ ...prev, [key]: { state: 'loading', message: 'আপনার লোকেশন খোঁজা হচ্ছে…' } }));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoValue = {
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          };
          setLocation(key, { geo: geoValue });
          setGeo((prev) => ({
            ...prev,
            [key]: { state: 'ok', message: 'আপনার লোকেশন যুক্ত হয়েছে।' },
          }));
        },
        (error) => {
          const message =
            error.code === error.PERMISSION_DENIED
              ? 'অনুমতি না দিলে লোকেশন যুক্ত হবে না। ঠিকানা লিখেও দেওয়া যাবে।'
              : 'লোকেশন পাওয়া যায়নি। ঠিকানা লিখে দিন।';
          setGeo((prev) => ({ ...prev, [key]: { state: 'error', message } }));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    },
    [setLocation]
  );

  /* -- Validation --------------------------------------------------------- */

  const validate = useCallback((): Record<string, string> => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = 'আপনার নাম লিখুন';
    else if (form.name.trim().length < 3) next.name = 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে';

    const phoneError = validateBdPhone(form.phone);
    if (phoneError) next.phone = phoneError;

    if (form.altPhone.trim()) {
      const altError = validateBdPhone(form.altPhone);
      if (altError) next.altPhone = 'বিকল্প নম্বরটি সঠিক নয় (যেমন ০১৮১২৩৪৫৬৭৮)';
    }

    if (!form.serviceType) next.serviceType = `${config.serviceTypesLabel} একটি বেছে নিন`;

    for (const block of config.locations) {
      const location = form.locations[block.key];
      if (block.required && !location.areaId) {
        next[`${block.key}.areaId`] = 'এলাকা নির্বাচন করুন';
      } else if (location.areaId && !getAreaById(location.areaId)) {
        next[`${block.key}.areaId`] = 'নির্বাচিত এলাকাটি সঠিক নয়';
      }
      if (!formatLocationBn(location)) {
        next[`${block.key}.address`] = 'বাড়ি, রোড বা পরিচিত স্থান — অন্তত একটি লিখুন';
      }
    }

    for (const field of config.fields) {
      if (!field.required) continue;
      const value = form.answers[field.name];
      const empty =
        value === undefined ||
        (Array.isArray(value) ? value.length === 0 : !value.trim());
      if (empty) next[field.name] = `${field.label} — একটি বেছে নিন বা লিখুন`;
    }

    if (file) {
      if (!file.type.startsWith('image/')) next.file = 'শুধুমাত্র ছবি আপলোড করা যাবে';
      else if (file.size > 5 * 1024 * 1024) next.file = 'ছবির সাইজ ৫MB এর কম হতে হবে';
    }

    return next;
  }, [config, form, file]);

  /* -- Submit ------------------------------------------------------------- */

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('error');
      setFormError('কিছু তথ্য ঠিক করতে হবে। চিহ্নিত ঘরগুলো দেখুন।');
      // Move focus to the first problem so keyboard and screen-reader users
      // are not left guessing where "চিহ্নিত ঘরগুলো" is.
      const firstBad = Object.keys(nextErrors)[0];
      fieldRefs.current[firstBad]?.focus();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (!user) {
      setStatus('error');
      setFormError('অনুরোধ পাঠাতে লগইন করতে হবে। লগইন করে একই পাতায় ফিরে আসতে পারবেন।');
      return;
    }

    setStatus('submitting');

    const result = await submitServiceRequest(
      {
        serviceSlug: config.slug,
        pageConfig: config,
        contactName: form.name,
        contactPhone: form.phone,
        altPhone: form.altPhone,
        areaId: form.locations.work.areaId,
        addressLine: formatLocationBn(form.locations.work),
        locations: {
          work: form.locations.work,
          ...(config.locations.some((block) => block.key === 'destination')
            ? { destination: form.locations.destination }
            : {}),
        },
        serviceType: form.serviceType,
        answers: { ...form.answers, serviceType: form.serviceType },
        details: form.details,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime,
        file,
      },
      user.id
    );

    if (!result.ok) {
      setStatus('error');
      if (result.fieldErrors) setErrors(result.fieldErrors);
      setFormError(result.error);
      return;
    }

    setReference(result.reference ?? null);
    setStatus('success');
  };

  const reset = () => {
    setForm({
      name: user?.fullName ?? '',
      phone: user?.phone ?? '',
      altPhone: '',
      serviceType: '',
      answers: {},
      locations: { work: emptyLocation(), destination: emptyLocation() },
      preferredDate: '',
      preferredTime: '',
      details: '',
    });
    setFile(null);
    setFilePreview(null);
    setErrors({});
    setFormError(null);
    setGeo({});
    setReference(null);
    setCopied(false);
    setStatus('idle');
  };

  /* -- Success ------------------------------------------------------------ */

  if (status === 'success') {
    return (
      <SuccessPanel
        config={config}
        form={form}
        reference={reference}
        copied={copied}
        onCopy={async () => {
          if (!reference) return;
          try {
            await navigator.clipboard.writeText(reference);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            setCopied(false);
          }
        }}
        onReset={reset}
      />
    );
  }

  /* -- Form --------------------------------------------------------------- */

  const disabled = status === 'submitting' || authLoading;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      aria-describedby="service-request-privacy"
      className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-100 pb-4">
        <div className="min-w-0">
          <h3 className="text-[17px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-xl">
            {config.title} অনুরোধের ছক
          </h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">
            চিহ্নিত ঘরগুলো অবশ্যই পূরণ করতে হবে। বাকিগুলো দিলে কাজ দ্রুত হয়।
          </p>
        </div>
        <p className="shrink-0 text-[12px] font-semibold text-ink-400">
          <span className="text-red-600">*</span> আবশ্যক ক্ষেত্র
        </p>
      </div>

      {/* Signed-out notice. The form stays readable so the visitor learns what
          the service needs; only the submit action is gated. */}
      {!authLoading && !user && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-brand-200 bg-mist-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-600">
            <Lock className="mt-px h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <span>
              অনুরোধটি শুধুমাত্র আপনার অ্যাকাউন্টের সাথে যুক্ত থাকে, যাতে অবস্থা
              দেখতে ও ভুল নম্বরে যোগাযোগ না হয়। তাই পাঠানোর আগে একবার লগইন করতে হবে।
            </span>
          </p>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-brand-700 px-4 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 sm:flex-none ${LIGHT_FOCUS}`}
            >
              লগইন করুন
            </Link>
            <Link
              href="/register"
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-[13px] font-bold text-brand-700 transition-colors hover:bg-mist-50 sm:flex-none ${LIGHT_FOCUS}`}
            >
              অ্যাকাউন্ট খুলুন
            </Link>
          </div>
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5"
        >
          <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
          <p className="text-[13px] font-semibold leading-relaxed text-red-800">{formError}</p>
        </div>
      )}

      <div className="mt-7 space-y-8">
        {/* ---------------- 1. ব্যক্তিগত তথ্য ---------------- */}
        <fieldset className="min-w-0">
          <SectionTitle icon={<User className="h-4 w-4" aria-hidden="true" />}>
            ব্যক্তিগত তথ্য
          </SectionTitle>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              id="service-name"
              label="আপনার নাম"
              required
              error={errors.name}
            >
              <input
                id="service-name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setTop('name', e.target.value)}
                onBlur={() => clearError('name')}
                placeholder="যেমন: রহিমা বেগম"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'service-name-error' : undefined}
                ref={(el) => {
                  fieldRefs.current.name = el;
                }}
                className={controlClass(errors.name)}
              />
            </Field>

            <Field
              id="service-phone"
              label="মোবাইল নম্বর"
              required
              error={errors.phone}
            >
              <input
                id="service-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setTop('phone', e.target.value)}
                onBlur={() => clearError('phone')}
                placeholder="০১৭১২৩৪৫৬৭৮"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'service-phone-error' : undefined}
                ref={(el) => {
                  fieldRefs.current.phone = el;
                }}
                className={controlClass(errors.phone)}
              />
            </Field>

            <Field
              id="service-alt-phone"
              label="বিকল্প নম্বর"
              hint="মূল নম্বর ব্যস্ত থাকলে দ্বিতীয় নম্বরটি দিন।"
              error={errors.altPhone}
            >
              <input
                id="service-alt-phone"
                name="altPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.altPhone}
                onChange={(e) => setTop('altPhone', e.target.value)}
                onBlur={() => clearError('altPhone')}
                placeholder="০১৮১২৩৪৫৬৭৮"
                aria-invalid={Boolean(errors.altPhone)}
                aria-describedby={errors.altPhone ? 'service-alt-phone-error' : undefined}
                ref={(el) => {
                  fieldRefs.current.altPhone = el;
                }}
                className={controlClass(errors.altPhone)}
              />
            </Field>
          </div>
        </fieldset>

        {/* ---------------- 2. ঠিকানা ---------------- */}
        <fieldset className="min-w-0">
          <SectionTitle icon={<MapPin className="h-4 w-4" aria-hidden="true" />}>
            ঠিকানার তথ্য
          </SectionTitle>

          <div className="mt-4 space-y-6">
            {config.locations.map((block) => (
              <LocationBlock
                key={block.key}
                block={block}
                areas={areas}
                value={form.locations[block.key]}
                errors={errors}
                geo={geo[block.key]}
                onChange={(patch) => setLocation(block.key, patch)}
                onShareLocation={() => shareLocation(block.key)}
                registerRef={(key, el) => {
                  fieldRefs.current[key] = el;
                }}
              />
            ))}
          </div>
        </fieldset>

        {/* ---------------- 3. সেবার তথ্য ---------------- */}
        <fieldset className="min-w-0">
          <SectionTitle icon={<ClipboardCheck className="h-4 w-4" aria-hidden="true" />}>
            সেবার তথ্য
          </SectionTitle>

          <div className="mt-4 space-y-6">
            <Field
              id="service-type"
              label={config.serviceTypesLabel}
              required
              error={errors.serviceType}
              hint="সবচেয়ে কাছের মিল, তাই এটি বেছে নেওয়া জরুরি।"
              labelAs="span"
            >
              <div
                role="radiogroup"
                aria-labelledby="service-type-label"
                aria-invalid={Boolean(errors.serviceType)}
                aria-describedby={errors.serviceType ? 'service-type-error' : undefined}
                className="grid gap-2 sm:grid-cols-2"
              >
                {config.serviceTypes.map((type) => {
                  const active = form.serviceType === type.id;
                  return (
                    <label key={type.id} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="serviceType"
                        value={type.id}
                        checked={active}
                        onChange={() => {
                          setForm((prev) => ({ ...prev, serviceType: type.id }));
                          clearError('serviceType');
                        }}
                        className="peer sr-only"
                      />
                      <span
                        className={`${optionClass(active)} peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/40`}
                      >
                        <Indicator active={active} />
                        <span className="min-w-0">{type.labelBn}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>

            {config.fields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={form.answers[field.name]}
                error={errors[field.name]}
                onChange={(value) => setAnswer(field.name, value)}
                onToggle={(optionValue) => toggleMulti(field.name, optionValue)}
                registerRef={(el) => {
                  fieldRefs.current[field.name] = el;
                }}
              />
            ))}
          </div>
        </fieldset>

        {/* ---------------- 4. সময় ---------------- */}
        <fieldset className="min-w-0">
          <SectionTitle icon={<Calendar className="h-4 w-4" aria-hidden="true" />}>
            কখন দরকার
          </SectionTitle>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field id="service-date" label={config.dateLabel}>
              <input
                id="service-date"
                name="preferredDate"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.preferredDate}
                onChange={(e) => setTop('preferredDate', e.target.value)}
                ref={(el) => {
                  fieldRefs.current.preferredDate = el;
                }}
                className={controlClass()}
              />
            </Field>

            {config.showTimeField && (
              <Field
                id="service-time"
                label="কোন সময়ে সুবিধা হবে"
                hint="সময় জানালে কাজের লোক সেই সময়েই আসতে পারবেন।"
              >
                <select
                  id="service-time"
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={(e) => setTop('preferredTime', e.target.value)}
                  ref={(el) => {
                    fieldRefs.current.preferredTime = el;
                  }}
                  className={`${controlClass()} appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
                  style={CHEVRON_BG}
                >
                  <option value="">— বেছে নিন (ঐচ্ছিক) —</option>
                  {REQUEST_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        </fieldset>

        {/* ---------------- 5. অতিরিক্ত বিবরণ ---------------- */}
        <fieldset className="min-w-0">
          <SectionTitle icon={<Send className="h-4 w-4" aria-hidden="true" />}>
            অতিরিক্ত বিবরণ
          </SectionTitle>

          <div className="mt-4 space-y-4">
            <Field
              id="service-details"
              label={config.detailsLabel}
              hint={config.detailsHint}
            >
              <textarea
                id="service-details"
                name="details"
                rows={5}
                value={form.details}
                onChange={(e) => setTop('details', e.target.value)}
                placeholder={config.detailsPlaceholder}
                ref={(el) => {
                  fieldRefs.current.details = el;
                }}
                className={`${controlClass()} resize-y leading-relaxed`}
              />
            </Field>

            <Field
              id="service-photo"
              label="সমস্যার ছবি"
              hint={config.photoHint}
              error={errors.file}
            >
              {filePreview ? (
                <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-mist-50 p-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview}
                    alt="নির্বাচিত ছবির প্রিভিউ"
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-600">
                    {file?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      pickFile(null);
                      if (fileRef.current) fileRef.current.value = '';
                    }}
                    className={`shrink-0 rounded-md p-2 text-ink-500 transition-colors hover:bg-white hover:text-rose-700 ${LIGHT_FOCUS}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">ছবি সরান</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand-300 bg-mist-50/60 px-4 text-[13px] font-bold text-brand-700 transition-colors hover:border-brand-400 hover:bg-mist-50 ${LIGHT_FOCUS}`}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  ছবি বেছে নিন (ঐচ্ছিক, সর্বোচ্চ ৫MB)
                </button>
              )}
              <input
                ref={fileRef}
                id="service-photo"
                name="photo"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </Field>
          </div>
        </fieldset>
      </div>

      {/* ---------------- Submit ---------------- */}
      <div className="mt-8 border-t border-brand-100 pt-6">
        {authLoading ? (
          <button
            type="submit"
            disabled
            className={`inline-flex min-h-[52px] w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-[15px] font-extrabold text-white opacity-60 ${LIGHT_FOCUS}`}
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            প্রস্তুত হচ্ছে…
          </button>
        ) : user ? (
          <button
            type="submit"
            disabled={disabled}
            className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-[15px] font-extrabold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70 ${LIGHT_FOCUS}`}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                পাঠানো হচ্ছে…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                সেবা নেওয়ার অনুরোধ পাঠান
              </>
            )}
          </button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 text-[15px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
          >
            লগইন করে অনুরোধ পাঠান
          </Link>
        )}

        <p
          id="service-request-privacy"
          className="mt-3.5 text-center text-[11.5px] leading-relaxed text-ink-400"
        >
          আপনার দেওয়া তথ্য শুধুমাত্র আপনার সেবা অনুরোধটি প্রক্রিয়া করার প্রয়োজনেই
          ব্যবহার করা হবে।
        </p>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <legend className="flex items-center gap-2 text-[15px] font-extrabold text-ink-900 sm:text-base">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brand-100 bg-mist-50 text-brand-600"
      >
        {icon}
      </span>
      {children}
    </legend>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  labelAs = 'label',
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /**
   * Use 'span' when the control is a group (radiogroup / fieldset) rather than
   * a single form element. A `<label htmlFor>` pointing at a `<div>` is not
   * clickable and mis-announces, so those pass 'span' and reference it from
   * the group's own `aria-labelledby` instead.
   */
  labelAs?: 'label' | 'span';
  children: React.ReactNode;
}) {
  const labelClass = 'mb-1.5 block text-[13px] font-bold text-ink-700';
  const labelContent = (
    <>
      {label} {required && <span className="text-red-600">*</span>}
      {!required && <span className="font-medium text-ink-400"> (ঐচ্ছিক)</span>}
    </>
  );

  return (
    <div className="min-w-0">
      {labelAs === 'label' ? (
        <label htmlFor={id} className={labelClass}>
          {labelContent}
        </label>
      ) : (
        <span id={`${id}-label`} className={labelClass}>
          {labelContent}
        </span>
      )}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold text-red-700"
        >
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-400">{hint}</p>
      ) : null}
    </div>
  );
}

/** Small round marker for radio options. */
function Indicator({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
        active ? 'border-brand-600 bg-brand-600' : 'border-brand-300 bg-white'
      }`}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
    </span>
  );
}

/** Square marker for checkbox options. */
function BoxIndicator({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
        active ? 'border-brand-600 bg-brand-600' : 'border-brand-300 bg-white'
      }`}
    >
      {active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Location block                                                             */
/* -------------------------------------------------------------------------- */

function LocationBlock({
  block,
  areas,
  value,
  errors,
  geo,
  onChange,
  onShareLocation,
  registerRef,
}: {
  block: ServiceLocationBlock;
  areas: ReturnType<typeof getAllMCCAreas>;
  value: LocationState;
  errors: Record<string, string>;
  geo?: { state: GeoState; message: string };
  onChange: (patch: Partial<LocationState>) => void;
  onShareLocation: () => void;
  registerRef: (key: string, el: HTMLElement | null) => void;
}) {
  const areaError = errors[`${block.key}.areaId`];
  const addressError = errors[`${block.key}.address`];

  const mapQuery = useMemo(() => {
    const area = getAreaById(value.areaId);
    const parts = [area?.nameBn, value.house, value.road, value.landmark]
      .map((part) => part?.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '';
  }, [value.areaId, value.house, value.road, value.landmark]);

  const mapUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${mapQuery}, ময়মনসিংহ`
      )}`
    : null;

  return (
    <div className="rounded-xl border border-brand-100 bg-mist-50/60 p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[13.5px] font-extrabold text-ink-900">
          {block.label} {block.required && <span className="text-red-600">*</span>}
        </p>
        <p className="text-[11.5px] text-ink-400">{block.helper}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${block.key}-area`} label="এলাকা" required error={areaError}>
          <select
            id={`${block.key}-area`}
            name={`${block.key}Area`}
            value={value.areaId}
            onChange={(e) => onChange({ areaId: e.target.value })}
            aria-invalid={Boolean(areaError)}
            aria-describedby={areaError ? `${block.key}-area-error` : undefined}
            ref={(el) => registerRef(`${block.key}.areaId`, el)}
            className={`${controlClass(areaError)} appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
            style={CHEVRON_BG}
          >
            <option value="">এলাকা নির্বাচন করুন</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nameBn} — {area.wardLabelBn}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id={`${block.key}-house`}
          label="বাড়ি / হোল্ডিং / ফ্ল্যাট নম্বর"
          error={addressError}
        >
          <input
            id={`${block.key}-house`}
            name={`${block.key}House`}
            type="text"
            value={value.house}
            onChange={(e) => onChange({ house: e.target.value })}
            placeholder="যেমন: বাড়ি ১২, তৃতীয় তলা"
            aria-invalid={Boolean(addressError)}
            aria-describedby={addressError ? `${block.key}-house-error` : undefined}
            ref={(el) => registerRef(`${block.key}.address`, el)}
            className={controlClass(addressError)}
          />
        </Field>

        <Field id={`${block.key}-road`} label="মহল্লা / রোড">
          <input
            id={`${block.key}-road`}
            name={`${block.key}Road`}
            type="text"
            value={value.road}
            onChange={(e) => onChange({ road: e.target.value })}
            placeholder="যেমন: সেহারা রোড, চরপাড়া"
            className={controlClass()}
          />
        </Field>

        <Field
          id={`${block.key}-landmark`}
          label="কাছাকাছি পরিচিত স্থান"
          hint="দোকান বা মোড়ের নাম বললে ঠিকানা খুঁজে পাওয়া সহজ হয়।"
        >
          <input
            id={`${block.key}-landmark`}
            name={`${block.key}Landmark`}
            type="text"
            value={value.landmark}
            onChange={(e) => onChange({ landmark: e.target.value })}
            placeholder="যেমন: নাহার মেমোরিয়ালের পাশে"
            className={controlClass()}
          />
        </Field>
      </div>

      {/* Map / location. Both options are optional and neither blocks submit:
          the geolocation button only fills coordinates when the user allows
          it, and the map link just opens the composed address in Google Maps. */}
      <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onShareLocation}
          disabled={geo?.state === 'loading'}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-[12.5px] font-bold text-brand-700 transition-colors hover:bg-mist-50 disabled:cursor-not-allowed disabled:opacity-60 ${LIGHT_FOCUS}`}
        >
          {geo?.state === 'loading' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          আমার বর্তমান লোকেশন যোগ করুন
        </button>

        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-bold text-brand-600 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-800 ${LIGHT_FOCUS}`}
          >
            মানচিত্রে এই ঠিকানা দেখুন
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}

        {value.geo && (
          <span className="inline-flex min-h-[44px] items-center gap-1.5 text-[11.5px] font-semibold text-brand-600">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            লোকেশন যুক্ত হয়েছে
          </span>
        )}
      </div>

      {geo?.state === 'error' && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">{geo.message}</p>
      )}
      {geo?.state === 'ok' && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-brand-600">{geo.message}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dynamic field renderer                                                     */
/* -------------------------------------------------------------------------- */

function DynamicField({
  field,
  value,
  error,
  onChange,
  onToggle,
  registerRef,
}: {
  field: ServiceField;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (value: string) => void;
  onToggle: (value: string) => void;
  registerRef: (el: HTMLElement | null) => void;
}) {
  const selected = Array.isArray(value) ? value : [];

  /* Radio group ------------------------------------------------------- */
  if (field.kind === 'radio' && field.options) {
    return (
      <div className="min-w-0">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 block text-[13px] font-bold text-ink-700">
            {field.label} {field.required ? <span className="text-red-600">*</span> : null}
          </legend>
          <div
            role="radiogroup"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `field-${field.name}-error` : undefined}
            className="grid gap-2 sm:grid-cols-2"
          >
            {field.options.map((option) => {
              const active = value === option.value;
              return (
                <label key={option.value} className="block cursor-pointer">
                  <input
                    type="radio"
                    name={field.name}
                    value={option.value}
                    checked={active}
                    onChange={() => onChange(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={`${optionClass(active)} peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/40`}
                  >
                    <Indicator active={active} />
                    <span className="min-w-0">
                      <span className="block">{option.label}</span>
                      {option.hint && (
                        <span
                          className={`mt-0.5 block text-[11.5px] font-medium ${
                            active ? 'text-brand-700' : 'text-ink-400'
                          }`}
                        >
                          {option.hint}
                        </span>
                      )}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {error ? (
          <p
            id={`field-${field.name}-error`}
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold text-red-700"
          >
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : field.hint ? (
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-400">{field.hint}</p>
        ) : null}
      </div>
    );
  }

  /* Checkbox group ---------------------------------------------------- */
  if (field.kind === 'checkboxes' && field.options) {
    return (
      <div className="min-w-0">
        <fieldset className="min-w-0">
          <legend className="mb-1.5 block text-[13px] font-bold text-ink-700">
            {field.label} {field.required ? <span className="text-red-600">*</span> : null}
          </legend>
          <div
            role="group"
            aria-describedby={error ? `field-${field.name}-error` : undefined}
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {field.options.map((option) => {
              const active = selected.includes(option.value);
              return (
                <label key={option.value} className="block cursor-pointer">
                  <input
                    type="checkbox"
                    name={field.name}
                    value={option.value}
                    checked={active}
                    onChange={() => onToggle(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={`${optionClass(active)} peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600/40`}
                  >
                    <BoxIndicator active={active} />
                    <span className="min-w-0">{option.label}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
        {error ? (
          <p
            id={`field-${field.name}-error`}
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-[12px] font-semibold text-red-700"
          >
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : field.hint ? (
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-400">{field.hint}</p>
        ) : null}
      </div>
    );
  }

  /* Everything else uses a plain labelled control. --------------------- */
  const id = `field-${field.name}`;
  // Shared props only. `onChange` is declared per control below because the
  // event type differs between input, textarea and select.
  const common = {
    id,
    name: field.name,
    value: typeof value === 'string' ? value : '',
    placeholder: field.placeholder,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  };

  let control: React.ReactNode;

  if (field.kind === 'textarea') {
    control = (
      <textarea
        {...common}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        ref={registerRef}
        className={`${controlClass(error)} resize-y leading-relaxed`}
      />
    );
  } else if (field.kind === 'select' && field.options) {
    control = (
      <select
        {...common}
        onChange={(e) => onChange(e.target.value)}
        ref={registerRef}
        className={`${controlClass(error)} appearance-none bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10`}
        style={CHEVRON_BG}
      >
        <option value="">— বেছে নিন —</option>
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else if (field.kind === 'date') {
    control = (
      <input
        {...common}
        type="date"
        min={new Date().toISOString().slice(0, 10)}
        onChange={(e) => onChange(e.target.value)}
        ref={registerRef}
        className={controlClass(error)}
      />
    );
  } else if (field.kind === 'number') {
    control = (
      <input
        {...common}
        type="number"
        inputMode="numeric"
        onChange={(e) => onChange(e.target.value)}
        ref={registerRef}
        className={controlClass(error)}
      />
    );
  } else {
    control = (
      <input
        {...common}
        type="text"
        onChange={(e) => onChange(e.target.value)}
        ref={registerRef}
        className={controlClass(error)}
      />
    );
  }

  return (
    <div className="min-w-0">
      <Field id={id} label={field.label} required={field.required} hint={field.hint} error={error}>
        {control}
      </Field>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Success panel                                                              */
/* -------------------------------------------------------------------------- */

function SuccessPanel({
  config,
  form,
  reference,
  copied,
  onCopy,
  onReset,
}: {
  config: ServiceRequestPageConfig;
  form: FormState;
  reference: string | null;
  copied: boolean;
  onCopy: () => void;
  onReset: () => void;
}) {
  const answers: Answers = { ...form.answers, serviceType: form.serviceType };
  const summary = formatAnswersBn(config, answers);
  const areaName = getAreaById(form.locations.work.areaId)?.nameBn;

  return (
    <div className="rounded-2xl border border-brand-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"
        >
          <CheckCircle2 className="h-7 w-7" />
        </span>

        <h3 className="mt-4 text-lg font-extrabold tracking-tight text-ink-900 sm:text-xl">
          আপনার সেবা অনুরোধটি সফলভাবে পাঠানো হয়েছে।
        </h3>

        <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-ink-600">
          {config.title} অনুরোধটি আমাদের টিমের তালিকায় জমা হয়েছে। যাচাই করার পর
          আপনার মোবাইল নম্বরে ফোন করে দাম ও সময় জানানো হবে।
        </p>

        {reference && (
          <div className="mt-5 w-full max-w-sm rounded-xl border border-brand-200 bg-mist-50 px-4 py-3.5">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              রেফারেন্স নম্বর
            </p>
            <div className="mt-1.5 flex items-center justify-center gap-2">
              <span className="font-mono text-lg font-bold tracking-wider text-brand-800">
                {reference}
              </span>
              <button
                type="button"
                onClick={onCopy}
                aria-label="রেফারেন্স নম্বর কপি করুন"
                className={`rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-brand-700 ${LIGHT_FOCUS}`}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-400">
              ফোনে যোগাযোগের সময় এই নম্বরটি বলে দিলে দ্রুত খুঁজে পাওয়া যাবে।
            </p>
          </div>
        )}
      </div>

      {/* Recap, so the user can spot a typo before the call arrives. */}
      {(summary.length > 0 || areaName) && (
        <div className="mt-6 rounded-xl border border-brand-100 bg-mist-50 p-4">
          <p className="text-[12px] font-extrabold uppercase tracking-wide text-ink-400">
            আপনার পাঠানো তথ্য
          </p>
          <dl className="mt-2.5 space-y-1.5">
            {summary.map((line) => (
              <div key={line} className="text-[12.5px] leading-relaxed text-ink-600">
                {line}
              </div>
            ))}
            {areaName && (
              <div className="text-[12.5px] leading-relaxed text-ink-600">
                এলাকা: {areaName}
              </div>
            )}
            {form.preferredDate && (
              <div className="text-[12.5px] leading-relaxed text-ink-600">
                তারিখ: {form.preferredDate}
                {form.preferredTime ? `, ${form.preferredTime}` : ''}
              </div>
            )}
            {form.details.trim() && (
              <div className="pt-1 text-[12.5px] leading-relaxed text-ink-600">
                <span className="font-bold text-ink-700">আপনার লেখা:</span>
                <span className="mt-0.5 block whitespace-pre-line">{form.details}</span>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          href="/profile/requests"
          className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
        >
          আমার সব অনুরোধ দেখুন
        </Link>
        <button
          type="button"
          onClick={onReset}
          className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 text-[13.5px] font-bold text-brand-700 transition-colors hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          আরেকটি অনুরোধ পাঠান
        </button>
      </div>
    </div>
  );
}