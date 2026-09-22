'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/profile';
  const { login, sendOtp, verifyOtp, isConfiguredWithSupabase } = useAuth();

  const [activeTab, setActiveTab] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifier.trim()) {
      setErrorMsg('দয়া করে আপনার মোবাইল নম্বর বা ইমেইল লিখুন');
      return;
    }
    if (!password) {
      setErrorMsg('দয়া করে আপনার পাসওয়ার্ড লিখুন');
      return;
    }

    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      router.push(redirectPath);
    } else {
      setErrorMsg(res.error || 'লগইন তথ্য সঠিক নয়। আবার চেষ্টা করুন।');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || identifier.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 01711223344)');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await sendOtp(identifier);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
    } else {
      setErrorMsg(res.error || 'ওটিপি পাঠাতে সমস্যা হয়েছে');
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('দয়া করে মোবাইলে প্রাপ্ত ওটিপি কোডটি লিখুন');
      return;
    }
    setLoading(true);
    const res = await verifyOtp(identifier, otpCode);
    setLoading(false);
    if (res.success) {
      router.push(redirectPath);
    } else {
      setErrorMsg(res.error || 'ওটিপি যাচাই করা সম্ভব হয়নি');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Top Brand Greeting */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl shadow-xs mx-auto mb-3">
              ম
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              লগইন করুন
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-xs mx-auto">
              ময়মনসিংহ সেবা অ্যাকাউন্ট দিয়ে সেবা গ্রহণ বা আপনার সার্ভিস পরিচালনা করুন
            </p>
          </div>

          {!isConfiguredWithSupabase && (
            <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                লগইন ও রেজিস্ট্রেশন পরিষেবা এখনো চালু হয়নি। প্রশাসক Supabase সেটআপ সম্পন্ন করলে আপনি এই পেজ থেকে অ্যাকাউন্ট খুলে সেবা নিতে পারবেন।
              </span>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('password');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'password'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                পাসওয়ার্ড দিয়ে
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('otp');
                  setErrorMsg('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'otp'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ওটিপি (OTP) দিয়ে
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: Password Login */}
            {activeTab === 'password' ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    মোবাইল নম্বর অথবা ইমেইল
                  </label>
                  <div className="relative">
                    <input
                      id="identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="017xxxxxxxx বা user@mail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      পাসওয়ার্ড
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-emerald-800 hover:text-emerald-900 font-medium hover:underline"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="আপনার পাসওয়ার্ড লিখুন"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  <span>{loading ? 'যাচাই করা হচ্ছে...' : 'লগইন করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* TAB 2: OTP Login */
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label
                        htmlFor="otpPhone"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        আপনার মোবাইল নম্বর
                      </label>
                      <div className="relative">
                        <input
                          id="otpPhone"
                          type="tel"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="01711223344"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                          required
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        আপনার মোবাইলে ওটিপি ভেরিফিকেশন কোড পাঠানো হবে। কোডটি লিখুন এবং যাচাই করুন।
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>ওটিপি কোড পাঠান</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleOtpVerify} className="space-y-4">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                      <span>নম্বর: <strong>{identifier}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpSent(false)}
                        className="text-xs text-emerald-800 font-semibold underline"
                      >
                        পরিবর্তন
                      </button>
                    </div>

                    <div>
                      <label
                        htmlFor="otpCode"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        ওটিপি কোড লিখুন
                      </label>
                      <div className="relative">
                        <input
                          id="otpCode"
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="আপনার মোবাইলে প্রাপ্ত কোডটি লিখুন"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-semibold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                          required
                        />
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{loading ? 'যাচাই করা হচ্ছে...' : 'ওটিপি যাচাই করে প্রবেশ করুন'}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Bottom divider & Register prompt */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                ময়মনসিংহ সেবাতে নতুন?{' '}
                <Link
                  href="/register"
                  className="font-bold text-emerald-800 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 ml-1"
                >
                  নতুন অ্যাকাউন্ট খুলুন
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </div>
          </div>

          {/* Privacy & MCC Guarantee */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>শুধুমাত্র ময়মনসিংহ সিটি কর্পোরেশন ও ১০০% ডেটা নিরাপত্তা</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFDFB] flex items-center justify-center text-slate-500 text-sm">
          লোড হচ্ছে...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
