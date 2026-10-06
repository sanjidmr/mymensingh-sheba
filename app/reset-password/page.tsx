'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * New-password landing page for the "পাসওয়ার্ড ভুলে গেছেন" email link.
 *
 * The reset email (sent from lib/auth-context resetPassword) routes through
 *  /auth/callback?next=/reset-password, which exchanges the PKCE code and
 * establishes a session. This page then lets the user choose a new password
 * and calls auth.updateUser({ password }).
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [checking, setChecking] = useState(true);
  const [noSession, setNoSession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseConfigured) {
        if (active) {
          setChecking(false);
          setErrorMsg('Supabase সংযুক্ত নেই — পাসওয়ার্ড পুনরুদ্ধার করা যাচ্ছে না।');
        }
        return;
      }
      const client = createClient();
      const { data } = client ? await client.auth.getSession() : { data: null };
      if (!active) return;
      setChecking(false);
      if (!data?.session) setNoSession(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (password.length < 6) {
      setErrorMsg('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('দুটো পাসওয়ার্ড মিলছে না।');
      return;
    }
    if (!isSupabaseConfigured) return;
    const client = createClient();
    if (!client) return;
    setSaving(true);
    const { error } = await client.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setDone(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">নতুন পাসওয়ার্ড দিন</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড সেট করুন
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">যাচাই করা হচ্ছে...</span>
              </div>
            ) : done ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">পাসওয়ার্ড পরিবর্তন হয়েছে</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  আপনার নতুন পাসওয়ার্ড দিয়ে এখন লগইন করতে পারবেন।
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-xs"
                  >
                    <span>লগইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : noSession ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  রিসেট লিংকটিতে ক্লিক করে এই পেজে এসেছেন। সেশন যাচাই করা যায়নি — অনুগ্রহ করে
                  আবার রিসেট প্রক্রিয়া শুরু করুন।
                </p>
                <Link
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-xs"
                >
                  <span>আবার পাসওয়ার্ড রিসেট করুন</span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed">{errorMsg}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    নতুন পাসওয়ার্ড
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    নতুন পাসওয়ার্ড (আবার লিখুন)
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="একই পাসওয়ার্ড লিখুন"
                      autoComplete="new-password"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{saving ? 'সংরক্ষণ হচ্ছে...' : 'পাসওয়ার্ড আপডেট করুন'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="text-xs text-slate-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>লগইনে ফিরে যান</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}