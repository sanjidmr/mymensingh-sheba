'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthShell, { AuthSwitch } from '@/components/auth/AuthShell';
import AuthField, { AuthSubmit } from '@/components/auth/AuthField';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import { isSafeInternalPath, resolveAuthRedirect } from '@/lib/auth-routes';
import SplashScreen from '@/components/site/SplashScreen';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Accept either `next=` (used by the server admin guard and other guards) or
  // the legacy `redirect=` parameter. Only a safe internal path is ever honoured.
  const rawTarget = searchParams.get('next') ?? searchParams.get('redirect');
  const requestedTarget = isSafeInternalPath(rawTarget) ? rawTarget : null;
  const { login, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // An authenticated visitor has no business on this page. The destination is
  // derived from their *verified* role, so an admin goes straight to the admin
  // panel and is never bounced into the customer profile.
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(resolveAuthRedirect(user.role, requestedTarget));
    }
  }, [authLoading, user, requestedTarget, router]);

  // While the stored session is still being restored we must not render the
  // signed-out form: that flashes a login screen to a returning admin and risks
  // treating them as a customer before their role is known.
  if (authLoading) {
    return <SplashScreen />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const errors: typeof fieldErrors = {};
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      errors.email = 'আপনার ইমেইল লিখুন';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      errors.email = 'সঠিক ইমেইল ঠিকানা লিখুন';
    }
    if (!password) {
      errors.password = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    let res: { success: boolean; error?: string; role?: 'admin' | 'customer' };
    try {
      res = await login(normalizedEmail, password);
    } catch {
      res = { success: false };
    }
    setLoading(false);

    if (res.success) {
      // Route on the role returned by the verified profile — not on a default
      // path. This is what sends an admin directly to /admin.
      router.replace(resolveAuthRedirect(res.role, requestedTarget));
      return;
    }

    // Auth failures are intentionally vague to avoid revealing registered accounts.
    setFormError(
      res.error || 'এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। ইমেইল ও পাসওয়ার্ড দেখে আবার চেষ্টা করুন।'
    );
  };

  return (
    <AuthShell
      eyebrow="স্বাগতম"
      title="আপনার অ্যাকাউন্টে প্রবেশ করুন"
      subtitle="লগইন করে আপনার সেবা ও অনুরোধ পরিচালনা করুন"
      supporting="প্রয়োজনীয় সেবা খুঁজতে, বিজ্ঞাপন দিতে বা আগের অনুরোধের অবস্থা দেখতে লগইন করুন।"
      formLabel="লগইন করুন"
      after={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AuthSwitch question="অ্যাকাউন্ট নেই?" actionLabel="রেজিস্ট্রেশন করুন" href="/register" />
          <a
            href="/forgot-password"
            className={`inline-flex items-center gap-1 rounded text-[13.5px] font-semibold text-brand-700 transition-colors hover:text-brand-800 ${LIGHT_FOCUS}`}
          >
            পাসওয়ার্ড ভুলে গেছেন?
          </a>
        </div>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-1">
        {formError && (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] leading-relaxed text-rose-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            {formError}
          </p>
        )}

        <AuthField
          label="ইমেইল"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
          }}
          placeholder="আপনার ইমেইল ঠিকানা"
          icon={<Mail className="h-4 w-4" />}
          autoComplete="email"
          inputMode="email"
          required
          error={fieldErrors.email}
        />

        <AuthField
          label="পাসওয়ার্ড"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
          }}
          placeholder="আপনার পাসওয়ার্ড"
          icon={<Lock className="h-4 w-4" />}
          autoComplete="current-password"
          isPassword
          required
          error={fieldErrors.password}
        />

        <div className="pt-2">
          <AuthSubmit
            loading={loading || authLoading}
            loadingLabel="লগইন হচ্ছে…"
            label="লগইন করুন"
            icon={<LogIn className="h-4 w-4" aria-hidden="true" />}
          />
        </div>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />
      <Suspense fallback={<SplashScreen />}>
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  );
}
