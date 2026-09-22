'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Edit3,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Lock,
  BookOpen,
  Users,
  MapPin,
  Coins,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import { useAuth } from '@/lib/auth-context';
import { TutorAvatar } from '@/components/home-tutor/TutorCard';
import {
  TUTOR_STATUS_META,
  TUTOR_TEACHING_MODE_LABELS,
  TUTOR_AVAILABILITY_LABELS,
  formatTutorFee,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';

export default function ProfileHomeTutorDashboardPage() {
  const { user, homeTutorProfile } = useAuth();

  if (!homeTutorProfile) {
    return (
      <RoutePlaceholderShell
        title="আমার গৃহশিক্ষক প্রোফাইল"
        subtitle="পড়াতে চাইলে এক মিনিটেই গৃহশিক্ষক প্রোফাইল খুলুন।"
        categoryBadge="Home Tutor প্রোফাইল"
        breadcrumbs={[
          { label: 'প্রোফাইল', href: '/profile' },
          { label: 'গৃহশিক্ষক ড্যাশবোর্ড' },
        ]}
      >
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            আপনিও কি পড়াতে চান?
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
            ময়মনসিংহ সিটির শিক্ষার্থী বা অভিভাবক হিসেবে আপনার শিক্ষক প্রোফাইল খুলুন। অ্যাডমিন
            যাচাইয়ের পর পাবলিক ডিরেক্টরিতে প্রকাশিত হবে।
          </p>
          <Link
            href="/profile/home-tutor/setup"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            গৃহশিক্ষক প্রোফাইল খুলুন
          </Link>
        </div>
      </RoutePlaceholderShell>
    );
  }

  const status = TUTOR_STATUS_META[homeTutorProfile.status];
  const areas = homeTutorProfile.preferredAreas
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const availability = TUTOR_AVAILABILITY_LABELS[homeTutorProfile.availability];

  return (
    <RoutePlaceholderShell
      title="আমার গৃহশিক্ষক প্রোফাইল"
      subtitle="শিক্ষক হিসেবে আপনার প্রোফাইল ও অবস্থা পরিচালনা করুন।"
      categoryBadge="Home Tutor প্রোফাইল"
      breadcrumbs={[
        { label: 'প্রোফাইল', href: '/profile' },
        { label: 'গৃহশিক্ষক ড্যাশবোর্ড' },
      ]}
    >
      <div className="space-y-5">
        {/* Status banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TutorAvatar tutor={homeTutorProfile} className="w-14 h-14 text-xl" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">{homeTutorProfile.fullName}</h3>
                {homeTutorProfile.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-emerald-700" aria-label="ভেরিফায়েড" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{homeTutorProfile.qualification}</p>
              <span className={`inline-block mt-2 text-[11px] font-bold px-2.5 py-1 rounded-full ${status.badge}`}>
                {status.labelBn}
              </span>
            </div>
          </div>
          {user?.role === 'admin' && <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">অ্যাডমিন ভিউ</span>}
        </div>

        {/* Status note / rejection reason */}
        {homeTutorProfile.status === 'rejected' && homeTutorProfile.rejectionReason && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-800 leading-relaxed">
            <strong className="block mb-1">প্রত্যাখ্যানের কারণ:</strong>
            {homeTutorProfile.rejectionReason}
          </div>
        )}
        {homeTutorProfile.status !== 'rejected' && (
          <p className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed">
            {status.note}
          </p>
        )}

        {/* Profile summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-bold text-slate-900">প্রোফাইল সারাংশ</h3>
            <Link
              href="/profile/home-tutor/setup"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5" />
              সম্পাদনা
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400">বিষয়সমূহ</span>
                <span className="block text-xs text-slate-800 font-medium">
                  {homeTutorProfile.preferredSubjects.join(' · ') || '—'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400">শ্রেণি / স্তর</span>
                <span className="block text-xs text-slate-800 font-medium">
                  {homeTutorProfile.preferredClasses.join(' · ') || '—'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400">পছন্দের এলাকা</span>
                <span className="block text-xs text-slate-800 font-medium">
                  {areas.join(' · ') || '—'}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Coins className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400">প্রত্যাশিত বেতন</span>
                <span className="block text-xs text-slate-800 font-medium">
                  {formatTutorFee(homeTutorProfile.expectedSalaryMin, homeTutorProfile.expectedSalaryMax)}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarDays className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400">সাপ্তাহিক দিন</span>
                <span className="block text-xs text-slate-800 font-medium">
                  {homeTutorProfile.daysPerWeek} দিন
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <GraduationCap className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400">পড়ার মাধ্যম / প্রাপ্যতা</span>
                <span className="block text-xs text-slate-800 font-medium">
                  {TUTOR_TEACHING_MODE_LABELS[homeTutorProfile.teachingMode]} · {availability.labelBn}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/profile/requests"
            className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3"
          >
            <div>
              <span className="block text-xs font-bold text-slate-900">আমার রিকোয়েস্ট</span>
              <span className="block text-[11px] text-slate-500 mt-1">
                অভিভাবকদের পাঠানো টিউশন রিকোয়েস্ট দেখুন
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-800 shrink-0" />
          </Link>

          {homeTutorProfile.status === 'approved' ? (
            <Link
              href={`/home-tutor/${homeTutorProfile.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3"
            >
              <div>
                <span className="block text-xs font-bold text-slate-900">পাবলিক প্রোফাইল দেখা</span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  অভিভাবকরা যেভাবে আপনার প্রোফাইল দেখতে পাবেন
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-800 shrink-0" />
            </Link>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="block text-xs font-bold text-slate-900">প্রকাশিত নয়</span>
                <span className="block text-[11px] text-slate-500 mt-1">
                  অ্যাডমিন অনুমোদনের পর প্রোফাইল প্রকাশিত হবে
                </span>
              </div>
            </div>
          )}
        </div>

        {homeTutorProfile.status === 'rejected' && (
          <Link
            href="/profile/home-tutor/setup"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            সংশোধন করে আবার জমা দিন
          </Link>
        )}
      </div>
    </RoutePlaceholderShell>
  );
}