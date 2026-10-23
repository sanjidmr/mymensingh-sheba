'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Lock, Mail, UserPlus } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthShell, { AuthSwitch } from '@/components/auth/AuthShell';
import AuthField, { AuthSubmit } from '@/components/auth/AuthField';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/lib/auth-context';
import { isSafeInternalPath, resolveAuthRedirect } from '@/lib/auth-routes';
import { isOnboardingComplete } from '@/lib/onboarding';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import SplashScreen from '@/components/site/SplashScreen';

const MIN_PASSWORD = 6;

function RegisterForm() {
  const searchParams = useSearchParams();
  const rawTarget = searchParams.get('next') ?? searchParams.get('redirect');
  const requestedTarget = isSafeInternalPath(rawTarget) ? rawTarget : null;
  const { register, signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [welcomeState, setWelcomeState] = useState<'setup' | null>(null);

  // New customers complete their profile before entering the rest of the site.
  useEffect(() => {
    if (authLoading || !user || loading) return;
    const destination =
      user.role !== 'admin' && !isOnboardingComplete(user)
        ? '/onboarding'
        : resolveAuthRedirect(user.role, requestedTarget);
    window.location.replace(destination);
  }, [authLoading, loading, user, requestedTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    const normalizedEmail = email.trim();
    let valid = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError('সঠিক ইমেইল ঠিকানা লিখুন');
      valid = false;
    } else {
      setEmailError('');
    }
    if (password.length < MIN_PASSWORD) {
      setPasswordError(`কমপক্ষে ${MIN_PASSWORD} অক্ষরের পাসওয়ার্ড ব্যবহার করুন`);
      valid = false;
    } else {
      setPasswordError('');
    }
    if (!valid) return;

    setLoading(true);
    try {
      const result = await register({
        email: normalizedEmail,
        password,
        next: requestedTarget,
      });
      if (!result.success) {
        setFormError(result.error || 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।');
      } else if (result.needsConfirmation) {
        setWelcomeState('setup');
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'অ্যাকাউন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle(requestedTarget);
      if (!result.success) setFormError(result.error || 'Google দিয়ে চালিয়ে যাওয়া যায়নি।');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google দিয়ে চালিয়ে যাওয়া যায়নি।');
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading || user) {
    return <SplashScreen />;
  }

  if (welcomeState) {
    return (
      <div className="flex min-h-screen flex-col bg-mist-50">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
          <section className="mms-welcome-card w-full max-w-md border border-brand-100 bg-white px-6 py-9 text-center shadow-sm sm:px-10 sm:py-11">
            <div className="mx-auto flex h-14 w-14 items-center justify-center border border-brand-200 bg-brand-50 text-brand-700">
              <CheckCircle2 className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold leading-tight text-ink-900 sm:text-3xl">
              ইমেইল যাচাই করুন
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-600 sm:text-base">
              অ্যাকাউন্ট তৈরি হয়েছে। ইমেইলে পাঠানো যাচাইকরণ লিংকে প্রবেশ করে লগইন করুন; এরপর আপনার প্রোফাইল সেটআপ সম্পন্ন করতে পারবেন।
            </p>
            <Link
              href="/login"
              className={`mt-6 inline-flex min-h-12 items-center justify-center border border-brand-200 px-5 text-sm font-bold text-brand-800 transition-colors hover:bg-brand-50 ${LIGHT_FOCUS}`}
            >
              লগইন করুন
            </Link>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />
      <AuthShell
        eyebrow="একটি অ্যাকাউন্ট, সব সেবা"
        title="Mymensingh Sheba-তে যোগ দিন"
        subtitle="ইমেইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট তৈরি করুন"
        formLabel="রেজিস্ট্রেশন"
        after={
          <AuthSwitch
            question="আগেই অ্যাকাউন্ট আছে?"
            actionLabel="লগইন করুন"
            href={requestedTarget ? `/login?next=${encodeURIComponent(requestedTarget)}` : '/login'}
          />
        }
      >
        {formError && (
          <p role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] leading-relaxed text-rose-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            {formError}
          </p>
        )}
        <form onSubmit={handleSubmit} noValidate className="space-y-1">
          <AuthField
            label="ইমেইল"
            type="email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              setEmailError('');
            }}
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            inputMode="email"
            required
            error={emailError}
          />
          <AuthField
            label="আপনার পাসওয়ার্ড সেট করুন"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setPasswordError('');
            }}
            placeholder={`কমপক্ষে ${MIN_PASSWORD} অক্ষর`}
            icon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            isPassword
            required
            error={passwordError}
            hint={`কমপক্ষে ${MIN_PASSWORD} অক্ষরের পাসওয়ার্ড ব্যবহার করুন`}
          />
          <div className="pt-2">
            <AuthSubmit
              loading={loading || authLoading}
              loadingLabel="অ্যাকাউন্ট তৈরি হচ্ছে…"
              label="অ্যাকাউন্ট তৈরি করুন"
              icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        </form>
        <div className="my-3 flex items-center gap-3 text-[11px] font-semibold text-ink-400">
          <span className="h-px flex-1 bg-brand-100" />
          অথবা
          <span className="h-px flex-1 bg-brand-100" />
        </div>
        <GoogleSignInButton onClick={handleGoogleSignIn} loading={googleLoading} />
      </AuthShell>
      <Footer />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <RegisterForm />
    </Suspense>
  );
}
