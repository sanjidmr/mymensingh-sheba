'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-5 py-12 text-center">
      <h1 className="text-2xl font-extrabold text-ink-900">পাতাটি খুঁজে পাওয়া যায়নি</h1>
      <p className="max-w-lg text-sm leading-6 text-ink-600">
        This page may have moved or no longer exists. আবার চেষ্টা করুন অথবা হোম পেজে যান।
      </p>
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => router.refresh()} className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white">
          Try again
        </button>
        <Link href="/" className="font-semibold text-brand-700 underline">Home</Link>
      </div>
    </main>
  );
}
