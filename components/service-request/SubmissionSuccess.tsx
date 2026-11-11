'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, Copy } from 'lucide-react';
import type { ServiceRequestPageConfig } from '@/lib/service-request-pages';

export interface ServiceRequestSuccessData {
  reference: string | null;
  summary: string[];
  areaName?: string;
  preferredDate: string;
  preferredTime: string;
  details: string;
}

interface SubmissionSuccessProps {
  config?: ServiceRequestPageConfig;
  submission?: ServiceRequestSuccessData;
}

export default function SubmissionSuccess({ config, submission }: SubmissionSuccessProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!config || !submission) return;
    const showTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mms:service-request-success', { detail: true }));
    }, 0);
    return () => {
      window.clearTimeout(showTimer);
      window.dispatchEvent(new CustomEvent('mms:service-request-success', { detail: false }));
    };
  }, [config, submission]);

  const copyReference = async () => {
    if (!submission?.reference) return;
    try {
      await navigator.clipboard.writeText(submission.reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!config || !submission) {
    return (
      <div
        className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center px-4 py-10"
        role="status"
        aria-live="polite"
      >
        <div className="mms-welcome-card w-full max-w-lg rounded-2xl border border-brand-200 bg-white px-6 py-10 text-center shadow-sm">
          <span className="mms-welcome-ring mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <CheckCircle2 className="mms-welcome-check h-7 w-7" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-extrabold text-ink-900 sm:text-xl">
            আপনার অনুরোধ জমা হয়েছে।
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10"
      role="status"
      aria-live="polite"
    >
      <div className="mms-welcome-card w-full max-w-xl rounded-2xl border border-brand-200 bg-white px-5 py-8 text-center shadow-lg shadow-brand-900/5 sm:px-8 sm:py-10">
        <span className="mms-welcome-ring mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <CheckCircle2 className="mms-welcome-check h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
          আপনার অনুরোধ সফলভাবে জমা হয়েছে!
        </h1>
        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-ink-600">
          {config.title} সেবার অনুরোধটি আমাদের টিমের কাছে পৌঁছেছে। যাচাই করার পর
          আপনার দেওয়া মোবাইল নম্বরে যোগাযোগ করে সেবার সময় জানানো হবে।
        </p>

        {submission.reference && (
          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-brand-200 bg-mist-50 px-4 py-3.5">
            <p className="text-xs font-bold text-ink-500">আপনার অনুরোধ আইডি</p>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-mono text-lg font-extrabold tracking-wider text-brand-800">
                {submission.reference}
              </span>
              <button
                type="button"
                onClick={() => void copyReference()}
                aria-label="অনুরোধ আইডি কপি করুন"
                className="rounded-md p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              যোগাযোগের সময় এই আইডিটি বললে আপনার অনুরোধটি দ্রুত খুঁজে পাওয়া যাবে।
            </p>
          </div>
        )}

        {(submission.summary.length > 0 || submission.areaName || submission.preferredDate || submission.details) && (
          <div className="mx-auto mt-5 max-w-md rounded-xl border border-brand-100 bg-mist-50 p-4 text-left">
            <p className="text-xs font-extrabold text-ink-500">আপনার পাঠানো তথ্য</p>
            <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink-600">
              {submission.summary.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
              {submission.areaName && <p>এলাকা: {submission.areaName}</p>}
              {submission.preferredDate && (
                <p>
                  তারিখ: {submission.preferredDate}
                  {submission.preferredTime ? `, ${submission.preferredTime}` : ''}
                </p>
              )}
              {submission.details && (
                <p className="whitespace-pre-line">
                  <span className="font-bold text-ink-700">আপনার লেখা: </span>
                  {submission.details}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            হোম পেজে যান
          </Link>
          <Link
            href="/services"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-brand-200 bg-white px-5 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            আরও সেবা নিন
          </Link>
        </div>
      </div>
    </div>
  );
}
