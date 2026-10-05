'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Flag, CheckCircle2, Loader2, Check } from 'lucide-react';
import { createListingReport } from '@/lib/tolet-service';
import type { UserProfile } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const REPORT_REASONS = [
  'স্প্যাম বা ভুয়া বিজ্ঞাপন',
  'ভাড়া বা শর্ত সম্পর্কে ভুল তথ্য',
  'ছবি ও সম্পত্তি মিলছে না',
  'নিরাপত্তা বা জালিয়াতির উদ্বেগ',
  'অন্যান্য',
];

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  user: UserProfile | null;
}

export function ReportSheet({ open, onClose, listingId, user }: ReportSheetProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('অনুগ্রহ করে কারণ নির্বাচন করুন।');
      return;
    }
    setSending(true);
    setError('');
    const result = await createListingReport({
      listingId,
      reporterId: user?.id || null,
      reporterName: user?.fullName || 'অতিথি',
      reason,
      details: details.trim(),
    });
    setSending(false);
    if (result.success) setDone(true);
    else setError(result.error || 'রিপোর্ট পাঠাতে ব্যর্থ হয়েছে।');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      {/* `role="dialog"` + `aria-modal`: the sheet is a modal layer, and this is
          what tells a screen reader the page behind it is inert. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tolet-report-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white sm:max-w-md sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between rounded-t-xl border-b border-brand-100 bg-white px-4 py-3.5 sm:px-5">
          <h2
            id="tolet-report-title"
            className="flex items-center gap-2 text-[14px] font-extrabold text-ink-900"
          >
            <Flag className="h-4 w-4 text-rose-600" aria-hidden="true" />
            <span>বিজ্ঞাপন রিপোর্ট করুন</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-mist-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {done ? (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3.5 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-7 w-7 text-brand-600" aria-hidden="true" />
              <div className="text-[13px] font-extrabold text-brand-900">রিপোর্ট জমা হয়েছে</div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-brand-800">
                অ্যাডমিন টিম বিষয়টি পর্যালোচনা করবে। আপনার রিপোর্টের জন্য ধন্যবাদ।
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-700 px-4 text-[12.5px] font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                বন্ধ করুন
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <p className="text-[11.5px] leading-relaxed text-ink-500">
                বিজ্ঞাপনে কোনো সমস্যা থাকলে নিচের ফর্মটি পূরণ করুন। ভুয়া রিপোর্টেরও ব্যবস্থা নেওয়া হবে।
              </p>

              <fieldset>
                <legend className="mb-2 text-[11.5px] font-bold text-ink-700">
                  কারণ <span className="text-rose-600">*</span>
                </legend>
                <div className="space-y-2">
                  {REPORT_REASONS.map((r) => {
                    const selected = reason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setReason(r);
                          setError('');
                        }}
                        className={cn(
                          'flex min-h-11 w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[12.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
                          selected
                            ? 'border-rose-300 bg-rose-50 text-rose-900'
                            : 'border-brand-200 bg-white text-ink-700 hover:border-brand-400'
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                            selected ? 'border-rose-600 bg-rose-600' : 'border-brand-300 bg-white'
                          )}
                        >
                          {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />}
                        </span>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label
                  htmlFor="tolet-report-details"
                  className="mb-1 block text-[11.5px] font-bold text-ink-700"
                >
                  বিস্তারিত <span className="font-medium text-ink-400">(ঐচ্ছিক)</span>
                </label>
                <textarea
                  id="tolet-report-details"
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="কী সমস্যা হচ্ছে তা সংক্ষেপে লিখুন..."
                  className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-[13px] text-ink-900 placeholder:text-ink-300 transition-colors focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/25"
                />
              </div>

              {!user && (
                <p className="rounded-lg border border-brand-100 bg-mist-50 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
                  আপনি লগইন না করেই রিপোর্ট পাঠাতে পারবেন।{' '}
                  <Link href="/login" className="font-bold text-brand-800 underline underline-offset-2">
                    লগইন
                  </Link>{' '}
                  করলে রিপোর্টের সাথে অ্যাকাউন্ট যুক্ত থাকবে।
                </p>
              )}

              {error && (
                <p role="alert" className="text-[11.5px] font-semibold text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-rose-700 px-4 text-[13px] font-extrabold text-white transition-colors hover:bg-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Flag className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{sending ? 'পাঠানো হচ্ছে...' : 'রিপোর্ট পাঠান'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}