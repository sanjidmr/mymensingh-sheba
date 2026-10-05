'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { createToletRequest } from '@/lib/tolet-service';
import type { UserProfile } from '@/lib/supabase/types';
import { getAllMCCAreas } from '@/lib/locations';

const PREFERRED_TIMES = [
  'সকাল (৯টা – ১২টা)',
  'দুপুর (১২টা – ৩টা)',
  'বিকেল (৩টা – ৬টা)',
  'সন্ধ্যা (৬টা – ৮টা)',
  'যেকোনো সময়',
];

interface RequestSectionProps {
  listingId: string;
  user: UserProfile | null;
}

export function RequestSection({ listingId, user }: RequestSectionProps) {
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visitorName, setVisitorName] = useState(user?.fullName || '');
  const [visitorPhone, setVisitorPhone] = useState(user?.phone || '');
  const [visitorArea, setVisitorArea] = useState(user?.primaryAreaId || '');
  const [preferredTime, setPreferredTime] = useState('');
  const [visitorNote, setVisitorNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRequestError('');
    setSubmitting(true);
    const result = await createToletRequest({
      listingId,
      customerId: user.id,
      customerName: visitorName.trim(),
      customerPhone: visitorPhone.trim(),
      areaId: visitorArea || undefined,
      message: visitorNote.trim(),
      preferredTime: preferredTime || undefined,
    });
    setSubmitting(false);
    if (result.success) setRequestSent(true);
    else setRequestError(result.error || 'অনুরোধ পাঠাতে ব্যর্থ হয়েছে।');
  };

  return (
    <section
      aria-labelledby="tolet-request-heading"
      className="rounded-xl border border-brand-100 bg-white p-4 sm:p-5"
    >
      <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-brand-700">
        <Lock className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
        <span>নিরাপদ যোগাযোগ প্রোটোকল</span>
      </p>

      <h2
        id="tolet-request-heading"
        className="mt-1.5 text-[15px] font-extrabold text-ink-900 sm:text-[17px]"
      >
        বাসা দেখার অনুরোধ পাঠান
      </h2>

      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-500">
        স্প্যাম ও হয়রানি রোধে মালিকের ফোন নম্বর সরাসরি উন্মুক্ত নয়। আপনার অনুরোধ প্ল্যাটফর্মের মাধ্যমে
        বিজ্ঞাপনদাতার কাছে পৌঁছাবে।
      </p>

      {requestSent ? (
        <div className="mt-3.5 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3.5 text-center">
          <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-brand-600" aria-hidden="true" />
          <div className="text-[13px] font-extrabold text-brand-900">অনুরোধ জমা হয়েছে!</div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-brand-800">
            আপনার তথ্য বিজ্ঞাপনদাতার কাছে পাঠানো হয়েছে। তিনি শীঘ্রই যোগাযোগ করবেন।
          </p>
          <Link
            href="/profile/requests"
            className="mt-2 inline-block text-[11.5px] font-bold text-brand-800 underline underline-offset-2"
          >
            আমার অনুরোধ দেখুন
          </Link>
        </div>
      ) : !user ? (
        <div className="mt-3.5 rounded-lg border border-brand-100 bg-mist-50 px-3.5 py-3.5 text-center">
          <Lock className="mx-auto mb-2 h-6 w-6 text-brand-400" aria-hidden="true" />
          <p className="mb-3 text-[11.5px] leading-relaxed text-ink-500">
            বাসা দেখার অনুরোধ পাঠাতে অ্যাকাউন্টে লগইন করুন। আপনার তথ্য গোপন রাখা হবে।
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-brand-700 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:flex-none"
            >
              লগইন করুন
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-brand-300 bg-white px-4 text-[12.5px] font-bold text-brand-800 transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:flex-none"
            >
              অ্যাকাউন্ট খুলুন
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="tolet-req-name" className="mb-1 block text-[11.5px] font-bold text-ink-700">
                আপনার নাম
              </label>
              <input
                id="tolet-req-name"
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="পূর্ণ নাম"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="tolet-req-phone" className="mb-1 block text-[11.5px] font-bold text-ink-700">
                মোবাইল নম্বর
              </label>
              <input
                id="tolet-req-phone"
                type="tel"
                inputMode="tel"
                required
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="tolet-req-area" className="mb-1 block text-[11.5px] font-bold text-ink-700">
              আপনার এলাকা <span className="font-medium text-ink-400">(ঐচ্ছিক)</span>
            </label>
            <select
              id="tolet-req-area"
              value={visitorArea}
              onChange={(e) => setVisitorArea(e.target.value)}
              className={inputClass}
            >
              <option value="">এলাকা নির্বাচন করুন</option>
              {getAllMCCAreas({ activeOnly: true }).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tolet-req-time" className="mb-1 block text-[11.5px] font-bold text-ink-700">
              পছন্দের সময়
            </label>
            <select
              id="tolet-req-time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className={inputClass}
            >
              <option value="">যেকোনো সময়</option>
              {PREFERRED_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tolet-req-note" className="mb-1 block text-[11.5px] font-bold text-ink-700">
              প্রশ্ন বা নোট <span className="font-medium text-ink-400">(ঐচ্ছিক)</span>
            </label>
            <textarea
              id="tolet-req-note"
              rows={2}
              value={visitorNote}
              onChange={(e) => setVisitorNote(e.target.value)}
              placeholder="যেমন: শুক্রবার বিকেলে দেখতে চাই..."
              className={`${inputClass} min-h-[4.5rem] resize-y`}
            />
          </div>

          {requestError && (
            <p role="alert" className="text-[11.5px] font-semibold text-rose-700">
              {requestError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{submitting ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}</span>
          </button>
        </form>
      )}
    </section>
  );
}

/** One field style, so name / phone / area / time / note can never drift apart. */
const inputClass =
  'w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25';