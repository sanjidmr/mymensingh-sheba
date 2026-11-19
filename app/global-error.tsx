'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/client-error-reporting';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, { source: 'global-error-boundary', digest: error.digest });
  }, [error]);

  return (
    <html lang="bn">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#faf8f2] px-5 py-12 text-center font-sans text-slate-900">
        <h1 className="text-2xl font-extrabold">দুঃখিত, একটি সমস্যা হয়েছে</h1>
        <p className="max-w-lg text-sm leading-6 text-slate-600">
          Something went wrong. Please try again or return to the home page.
        </p>
        <div className="flex items-center gap-4">
          <button type="button" onClick={reset} className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white">
            Try again
          </button>
          <Link href="/" className="font-semibold text-emerald-800 underline">Home</Link>
        </div>
      </body>
    </html>
  );
}