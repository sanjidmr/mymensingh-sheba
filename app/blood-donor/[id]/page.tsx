'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Droplets,
  MapPin,
  Flag,
  ArrowLeft,
  BadgeCheck,
  Loader2,
  Lock,
  Heart,
  CalendarClock,
  Scale,
  Users,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { DonorAvatar } from '@/components/blood-donor/DonorCard';
import { BloodRequestForm, RequestSheetHeader } from '@/components/blood-donor/BloodRequestForm';
import { DonorReportSheet } from '@/components/blood-donor/DonorReportSheet';
import { fetchPublishedDonorById } from '@/lib/blood-donor-service';
import { useAuth } from '@/lib/auth-context';
import { DONOR_AVAILABILITY_LABELS, formatLastDonation } from '@/lib/blood-donor-types';
import { getAreaById, getPopularMCCAreas } from '@/lib/locations';
import type { BloodDonorProfile } from '@/lib/supabase/types';

function DonorDetailContent({ donorId }: { donorId: string }) {
  const { user } = useAuth();
  const [donor, setDonor] = useState<BloodDonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedDonorById(donorId).then((data) => {
      if (cancelled) return;
      setDonor(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [donorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
          <span className="text-sm">প্রোফাইল লোড হচ্ছে...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <Droplets className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900">প্রোফাইলটি পাওয়া যায়নি</h1>
          <p className="text-sm text-slate-500 mt-2">
            রক্তদাতা প্রোফাইলটি হয় প্রকাশিত নয় অথবা স্থগিত করা হয়েছে।
          </p>
          <Link
            href="/blood-donor"
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            রক্তদাতা তালিকায় ফিরে যান
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const area = getAreaById(donor.areaId);
  const availability = DONOR_AVAILABILITY_LABELS[donor.isAvailable ? 'available' : 'unavailable'];

  return (
    <div className="min-h-screen bg-[#FBFDFB]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          রক্তদাতা তালিকায় ফিরে যান
        </button>

        {/* Profile hero */}
        <div className="bg-gradient-to-br from-rose-700 via-rose-600 to-red-700 rounded-3xl p-5 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <DonorAvatar donor={donor} className="w-20 h-20 sm:w-24 sm:h-24 text-3xl ring-2 ring-white/30" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">{donor.fullName}</h1>
                {donor.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-white/90" aria-label="ভেরিফায়েড" />
                )}
              </div>
              <p className="text-sm text-rose-50/90 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {area?.nameBn || donor.areaId}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black bg-white text-rose-900 px-2.5 py-1 rounded-full">
                  <Droplets className="w-3.5 h-3.5" />
                  {donor.bloodGroup}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white ${donor.isAvailable ? 'text-emerald-800' : 'text-slate-600'}`}>
                  <Heart className="w-3.5 h-3.5" />
                  {availability.labelBn}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          {/* Left: relevant info */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">রক্তদান সংক্রান্ত তথ্য</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <Droplets className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] text-slate-400">রক্তের গ্রুপ</span>
                    <span className="block text-sm font-bold text-slate-900">{donor.bloodGroup}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <CalendarClock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] text-slate-400">সর্বশেষ রক্তদান</span>
                    <span className="block text-sm font-bold text-slate-900">
                      {formatLastDonation(donor.lastDonationDate)}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <Users className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] text-slate-400">মোট রক্তদান</span>
                    <span className="block text-sm font-bold text-slate-900">{donor.donationCount} বার</span>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                  <Scale className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[11px] text-slate-400">রক্তদানের প্রস্তুতি</span>
                    <span className="block text-sm font-bold text-emerald-800">
                      {donor.isAvailable ? 'রক্তদানে প্রস্তুত' : 'বর্তমানে বিরতিতে'}
                    </span>
                  </div>
                </div>
              </div>

              {donor.intro && (
                <div className="mt-4 p-4 rounded-xl bg-rose-50/70 border border-rose-200/60 text-sm text-slate-700 leading-relaxed">
                  {donor.intro}
                </div>
              )}

              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  রক্তদাতার নিজস্ব মোবাইল নম্বর, সঠিক ঠিকানা বা ব্যক্তিগত ও চিকিৎসা সংক্রান্ত নথি এখানে প্রকাশ করা হয় না।
                </span>
              </div>
            </section>
          </div>

          {/* Right: request CTA */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold text-slate-900 mb-2">রক্তের প্রয়োজন?</h2>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                এই রক্তদাতার কাছ থেকে রক্তের প্রয়োজন হলে অনুরোধ পাঠান। অ্যাডমিন প্রেসক্রিপশন যাচাই করে
                নিয়ন্ত্রিতভাবে রক্তদাতার সঙ্গে যোগাযোগ স্থাপন করবেন।
              </p>
              <button
                type="button"
                onClick={() => setRequestOpen(true)}
                disabled={!donor.isAvailable}
                className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  donor.isAvailable
                    ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{donor.isAvailable ? 'রক্তের জন্য Request করুন' : 'সাময়িক বিরতিতে চলে গেছেন'}</span>
              </button>
              {!donor.isAvailable && (
                <p className="mt-2 text-[11px] text-slate-400">
                  রক্তদাতা সাময়িক বিরতিতে আছেন। অন্য কোনো রক্তদাতা খুঁজে দেখুন।
                </p>
              )}
              <p className="mt-3 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                রক্তদান সম্পূর্ণ স্বেচ্ছাসেবী। কোনো আর্থিক লেনদেন করা যাবে না।
              </p>
            </div>
          </div>
        </div>

        {/* Related donors by area */}
        <RelatedDonors currentId={donor.id} areaId={donor.areaId} bloodGroup={donor.bloodGroup} />

        {/* Report */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-700"
          >
            <Flag className="w-3.5 h-3.5" />
            প্রোফাইলে কোনো সমস্যা? রিপোর্ট করুন
          </button>
        </div>
      </main>

      {/* Request sheet */}
      {requestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50"
          onClick={() => setRequestOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <RequestSheetHeader onClose={() => setRequestOpen(false)} />
            <div className="p-5">
              <BloodRequestForm donor={donor} user={user} onClose={() => setRequestOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <DonorReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        donorId={donor.id}
        donorName={donor.fullName}
        user={user}
      />

      <Footer />
    </div>
  );
}

function RelatedDonors({ currentId, areaId, bloodGroup }: { currentId: string; areaId: string; bloodGroup: string }) {
  const popular = getPopularMCCAreas();
  const hint = popular[0]?.id || areaId;
  return (
    <div className="mt-10">
      <h2 className="text-sm font-bold text-slate-900 mb-3">একই এলাকার আরও রক্তদাতা</h2>
      <Link
        href={`/blood-donor?area=${encodeURIComponent(hint)}`}
        className="text-xs text-rose-700 font-semibold hover:underline inline-flex items-center gap-1"
      >
        {bloodGroup} গ্রুপ — {hint} এলাকার ডিরেক্টরি দেখুন
      </Link>
    </div>
  );
}

export default function DonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  return <DonorDetailContent donorId={resolved.id} />;
}