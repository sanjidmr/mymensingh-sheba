'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { isSafeInternalPath, resolveAuthRedirect } from '@/lib/auth-routes';
import { isOnboardingComplete } from '@/lib/onboarding';
import { isAbortError, isTimeoutError, REQUEST_TIMEOUT_MESSAGE } from '@/lib/fetch-with-timeout';

export default function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const timer = window.setTimeout(() => void (async () => {
      const supabase = createClient();
      if (!code || !supabase) return;

      try {
        const { data: authData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !authData.user) {
          if (isAbortError(exchangeError)) return;
          console.error('Auth callback code exchange failed:', exchangeError);
          if (active) {
            setError(isTimeoutError(exchangeError)
              ? REQUEST_TIMEOUT_MESSAGE
              : 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার লগইন করুন।');
          }
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, status, full_name, phone, primary_area_id, onboarding_completed_at')
          .eq('id', authData.user.id)
          .maybeSingle()
          .abortSignal(controller.signal);

        if (profileError || !profile || (profile.status ?? 'active') !== 'active') {
          if (isAbortError(profileError)) return;
          if (isTimeoutError(profileError)) {
            if (active) setError(REQUEST_TIMEOUT_MESSAGE);
            return;
          }
          console.error('Auth callback profile verification failed:', profileError ?? 'Profile unavailable');
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) console.error('Auth callback session cleanup failed:', signOutError);
          if (active) setError('আপনার অ্যাকাউন্ট যাচাই করা যায়নি। সহায়তার জন্য যোগাযোগ করুন।');
          return;
        }

        const role =
          profile.role === 'admin'
            ? 'admin'
            : profile.role === 'news_editor'
              ? 'news_editor'
              : 'customer';
        const requested = isSafeInternalPath(nextParam) ? nextParam : null;
        const needsOnboarding =
          role === 'customer' &&
          !isOnboardingComplete({
            fullName: profile.full_name,
            phone: profile.phone,
            primaryAreaId: profile.primary_area_id,
            onboardingCompletedAt: profile.onboarding_completed_at,
          });
        const destination =
          requested === '/reset-password'
            ? '/reset-password'
            : needsOnboarding
              ? '/onboarding'
              : resolveAuthRedirect(role, requested);

        if (active) window.location.replace(destination);
      } catch (cause) {
        if (!isAbortError(cause)) {
          console.error('Auth callback could not be completed:', cause);
          if (active) {
            setError(isTimeoutError(cause)
              ? REQUEST_TIMEOUT_MESSAGE
              : 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার লগইন করুন।');
          }
        }
      }
    })(), 0);

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [code, nextParam]);

  const displayedError =
    error || (!code || !isSupabaseConfigured ? 'অ্যাকাউন্ট যাচাই করা যায়নি। আবার লগইন করুন।' : '');

  if (!displayedError) {
    return <main className="p-8 text-center">অ্যাকাউন্ট যাচাই করা হচ্ছে…</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 p-8 text-center">
      <p role="alert">{displayedError}</p>
      {displayedError === REQUEST_TIMEOUT_MESSAGE && (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800"
        >
          আবার চেষ্টা করুন
        </button>
      )}
      <Link href="/login" className="font-semibold text-brand-700 hover:underline">
        লগইন পৃষ্ঠায় ফিরুন
      </Link>
    </main>
  );
}
