'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  PauseCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Phone,
  Camera,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { adminFetchTutorProfiles, adminUpdateTutorProfile } from '@/lib/home-tutor-service';
import { TutorAvatar } from '@/components/home-tutor/TutorCard';
import type { HomeTutorProfile, TutorProfileStatus } from '@/lib/supabase/types';
import {
  TUTOR_STATUS_META,
  TUTOR_TEACHING_MODE_LABELS,
  TUTOR_AVAILABILITY_LABELS,
  formatTutorFee,
} from '@/lib/home-tutor-types';
import { getAreaById } from '@/lib/locations';
import { resolveTutorPhotoUrl } from '@/lib/home-tutor-service';

const TABS: { id: 'all' | TutorProfileStatus; labelBn: string }[] = [
  { id: 'all', labelBn: 'সব' },
  { id: 'pending_approval', labelBn: 'পর্যালোচনায়' },
  { id: 'approved', labelBn: 'প্রকাশিত' },
  { id: 'rejected', labelBn: 'প্রত্যাখ্যাত' },
  { id: 'suspended', labelBn: 'নিষিদ্ধ' },
  { id: 'paused', labelBn: 'বিরতি' },
];

export default function AdminTutorVerificationsPage() {
  const [profiles, setProfiles] = useState<HomeTutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | TutorProfileStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminFetchTutorProfiles()
      .then((data) => {
        if (active) setProfiles(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const patch = async (id: string, p: Parameters<typeof adminUpdateTutorProfile>[1], reload = false) => {
    setBusyId(id);
    setError('');
    const res = await adminUpdateTutorProfile(id, p);
    setBusyId(null);
    if (res.success && res.profile) {
      setProfiles((prev) => prev.map((x) => (x.id === id ? res.profile! : x)));
    } else if (res.success && reload) {
      const data = await adminFetchTutorProfiles();
      setProfiles(data);
    } else {
      setError(res.error || 'আপডেট ব্যর্থ হয়েছে');
    }
  };

  const handleReject = async (p: HomeTutorProfile) => {
    const reason = window.prompt(
      `প্রত্যাখ্যান / পরিবর্তনের কারণ লিখুন (তিনি দেখতে পাবেন):\n${p.fullName}`
    );
    if (reason == null) return;
    if (!reason.trim()) {
      setError('প্রত্যাখ্যানের কারণ লিখতে হবে।');
      return;
    }
    await patch(p.id, { status: 'rejected', rejectionReason: reason.trim() });
  };

  const filtered = profiles.filter((p) => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.fullName.toLowerCase().includes(q) &&
        !p.institution.toLowerCase().includes(q) &&
        !p.id.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">গৃহশিক্ষক ভেরিফিকেশন</h1>
            <p className="text-xs text-slate-500 mt-1">
              টিউটর প্রোফাইল যাচাই ও প্রকাশ। ব্যক্তিগত নম্বর শুধুমাত্র এখানে দেখানো হয়।
            </p>
          </div>
          <Link
            href="/home-tutor"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <GraduationCap className="w-4 h-4" />
            পাবলিক ডিরেক্টরি
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {TABS.map((t) => {
            const count =
              t.id === 'all'
                ? profiles.length
                : profiles.filter((p) => p.status === t.id).length;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {t.labelBn}
                <span className={`ml-1.5 text-[10px] ${active ? 'text-emerald-300' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম / প্রতিষ্ঠান খুঁজুন..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            প্রোফাইল লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm bg-white rounded-2xl border border-slate-200">
            এই ফিল্টারে কোনো প্রোফাইল নেই।
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => {
              const meta = TUTOR_STATUS_META[p.status];
              const expanded = expandedId === p.id;
              const photo = resolveTutorPhotoUrl(p.profilePhotoUrl);
              const areas = p.preferredAreas
                .map((id) => getAreaById(id)?.nameBn)
                .filter((n): n is string => Boolean(n));
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header row */}
                  <div className="p-4 sm:p-5 flex items-start gap-4">
                    <TutorAvatar tutor={p} className="w-12 h-12 text-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">{p.fullName}</h3>
                        {p.isVerified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-600" aria-label="ভেরিফায়েড" />
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                          {meta.labelBn}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                        {p.qualification} · {p.institution}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <Lock className="w-3 h-3" />
                        {p.privatePhone || '—'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : p.id)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 shrink-0"
                      aria-label={expanded ? 'বন্ধ করুন' : 'বিস্তারিত'}
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="px-4 sm:px-5 pb-5 border-t border-slate-100 pt-4">
                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="block text-[10px] text-slate-400">বিষয়সমূহ</span>
                          <span className="block text-slate-800 font-medium mt-0.5">
                            {p.preferredSubjects.join(' · ') || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">শ্রেণি</span>
                          <span className="block text-slate-800 font-medium mt-0.5">
                            {p.preferredClasses.join(' · ') || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">পছন্দের এলাকা</span>
                          <span className="block text-slate-800 font-medium mt-0.5">
                            {areas.join(' · ') || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">বেতন</span>
                          <span className="block text-slate-800 font-medium mt-0.5">
                            {formatTutorFee(p.expectedSalaryMin, p.expectedSalaryMax)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">মাধ্যম / প্রাপ্যতা</span>
                          <span className="block text-slate-800 font-medium mt-0.5">
                            {TUTOR_TEACHING_MODE_LABELS[p.teachingMode]} ·{' '}
                            {TUTOR_AVAILABILITY_LABELS[p.availability].labelBn}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">অভিজ্ঞতা / রেটিং</span>
                          <span className="block text-slate-800 font-medium mt-0.5">
                            {p.experienceYears} বছর ·{' '}
                            {Number(p.ratingCount ?? 0) > 0
                              ? `${Number(p.ratingAvg ?? 0).toFixed(1)}★ (${p.ratingCount ?? 0})`
                              : 'কোনো রিভিউ নেই'}
                          </span>
                        </div>
                      </div>

                      {/* Rejection reason */}
                      {p.status === 'rejected' && p.rejectionReason && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <strong>প্রত্যাখ্যানের কারণ:</strong> {p.rejectionReason}
                        </div>
                      )}
                      {p.adminNotes && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                          <strong>অ্যাডমিন নোট:</strong> {p.adminNotes}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {p.status !== 'approved' && (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => patch(p.id, { status: 'approved', isVerified: true })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {busyId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Approve / প্রকাশ
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() =>
                              patch(p.id, { status: 'suspended' }, true)
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold disabled:opacity-50"
                          >
                            {busyId === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <PauseCircle className="w-3.5 h-3.5" />
                            )}
                            Suspend / নিষিদ্ধ
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => handleReject(p)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-white text-rose-700 text-xs font-bold hover:bg-rose-50 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject / পরিবর্তন চান
                        </button>
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => patch(p.id, { isVerified: !p.isVerified })}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold disabled:opacity-50 ${
                            p.isVerified
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {p.isVerified ? 'ভেরিফায়েড ✅' : 'ভেরিফায়ড চিহ্নিত করুন'}
                        </button>
                        {['suspended', 'paused'].includes(p.status) && (
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => patch(p.id, { status: 'approved' }, true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            পুনরায় সক্রিয়
                          </button>
                        )}
                        <Link
                          href={`/home-tutor/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          প্রোফাইল
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}