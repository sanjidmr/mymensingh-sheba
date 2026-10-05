'use client';

/**
 * The "request this tutor" form on a tutor profile.
 *
 * Restyled onto the brand tokens, off the old `emerald-*` / `slate-*` palette.
 * This is not cosmetic housekeeping: the form lives inside the same sticky
 * column as `TutorSalaryCard`, so while it was still emerald the page showed
 * two different greens a few centimetres apart — `emerald-800` (#065f46) and
 * `brand-700` (#0c3b2e) are close enough to look like one colour being used
 * badly rather than two tokens that were never reconciled.
 *
 * The privacy line is load-bearing, not reassurance copy: the tutor's number is
 * never published, so this form is the only path from "I want this tutor" to an
 * actual phone call, and it goes through an admin.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  CheckCircle2,
  Loader2,
  GraduationCap,
  Clock,
  User,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import LocationSelectInput from '@/components/LocationSelectInput';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { TUTOR_CLASSES, TUTOR_SUBJECTS, TUTOR_TEACHING_MODES } from '@/lib/filter-definitions';
import { formatTutorFee } from '@/lib/home-tutor-types';

const TIME_SLOTS = [
  'সকাল (৯টা – ১২টা)',
  'দুপুর (১২টা – ৩টা)',
  'বিকেল (৩টা – ৬টা)',
  'সন্ধ্যা (৬টা – ৮টা)',
  'সন্ধ্যার পর (৮টা – ১০টা)',
  'যেকোনো সময়',
];

const BUDGET_OPTIONS = [
  '২,০০০৳ এর কম',
  '২,০০০ – ৪,০০০৳',
  '৪,০০০ – ৬,০০০৳',
  '৬,০০০৳ এর বেশি',
  'আলোচনা সাপেক্ষে',
];

const SELECT_CLASS =
  'w-full rounded-xl border border-mist-200 bg-white px-3.5 py-2.5 text-[13.5px] text-ink-900 outline-none transition-colors focus:border-brand-500';

const LABEL_CLASS = 'mb-1.5 block text-[12.5px] font-bold text-ink-800';

interface TutorRequestFormProps {
  tutor: HomeTutorProfile;
}

export default function TutorRequestForm({ tutor }: TutorRequestFormProps) {
  const { user, createServiceRequest } = useAuth();

  const [areaId, setAreaId] = useState('');
  const [classLevel, setClassLevel] = useState('middle');
  const [subject, setSubject] = useState('math');
  const [mode, setMode] = useState('both');
  const [preferredTime, setPreferredTime] = useState(TIME_SLOTS[2]);
  const [budget, setBudget] = useState(BUDGET_OPTIONS[2]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <section className="rounded-2xl border border-mist-200 bg-white p-5 text-center">
        <GraduationCap className="mx-auto h-9 w-9 text-brand-600" aria-hidden="true" />
        <h3 className="mt-2.5 text-[14.5px] font-extrabold text-ink-900">
          টিউশন রিকোয়েস্ট পাঠাতে লগইন করুন
        </h3>
        <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-ink-500">
          {tutor.fullName} এর প্রোফাইলে রিকোয়েস্ট পাঠাতে ময়মনসিংহ সেবা অ্যাকাউন্ট লাগবে।
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/home-tutor/${tutor.id}`)}`}
          className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-700 px-5 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          লগইন করুন
        </Link>
      </section>
    );
  }

  if (success) {
    return (
      <section className="rounded-2xl border border-brand-200 bg-white p-5 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-600" aria-hidden="true" />
        <h3 className="mt-2.5 text-[15px] font-extrabold text-ink-900">
          আপনার অনুরোধ পাঠানো হয়েছে
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-[12.5px] leading-relaxed text-ink-600">
          অ্যাডমিন টিম আপনার অনুরোধ যাচাই করে <strong>{tutor.fullName}</strong> এর সাথে
          যোগাযোগ সমন্বয় করবে। অবস্থা{' '}
          <Link href="/profile/requests" className="font-bold text-brand-700 underline">
            আমার অনুরোধ
          </Link>{' '}
          পাতায় দেখতে পারবেন।
        </p>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId) return;
    setLoading(true);
    const classLabel = TUTOR_CLASSES.find((c) => c.id === classLevel)?.labelBn || classLevel;
    const subjectLabel = TUTOR_SUBJECTS.find((s) => s.id === subject)?.labelBn || subject;
    const modeLabel = TUTOR_TEACHING_MODES.find((m) => m.id === mode)?.labelBn || mode;
    await createServiceRequest({
      serviceSlug: 'home-tutor',
      areaId,
      addressLine: '',
      contactName: user.fullName,
      contactPhone: user.phone,
      preferredTime,
      serviceType: subject,
      profileId: tutor.id,
      profileTitleBn: tutor.fullName,
      details: [
        `শ্রেণি: ${classLabel}`,
        `বিষয়: ${subjectLabel}`,
        `মাধ্যম: ${modeLabel}`,
        `মাসিক বাজেট: ${budget}`,
        note ? `অতিরিক্ত নোট: ${note}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
    });
    setLoading(false);
    setSuccess(true);
  };

  return (
    <section className="rounded-2xl border border-mist-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Send className="h-4 w-4" aria-hidden="true" />
        </span>
        <h3 className="text-[14.5px] font-extrabold text-ink-900">শিক্ষকের অনুরোধ পাঠান</h3>
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">
        অ্যাডমিন টিম আপনার অনুরোধ যাচাই করে শিক্ষকের সাথে সমন্বয় করবে। শিক্ষকের নম্বর কখনোই
        প্রকাশ করা হয় না।
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
        {/* Name and number are read back from the profile rather than asked for
            again — the account already holds them, and re-typing a phone number
            on a phone keypad is the single most error-prone step in the flow. */}
        <div>
          <span className={LABEL_CLASS}>আপনার নাম</span>
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-mist-200 bg-mist-50 px-3.5 py-2.5 text-[13.5px] text-ink-800">
            <User className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">{user.fullName}</span>
          </div>
        </div>

        <div>
          <span className={LABEL_CLASS}>যোগাযোগের নম্বর</span>
          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-mist-200 bg-mist-50 px-3.5 py-2.5 text-[13.5px] text-ink-800">
            <Phone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
            <span className="truncate">{user.phone}</span>
          </div>
        </div>

        <div>
          <LocationSelectInput
            value={areaId || null}
            onChange={(value) => setAreaId(value ?? '')}
            label="পড়ানোর এলাকা *"
            placeholder="এলাকা নির্বাচন করুন"
            size="md"
          />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="tutor-req-class" className={LABEL_CLASS}>
              শিক্ষার্থীর শ্রেণি
            </label>
            <select
              id="tutor-req-class"
              value={classLevel}
              onChange={(e) => setClassLevel(e.target.value)}
              className={SELECT_CLASS}
            >
              {TUTOR_CLASSES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.labelBn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tutor-req-subject" className={LABEL_CLASS}>
              বিষয়
            </label>
            <select
              id="tutor-req-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={SELECT_CLASS}
            >
              {TUTOR_SUBJECTS.filter((s) => s.id !== 'all').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.labelBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor="tutor-req-mode" className={LABEL_CLASS}>
              পড়ানোর মাধ্যম
            </label>
            <select
              id="tutor-req-mode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className={SELECT_CLASS}
            >
              {TUTOR_TEACHING_MODES.filter((m) => m.id !== 'all').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.labelBn}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tutor-req-time" className={LABEL_CLASS}>
              পছন্দের সময়
            </label>
            <select
              id="tutor-req-time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className={SELECT_CLASS}
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="tutor-req-budget" className={LABEL_CLASS}>
            মাসিক বাজেট
          </label>
          <select
            id="tutor-req-budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={SELECT_CLASS}
          >
            {BUDGET_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-ink-500">
            শিক্ষকের প্রত্যাশিত বেতন:{' '}
            <strong className="font-bold text-ink-700">
              {formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax)}
            </strong>
          </p>
        </div>

        <div>
          <label htmlFor="tutor-req-note" className={LABEL_CLASS}>
            অতিরিক্ত তথ্য <span className="text-[11px] font-medium text-ink-400">(ঐচ্ছিক)</span>
          </label>
          <textarea
            id="tutor-req-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            placeholder="যেমন: মহিলা শিক্ষক হলে ভালো, দুর্বল গণিতের ভিত্তি আছে…"
            className="w-full rounded-xl border border-mist-200 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
          />
        </div>

        {!areaId && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11.5px] leading-relaxed text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>রিকোয়েস্ট পাঠাতে আগে এলাকা নির্বাচন করুন।</span>
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !areaId}
          className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-50 ${LIGHT_FOCUS}`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'পাঠানো হচ্ছে…' : 'অনুরোধ পাঠান'}
        </button>

        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          অ্যাডমিন ভেরিফিকেশন শেষে সাধারণত ২৪ ঘণ্টার মধ্যে যোগাযোগ করা হয়।
        </p>
      </form>
    </section>
  );
}