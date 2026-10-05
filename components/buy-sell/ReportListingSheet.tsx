'use client';

/**
 * The marketplace "report this listing" sheet.
 *
 * A separate component rather than a reuse of `components/tolet/ReportSheet`
 * for two reasons: the reasons list is marketplace-specific (a wrong price, a
 * stolen photo, a seller who will not hand the item over), and the insert
 * targets a different table because `listing_reports` is FK-bound to
 * `tolet_listings`.
 *
 * A sheet rather than a page, because reporting is a correction, not a
 * destination — a reader who spotted something wrong wants to say so and get
 * back to what they were doing.
 *
 * The reason list is a required radio group, not a free-text field on its own.
 * A report with a structured reason can be triaged and counted; "ভালো না" cannot.
 * The free text is for the detail only.
 */

import React, { useState } from 'react';
import { CheckCircle2, Flag, Loader2, X } from 'lucide-react';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { createCommunityPostReport } from '@/lib/catalog-service';

const REASONS = [
  { id: 'fake', labelBn: 'স্প্যাম বা ভুয়া বিজ্ঞাপন' },
  { id: 'price', labelBn: 'দাম বা তথ্য ভুল বলা হয়েছে' },
  { id: 'photo', labelBn: 'ছবি অন্য পণ্যের' },
  { id: 'gone', labelBn: 'পণ্য আর নেই / বিক্রি হয়ে গেছে' },
  { id: 'abuse', labelBn: 'অপ্রীতিকর বা হয়রানির বার্তা' },
  { id: 'other', labelBn: 'অন্যান্য' },
];

interface ReportListingSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  reporterId: string | null;
  reporterName: string;
}

export function ReportListingSheet({
  open,
  onClose,
  postId,
  postTitle,
  reporterId,
  reporterName,
}: ReportListingSheetProps) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError('অনুগ্রহ করে একটি কারণ বেছে নিন।');
      return;
    }
    setSending(true);
    setError('');
    const result = await createCommunityPostReport({
      postId,
      reporterId,
      reporterName,
      reason: REASONS.find((r) => r.id === reason)?.labelBn ?? reason,
      details,
    });
    setSending(false);
    if (result.success) setDone(true);
    else setError(result.error ?? 'রিপোর্ট পাঠাতে ব্যর্থ হয়েছে।');
  }

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
        aria-labelledby="market-report-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white sm:max-w-md sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between rounded-t-xl border-b border-mist-200 bg-white px-4 py-3.5">
          <h2
            id="market-report-title"
            className="flex items-center gap-2 text-[14px] font-extrabold text-ink-900"
          >
            <Flag className="h-4 w-4 text-rose-600" aria-hidden="true" />
            বিজ্ঞাপন রিপোর্ট করুন
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="বন্ধ করুন"
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-mist-100 ${LIGHT_FOCUS}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-7 text-center">
            <CheckCircle2 className="mx-auto h-9 w-9 text-brand-600" aria-hidden="true" />
            <h3 className="mt-2.5 text-[14.5px] font-extrabold text-ink-900">রিপোর্ট পাঠানো হয়েছে</h3>
            <p className="mx-auto mt-1.5 max-w-xs text-[12.5px] leading-relaxed text-ink-500">
              অ্যাডমিন বিজ্ঞাপনটি যাচাই করে প্রয়োজনে সরিয়ে দেবেন। ধন্যবাদ।
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-700 px-5 text-[13px] font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
            >
              ঠিক আছে
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-5">
            <p className="rounded-lg bg-mist-50 px-3 py-2 text-[12px] leading-relaxed text-ink-600">
              বিজ্ঞাপন: <span className="font-bold text-ink-900">{postTitle}</span>
            </p>

            <fieldset>
              <legend className="mb-2 text-[12.5px] font-bold text-ink-900">
                কারণ <span className="text-rose-600">*</span>
              </legend>
              <div className="space-y-1">
                {REASONS.map((option) => (
                  <label
                    key={option.id}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3 transition-colors ${
                      reason === option.id
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-mist-200 hover:bg-mist-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="market-report-reason"
                      value={option.id}
                      checked={reason === option.id}
                      onChange={() => setReason(option.id)}
                      className="h-4 w-4 shrink-0 accent-brand-700"
                    />
                    <span className="text-[13px] text-ink-800">{option.labelBn}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-[12.5px] font-bold text-ink-900">
                বিস্তারিত <span className="text-[11px] font-medium text-ink-400">(ঐচ্ছিক)</span>
              </span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="যা দেখেছেন তা লিখুন…"
                className="w-full rounded-xl border border-mist-200 px-3 py-2.5 text-[13.5px] leading-relaxed text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12.5px] font-medium text-rose-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 text-[13.5px] font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 ${LIGHT_FOCUS}`}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  পাঠানো হচ্ছে…
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" aria-hidden="true" />
                  রিপোর্ট পাঠান
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}