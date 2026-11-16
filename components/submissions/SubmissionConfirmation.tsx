'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import Footer from '@/components/Footer';

export interface SubmissionConfirmationProps {
  type: 'post' | 'profile';
  id: string;
  serviceName?: string;
  reminder?: string;
  summary?: string[];
  footer?: boolean;
  notice?: string;
}

export default function SubmissionConfirmation({
  type,
  id,
  serviceName,
  reminder,
  summary = [],
  footer = false,
  notice,
}: SubmissionConfirmationProps) {
  useEffect(() => {
    document.body.dataset.submissionSuccess = 'true';
    const showTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('mms:submission-confirmation', { detail: true }));
    }, 0);
    return () => {
      window.clearTimeout(showTimer);
      delete document.body.dataset.submissionSuccess;
      window.dispatchEvent(new CustomEvent('mms:submission-confirmation', { detail: false }));
    };
  }, []);

  const isPost = type === 'post';
  const heading = isPost
    ? 'আপনার পোস্ট সফলভাবে জমা হয়েছে!'
    : 'আপনার প্রোফাইল সফলভাবে জমা হয়েছে!';
  const message = isPost
    ? 'আপনার পোস্টটি সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করার পর এটি সবার জন্য প্রকাশিত হবে।'
    : `আপনার ${serviceName ?? 'সেবা'} প্রোফাইলটি সফলভাবে জমা হয়েছে। অ্যাডমিন যাচাই করার পর এটি সবার জন্য প্রকাশিত হবে।`;

  return (
    <div
      data-submission-confirmation
      className="flex min-h-screen w-full flex-col bg-mist-50"
      role="status"
      aria-live="polite"
    >
      <main className="mx-auto flex w-full max-w-3xl flex-1 items-center justify-center px-3 py-6 sm:px-5 sm:py-10">
        <section className="mms-welcome-card w-full max-w-xl rounded-2xl border border-brand-200 bg-white px-4 py-6 text-center shadow-lg shadow-brand-900/5 sm:px-8 sm:py-10">
          <span className="mms-welcome-ring mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <CheckCircle2 className="mms-welcome-check h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">
            {heading}
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-ink-600">
            {message}
          </p>

          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-brand-200 bg-mist-50 px-4 py-3.5">
            <p className="text-xs font-bold text-ink-500">
              {isPost ? 'আপনার পোস্ট আইডি' : 'আপনার প্রোফাইল আইডি'}
            </p>
            <p className="mt-1 break-all font-mono text-lg font-extrabold tracking-wide text-brand-800">
              {id}
            </p>
          </div>

          {reminder && (
            <p className="mx-auto mt-3 max-w-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-left text-xs leading-relaxed text-amber-900">
              {reminder}
            </p>
          )}

          {summary.length > 0 && (
            <div className="mx-auto mt-5 max-w-md rounded-xl border border-brand-100 bg-mist-50 p-3.5 text-left sm:p-4">
              <h2 className="text-xs font-extrabold text-ink-700">আপনার পাঠানো তথ্য</h2>
              <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-600">
                {summary.map((line, index) => (
                  <li key={`${index}-${line}`} className="break-words">{line}</li>
                ))}
              </ul>
            </div>
          )}

          {notice && (
            <p role="status" className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-amber-800">
              {notice}
            </p>
          )}

          <nav aria-label="পরবর্তী পদক্ষেপ" className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href={isPost ? '/dashboard/posts' : '/dashboard/profiles'}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800"
            >
              {isPost ? 'আমার পোস্টগুলো দেখুন' : 'আমার প্রোফাইল দেখুন'}
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-200 bg-white px-5 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50"
            >
              হোম পেজে যান
            </Link>
          </nav>
        </section>
      </main>
      {footer && <Footer />}
    </div>
  );
}
