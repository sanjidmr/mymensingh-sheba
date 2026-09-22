'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Phone,
  ArrowLeft,
  Search,
  Plus,
  Home,
  Loader2,
  X,
  UserCheck,
  User,
  Briefcase,
  Package,
  GraduationCap,
  Droplets,
  Heart,
  Lock,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAreaById } from '@/lib/locations';
import { TUTOR_SUBJECTS } from '@/lib/filter-definitions';
import {
  fetchToletRequestsAsCustomer,
  updateToletRequestStatus,
} from '@/lib/tolet-service';
import type { ToletRequest } from '@/lib/tolet-types';
import { RequestStatusBadge } from '@/components/tolet/ListingStatusBadge';
import {
  fetchMyBloodRequests,
  cancelMyBloodRequest,
} from '@/lib/blood-donor-service';
import { BLOOD_REQUEST_STATUS_META } from '@/lib/blood-donor-types';
import type { BloodRequest, BloodRequestStatus } from '@/lib/supabase/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const STATUS_CONFIGS = {
  new: { label: 'নতুন', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200', icon: FileText },
  reviewing: { label: 'পর্যালোচনাধীন', badgeClass: 'bg-violet-50 text-violet-900 border-violet-200', icon: UserCheck },
  contacted: { label: 'যোগাযোগ করা হয়েছে', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200', icon: Phone },
  in_progress: { label: 'কাজ চলছে', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200', icon: Clock },
  completed: { label: 'সম্পন্ন', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'বাতিল', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', icon: X },
  rejected: { label: 'প্রত্যাখ্যাত', badgeClass: 'bg-rose-50 text-rose-900 border-rose-200', icon: AlertCircle },
  submitted: { label: 'জমা দেওয়া হয়েছে', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200', icon: Clock },
  assigned: { label: 'কর্মী নির্ধারিত হয়েছে', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200', icon: CheckCircle2 },
};

export default function RequestsPage() {
  const { requests, user } = useAuth();
  const [supportRequested, setSupportRequested] = useState<string | null>(null);
  const [toletRequests, setToletRequests] = useState<ToletRequest[]>([]);
  const [loadingTolet, setLoadingTolet] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [loadingBlood, setLoadingBlood] = useState(true);
  const [cancellingBloodId, setCancellingBloodId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      fetchToletRequestsAsCustomer(user.id),
      fetchMyBloodRequests(user.id),
    ])
      .then(([t, b]) => {
        if (!active) return;
        setToletRequests(t);
        setBloodRequests(b);
      })
      .finally(() => {
        if (active) {
          setLoadingTolet(false);
          setLoadingBlood(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleCancelTolet = async (id: string) => {
    setCancellingId(id);
    const result = await updateToletRequestStatus(id, 'cancelled');
    setCancellingId(null);
    if (result.success) {
      setToletRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r)));
    }
  };

  const handleCancelBlood = async (id: string) => {
    if (!user) return;
    const confirmed = window.confirm('এই রক্তদান অনুরোধটি বাতিল করবেন?');
    if (!confirmed) return;
    setCancellingBloodId(id);
    const result = await cancelMyBloodRequest(id, user.id);
    setCancellingBloodId(null);
    if (result.success) {
      setBloodRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'cancelled' as BloodRequestStatus } : r)));
    }
  };

  const allEmpty = requests.length === 0 && toletRequests.length === 0 && bloodRequests.length === 0;

  const sortedTolet = useMemo(
    () => [...toletRequests].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [toletRequests]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">আমার রিকোয়েস্টসমূহ</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">আমার রিকোয়েস্টসমূহ</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              বাসা দেখার অনুরোধসহ সব সেবার বর্তমান অবস্থা এক জায়গায়
            </p>
          </div>

          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন রিকোয়েস্ট করুন</span>
          </Link>
        </div>

        {loadingTolet || loadingBlood ? (
          <div className="py-16 flex flex-col items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            <span>রিকোয়েস্ট লোড হচ্ছে...</span>
          </div>
        ) : allEmpty ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">এখনও কোনো রিকোয়েস্ট নেই</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
              বাসা দেখার অনুরোধ, রক্তদান (জরুরি), কাজের বুয়া, ইলেক্ট্রিশিয়ান জাতীয় সেবা রিকোয়েস্ট করলে তা এখানে দেখা যাবে।
            </p>
            <Link
              href="/tolet"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
            >
              <Search className="w-4 h-4" />
              <span>বাসা খুঁজুন</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* TO-LET REQUESTS */}
            {sortedTolet.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-slate-900 pt-2">বাসা দেখার অনুরোধ</h2>
                {sortedTolet.map((req) => {
                  const area = req.areaId ? getAreaById(req.areaId) : undefined;
                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider inline-flex items-center gap-1">
                            <Home className="w-3.5 h-3.5" /> To-Let অনুরোধ
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5 line-clamp-1">
                            {req.listingTitle || 'বাসা দেখার অনুরোধ'}
                          </h3>
                          <Link
                            href={`/tolet/${req.listingId}`}
                            className="text-xs text-emerald-800 font-semibold hover:underline"
                          >
                            বিজ্ঞাপনটি দেখুন
                          </Link>
                        </div>
                        <RequestStatusBadge status={req.status} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{area?.nameBn || req.areaId || 'এলাকা নির্ধারিত নয়'}</span>
                        </div>
                        {req.preferredTime && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>পছন্দের সময়: {req.preferredTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>জমার তারিখ: {new Date(req.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>

                      {req.message && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                          <strong>নোট:</strong> {req.message}
                        </div>
                      )}

                      {req.status === 'submitted' && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            disabled={cancellingId === req.id}
                            onClick={() => handleCancelTolet(req.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                          >
                            {cancellingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            অনুরোধ বাতিল করুন
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* BLOOD DONATION REQUESTS */}
            {bloodRequests.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-slate-900 pt-3">রক্তদান অনুরোধ</h2>
                {bloodRequests.map((req) => {
                  const meta = BLOOD_REQUEST_STATUS_META[req.status];
                  const hospitalArea = req.hospitalAreaId ? getAreaById(req.hospitalAreaId) : undefined;
                  const canCancel = req.status === 'pending_review' || (req.status === 'approved' && !req.contactReleasedAt);
                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-rose-200/70 p-5 sm:p-6 shadow-2xs hover:border-rose-300 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider inline-flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5" /> জরুরি রক্তদান
                          </span>
                          <div className="flex items-center gap-2 flex-wrap mt-1">
                            <h3 className="text-base font-bold text-slate-900">{req.patientName}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-100 text-rose-800 font-black text-xs">
                              {req.bloodGroup}
                            </span>
                            <span className="text-xs text-slate-500">{req.units} ইউনিট</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${meta.badge}`}>
                          <Droplets className="w-3.5 h-3.5" />
                          <span>{meta.labelBn}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-rose-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            <span className="block text-[10px] text-slate-400">হাসপাতাল</span>
                            {req.hospitalName} {hospitalArea ? `(${hospitalArea.nameBn})` : ''}
                          </span>
                        </div>
                        {req.requiredDateTime && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>প্রয়োজন: {req.requiredDateTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>যোগাযোগ: {req.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>জমার তারিখ: {new Date(req.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>

                      {req.contactReleasedAt && req.donorName && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Eye className="w-3.5 h-3.5" />
                            রক্তদাতা: {req.donorName} ({req.donorBloodGroup})
                          </div>
                          <p className="text-[11px] text-emerald-800 mt-1">
                            অ্যাডমিন রক্তদাতার নম্বরটি প্রকাশ করেছেন ({new Date(req.contactReleasedAt).toLocaleDateString('bn-BD')} থেকে)। নম্বরটি সরাসরি অ্যাডমিনের সাথে যোগাযোগের মাধ্যমে সংগ্রহ করুন এবং অন্যদের সাথে শেয়ার করবেন না।
                          </p>
                          <p className="text-[11px] text-emerald-800 mt-1">
                            রক্তদান সম্পূর্ণ স্বেচ্ছাসেবী — কোনো অর্থহীন লেনদেনে যাবেন না।
                          </p>
                        </div>
                      )}

                      {req.status === 'rejected' && req.rejectionReason && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          <AlertCircle className="w-3.5 h-3.5 inline" /> প্রত্যাখ্যানের কারণ: {req.rejectionReason}
                        </div>
                      )}

                      {canCancel && (
                        <div className="mt-4 pt-3 border-t border-rose-100 flex justify-end">
                          <button
                            type="button"
                            disabled={cancellingBloodId === req.id}
                            onClick={() => handleCancelBlood(req.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                          >
                            {cancellingBloodId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            অনুরোধ বাতিল করুন
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                  <Lock className="w-3 h-3" />
                  প্রেসক্রিপশন ও রক্তদাতার নম্বর শুধুমাত্র যাচাইয়ের পরে অ্যাডমিনের নিয়ন্ত্রণে প্রকাশ হয়।
                </p>
              </>
            )}

            {/* GENERIC SERVICE REQUESTS */}
            {requests.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-slate-900 pt-3">সার্ভিস রিকোয়েস্ট</h2>
                {requests.map((req) => {
                  const statusConf = STATUS_CONFIGS[req.status] || STATUS_CONFIGS.submitted;
                  const StatusIcon = statusConf.icon;
                  const area = getAreaById(req.areaId);

                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                            আইডি: #{req.id}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-0.5">{req.serviceTitleBn}</h3>
                          {req.profileTitleBn && (
                            <Link
                              href={`/${req.serviceSlug}/${req.profileId}`}
                              className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-800 font-semibold hover:underline"
                            >
                              <Briefcase className="w-3.5 h-3.5" />
                              প্রোফাইল: {req.profileTitleBn}
                            </Link>
                          )}
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${statusConf.badgeClass}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusConf.label}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                        {req.serviceSlug === 'home-moving' ? (
                          <>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>
                                <span className="block text-[10px] text-slate-400">থেকে</span>
                                {getAreaById(req.pickupAreaId)?.nameBn || req.pickupAreaId},
                                {' '}{req.pickupAddress}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>
                                <span className="block text-[10px] text-slate-400">যাবেন</span>
                                {getAreaById(req.destinationAreaId)?.nameBn || req.destinationAreaId},
                                {' '}{req.destinationAddress}
                              </span>
                            </div>
                            {req.movingItems && req.movingItems.length > 0 && (
                              <div className="flex items-center gap-2 sm:col-span-2">
                                <Package className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>
                                  মালামাল:{' '}
                                  {req.movingItems
                                    .map((i) => `${i.labelBn}${i.quantity ? ` ×${i.quantity}` : ''}`)
                                    .join(', ')}
                                </span>
                              </div>
                            )}
                            {req.parkingInfo && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>পার্কিং: {req.parkingInfo}</span>
                              </div>
                            )}
                          </>
) : req.serviceSlug === 'home-tutor' ? (
                          <>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>
                                বিষয়:{' '}
                                {TUTOR_SUBJECTS.find((s) => s.id === req.serviceType)?.labelBn ||
                                  req.serviceType ||
                                  '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{area?.nameBn || req.areaId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>যোগাযোগ: {req.contactName} ({req.contactPhone})</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{area?.nameBn || req.areaId}, {req.addressLine}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>যোগাযোগ: {req.contactName} ({req.contactPhone})</span>
                            </div>
                            {req.serviceType && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>কার্য ধরন: {req.serviceType}</span>
                              </div>
                            )}
                          </>
                        )}
                        {req.preferredDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>প্রত্যাশিত তারিখ: {req.preferredDate}</span>
                          </div>
                        )}
                        {req.preferredTime && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>পছন্দের সময়: {req.preferredTime}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>জমার তারিখ: {new Date(req.createdAt).toLocaleDateString('bn-BD')}</span>
                        </div>
                      </div>

                      {req.details && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                          <strong>বিবরণ:</strong> {req.details}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          className="text-emerald-800 font-semibold hover:underline"
                          onClick={() => setSupportRequested(req.id)}
                        >
                          সহায়তা চান
                        </button>
                      </div>

                      {supportRequested === req.id && (
                        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                          আপনার সহায়তা অনুরোধটি নোট করা হয়েছে। অ্যাডমিন টিম শীঘ্রই পর্যালোচনা করে যোগাযোগ করবে।
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}