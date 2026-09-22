'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/lib/auth-context';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 11) return;
    setLoading(true);
    setErrorMsg('');
    const result = await resetPassword(phone);
    setLoading(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setErrorMsg(result.error || 'পাসওয়ার্ড রিসেট করা যায়নি');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">পাসওয়ার্ড পুনরুদ্ধার</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              আপনার নিবন্ধিত মোবাইল নম্বর লিখুন
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            {submitted ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  পাসওয়ার্ড রিসেট নির্দেশনা পাঠানো হয়েছে
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  আপনার মোবাইল নম্বর <strong>{phone}</strong>-এ রিসেট নির্দেশনা পাঠানো হয়েছে। এসএমএস/ইমেইলের নির্দেশনানুযায়ী এগিয়ে যান।
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs shadow-xs"
                  >
                    <span>লগইন পেজে ফিরে যান</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
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
                    htmlFor="resetPhone"
                    className="block text-xs font-semibold text-slate-800 mb-1.5"
                  >
                    মোবাইল নম্বর
                  </label>
                  <div className="relative">
                    <input
                      id="resetPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01711223344"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'প্রক্রিয়াধীন...' : 'রিসেট কোড পাঠান'}</span>
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