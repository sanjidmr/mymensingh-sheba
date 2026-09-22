'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, BadgeCheck, ArrowRight, Heart, Droplets, Lock, CalendarClock } from 'lucide-react';
import type { BloodDonorProfile } from '@/lib/supabase/types';
import { DONOR_AVAILABILITY_LABELS, formatLastDonation } from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import { resolveDonorPhotoUrl } from '@/lib/blood-donor-service';

export function DonorAvatar({ donor, className = 'w-14 h-14 text-lg' }: { donor: BloodDonorProfile; className?: string }) {
  const photo = resolveDonorPhotoUrl(donor.profilePhotoUrl);
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center font-black text-white ring-2 ring-white/30 ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={donor.fullName} className="w-full h-full object-cover" />
      ) : (
        <span>{donor.fullName.charAt(0) || '?'}</span>
      )}
    </div>
  );
}

export function DonorVerifiedBadge({ donor }: { donor: BloodDonorProfile }) {
  if (!donor.isVerified) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
      <BadgeCheck className="w-3 h-3" />
      ভেরিফাইড
    </span>
  );
}

export default function DonorCard({ donor }: { donor: BloodDonorProfile }) {
  const area = getAreaById(donor.areaId);
  const availability = DONOR_AVAILABILITY_LABELS[donor.isAvailable ? 'available' : 'unavailable'];

  return (
    <Link
      href={`/blood-donor/${donor.id}`}
      className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all duration-150 flex flex-col overflow-hidden no-underline"
    >
      {/* Profile header */}
      <div className="relative w-full bg-gradient-to-br from-rose-700 via-rose-600 to-red-700 px-4 pt-4 pb-12">
        <div className="flex items-center gap-3">
          <DonorAvatar donor={donor} className="w-14 h-14 text-2xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-white text-base sm:text-lg leading-tight truncate">
                {donor.fullName}
              </h3>
              {donor.isVerified && (
                <BadgeCheck className="w-4 h-4 text-white/90 shrink-0" aria-label="ভেরিফাইড" />
              )}
            </div>
            <p className="text-[11px] text-rose-50/90 mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {area?.nameBn || donor.areaId}
            </p>
          </div>
        </div>
      </div>

      {/* Overlapping blood group chip */}
      <div className="px-4 -mt-7 relative">
        <div className="bg-white border border-rose-200 rounded-xl p-3 shadow-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-800 flex items-center justify-center font-black text-base border border-rose-200">
              {donor.bloodGroup}
            </span>
            <div>
              <span className="block text-[10px] text-slate-400">রক্তের গ্রুপ</span>
              <span className="block text-xs font-black text-slate-900">
                {donor.bloodGroup} ({donor.isAvailable ? 'দানে প্রস্তুত' : 'বিরতিতে'})
              </span>
            </div>
          </div>
          <Droplets className="w-5 h-5 text-rose-300" aria-hidden="true" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col px-4 pb-4 pt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${availability.className}`}>
            <Heart className="w-3 h-3" />
            {availability.labelBn}
          </span>
          <DonorVerifiedBadge donor={donor} />
        </div>

        {donor.intro && (
          <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-2">
            {donor.intro}
          </p>
        )}

        <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
          <div className="flex items-start gap-1.5">
            <CalendarClock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span>সর্বশেষ রক্তদান: {formatLastDonation(donor.lastDonationDate)}</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Droplets className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
            <span>{donor.donationCount} বার রক্তদান</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            নম্বর অ্যাডমিন-নিয়ন্ত্রিত
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 transition-colors shrink-0">
            বিস্তারিত দেখুন
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}