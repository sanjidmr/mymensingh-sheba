'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, Phone, UserRound } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import SplashScreen from '@/components/site/SplashScreen';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS } from '@/lib/locations';
import { isOnboardingComplete, normalizeBangladeshPhone } from '@/lib/onboarding';
import type { UserProfile } from '@/lib/supabase/types';
import { completeOnboarding } from './actions';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login?next=%2Fonboarding');
      return;
    }
    if (user.role === 'admin') {
      router.replace('/admin');
      return;
    }
    if (isOnboardingComplete(user)) {
      router.replace('/welcome');
    }
  }, [isLoading, router, user]);

  if (isLoading || !user || user.role === 'admin' || isOnboardingComplete(user)) {
    return <SplashScreen />;
  }

  return <OnboardingForm key={user.id} user={user} />;
}

function OnboardingForm({ user }: { user: UserProfile }) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [primaryAreaId, setPrimaryAreaId] = useState(
    MCC_AREAS.some((area) => area.isActive && area.id === user.primaryAreaId)
      ? user.primaryAreaId
      : ''
  );
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const nameWasProvided =
    Boolean(user.fullName.trim()) &&
    user.fullName.trim().toLocaleLowerCase() !==
      user.email?.split('@')[0]?.trim().toLocaleLowerCase();
  const phoneWasProvided = Boolean(normalizeBangladeshPhone(user.phone || ''));
  const areaWasProvided = MCC_AREAS.some(
    (area) => area.isActive && area.id === user.primaryAreaId
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (fullName.trim().length < 2) {
      setFieldError('আপনার নাম কমপক্ষে ২ অক্ষরের লিখুন।');
      return;
    }
    if (!normalizeBangladeshPhone(phone)) {
      setFieldError('সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!primaryAreaId) {
      setFieldError('তালিকা থেকে আপনার এলাকাটি নির্বাচন করুন।');
      return;
    }
    setFieldError('');
    setSaving(true);
    try {
      const result = await completeOnboarding({ fullName, phone, primaryAreaId });
      if (!result.success) {
        setFormError(result.error || 'তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      window.location.replace('/welcome');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-mist-50">
      <Navbar />
      <main className="flex flex-1 items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto grid w-full max-w-4xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
          <section className="max-w-md">
            <p className="text-xs font-extrabold tracking-[0.12em] text-brand-600">
              আপনার অ্যাকাউন্ট সেটআপ
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-4xl">
              আপনার এলাকার সেবাগুলো পেতে
              <span className="mt-1 block text-brand-700">আর মাত্র এক ধাপ</span>
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-7 text-ink-600 sm:text-base">
              সঠিক সেবা ও স্থানীয় সহায়তা পৌঁছে দিতে আপনার কয়েকটি তথ্য দরকার।
              এগুলো আপনার প্রোফাইলে নিরাপদে সংরক্ষিত থাকবে।
            </p>
            <div className="mt-6 h-1 w-16 bg-red-600" aria-hidden="true" />
          </section>

          <section className="border border-brand-100 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-lg font-extrabold text-ink-900">প্রয়োজনীয় তথ্য</h2>
            <p className="mt-1 text-sm text-ink-500">তারকা (*) চিহ্নিত তথ্যগুলো পূরণ করুন।</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
              <div>
                <label htmlFor="onboarding-name" className="mb-2 block text-sm font-bold text-ink-700">
                  আপনার নাম <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                  <input
                    id="onboarding-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    readOnly={nameWasProvided}
                    maxLength={100}
                    className="min-h-12 w-full border border-brand-200 bg-white py-3 pl-11 pr-3 text-[15px] text-ink-900 outline-none transition-colors focus:border-brand-600 read-only:bg-mist-50"
                    aria-describedby={nameWasProvided ? 'onboarding-name-hint' : undefined}
                  />
                </div>
                {nameWasProvided && (
                  <p id="onboarding-name-hint" className="mt-1.5 text-xs text-ink-500">
                    আপনার অ্যাকাউন্টে দেওয়া নামটি রাখা হয়েছে।
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="onboarding-phone" className="mb-2 block text-sm font-bold text-ink-700">
                  মোবাইল নম্বর <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                  <input
                    id="onboarding-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    readOnly={phoneWasProvided}
                    maxLength={16}
                    className="min-h-12 w-full border border-brand-200 bg-white py-3 pl-11 pr-3 text-[15px] text-ink-900 outline-none transition-colors focus:border-brand-600 read-only:bg-mist-50"
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-500">বাংলাদেশি ১১-সংখ্যার মোবাইল নম্বর দিন।</p>
              </div>

              <div>
                <label htmlFor="onboarding-area" className="mb-2 block text-sm font-bold text-ink-700">
                  আপনার এলাকা <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
                  <select
                    id="onboarding-area"
                    value={primaryAreaId}
                    onChange={(event) => setPrimaryAreaId(event.target.value)}
                    disabled={areaWasProvided}
                    className="min-h-12 w-full appearance-none border border-brand-200 bg-white py-3 pl-11 pr-3 text-[15px] text-ink-900 outline-none transition-colors focus:border-brand-600 disabled:bg-mist-50"
                  >
                    <option value="" disabled>এলাকা নির্বাচন করুন</option>
                    {MCC_AREAS.filter((area) => area.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((area) => (
                        <option key={area.id} value={area.id}>{area.nameBn}</option>
                      ))}
                  </select>
                </div>
              </div>

              {(fieldError || formError) && (
                <p
                  role="alert"
                  className="border-l-2 border-red-600 bg-red-50 px-3 py-2.5 text-sm leading-relaxed text-red-800"
                >
                  {fieldError || formError}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="flex min-h-12 w-full items-center justify-center gap-2 bg-brand-700 px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                    তথ্য সংরক্ষণ হচ্ছে…
                  </>
                ) : (
                  <>তথ্য সংরক্ষণ করুন <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
