'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Hospital,
  Droplets,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarClock,
  MapPin,
  History,
  Send,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import {
  adminFetchBloodRequestById,
  adminFetchContactReleases,
  adminReleaseDonorContact,
  adminUpdateBloodRequest,
  getPrescriptionViewUrl,
  adminFetchDonorProfileById,
} from '@/lib/blood-donor-service';
import {
  BLOOD_REQUEST_STATUS_META,
  BLOOD_REQUEST_STATUSES,
} from '@/lib/blood-donor-types';
import { getAreaById } from '@/lib/locations';
import type { BloodContactRelease, BloodRequest, BloodRequestStatus, BloodDonorProfile } from '@/lib/supabase/types';

function AdminBloodRequestDetail({ requestId }: { requestId: string }) {
  const [req, setReq] = useState<BloodRequest | null>(null);
  const [donor, setDonor] = useState<BloodDonorProfile | null>(null);
  const [releases, setReleases] = useState<BloodContactRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [presUrl, setPresUrl] = useState<string | undefined>();
  const [presOpen, setPresOpen] = useState(false);
  const [presLoading, setPresLoading] = useState(false);
  const [releasedPhone, setReleasedPhone] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      adminFetchBloodRequestById(requestId),
      adminFetchContactReleases(requestId),
    ]).then(([r, c]) => {
      if (!active || !r) return;
      setReq(r);
      setAdminNotes(r.adminNotes || '');
      setRejectionReason(r.rejectionReason || '');
      setReleases(c);
      if (r.donorProfileId) {
        adminFetchDonorProfileById(r.donorProfileId).then((d) => {
          if (active) setDonor(d);
        });
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [requestId]);

  const reload = async () => {
    const [r, c] = await Promise.all([
      adminFetchBloodRequestById(requestId),
      adminFetchContactReleases(requestId),
    ]);
    if (r) {
      setReq(r);
      setReleases(c);
    }
  };

  const updateStatus = async (status: BloodRequestStatus, opts?: { adminNotes?: string; rejectionReason?: string }) => {
    if (!req) return;
    setBusy(true);
    setError('');
    const res = await adminUpdateBloodRequest(req.id, {
      status,
      adminNotes: opts?.adminNotes !== undefined ? opts.adminNotes : adminNotes,
      rejectionReason: opts?.rejectionReason,
    });
    setBusy(false);
    if (res.success) {
      if (res.request) setReq(res.request);
      if (opts?.rejectionReason) setRejectionReason(opts.rejectionReason);
    } else {
      setError(res.error || 'আপডেট ব্যর্থ হয়েছে');
    }
  };

  const saveNotes = async () => {
    if (!req) return;
    setBusy(true);
    const res = await adminUpdateBloodRequest(req.id, { adminNotes });
    setBusy(false);
    if (res.success && res.request) {
      setReq(res.request);
      setError('');
    } else {
      setError('নোট সংরক্ষণ ব্যর্থ হয়েছে');
    }
  };

  const openPrescription = async () => {
    if (!req?.prescriptionUrl || presUrl) {
      setPresOpen(true);
      return;
    }
    setPresLoading(true);
    const url = await getPrescriptionViewUrl(req.prescriptionUrl);
    setPresLoading(false);
    setPresUrl(url);
    setPresOpen(true);
  };

  const releaseContact = async () => {
    if (!req) return;
    setBusy(true);
    setError('');
    const res = await adminReleaseDonorContact(req.id);
    setBusy(false);
    if (res.success && res.phone) {
      setReleasedPhone(res.phone);
      await Promise.all([
        adminFetchContactReleases(req.id).then(setReleases),
        adminFetchBloodRequestById(req.id).then((r) => r && setReq(r)),
      ]);
    } else {
      setError(res.error || 'নম্বর প্রকাশ ব্যর্থ হয়েছে');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-32 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-rose-700" />
          <span className="text-sm">অনুরোধ লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-4" />
          <h1 className="text-base font-bold text-slate-900">অনুরোধটি পাওয়া যায়নি</h1>
          <Link href="/admin/blood" className="mt-5 inline-flex items-center gap-1.5 text-xs text-rose-700 font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" /> রক্ত মডারেশনে ফিরে যান
          </Link>
        </div>
      </div>
    );
  }

  const meta = BLOOD_REQUEST_STATUS_META[req.status];
  const area = getAreaById(req.areaId);
  const hospitalArea = getAreaById(req.hospitalAreaId);
  const statusOptions = BLOOD_REQUEST_STATUSES;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin/blood"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> রক্ত মডারেশনে ফিরে যান
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{req.patientName}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 font-black text-sm border border-rose-100">
                  {req.bloodGroup}
                </span>
                <span className="text-xs text-slate-500">{req.units} ইউনিট</span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${meta.badge}`}>{meta.labelBn}</span>
                <span className="text-[11px] text-slate-400">
                  জমা: {new Date(req.createdAt).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                শুধুমাত্র অ্যাডমিনের জন্য গোপন তথ্য
              </span>
            </div>
          </div>

          {/* Status control */}
          <div className="mt-5 pt-5 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">অনুরোধের অবস্থা পরিবর্তন</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {statusOptions.map((s) => {
                const m = BLOOD_REQUEST_STATUS_META[s];
                const isCurrent = req.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => updateStatus(s)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                      isCurrent
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.labelBn}
                  </button>
                );
              })}
            </div>
            {req.status === 'rejected' && req.rejectionReason && (
              <p className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900">
                <strong>প্রত্যাখ্যানের কারণ:</strong> {req.rejectionReason}
              </p>
            )}
            {req.contactReleasedAt && (
              <p className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                নম্বর মুক্তি হয়েছে: {new Date(req.contactReleasedAt).toLocaleString('bn-BD')}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: request info + prescription */}
          <div className="lg:col-span-7 space-y-6">
            {/* Patient / requester info */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">রোগী / যোগাযোগকারী</h2>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>যোগাযোগকারীর ফোন:</strong> {req.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Hospital className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>হাসপাতাল:</strong> {req.hospitalName} ({hospitalArea?.nameBn || req.hospitalAreaId}) — {req.hospitalLocation}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarClock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>প্রয়োজনীয় তারিখ/সময়:</strong> {req.requiredDateTime || 'উল্লেখ নেই'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span><strong>এলাকা:</strong> {area?.nameBn || req.areaId}</span>
                </div>
                {req.patientInfo && (
                  <div className="flex items-start gap-2">
                    <Droplets className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span><strong>রোগী সম্পর্কে:</strong> {req.patientInfo}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Prescription */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">প্রেসক্রিপশন / ডাক্তারের লিখন</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    গোপন নথি — শুধুমাত্র অ্যাডমিন দেখতে পারেন
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openPrescription}
                  disabled={presLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold disabled:opacity-60"
                >
                  {presLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  প্রেসক্রিপশন দেখুন
                </button>
              </div>
              <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl">
                প্রেসক্রিপশনটি private storage-এ সংরক্ষিত। স্বাক্ষরিত (signed) লিংক তৈরি হয়ে শুধুমাত্র এই পেজে দেখানো হয়।
              </p>
            </section>

            {/* Admin notes */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">অ্যাডমিন নোট</h2>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="যাচাইয়ের মন্তব্য লিখুন..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-600"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveNotes}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
                >
                  নোট সংরক্ষণ
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const r = window.prompt('অনুরোধটি সংশোধনের জন্য আবেদনকারীকে জানান (কারণ লিখুন):');
                    if (r == null) return;
                    if (!r.trim()) {
                      setError('কারণ লিখতে হবে।');
                      return;
                    }
                    updateStatus('pending_review', { rejectionReason: `সংশোধনের অনুরোধ: ${r.trim()}` });
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold disabled:opacity-50"
                >
                  সংশোধনের অনুরোধ করুন
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const r = window.prompt('প্রত্যাখ্যানের কারণ লিখুন (আবেদনকারী দেখতে পাবেন):');
                    if (r == null) return;
                    if (!r.trim()) {
                      setError('কারণ লিখতে হবে।');
                      return;
                    }
                    updateStatus('rejected', { rejectionReason: r.trim() });
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5 inline" /> প্রত্যাখ্যান
                </button>
              </div>
            </section>
          </div>

          {/* Right column: donor + contact release + audit */}
          <div className="lg:col-span-5 space-y-6">
            {/* Donor */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3">রক্তদাতা</h2>
              {req.donorName ? (
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-lg bg-rose-50 text-rose-800 font-black text-sm flex items-center justify-center border border-rose-100">
                      {req.donorBloodGroup || '?'}
                    </span>
                    <span className="font-bold text-slate-900">{req.donorName}</span>
                    {donor?.isVerified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600" aria-label="ভেরিফাইড" />
                    )}
                  </div>
                  {donor && (
                    <>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span>{getAreaById(donor.areaId)?.nameBn || donor.areaId}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Droplets className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span>{donor.donationCount} বার দান করেছেন</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">কোনো রক্তদাতা যুক্ত করা হয়নি।</p>
              )}

              {/* Contact release */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  নিয়ন্ত্রিত নম্বর প্রকাশ
                </h3>
                <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                  অনুমোদনের পর রক্তদাতার নম্বর আবেদনকারীকে প্রকাশ করতে নিচের বোতাম চাপুন। প্রতিটি প্রকাশ অডিটে সংরক্ষিত হয়।
                </p>
                {releasedPhone || req.contactReleasedAt ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {donor?.privatePhone || releasedPhone}
                    </p>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      এই নম্বরটি {req.contactReleasedAt ? new Date(req.contactReleasedAt).toLocaleString('bn-BD') : ''} ই রক্তদান অনুরোধকারীকে প্রকাশ করা হয়েছে।
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={releaseContact}
                      className="mt-2 text-[11px] text-emerald-800 underline font-semibold disabled:opacity-50"
                    >
                      নম্বর আবার দেখুন
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={busy || !donor}
                    onClick={releaseContact}
                    className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    রক্তদাতার নম্বর প্রকাশ করুন
                  </button>
                )}
                <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  নম্বর প্রকাশ মানে রোগীর পক্ষে সরাসরি যোগাযোগের অনুমতি — সম্পূর্ণ স্বেচ্ছাসেবী, কোনো অর্থ নয়।
                </p>
              </div>
            </section>

            {/* Audit trail */}
            <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" />
                নম্বর প্রকাশের অডিট
              </h2>
              {releases.length === 0 ? (
                <p className="text-xs text-slate-400">এখনও কোনো নম্বর প্রকাশ হয়নি।</p>
              ) : (
                <div className="space-y-3">
                  {releases.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">রক্তদাতার নম্বর প্রকাশ</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        প্রকাশ করেছেন: <strong>{c.releasedBy}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        সময়: {new Date(c.createdAt).toLocaleString('bn-BD')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Prescription modal */}
      {presOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-6"
          onClick={() => setPresOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>প্রেসক্রিপশন</span>
              </div>
              <button type="button" onClick={() => setPresOpen(false)} className="p-2 rounded-lg hover:bg-slate-100" aria-label="বন্ধ করুন">
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5 bg-slate-100">
              {!presUrl ? (
                <p className="text-center text-sm text-slate-500 py-20">
                  {presLoading ? 'লিংক তৈরি হচ্ছে...' : 'প্রেসক্রিপশন দেখা যাচ্ছে না'}
                </p>
              ) : req.prescriptionUrl.endsWith('.pdf') ? (
                <iframe src={presUrl} title="প্রেসক্রিপশন" className="w-full h-[70vh] bg-white rounded-xl" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={presUrl} alt="প্রেসক্রিপশন" className="mx-auto max-h-[70vh] rounded-xl shadow-sm" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBloodRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolved = use(params);
  return <AdminBloodRequestDetail requestId={resolved.id} />;
}