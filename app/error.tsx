'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/client-error-reporting';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { source: 'app-error-boundary', digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-mist-50 px-5 py-12 text-center">
      <h1 className="text-2xl font-extrabold text-ink-900">দুঃখিত, একটি সমস্যা হয়েছে</h1>
      <p className="max-w-lg text-sm leading-6 text-ink-600">
        Something went wrong. আপনার কাজটি আবার চেষ্টা করুন, অথবা হোম পেজে ফিরে যান।
      </p>
      <div className="flex items-center gap-4">
        <button type="button" onClick={reset} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="font-semibold text-brand-700 underline">Home</Link>
      </div>
    </main>
  );
}
