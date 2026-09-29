'use client';

import { useRef, useState, useTransition } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Send,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import {
  CONTACT_SUBJECTS,
  CONTACT_FIELD_ORDER,
  EMPTY_CONTACT_FORM,
  MESSAGE_MAX,
  hasContactErrors,
  validateContactForm,
  type ContactField,
  type ContactFieldErrors,
  type ContactFormValues,
} from '@/lib/contact-types';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { sendContactMessage, type ContactActionState } from '@/app/contact/actions';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/** Shared control chrome — tall enough to hit comfortably on a phone. */
const CONTROL =
  'w-full min-h-[48px] rounded-lg border bg-mist-50 px-3.5 py-2.5 text-[15px] text-ink-900 placeholder:text-ink-400 transition-colors duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/25 sm:text-sm';

function controlClass(error?: string): string {
  return `${CONTROL} ${
    error
      ? 'border-red-400 focus:border-red-500'
      : 'border-brand-100 hover:border-brand-200 focus:border-brand-600'
  }`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-700">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

/**
 * ContactForm — the focal point of the /contact page.
 *
 * Client-side validation gives immediate feedback (per field on blur, all
 * fields on submit) and the server action re-validates everything, so a failed
 * round-trip still highlights the exact inputs that need attention and moves
 * focus to the first one.
 */
export default function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(EMPTY_CONTACT_FORM);
  const [errors, setErrors] = useState<ContactFieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [formError, setFormError] = useState('');
  const [fallbackEmail, setFallbackEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fieldRefs = useRef<Partial<Record<ContactField, HTMLElement | null>>>({});
  const formRef = useRef<HTMLFormElement | null>(null);

  const setField = (field: ContactField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  /** Re-validate a field live once it has already been marked invalid. */
  const onBlur = (field: ContactField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = validateContactForm(values);
      return { ...prev, [field]: next[field] };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFallbackEmail(null);

    const nextErrors = validateContactForm(values);
    setErrors(nextErrors);

    if (hasContactErrors(nextErrors)) {
      setStatus('error');
      setFormError('কিছু তথ্য ঠিক করতে হবে। চিহ্নিত ঘরগুলো দেখুন।');
      const firstBad = CONTACT_FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstBad) fieldRefs.current[firstBad]?.focus();
      return;
    }

    setStatus('submitting');
    setFormError('');

    startTransition(async () => {
      const result: ContactActionState = await sendContactMessage(values);

      if (result.status === 'success') {
        setStatus('success');
        return;
      }

      setStatus('error');
      setErrors(result.errors);
      setFormError(result.formErrorBn);
      setFallbackEmail(result.fallbackEmail);

      if (result.fallbackEmail) {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const firstBad = CONTACT_FIELD_ORDER.find((field) => result.errors[field]);
        if (firstBad) fieldRefs.current[firstBad]?.focus();
      }
    });
  };

  const reset = () => {
    setValues(EMPTY_CONTACT_FORM);
    setErrors({});
    setStatus('idle');
    setFormError('');
    setFallbackEmail(null);
  };

  // --- Success panel -------------------------------------------------------
  if (status === 'success') {
    return (
      <div
        id="contact-form"
        className="rounded-2xl border border-brand-200 bg-white p-5 sm:p-8"
      >
        <div className="flex flex-col items-center text-center sm:py-4">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"
          >
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            বার্তাটি পৌঁছে গেছে
          </h2>
          <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-ink-600">
            আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। খুব শিগগিরই আমরা আপনার সাথে
            যোগাযোগ করার চেষ্টা করব।
          </p>
          <p className="mt-1.5 text-xs text-ink-400">
            বিষয়: {CONTACT_SUBJECTS.find((s) => s.value === values.subject)?.labelBn}
          </p>

          <button
            type="button"
            onClick={reset}
            className={`mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-brand-200 px-5 text-sm font-bold text-brand-700 transition-colors hover:border-brand-300 hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            আরেকটি বার্তা পাঠান
          </button>
        </div>
      </div>
    );
  }

  const disabled = status === 'submitting' || isPending;

  return (
    <form
      ref={formRef}
      id="contact-form"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby="contact-form-heading"
      className="scroll-mt-24 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="contact-form-heading"
            className="text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl"
          >
            আপনার বার্তা পাঠান
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            ঘরগুলো পূরণ করে নিচের বোতামে চাপ দিন।
          </p>
        </div>
        <p className="text-xs font-medium text-ink-400">
          <span className="text-red-600">*</span> আবশ্যক ক্ষেত্র
        </p>
      </div>

      {/* Whole-form problem (server rejected it, or storage unavailable). */}
      {formError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5"
        >
          <AlertCircle className="mt-px h-4 w-4 shrink-0 text-red-700" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-relaxed text-red-800">
              {formError}
            </p>
            {fallbackEmail && (
              <a
                href={`mailto:${fallbackEmail}`}
                className="mt-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-red-700 px-3 text-xs font-bold text-white transition-colors hover:bg-red-800"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {fallbackEmail}
              </a>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        {/* Name + phone share a row on wider phones, stack on the narrowest. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="contact-name"
              className="mb-1.5 block text-[13px] font-bold text-ink-700"
            >
              আপনার নাম <span className="text-red-600">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              ref={(el) => {
                fieldRefs.current.name = el;
              }}
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => onBlur('name')}
              placeholder="যেমন: রহিম উদ্দিন"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              className={controlClass(errors.name)}
            />
            <FieldError id="contact-name-error" message={errors.name} />
          </div>

          <div>
            <label
              htmlFor="contact-phone"
              className="mb-1.5 block text-[13px] font-bold text-ink-700"
            >
              মোবাইল নম্বর <span className="text-red-600">*</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              ref={(el) => {
                fieldRefs.current.phone = el;
              }}
              value={values.phone}
              onChange={(e) => setField('phone', e.target.value)}
              onBlur={() => onBlur('phone')}
              placeholder="01XXXXXXXXX"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
              className={controlClass(errors.phone)}
            />
            <FieldError id="contact-phone-error" message={errors.phone} />
          </div>
        </div>

        {/* Email (optional) */}
        <div>
          <label
            htmlFor="contact-email"
            className="mb-1.5 block text-[13px] font-bold text-ink-700"
          >
            ইমেইল{' '}
            <span className="font-medium text-ink-400">(ঐচ্ছিক)</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            ref={(el) => {
              fieldRefs.current.email = el;
            }}
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => onBlur('email')}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className={controlClass(errors.email)}
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>

        {/* Subject */}
        <div>
          <label
            htmlFor="contact-subject"
            className="mb-1.5 block text-[13px] font-bold text-ink-700"
          >
            আপনি কী বিষয়ে যোগাযোগ করছেন? <span className="text-red-600">*</span>
          </label>
          <select
            id="contact-subject"
            name="subject"
            ref={(el) => {
              fieldRefs.current.subject = el;
            }}
            value={values.subject}
            onChange={(e) => setField('subject', e.target.value)}
            onBlur={() => onBlur('subject')}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
            className={`${controlClass(errors.subject)} appearance-none bg-[length:16px] bg-[right_0.85rem_center] bg-no-repeat pr-10`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237d8b81' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
            }}
          >
            <option value="">— বিষয় নির্বাচন করুন —</option>
            {CONTACT_SUBJECTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.labelBn}
              </option>
            ))}
          </select>
          <FieldError id="contact-subject-error" message={errors.subject} />
        </div>

        {/* Message */}
        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-[13px] font-bold text-ink-700"
          >
            আপনার বার্তা <span className="text-red-600">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            ref={(el) => {
              fieldRefs.current.message = el;
            }}
            value={values.message}
            onChange={(e) => setField('message', e.target.value)}
            onBlur={() => onBlur('message')}
            placeholder="যত বিস্তারিত লিখবেন, তত দ্রুত ও নির্ভুলভাবে সাহায্য করতে পারব।"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={
              errors.message ? 'contact-message-error contact-message-count' : 'contact-message-count'
            }
            className={`${controlClass(errors.message)} min-h-[140px] resize-y leading-relaxed`}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <FieldError id="contact-message-error" message={errors.message} />
            <span
              id="contact-message-count"
              className="ml-auto shrink-0 text-[11px] tabular-nums text-ink-400"
            >
              {values.message.length}/{MESSAGE_MAX}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className={`mt-6 inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-6 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-70 ${LIGHT_FOCUS}`}
      >
        {disabled ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            পাঠানো হচ্ছে…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            বার্তা পাঠান
          </>
        )}
      </button>

      <p className="mt-3.5 text-center text-[11.5px] leading-relaxed text-ink-400">
        আপনার তথ্য শুধু আপনার অনুরোধ সামলানোর জন্য ব্যবহার করা হবে।
      </p>
    </form>
  );
}
