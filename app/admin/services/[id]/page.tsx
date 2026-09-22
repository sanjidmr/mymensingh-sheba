'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Pencil,
  Eye,
  Phone,
  MapPin,
  Briefcase,
  BadgeCheck,
  CheckCircle2,
  Zap,
  DollarSign,
  Clock,
  CalendarDays,
  Share2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { adminFetchStaffProfileById, adminFetchStaffRequests, resolveStaffImageUrl } from '@/lib/staff-service';
import type { StaffProfile } from '@/lib/staff-types';
import { STAFF_SERVICE_UI, STAFF_REQUEST_STATUS_INFO, formatExperienceBn, formatSalaryBn } from '@/lib/staff-types';
import { STAFF_AVAILABILITY_LABELS, STAFF_WORK_MODE_LABELS } from '@/lib/staff-types';
import { STAFF_ACCENT_CLASSES, staffWorkTypeLabels } from '@/lib/staff-labels';
import { getAreaById } from '@/lib/locations';
import type { StaffRequest } from '@/lib/staff-types';

interface AdminStaffProfileDetailProps {
  params: Promise<{ id: string }>;
}

export default function AdminStaffProfileDetailPage({ params }: AdminStaffProfileDetailProps) {
  const { id } = use(params);

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [requests, setRequests] = useState<StaffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const [profileData, reqData] = await Promise.all([
        adminFetchStaffProfileById(id),
        adminFetchStaffRequests(),
      ]);
      if (!active) return;
      if (!profileData) setError('প্রোফাইল পাওয়া যায়নি।');
      setProfile(profileData);
      setRequests(reqData.filter((r) => r.profileId === id));
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setError('তথ্য লোড করতে সমস্যা হয়েছে।');
    });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-sm text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700 mr-2" />
          লোড হচ্ছে...
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm w-full">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-2">প্রোফাইল পাওয়া যায়নি</h2>
            <p className="text-xs text-slate-600 mb-5">{error}</p>
            <Link
              href="/admin/services"
              className="inline-block px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
            >
              তালিকায় ফিরে যান
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const ui = STAFF_SERVICE_UI[profile.serviceSlug];
  const accent = STAFF_ACCENT_CLASSES[ui?.accent || 'emerald'];
  const areas = profile.areaIds.map((id) => getAreaById(id)?.nameBn).filter(Boolean);
  const labels = staffWorkTypeLabels(profile.serviceSlug, profile.workTypes);

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <Link href="/admin/services" className="hover:text-emerald-800 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>কর্মী প্রোফাইল তালিকা</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{profile.nameBn}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                {profile.imageUrl ? (
                  <Image
                    src={resolveStaffImageUrl(profile.imageUrl)}
                    alt={profile.nameBn}
                    fill
                    sizes="80px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
                    <span className="text-2xl font-black text-white/90">{profile.nameBn.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${accent.chip}`}>
                    {ui?.nameBn || profile.serviceSlug}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      profile.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {profile.isActive ? 'প্রকাশিত' : 'নিষ্ক্রিয়'}
                  </span>
                  {profile.isVerified && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      ভেরিফাইড
                    </span>
                  )}
                  {profile.isEmergency && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      জরুরি
                    </span>
                  )}
                </div>
                <h1 className="font-bold text-slate-900 text-lg sm:text-xl">{profile.nameBn}</h1>
                <p className="text-xs text-slate-600 mt-0.5">{profile.titleBn}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                href={`/admin/services/${profile.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>সম্পাদনা</span>
              </Link>
              {profile.isActive && (
                <Link
                  href={`${ui?.route}/${profile.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>পাবলিক ভিউ</span>
                </Link>
              )}
            </div>
          </div>

          {/* Stat boxes */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" /> অভিজ্ঞতা
              </p>
              <p className="font-bold text-slate-900">{formatExperienceBn(profile.experienceYears)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> এলাকা
              </p>
              <p className="font-bold text-slate-900 line-clamp-1">{areas.join(', ') || 'সব এলাকা'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> প্রাপ্যতা
              </p>
              <p className="font-bold text-slate-900">{STAFF_AVAILABILITY_LABELS[profile.availability]}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> প্রত্যাশিত সম্মানী
              </p>
              <p className="font-bold text-slate-900 line-clamp-1">
                {ui?.usesSalary
                  ? formatSalaryBn(profile.salaryMin, profile.salaryMax)
                  : profile.rateLabel || 'আলোচনা সাপেক্ষে'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile details */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">কাজের ধরন / দক্ষতা</h3>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => (
                  <span key={l} className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-900 text-[11px] font-medium">
                    {l}
                  </span>
                ))}
              </div>
              {(profile.workMode || profile.timeSlot) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {profile.workMode && (
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-slate-500 mb-0.5">কাজের ধরন (শিফট)</p>
                      <p className="font-bold text-slate-900">{STAFF_WORK_MODE_LABELS[profile.workMode] || profile.workMode}</p>
                    </div>
                  )}
                  {profile.timeSlot && (
                    <div className="p-3 rounded-xl bg-slate-50">
                      <p className="text-slate-500 mb-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> পছন্দের সময়
                      </p>
                      <p className="font-bold text-slate-900">{profile.timeSlot}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">বিস্তারিত তথ্য</h3>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {profile.aboutBn || 'কোনো বিবরণ নেই।'}
              </p>
            </div>

            {/* Requests */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-700" />
                সার্ভিস অনুরোধ ({requests.length})
              </h3>
              {requests.length === 0 ? (
                <p className="text-xs text-slate-500">এই কর্মীর জন্য এখনও কোনো সার্ভিস অনুরোধ নেই।</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <span className="text-xs font-bold text-slate-900">{req.customerName}</span>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap ${
                            STAFF_REQUEST_STATUS_INFO[req.status]?.badgeClass || 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {STAFF_REQUEST_STATUS_INFO[req.status]?.labelBn || req.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {req.customerPhone} • {new Date(req.createdAt).toLocaleDateString('bn-BD')}
                      </p>
                      {req.description && (
                        <p className="text-[11px] text-slate-700 mt-1">{req.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-700" />
                যোগাযোগ (অ্যাডমিন-শুধু)
              </h3>
              {profile.phonePrivate ? (
                <a
                  href={`tel:${profile.phonePrivate}`}
                  className="flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-900"
                >
                  <Phone className="w-4 h-4" />
                  {profile.phonePrivate}
                </a>
              ) : (
                <p className="text-xs text-slate-500">কোনো নম্বর দেওয়া হয়নি।</p>
              )}
              <p className="text-[11px] text-slate-400 mt-3">
                এই নম্বর শুধু অ্যাডমিন দেখতে পাবেন; পাবলিক ভিউতে প্রকাশ হয় না।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                তথ্য
              </h3>
              <p className="text-[11px] text-slate-400">
                তৈরি: {new Date(profile.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' } as Intl.DateTimeFormatOptions)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                শেষ আপডেট: {new Date(profile.updatedAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' } as Intl.DateTimeFormatOptions)}
              </p>
              <div className="mt-4 p-3 rounded-xl bg-slate-50">
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  সর্বদা বাস্তব তথ্য প্রদান করুন। ভেরিফাইড ব্যাজ<ShieldCheck className="w-3 h-3 inline" /> কেবলমাত্র বাস্তব যাচাইয়ের পর দেওয়া হয়।
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}