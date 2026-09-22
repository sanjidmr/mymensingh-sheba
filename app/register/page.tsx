'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Lock,
  Mail,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS } from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [primaryAreaId, setPrimaryAreaId] = useState(MCC_AREAS[0]?.id || 'charpara');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('দয়া করে আপনার পুরো নাম লিখুন');
      return;
    }
    if (!phone.trim() || phone.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017xxxxxxxx)');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('পাসওয়ার্ড নূন্যতম ৬ অক্ষরের হতে হবে');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('ময়মনসিংহ সেবা ব্যবহারের শর্তাবলীতে সম্মতি দিন');
      return;
    }

    setLoading(true);
    const res = await register({
      fullName,
      phone,
      primaryAreaId,
      password,
      email: email.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      router.push('/profile');
    } else {
      setErrorMsg(res.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl shadow-xs mx-auto mb-3">
              ম
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              নতুন অ্যাকাউন্ট তৈরি করুন
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-xs mx-auto">
              একটি অ্যাকাউন্ট থেকেই সব সেবা গ্রহণ এবং প্রয়োজনে সার্ভিস প্রোফাইল সক্রিয় করুন
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-7">
            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  আপনার পুরো নাম (বাংলা বা ইংরেজি)
                </label>
                <div className="relative">
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Mobile Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  মোবাইল নম্বর (১১ ডিজিট)
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711223344"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                    required
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  এই নম্বরে সার্ভিস সংক্রান্ত প্রয়োজনীয় আপডেট জানানো হবে।
                </p>
              </div>

              {/* Primary MCC Area */}
              <div>
                <label
                  htmlFor="primaryArea"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  আপনার এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)
                </label>
                <div className="relative">
                  <select
                    id="primaryArea"
                    value={primaryAreaId}
                    onChange={(e) => setPrimaryAreaId(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all appearance-none"
                    required
                  >
                    {MCC_AREAS.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.nameBn} {area.wardNo ? `(ওয়ার্ড ${area.wardNo})` : ''}
                      </option>
                    ))}
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="regPassword"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  পাসওয়ার্ড নির্ধারণ করুন
                </label>
                <div className="relative">
                  <input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৬ অক্ষর লিখুন"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Optional Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  ইমেইল ঠিকানা <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                  />
                  <span>
                    আমি নিশ্চিত করছি যে আমি ময়মনসিংহ সিটি কর্পোরেশন এলাকার বাসিন্দা বা এই এলাকার সেবায় আগ্রহী এবং আমি প্ল্যাটফর্মের নিরাপত্তা নীতি মেনে চলবো।
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm transition-all shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
              >
                <span>{loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'অ্যাকাউন্ট নিশ্চিত করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Bottom link */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <Link
                  href="/login"
                  className="font-bold text-emerald-800 hover:text-emerald-900 hover:underline inline-flex items-center gap-1 ml-1"
                >
                  লগইন করুন
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>১০০% এনক্রিপ্টেড ও সুরক্ষিত প্ল্যাটফর্ম</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
