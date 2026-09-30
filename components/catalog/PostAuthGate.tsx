'use client';

/**
 * Sign-in gate for the create / edit post routes.
 *
 * Those routes exist for a signed-in member, and the create route is marked
 * `noindex` because the resulting post is not public yet. A signed-out reader is
 * sent to login with a `next` pointing back here, so they land on the form they
 * were trying to fill rather than on the home page.
 *
 * The `next` value is a path on this site only — never an absolute URL — so a
 * crafted link cannot use the login form as an open redirect.
 */
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PostAuthGate({
  children,
  next,
}: {
  children: React.ReactNode;
  /** The path to return to after login. Defaults to the current route. */
  next?: string;
}) {
  const { user, isLoading: loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen bg-mist-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-3 py-10">
          <div className="h-64 animate-pulse rounded-xl bg-mist-100" aria-hidden="true" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    const target = next ?? safeReturnPath(pathname);
    return (
      <div className="min-h-screen bg-mist-50">
        <Navbar />
        <main className="mx-auto max-w-md px-3 py-12 text-center">
          <h1 className="text-lg font-extrabold text-ink-900">লগইন প্রয়োজন</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
            পোস্ট করতে একটি অ্যাকাউন্ট লাগবে। লগইন করলে আপনি এখানেই ফিরে আসবেন।
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(target)}`}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 ${LIGHT_FOCUS}`}
            >
              লগইন করুন
            </Link>
            <Link
              href={`/register?next=${encodeURIComponent(target)}`}
              className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-brand-200 bg-white px-5 text-sm font-bold text-brand-700 transition-colors hover:bg-mist-50 ${LIGHT_FOCUS}`}
            >
              নতুন অ্যাকাউন্ট খুলুন
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * The post-login destination.
 *
 * Only a single-leading-slash path on this origin is accepted. Anything else —
 * a protocol-relative `//evil.example`, an absolute URL, a non-path — falls back
 * to the post list, so the login form cannot be turned into an open redirect.
 */
function safeReturnPath(pathname: string | null): string {
  if (!pathname) return '/profile/posts';
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return '/profile/posts';
  return pathname;
}
