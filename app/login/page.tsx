'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Phone, LogIn, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthShell, { AuthSwitch } from '@/components/auth/AuthShell';
import AuthField, { AuthSubmit } from '@/components/auth/AuthField';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/profile';
  const { login, user, isLoading: authLoading } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // An authenticated visitor has no business on this page.
  useEffect(() => {
    if (user) router.replace(redirectPath);
  }, [user, redirectPath, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const errors: typeof fieldErrors = {};
    if (!identifier.trim()) {
      errors.identifier = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    }
    if (!password) {
      errors.password = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    let res: { success: boolean; error?: string };
    try {
      res = await login(identifier.trim(), password);
    } catch {
      res = { success: false };
    }
    setLoading(false);

    if (res.success) {
      router.replace(redirectPath);
      return;
    }

    // Auth failures are intentionally vague: saying "no such account" would
    // let someone test which numbers are registered.
    setFormError(
      res.error || 'এই তথ্য দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। নম্বর ও পাসওয়ার্ড দেখে আবার চেষ্টা করুন।'
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
            className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] leading-relaxed text-rose-900"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            {formError}
          </p>
        )}

        <AuthField
          label="মোবাইল নম্বর অথবা ইমেইল"
          value={identifier}
          onChange={(v) => {
            setIdentifier(v);
            if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
          }}
          placeholder="০১৭১২৩৪৫৬৭৮"
          icon={<Phone className="h-4 w-4" />}
          autoComplete="username"
          inputMode="email"
          required
          error={fieldErrors.identifier}
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
      <Suspense
        fallback={
          <main className="flex-1 bg-mist-50 px-4 py-10 sm:px-6">
            <div className="mx-auto w-full max-w-5xl rounded-xl border border-brand-100 bg-white px-5 py-12 shadow-sm">
              <p className="text-sm text-ink-500">লোড হচ্ছে…</p>
            </div>
          </main>
        }
      >
        <LoginForm />
      </Suspense>
      <Footer />
    </div>
  );
}
