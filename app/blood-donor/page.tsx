'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, PlusCircle, Loader2, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ServiceFilterBar from '@/components/filters/ServiceFilterBar';
import EmptyFilterResults from '@/components/filters/EmptyFilterResults';
import DonorCard from '@/components/blood-donor/DonorCard';
import { fetchPublishedDonors } from '@/lib/blood-donor-service';
import { getAreaById } from '@/lib/locations';
import type { BloodDonorProfile } from '@/lib/supabase/types';

function BloodDonorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialGroup = searchParams.get('group') || searchParams.get('bloodGroup') || 'all';
  const initialArea = searchParams.get('area') || searchParams.get('areaId') || undefined;

  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({
    bloodGroup: initialGroup !== 'all' ? initialGroup : undefined,
    areaId: initialArea,
  });
  const [donors, setDonors] = useState<BloodDonorProfile[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedDonors().then((data) => {
      if (cancelled) return;
      setDonors(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilterValues(newFilters);
    const params = new URLSearchParams();
    if (newFilters.bloodGroup && newFilters.bloodGroup !== 'all') {
      params.set('group', String(newFilters.bloodGroup));
    }
    if (newFilters.areaId) {
      params.set('area', String(newFilters.areaId));
    }
    const query = params.toString();
    router.replace(`/blood-donor${query ? `?${query}` : ''}`, { scroll: false });
  };

  const handleResetFilters = () => {
    setFilterValues({});
    router.replace('/blood-donor', { scroll: false });
  };

  const filteredDonors = useMemo(() => {
    if (!donors) return [];
    return donors.filter((d) => {
      if (filterValues.bloodGroup && filterValues.bloodGroup !== 'all') {
        if (d.bloodGroup !== filterValues.bloodGroup) return false;
      }
      if (filterValues.areaId && d.areaId !== filterValues.areaId) return false;
      if (filterValues.isAvailableNow && !d.isAvailable) return false;
      return true;
    });
  }, [donors, filterValues]);

  const activeArea = getAreaById(
    typeof filterValues.areaId === 'string' ? filterValues.areaId : undefined
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-rose-700" />
          <span className="text-sm">রক্তদাতাদের তালিকা লোড হচ্ছে...</span>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFDFB]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            সম্পূর্ণ স্বেচ্ছাসেবী ও অ-বাণিজ্যিক সেবা
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            রক্তদাতা ডিরেক্টরি — ময়মনসিংহ
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            আপনার রক্তের গ্রুপ ও এলাকা নির্বাচন করুন। প্রয়োজনে অ্যাডমিন যাচাইয়ের ভিত্তিতে রক্তদাতার সঙ্গে নিরাপদ যোগাযোগ স্থাপিত হয়।
          </p>
        </div>

        {/* Privacy & Rule banner */}
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-rose-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm sm:text-base text-rose-900">
                  গোপনীয়তা ও রক্ত সুরক্ষার সার্বজনীন নিয়ম
                </h3>
                <p className="text-xs sm:text-sm text-rose-800/90 mt-1 leading-relaxed">
                  রক্তদাতার নিজস্ব মোবাইল নম্বর কখনোই পাবলিক হয় না। প্রেসক্রিপশন ও হাসপাতাল তথ্য যাচাইয়ের পর অ্যাডমিন নিয়ন্ত্রিতভাবে যোগাযোগ স্থাপিত হয়। রক্ত কেনা-বেচা কঠোরভাবে নিষিদ্ধ।
                </p>
              </div>
            </div>
            <Link
              href="/profile/blood-donor/setup"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-medium text-xs sm:text-sm shrink-0 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>রক্তদাতা হিসেবে নিবন্ধন</span>
            </Link>
          </div>
        </div>

        {/* Centralized Filter Bar */}
        <ServiceFilterBar
          serviceType="blood-donor"
          filterValues={filterValues}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          totalResults={filteredDonors.length}
        />

        {/* Empty State */}
        {filteredDonors.length === 0 ? (
          <EmptyFilterResults
            onResetFilters={handleResetFilters}
            areaName={activeArea?.nameBn}
            customMessage="নির্বাচিত গ্রুপের কোনো প্রস্তুত রক্তদাতা পাওয়া যায়নি। অন্য এলাকা বা গ্রুপ সিলেক্ট করে দেখুন।"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredDonors.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function BloodDonorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFDFB]">
          <Navbar />
          <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500 text-sm">
            রক্তদাতাদের তালিকা লোড হচ্ছে...
          </div>
        </div>
      }
    >
      <BloodDonorContent />
    </Suspense>
  );
}