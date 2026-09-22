'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Settings, User, Phone, MapPin, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREAS } from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [primaryAreaId, setPrimaryAreaId] = useState(user?.primaryAreaId || 'charpara');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    setLoading(true);
    await updateProfile({
      fullName,
      email: email || undefined,
      primaryAreaId,
      emergencyContact: emergencyContact || undefined,
    });
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">অ্যাকাউন্ট সেটিংস</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                অ্যাকাউন্ট সেটিংস
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                আপনার নাম, এলাকা ও যোগাযোগের তথ্য আপডেট করুন
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span className="text-sm font-semibold">
                তথ্য সফলভাবে আপডেট করা হয়েছে!
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                আপনার পুরো নাম
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                মোবাইল নম্বর <span className="text-slate-400 font-normal">(অপরিবর্তনযোগ্য)</span>
              </label>
              <input
                type="text"
                disabled
                value={user?.phone || ''}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                নিরাপত্তার স্বার্থে প্রাথমিক মোবাইল নম্বর পরিবর্তন করতে হেল্পলাইনে যোগাযোগ করুন।
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                প্রাথমিক এলাকা (ময়মনসিংহ সিটি কর্পোরেশন)
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

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                ইমেইল ঠিকানা <span className="text-slate-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                জরুরি যোগাযোগের বিকল্প নম্বর
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="018xxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <Link
                href="/profile"
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50"
              >
                বাতিল
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                {loading ? 'সংরক্ষণ হচ্ছে...' : 'সেটিংস সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
