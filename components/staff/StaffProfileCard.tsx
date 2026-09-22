'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Award, Clock, ShieldCheck, Zap, ArrowRight, BadgeCheck } from 'lucide-react';
import type { StaffProfile, StaffServiceUiConfig } from '@/lib/staff-types';
import { STAFF_AVAILABILITY_LABELS, formatSalaryBn } from '@/lib/staff-types';
import { staffWorkTypeLabels, STAFF_ACCENT_CLASSES } from '@/lib/staff-labels';
import { getAreaById } from '@/lib/locations';
import { resolveStaffImageUrl } from '@/lib/staff-service';

interface StaffProfileCardProps {
  profile: StaffProfile;
  serviceUi: StaffServiceUiConfig;
}

export function StaffProfileCard({ profile, serviceUi }: StaffProfileCardProps) {
  const accent = STAFF_ACCENT_CLASSES[serviceUi.accent] || STAFF_ACCENT_CLASSES.emerald;
  const areas = profile.areaIds
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));

  const labels = staffWorkTypeLabels(profile.serviceSlug, profile.workTypes);
  const rate =
    serviceUi.usesSalary && (profile.salaryMin != null || profile.salaryMax != null)
      ? formatSalaryBn(profile.salaryMin, profile.salaryMax)
      : profile.rateLabel;

  return (
    <Link
      href={`${serviceUi.route}/${profile.id}`}
      className="group bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-150 flex flex-col overflow-hidden no-underline"
    >
      {/* Image header */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {profile.imageUrl ? (
          <Image
            src={resolveStaffImageUrl(profile.imageUrl)}
            alt={profile.nameBn}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
            <span className="text-4xl font-black text-white/90">
              {profile.nameBn.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10 pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {profile.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700/95 px-2.5 py-1 rounded-full border border-white/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              ভেরিফাইড
            </span>
          ) : (
            <span />
          )}
          {profile.isEmergency && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-100 bg-rose-700/90 px-2.5 py-1 rounded-full border border-white/30">
              <Zap className="w-3.5 h-3.5" />
              জরুরিতে উপলব্ধ
            </span>
          )}
        </div>

        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          {STAFF_AVAILABILITY_LABELS[profile.availability] || 'সীমিত সময়ে'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-5">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug line-clamp-1">
          {profile.nameBn}
        </h3>
        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-snug">
          {profile.titleBn}
        </p>

        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-slate-500">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span className="line-clamp-1">
            {areas.length > 0 ? `সার্ভিস এলাকা: ${areas.join(', ')}` : 'ময়মনসিংহ সিটি কর্পোরেশন'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${accent.chip}`}>
            <Award className="w-3 h-3" />
            {profile.experienceYears > 0 ? `${profile.experienceYears} বছরের অভিজ্ঞতা` : 'নতুন'}
          </span>
        </div>

        {labels.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {labels.slice(0, 3).map((label) => (
              <span key={label} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {label}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-[11px] font-semibold text-slate-500">
                +{labels.length - 3}টি
              </span>
            )}
          </div>
        )}

        {rate && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wide text-slate-400">
                সম্মানী / চার্জ
              </span>
              <span className="block text-sm font-black text-slate-900 truncate">{rate}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white ${accent.btn} ${accent.btnHover} shrink-0`}>
              বিস্তারিত
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}