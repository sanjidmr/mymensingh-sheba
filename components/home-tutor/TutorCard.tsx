'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  GraduationCap,
  BadgeCheck,
  ArrowRight,
  Star,
  Clock,
  Landmark,
} from 'lucide-react';
import type { HomeTutorProfile } from '@/lib/supabase/types';
import {
  TUTOR_TEACHING_MODE_LABELS,
  TUTOR_AVAILABILITY_LABELS,
  formatTutorFee,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';
import { resolveTutorPhotoUrl } from '@/lib/home-tutor-service';

export function TutorAvatar({ tutor, className = 'w-14 h-14 text-lg' }: { tutor: HomeTutorProfile; className?: string }) {
  const photo = resolveTutorPhotoUrl(tutor.profilePhotoUrl);
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-emerald-700 to-teal-700 flex items-center justify-center font-black text-white ring-2 ring-emerald-100 ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={tutor.fullName} className="w-full h-full object-cover" />
      ) : (
        <span>{tutor.fullName.charAt(0) || '?'}</span>
      )}
    </div>
  );
}

export function TutorRatingBadge({ tutor }: { tutor: HomeTutorProfile }) {
  if (!tutor.ratingCount) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
      {Number(tutor.ratingAvg ?? 0).toFixed(1)}
      <span className="font-medium text-amber-600/80">({tutor.ratingCount})</span>
    </span>
  );
}

export default function TutorCard({ tutor }: { tutor: HomeTutorProfile }) {
  const areas = tutor.preferredAreas
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));
  const availability = TUTOR_AVAILABILITY_LABELS[tutor.availability];

  return (
    <Link
      href={`/home-tutor/${tutor.id}`}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-150 flex flex-col overflow-hidden no-underline"
    >
      {/* Profile header */}
      <div className="relative w-full bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 px-4 pt-4 pb-14">
        <div className="flex items-center gap-3">
          <TutorAvatar tutor={tutor} className="w-16 h-16 text-2xl ring-2 ring-white/30" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-white text-base sm:text-lg leading-tight truncate">
                {tutor.fullName}
              </h3>
              {tutor.isVerified && (
                <BadgeCheck className="w-4 h-4 text-white/90 shrink-0" aria-label="ভেরিফাইড" />
              )}
            </div>
            <p className="text-[11px] text-emerald-50/90 mt-0.5 flex items-center gap-1 truncate">
              <GraduationCap className="w-3 h-3 shrink-0" />
              {tutor.qualification}
            </p>
          </div>
        </div>
      </div>

      {/* Overlapping quick meta */}
      <div className="px-4 -mt-9 relative">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm grid grid-cols-3 gap-2">
          <div>
            <span className="block text-[10px] text-slate-400">মাসিক বেতন</span>
            <span className="block text-xs font-black text-slate-900 truncate">
              {formatTutorFee(tutor.expectedSalaryMin, tutor.expectedSalaryMax)}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">অভিজ্ঞতা</span>
            <span className="block text-xs font-black text-slate-900 truncate">
              {tutor.experienceYears > 0 ? `${tutor.experienceYears} বছর` : 'নতুন'}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400">মাধ্যম</span>
            <span className="block text-xs font-black text-slate-900 truncate">
              {TUTOR_TEACHING_MODE_LABELS[tutor.teachingMode]}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-4 pb-4 pt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${availability.className}`}>
            <Clock className="w-3 h-3" />
            {availability.labelBn}
          </span>
          <TutorRatingBadge tutor={tutor} />
        </div>

        {tutor.preferredSubjects.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tutor.preferredSubjects.slice(0, 3).map((s) => (
              <span key={s} className="text-[11px] font-medium text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md">
                {s}
              </span>
            ))}
            {tutor.preferredSubjects.length > 3 && (
              <span className="text-[11px] font-semibold text-slate-500">
                +{tutor.preferredSubjects.length - 3}
              </span>
            )}
          </div>
        )}

        {tutor.bio && (
          <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
            {tutor.bio}
          </p>
        )}

        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2">
            {areas.length > 0 ? `পড়ানোর এলাকা: ${areas.join(' · ')}` : 'ময়মনসিংহ সিটি কর্পোরেশন'}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5" />
            {tutor.institution}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 transition-colors shrink-0">
            বিস্তারিত দেখুন
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}