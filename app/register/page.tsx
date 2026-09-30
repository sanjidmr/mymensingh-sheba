'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Lock, Mail, MapPin, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthShell, { AuthSwitch } from '@/components/auth/AuthShell';
import AuthField, { AuthSubmit, PasswordStrength } from '@/components/auth/AuthField';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';
import { useAuth } from '@/lib/auth-context';
import { getAllMCCAreas } from '@/lib/locations';

const AREAS = getAllMCCAreas();
const MIN_PASSWORD = 6;

type Errors = Partial<
  Record<'fullName' | 'phone' | 'primaryAreaId' | 'password' | 'confirmPassword', string>
>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [primaryAreaId, setPrimaryAreaId] = useState(AREAS[0]?.id || 'charpara');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user) router.replace('/profile');
  }, [user, router]);

  const clearError = (key: keyof Errors) =>
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const next: Errors = {};

    if (!fullName.trim()) next.fullName = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    else if (fullName.trim().length < 3) next.fullName = 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে';

    // Bangladeshi mobile: 11 digits, 01 + operator digit. Tolerates +88, spaces
    // and Bengali digits, because people type all three.
    const digits = phone.replace(/[^\d]/g, '');
    const local = digits.startsWith('880') ? digits.slice(3) : digits;
    if (!local) next.phone = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    else if (!/^01[3-9]\d{8}$/.test(local)) next.phone = 'সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)';

    if (!password) next.password = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    else if (password.length < MIN_PASSWORD)
      next.password = `কমপক্ষে ${MIN_PASSWORD} অক্ষরের পাসওয়ার্ড ব্যবহার করুন`;

    if (!confirmPassword) next.confirmPassword = 'অনুগ্রহ করে তথ্যটি পূরণ করুন';
    else if (password !== confirmPassword) next.confirmPassword = 'দুটি পাসওয়ার্ড মিলছে না';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!agreed) {
      setFormError('চালু করার জন্য শর্তাবলী ও নিরাপত্তা নীতিতে সম্মতি দিন।');
      return;
    }

    setLoading(true);
    let res: { success: boolean; error?: string };
    try {
      res = await register({
        fullName: fullName.trim(),
        phone: local,
        primaryAreaId,
        password,
        email: email.trim() || undefined,
      });
    } catch {
      res = { success: false };
    }
    setLoading(false);

    if (res.success) {
      setDone(true);
      return;
    }
    setFormError(res.error || 'অ্যাকাউন্ট তৈরি করা যায়নি। একটু পরে আবার চেষ্টা করুন।');
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col bg-mist-50">
        <Navbar />
        <main className="flex flex-1 items-center justify-center bg-mist-50 px-4 py-12 sm:px-6">
          <div className="w-full max-w-md rounded-xl border border-brand-100 bg-white px-6 py-10 text-center shadow-sm">
            <span
              aria-hidden="true"
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700"
            >
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-xl font-extrabold tracking-tight text-ink-900">
              অভিনন্দন!
            </h1>
            <p className="mx-auto mt-2 max-w-xs text-[14px] leading-relaxed text-ink-500">
              আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন সেবা খুঁজতে ও নিজের প্রোফাইল সাজাতে পারেন।
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => router.replace('/profile')}
                className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-5 text-[15px] font-extrabold text-white transition-colors hover:bg-brand-800 sm:w-auto ${LIGHT_FOCUS}`}
              >
                শুরু করুন
              </button>
              <button
                type="button"
                onClick={() => router.replace('/services')}
                className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-brand-200 bg-white px-5 text-[15px] font-bold text-brand-700 transition-colors hover:bg-mist-50 sm:w-auto ${LIGHT_FOCUS}`}
              >
                সেবা দেখুন
              </button>
            </div>
          </div>
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
        subtitle="মাত্র কয়েকটি তথ্য দিয়ে অ্যাকাউন্ট তৈরি করুন"
        supporting="ফর্মটি শুধু আপনাকে সেবা দিতে সাহায্য করে — বাজার, বিজ্ঞাপন বা প্রোফাইলের জন্য কিছু আগে থেকে দিতে হবে না।"
        formLabel="অ্যাকাউন্ট তৈরি করুন"
        after={
          <AuthSwitch question="আগেই অ্যাকাউন্ট আছে?" actionLabel="লগইন করুন" href="/login" />
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
            label="আপনার নাম"
            value={fullName}
            onChange={(v) => {
              setFullName(v);
              clearError('fullName');
            }}
            placeholder="যেমন: রহিমা বেগম"
            icon={<User className="h-4 w-4" />}
            autoComplete="name"
            required
            error={errors.fullName}
          />

          <AuthField
            label="মোবাইল নম্বর"
            value={phone}
            onChange={(v) => {
              setPhone(v);
              clearError('phone');
            }}
            placeholder="০১৭১২৩৪৫৬৭৮"
            icon={<Phone className="h-4 w-4" />}
            autoComplete="tel"
            inputMode="tel"
            maxLength={14}
            required
            error={errors.phone}
            hint="এই নম্বরেই সেবার আপডেট জানানো হবে।"
          />

          <div>
            <label
              htmlFor="primaryArea"
              className="mb-1.5 flex items-baseline gap-1.5 text-[13px] font-bold text-ink-700"
            >
              আপনার এলাকা
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <select
                id="primaryArea"
                value={primaryAreaId}
                onChange={(e) => setPrimaryAreaId(e.target.value)}
                className={`w-full appearance-none rounded-lg border bg-white py-3 pl-11 pr-9 text-[15px] text-ink-900 transition-colors focus:outline-none ${
                  errors.primaryAreaId
                    ? 'border-rose-300 bg-rose-50/50'
                    : 'border-brand-200 hover:border-brand-300 focus:border-brand-500'
                } ${LIGHT_FOCUS}`}
              >
                {AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nameBn}
                    {area.wardNo ? ` — ওয়ার্ড ${area.wardNo}` : ''}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="mt-1.5 min-h-[18px]">
              <p className="text-[11.5px] leading-relaxed text-ink-400">
                কাছের সেবাগুলো আগে দেখানোর জন্য ব্যবহার হবে।
              </p>
            </div>
          </div>

          <AuthField
            label="পাসওয়ার্ড"
            value={password}
            onChange={(v) => {
              setPassword(v);
              clearError('password');
              if (confirmPassword && v !== confirmPassword)
                setErrors((p) => ({ ...p, confirmPassword: 'দুটি পাসওয়ার্ড মিলছে না' }));
            }}
            placeholder={`কমপক্ষে ${MIN_PASSWORD} অক্ষর`}
            icon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            isPassword
            required
            error={errors.password}
            hint={`কমপক্ষে ${MIN_PASSWORD} অক্ষরের পাসওয়ার্ড ব্যবহার করুন`}
          >
            <div className="mt-2">
              <PasswordStrength value={password} />
            </div>
          </AuthField>

          <AuthField
            label="পাসওয়ার্ড আবার লিখুন"
            value={confirmPassword}
            onChange={(v) => {
              setConfirmPassword(v);
              clearError('confirmPassword');
            }}
            placeholder="একই পাসওয়ার্ড আবার লিখুন"
            icon={<Lock className="h-4 w-4" />}
            autoComplete="new-password"
            isPassword
            required
            error={errors.confirmPassword}
          />

          <AuthField
            label="ইমেইল ঠিকানা"
            labelSuffix="(ঐচ্ছিক)"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            autoComplete="email"
            inputMode="email"
            hint="পাসওয়ার্ড ভুলে গেলে ইমেইলে সাহায্য লাগে।"
          />

          <label className="flex cursor-pointer items-start gap-2.5 py-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => {
                setAgreed(e.target.checked);
                if (e.target.checked) setFormError('');
              }}
              className={`mt-0.5 h-4 w-4 shrink-0 rounded border-brand-300 accent-brand-700 ${LIGHT_FOCUS}`}
            />
            <span className="text-[12.5px] leading-relaxed text-ink-600">
              আমি শর্তাবলী ও{' '}
              <a
                href="/safety"
                className={`font-semibold text-brand-700 underline underline-offset-2 ${LIGHT_FOCUS}`}
              >
                নিরাপত্তা নীতি
              </a>{' '}
              মেনে চলছি।
            </span>
          </label>

          <div className="pt-3">
            <AuthSubmit
              loading={loading || authLoading}
              loadingLabel="অ্যাকাউন্ট তৈরি হচ্ছে…"
              label="অ্যাকাউন্ট তৈরি করুন"
              icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
            />
          </div>
        </form>
      </AuthShell>

      <Footer />
    </div>
  );
}
