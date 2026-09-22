'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, Lock, Edit3, ExternalLink, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DonorAvatar } from '@/components/blood-donor/DonorCard';
import { useAuth } from '@/lib/auth-context';
import { DONOR_STATUS_META, formatLastDonation } from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodDonorProfile } from '@/lib/supabase/types';

export default function ProfileBloodDonorDashboardPage() {
  const { user, bloodDonorProfile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <Heart className="w-10 h-10 text-rose-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900">রক্তদাতা প্রোফাইল</h1>
          <p className="text-sm text-slate-500 mt-2">
            রক্তদাতা হিসেবে নিবন্ধন করতে লগইন করুন।
          </p>
          <Link
            href={`/login?next=/profile/blood-donor`}
            className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-semibold"
          >
            লগইন / রেজিস্টার
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!bloodDonorProfile) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-24 text-center">
          <Heart className="w-10 h-10 text-rose-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900">আপনি এখনও রক্তদাতা নন</h1>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            ময়মনসিংহের রোগীদের জরুরি প্রয়োজনে রক্ত দিতে নিজেকে তালিকাভুক্ত করুন।
          </p>
          <Link
            href="/profile/blood-donor/setup"
            className="inline-flex items-center gap-1.5 px-6 py-3 rounded-xl bg-rose-700 text-white text-sm font-semibold"
          >
            রক্তদাতা হিসেবে নিবন্ধন করুন
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return <DonorDashboard donor={bloodDonorProfile} />;
}

function DonorDashboard({ donor }: { donor: BloodDonorProfile }) {
  const status = DONOR_STATUS_META[donor.status];
  const area = getAreaById(donor.areaId);
  const isPublished = donor.status === 'approved';

  return (
    <div className="min-h-screen bg-[#FBFDFB]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800">
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">আমার রক্তদাতা প্রোফাইল</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Status header */}
          <div className="bg-gradient-to-br from-rose-700 via-rose-600 to-red-700 px-6 py-5 text-white">
            <div className="flex items-center gap-4">
              <DonorAvatar donor={donor} className="w-16 h-16 text-2xl ring-2 ring-white/30" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold truncate">{donor.fullName} (রক্তদাতা)</h1>
                </div>
                <p className="text-xs text-rose-50/90 mt-0.5">
                  {donor.bloodGroup} • {area?.nameBn || donor.areaId}
                </p>
                <span className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white text-rose-900`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {status.labelBn}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {donor.status === 'pending_approval' && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>{status.note}</p>
              </div>
            )}
            {donor.status === 'rejected' && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <p>
                  {status.note}
                  {donor.rejectionReason && (
                    <>
                      <br />
                      <strong>কারণ:</strong> {donor.rejectionReason}
                    </>
                  )}
                </p>
              </div>
            )}
            {donor.status === 'suspended' && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <p>{status.note}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] text-slate-400">রক্তের গ্রুপ</span>
                <strong className="text-slate-900">{donor.bloodGroup}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] text-slate-400">মোট রক্তদান</span>
                <strong className="text-slate-900">{donor.donationCount} বার</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] text-slate-400">সর্বশেষ রক্তদান</span>
                <strong className="text-slate-900">{formatLastDonation(donor.lastDonationDate)}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] text-slate-400">রক্তদানের প্রস্তুতি</span>
                <strong className={donor.isAvailable ? 'text-emerald-800' : 'text-slate-600'}>
                  {donor.isAvailable ? 'রক্তদানে প্রস্তুত' : 'বর্তমানে বিরতিতে'}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] text-slate-400">উপস্থিত এলাকা</span>
                <strong className="text-slate-900">{area?.nameBn || donor.areaId}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50">
                <span className="block text-[11px] text-slate-400">যাচাইকরণ অবস্থা</span>
                <strong className={donor.isVerified ? 'text-emerald-800' : 'text-slate-600'}>
                  {donor.isVerified ? 'ভেরিফাইড' : 'ভেরিফিকেশনের অপেক্ষায়'}
                </strong>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/60 text-[11px] text-rose-950 flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>
                আপনার মোবাইল নম্বর সম্পূর্ণ গোপন রাখা হয়েছে। প্রেসক্রিপশন যাচাইয়ের পর অ্যাডমিন নিয়ন্ত্রিতভাবে যোগাযোগ স্থাপন করবেন।
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {isPublished && (
                <Link
                  href={`/blood-donor/${donor.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  পাবলিক প্রোফাইল দেখুন
                </Link>
              )}
              <Link
                href="/profile/blood-donor/setup"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5" />
                প্রোফাইল এডিট করুন
              </Link>
              <Link
                href="/blood-donor"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                রক্তদাতা ডিরেক্টরি
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}