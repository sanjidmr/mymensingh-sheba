'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Award, Clock, ShieldCheck, Zap, Calendar, User, Phone, Mail, Send, Flag, Share2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import type { StaffProfile, StaffServiceUiConfig } from '@/lib/staff-types';
import { STAFF_AVAILABILITY_LABELS, formatSalaryBn } from '@/lib/staff-types';
import { staffWorkTypeLabels, STAFF_ACCENT_CLASSES } from '@/lib/staff-labels';
import { getAreaById } from '@/lib/locations';
import { resolveStaffImageUrl } from '@/lib/staff-service';
import { StaffRequestForm } from './StaffRequestForm';
import { StaffReportSheet } from './StaffReportSheet';

interface StaffDetailProps {
  profile: StaffProfile;
  serviceUi: StaffServiceUiConfig;
  imageless?: boolean;
}

export function StaffDetail({ profile, serviceUi, imageless = false }: StaffDetailProps) {
  const { user } = useAuth();
  const accent = STAFF_ACCENT_CLASSES[serviceUi.accent] || STAFF_ACCENT_CLASSES.emerald;

  const [showReport, setShowReport] = React.useState(false);

  const areas = profile.areaIds
    .map((id) => getAreaById(id)?.nameBn)
    .filter((n): n is string => Boolean(n));

  const labels = staffWorkTypeLabels(profile.serviceSlug, profile.workTypes);
  const rate =
    serviceUi.usesSalary && (profile.salaryMin != null || profile.salaryMax != null)
      ? formatSalaryBn(profile.salaryMin, profile.salaryMax)
      : profile.rateLabel;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {imageless ? (
        <div className={`relative flex flex-wrap items-center justify-between gap-2 sm:gap-3 bg-gradient-to-r ${accent.gradient} px-4 py-3 sm:px-5 sm:py-3.5`}>
          <div className="flex items-center gap-2 flex-wrap">
            {profile.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-full border border-white/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                ভেরিফাইড
              </span>
            )}
            {profile.isEmergency && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-100 bg-rose-700/90 px-2.5 py-1 rounded-full border border-white/30">
                <Zap className="w-3.5 h-3.5" />
                জরুরি সার্ভিস
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-slate-900/40 px-2.5 py-1 rounded-full shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {STAFF_AVAILABILITY_LABELS[profile.availability] || 'সীমিত সময়ে'}
          </span>
        </div>
      ) : (
        <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {profile.imageUrl ? (
          <Image
            src={resolveStaffImageUrl(profile.imageUrl)}
            alt={profile.nameBn}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
            <span className="text-5xl font-black text-white/90">
              {profile.nameBn.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10 pointer-events-none" />

        <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
          {profile.isVerified ? (
            <span className="inline-flex items-center gap-1 text-[13px] sm:text-sm font-bold text-white bg-emerald-700/95 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/30">
              <ShieldCheck className="w-4 h-4" />
              ভেরিফাইড
            </span>
          ) : (
            <span />
          )}
          {profile.isEmergency && (
            <span className="inline-flex items-center gap-1 text-[13px] sm:text-sm font-bold text-rose-100 bg-rose-700/90 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/30">
              <Zap className="w-4 h-4" />
              জরুরি সার্ভিস
            </span>
          )}
        </div>

        <span className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 inline-flex items-center gap-1 text-[13px] sm:text-sm font-semibold text-white bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full">
          <Clock className="w-4 h-4" />
          {STAFF_AVAILABILITY_LABELS[profile.availability] || 'সীমিত সময়ে'}
        </span>
      </div>
      )}

      {/* Body */}
      <div className="p-4 sm:p-6">
        {/* Header info */}
        <div className="mb-4 sm:mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
            {profile.nameBn}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1.5">{profile.titleBn}</p>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4 sm:mb-5 p-3 sm:p-4 rounded-xl bg-slate-50">
          <div className="text-center">
            <div className="text-lg font-black text-slate-900">{profile.experienceYears || 0}</div>
            <div className="text-xs sm:text-[11px] text-slate-500">বছর অভিজ্ঞতা</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-900">{areas.length}</div>
            <div className="text-xs sm:text-[11px] text-slate-500">সার্ভিস এলাকা</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-900">{labels.length}</div>
            <div className="text-xs sm:text-[11px] text-slate-500">কার্য প্রকার</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black text-slate-900">
              {serviceUi.usesSalary && (profile.salaryMin != null || profile.salaryMax != null) ? 'বেতন' : 'হার'}
            </div>
            <div className="text-xs sm:text-[11px] text-slate-500">{serviceUi.usesSalary ? 'বেতন' : 'হার'}</div>
          </div>
        </div>

        {/* Work types chips */}
        {labels.length > 0 && (
          <section className="mb-4 sm:mb-5">
            <h2 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              দক্ষতা ও কাজের ধরন
            </h2>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <span key={label} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium ${accent.chip}`}>
                  {label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* About */}
        {profile.aboutBn && (
          <section className="mb-4 sm:mb-5">
            <h2 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              সম্পর্কে
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{profile.aboutBn}</p>
          </section>
        )}

        {/* Schedule & details */}
        <section className="mb-4 sm:mb-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            সময়সূচী ও উপলব্ধতা
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 text-sm sm:grid-cols-4">
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400">{profile.workMode ? '•' : ''}</span>
              <span className="text-slate-600">
                {profile.workMode === 'full_time' ? 'ফুল-টাইম'
                  : profile.workMode === 'part_time' ? 'পার্ট-টাইম'
                  : profile.workMode === 'live_in' ? 'লিভ-ইন'
                  : profile.workMode === 'day_based' ? 'দিন ভিত্তিক'
                  : 'নির্ধারিত নয়'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400">{profile.timeSlot ? '•' : ''}</span>
              <span className="text-slate-600">{profile.timeSlot || 'নির্ধারিত নয়'}</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">
                {serviceUi.usesSalary && (profile.salaryMin != null || profile.salaryMax != null)
                  ? rate
                  : profile.rateLabel || 'নির্ধারিত নয়'}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400">{profile.availability ? '•' : ''}</span>
              <span className="text-slate-600 capitalize">{profile.availability}</span>
            </div>
          </div>
        </section>

        {/* Service areas */}
        <section className="mb-4 sm:mb-5">
          <h2 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            সার্ভিস এলাকা
          </h2>
          <div className="flex flex-wrap gap-2">
            {areas.length > 0 ? (
              areas.map((a) => (
                <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <MapPin className="w-3 h-3" />
                  {a}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500">ময়মনসিংহ সিটি কর্পোরেশন (সব এলাকা)</span>
            )}
          </div>
        </section>

        {/* Contact/CTA */}
        <div className="border-t border-slate-100 pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <StaffRequestForm profile={profile} serviceUi={serviceUi} />
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="w-full sm:w-auto min-h-11 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <Flag className="w-4 h-4" />
              রিপোর্ট
            </button>
          </div>

          <p className="text-[11.5px] sm:text-[11px] text-slate-500 text-center mt-4 leading-relaxed">
            ফোন নম্বর সুরক্ষার জন্য সরাসরি দেখা যায় না। অনুরোধ পাঠালে কর্মী আপনার সাথে যোগাযোগ করবেন।
          </p>
        </div>
      </div>

      <StaffReportSheet
        open={showReport}
        onClose={() => setShowReport(false)}
        profileId={profile.id}
        serviceSlug={profile.serviceSlug}
        user={user ? { id: user.id, fullName: user.fullName } : null}
      />
    </div>
  );
}