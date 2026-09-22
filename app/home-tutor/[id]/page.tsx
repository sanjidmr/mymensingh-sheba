'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  ShieldCheck,
  MapPin,
  BookOpen,
  Clock,
  Coins,
  CalendarDays,
  Users,
  Flag,
  ArrowLeft,
  BadgeCheck,
  Landmark,
  Loader2,
  Send,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { TutorAvatar, TutorRatingBadge } from '@/components/home-tutor/TutorCard';
import TutorRequestForm from '@/components/home-tutor/TutorRequestForm';
import { TutorReviewsSection } from '@/components/home-tutor/TutorReviewsSection';
import { TutorReportSheet } from '@/components/home-tutor/TutorReportSheet';
import { fetchPublishedTutorById } from '@/lib/home-tutor-service';
import { useAuth } from '@/lib/auth-context';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  TUTOR_TEACHING_MODE_LABELS,
  TUTOR_AVAILABILITY_LABELS,
  formatTutorFee,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';

function TutorProfileContent({ tutorId }: { tutorId: string }) {
  const { user } = useAuth();
  const [tutor, setTutor] = useState<HomeTutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchPublishedTutorById(tutorId).then((data) => {
      if (cancelled) return;
      setTutor(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [tutorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <span className="text-sm">প্রোফাইল লোড হচ্ছে...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-[#FBFDFB]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900">প্রোফাইলটি পাওয়া যায়নি</h1>
          <p className="text-sm text-slate-500 mt-2">
            শিক্ষক প্রোফাইলটি হয় প্রকাশিত নয় অথবা স্থগিত করা হয়েছে।
          </p>
          <Link
            href="/home-tutor"
            className="mt-6 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            গৃহশিক্ষক তালিকায় ফিরে যান
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const areas = tutor.preferredAreas
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const availability = TUTOR_AVAILABILITY_LABELS[tutor.availability];

  return (
    <div className="min-h-screen bg-[#FBFDFB]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        {/* Back link */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          গৃহশিক্ষক তালিকায় ফিরে যান
        </button>

        {/* Profile hero */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-5 sm:p-8 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TutorAvatar tutor={tutor} className="w-20 h-20 sm:w-24 sm:h-24 text-3xl ring-2 ring-white/30" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight">{tutor.fullName}</h1>
                {tutor.isVerified && (
                  <BadgeCheck className="w-5 h-5 text-white/90" aria-label="ভেরিফায়েড" />
                )}
              </div>
              <p className="text-sm text-emerald-50/90 mt-1">{tutor.qualification}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                  <Landmark className="w-3.5 h-3.5" />
                  {tutor.institution}
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-emerald-900`}>
                  <Clock className="w-3.5 h-3.5" />
                  {availability.labelBn}
                </span>
                <TutorRatingBadge tutor={tutor} />
              </div>
            </div>
            {tutor.isVerified && (
              <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[11px] font-bold">ভেরিফায়েড শিক্ষক</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: profile details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5">
                <Coins className="w-4 h-4 text-emerald-700 mb-1.5" />
                <span className="block text-[10px] text-slate-400">মাসিক বেতন</span>
                <span className="block text-xs font-black text-slate-900 mt-0.5">
                  {formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax)}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5">
                <GraduationCap className="w-4 h-4 text-emerald-700 mb-1.5" />
                <span className="block text-[10px] text-slate-400">অভিজ্ঞতা</span>
                <span className="block text-xs font-black text-slate-900 mt-0.5">
                  {tutor.experienceYears > 0 ? `${tutor.experienceYears} বছর` : 'নতুন'}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5">
                <Users className="w-4 h-4 text-emerald-700 mb-1.5" />
                <span className="block text-[10px] text-slate-400">পড়ানোর মাধ্যম</span>
                <span className="block text-xs font-black text-slate-900 mt-0.5">
                  {TUTOR_TEACHING_MODE_LABELS[tutor.teachingMode]}
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5">
                <CalendarDays className="w-4 h-4 text-emerald-700 mb-1.5" />
                <span className="block text-[10px] text-slate-400">সাপ্তাহিক দিন</span>
                <span className="block text-xs font-black text-slate-900 mt-0.5">
                  {tutor.daysPerWeek} দিন
                </span>
              </div>
            </div>

            {/* About */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
              <h2 className="font-bold text-slate-900 mb-3">শিক্ষক সম্পর্কে</h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {tutor.bio || 'এখনও সংক্ষিপ্ত পরিচয় যোগ করেননি।'}
              </p>
            </div>

            {/* Details grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 space-y-5">
              <h2 className="font-bold text-slate-900">পড়ানোর বিস্তারিত</h2>

              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> বিষয়সমূহ
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tutor.preferredSubjects.map((s) => (
                    <span key={s} className="text-[11px] font-medium text-emerald-900 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> শ্রেণি / স্তর
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tutor.preferredClasses.map((c) => (
                    <span key={c} className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> পছন্দের এলাকা (ময়মনসিংহ সিটি)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {areas.length > 0 ? (
                    areas.map((a) => (
                      <span key={a} className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">যেকোনো এলাকা</span>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            <TutorReviewsSection tutor={tutor} />

            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1.5"
            >
              <Flag className="w-3.5 h-3.5" />
              এই প্রোফাইলে সমস্যা হলে রিপোর্ট করুন
            </button>
          </div>

          {/* Right column: request form */}
          <div className="lg:col-span-5">
            <div id="tutor-request" className="lg:sticky lg:top-6">
              <TutorRequestForm tutor={tutor} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200">
        <a
          href="#tutor-request"
          className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-bold"
        >
          <Send className="w-4 h-4" />
          Tutor Request করুন
        </a>
      </div>
      <div className="lg:hidden h-16" />

      <TutorReportSheet open={reportOpen} onClose={() => setReportOpen(false)} tutorId={tutor.id} user={user} />
      <Footer />
    </div>
  );
}

export default function HomeTutorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <TutorProfileContent tutorId={resolvedParams.id} />;
}