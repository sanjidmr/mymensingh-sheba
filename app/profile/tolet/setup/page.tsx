'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  MapPin,
  Phone,
  FileText,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS } from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ToletSetupPage() {
  const router = useRouter();
  const { user, toletProfile, activateToletProfile } = useAuth();

  const [ownerName, setOwnerName] = useState(toletProfile?.ownerName || user?.fullName || '');
  const [phone, setPhone] = useState(toletProfile?.phone || user?.phone || '');
  const [emergencyPhone, setEmergencyPhone] = useState(toletProfile?.emergencyPhone || '');
  const [primaryAreaId, setPrimaryAreaId] = useState(
    toletProfile?.primaryAreaId || user?.primaryAreaId || 'charpara'
  );
  const [addressLine, setAddressLine] = useState(toletProfile?.addressLine || '');
  const [holdingNumber, setHoldingNumber] = useState(toletProfile?.holdingNumber || '');
  const [nidNumber, setNidNumber] = useState(toletProfile?.nidNumber || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName || !phone || !addressLine) return;

    setLoading(true);
    await activateToletProfile({
      ownerName,
      phone,
      emergencyPhone: emergencyPhone || undefined,
      primaryAreaId,
      addressLine,
      holdingNumber: holdingNumber || undefined,
      nidNumber: nidNumber || undefined,
      isVerified: false,
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push('/profile');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">বাসা মালিক (To-Let) প্রোফাইল সেটআপ</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                বাসা মালিক (To-Let) প্রোফাইল সেটআপ
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                আপনার ফ্যামিলি বাসা, মেস বা সিট ভাড়া দেওয়ার জন্য তথ্য পূরণ করুন
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
<span className="text-sm font-semibold">
                প্রোফাইল জমা হয়েছে! অ্যাডমিন অনুমোদনের পরে সক্রিয় হবে।
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  বাড়িওয়ালা / দায়িত্বপ্রাপ্ত ব্যক্তির নাম
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="যেমন: হাজী মো. রফিকুল ইসলাম"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  মোবাইল নম্বর
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  বিকল্প / কেয়ারটেকার নম্বর (ঐচ্ছিক)
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="018xxxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)
                </label>
                <select
                  value={primaryAreaId}
                  onChange={(e) => setPrimaryAreaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  required
                >
                  {MCC_AREAS.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nameBn} {area.wardNo ? `(ওয়ার্ড ${area.wardNo})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  বাসা / হোল্ডিং নম্বর
                </label>
                <input
                  type="text"
                  value={holdingNumber}
                  onChange={(e) => setHoldingNumber(e.target.value)}
                  placeholder="যেমন: হোল্ডিং ১২/বি"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  জাতীয় পরিচয়পত্র (NID) নম্বর
                </label>
                <input
                  type="text"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value)}
                  placeholder="ভেরিফিকেশনের জন্য NID নম্বর"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                বিস্তারিত ঠিকানা ও ল্যান্ডমার্ক
              </label>
              <textarea
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="যেমন: কাঁচিঝুলি মেইন রোড, জিলা স্কুলের পূর্ব পাশে, বাড়ি ১২/বি"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            {/* Verification trust banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">বিশ্বস্ততা ও ভেরিফিকেশন নীতি:</span>
                ভাড়াটিয়াদের নিরাপত্তার জন্য আপনার ঠিকানা ও তথ্য অ্যাডমিন টিম ভেরিফাই করবে। ভেরিফাইড বাসাগুলোতে ভাড়াটিয়ারা বেশি আস্থা পান।
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/profile"
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                বাতিল করুন
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ ও সক্রিয় করুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
