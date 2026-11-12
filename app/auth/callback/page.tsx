import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthCallbackContent from './AuthCallbackContent';

export const metadata: Metadata = {
  title: 'অ্যাকাউন্ট যাচাই — Mymensingh Sheba',
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<main className="p-8 text-center">অ্যাকাউন্ট যাচাই করা হচ্ছে…</main>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
