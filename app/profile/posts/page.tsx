import { Suspense } from 'react';
import type { Metadata } from 'next';
import MyPosts from './MyPosts';

export const metadata: Metadata = {
  title: 'আমার পোস্ট — ময়মনসিংহ শেবা',
  robots: { index: false, follow: false },
};

export default function Page() {
  // `MyPosts` reads `?submitted=` to confirm the write landed, which needs a
  // client boundary for static rendering.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mist-50">
          <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-xl bg-mist-100" />
        </div>
      }
    >
      <MyPosts />
    </Suspense>
  );
}
