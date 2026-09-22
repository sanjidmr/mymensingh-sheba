'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  PhoneCall,
  Calendar,
  Heart,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export interface ProviderPersonCardProps {
  id: string;
  name: string;
  category: 'bua' | 'electrician' | 'plumber' | 'tutor' | 'blood' | 'moving';
  titleOrSpecialty: string;
  areaBn: string;
  wardNo?: string;
  avatarUrl?: string | null;
  rating?: number;
  reviewCount?: number;
  experienceYears?: string;
  hourlyOrMonthlyRate?: string;
  isVerified?: boolean;
  isAvailable?: boolean;
  institutionOrOrg?: string;
  detailHref: string;
  bloodGroup?: string;
  lastDonationDate?: string;
  ctaText?: string;
  className?: string;
}

export function ProviderPersonCard({
  id,
  name,
  category,
  titleOrSpecialty,
  areaBn,
  wardNo,
  avatarUrl,
  rating,
  reviewCount,
  experienceYears,
  hourlyOrMonthlyRate,
  isVerified = true,
  isAvailable = true,
  institutionOrOrg,
  detailHref,
  bloodGroup,
  lastDonationDate,
  ctaText = 'বিস্তারিত দেখুন',
  className,
}: ProviderPersonCardProps) {
  const isBloodDonor = category === 'blood';

  return (
    <div
      className={cn(
        'group bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-emerald-700/60 hover:shadow-md transition-all duration-150 flex flex-col justify-between',
        isBloodDonor ? 'hover:border-rose-300' : '',
        className
      )}
    >
      <div>
        {/* Header: Avatar, Name, Verification & Status */}
        <div className="flex items-start gap-3.5">
          <Avatar
            src={avatarUrl}
            name={name}
            size="lg"
            isVerified={isVerified}
            isAvailable={isAvailable}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-emerald-950 transition-colors">
                {name}
              </h3>

              {bloodGroup && (
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-black text-xs border border-rose-200">
                  {bloodGroup}
                </span>
              )}

              {isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" />
                  ভেরিফাইড
                </span>
              )}
            </div>

            <p className="text-xs font-medium text-slate-700 mt-0.5 truncate">
              {titleOrSpecialty}
            </p>

            {institutionOrOrg && (
              <p className="text-[11px] text-emerald-800 font-semibold truncate mt-0.5">
                {institutionOrOrg}
              </p>
            )}

            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
              <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
              <span>{areaBn}</span>
              {wardNo && <span>(ওয়ার্ড {wardNo})</span>}
            </div>
          </div>
        </div>

        {/* Badges / Metrics Row */}
        <div className="flex items-center flex-wrap gap-2 mt-3.5 pt-3 border-t border-slate-100 text-xs">
          {rating !== undefined && (
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{rating.toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span className="font-normal text-slate-500">
                  ({reviewCount})
                </span>
              )}
            </span>
          )}

          {experienceYears && (
            <span className="inline-flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              <Award className="w-3 h-3 text-slate-500" />
              <span>{experienceYears}</span>
            </span>
          )}

          {isAvailable !== undefined && !isBloodDonor && (
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium',
                isAvailable
                  ? 'bg-teal-50 text-teal-800'
                  : 'bg-slate-100 text-slate-600'
              )}
            >
              <Clock className="w-3 h-3" />
              <span>{isAvailable ? 'অন ডিউটি / ফ্রি' : 'ব্যস্ত'}</span>
            </span>
          )}

          {isBloodDonor && lastDonationDate && (
            <span className="inline-flex items-center gap-1 text-slate-600 bg-rose-50/70 text-rose-800 px-2 py-0.5 rounded-md">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
              <span>সর্বশেষ রক্তদান: {lastDonationDate}</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer / Rate / CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {hourlyOrMonthlyRate ? (
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">
              সম্মানী / চার্জ
            </span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              {hourlyOrMonthlyRate}
            </span>
          </div>
        ) : isBloodDonor ? (
          <div className="text-[11px] text-slate-500 leading-tight">
            স্বেচ্ছাসেবী • কোনো ফি প্রযোজ্য নয়
          </div>
        ) : (
          <div className="text-xs text-slate-500">অ্যাডমিন নির্ধারিত দর</div>
        )}

        <Link
          href={detailHref}
          className={cn(
            'px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-colors whitespace-nowrap',
            isBloodDonor
              ? 'bg-rose-700 hover:bg-rose-800 text-white'
              : 'bg-emerald-800 hover:bg-emerald-900 text-white'
          )}
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
}
