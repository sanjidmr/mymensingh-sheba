'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PauseCircle,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Archive,
  Eye,
  Pencil,
  Phone,
  Building2,
  MessageSquareText,
  Inbox,
  BadgeCheck,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  adminFetchListingById,
  adminUpdateListing,
  getReportsForListing,
  fetchRequestsForListing,
  adminUpdateReportStatus,
} from '@/lib/tolet-service';
import type { ToletListing, ToletRequest, ListingReport, ToletListingStatus, ListingReportStatus } from '@/lib/tolet-types';
import {
  TOLET_PROPERTY_TYPE_INFO,
  TOLET_LISTING_STATUS_INFO,
} from '@/lib/tolet-types';
import { ListingStatusBadge, RequestStatusBadge } from '@/components/tolet/ListingStatusBadge';
import { getAreaById } from '@/lib/locations';

interface AdminToletDetailProps {
  params: Promise<{ id: string }>;
}

export default function AdminToletDetailPage({ params }: AdminToletDetailProps) {
  const { id } = use(params);

  const [listing, setListing] = useState<ToletListing | null>(null);
  const [requests, setRequests] = useState<ToletRequest[]>([]);
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const [listingData, reqData, repData] = await Promise.all([
        adminFetchListingById(id),
        fetchRequestsForListing(id),
        getReportsForListing(id),
      ]);
      if (!active) return;
      if (!listingData) setError('বিজ্ঞাপন পাওয়া যায়নি।');
      setListing(listingData);
      setRequests(reqData);
      setReports(repData);
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

  const applyReportStatus = async (reportId: string, status: ListingReportStatus) => {
    const res = await adminUpdateReportStatus(reportId, status);
    if (res.success) {
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    }
  };

  const applyPatch = async (
    patch: Partial<ToletListing>,
    label: string,
    opts?: { rejectReason?: string }
  ) => {
    if (!listing) return;
    setBusy(label);
    setError('');
    setNotice('');
    const result = await adminUpdateListing(listing.id, {
      ...patch,
      rejectionReason:
        opts?.rejectReason !== undefined
          ? opts.rejectReason
          : patch.status !== 'rejected'
            ? (listing.rejectionReason ?? undefined)
            : listing.rejectionReason,
    });
    setBusy('');
    if (!result.success || !result.listing) {
      setError(result.error || 'আপডেট ব্যর্থ হয়েছে।');
      return;
    }
    setListing(result.listing);
    if (label === 'approve') setNotice('বিজ্ঞাপনটি অনুমোদিত ও প্রকাশিত হয়েছে।');
    else if (label === 'reject') setNotice('বিজ্ঞাপনটি মালিকের কাছে ফেরত পাঠানো হয়েছে।');
    else setNotice('অবস্থা আপডেট হয়েছে।');
  };

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

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-sm w-full">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-2">বিজ্ঞাপন পাওয়া যায়নি</h2>
            <p className="text-xs text-slate-600 mb-5">{error}</p>
            <Link
              href="/admin/tolet"
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

  const area = getAreaById(listing.areaId);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
  const statusDescription: Partial<Record<ToletListingStatus, string>> = {
    draft: 'মালিক এখনও চূড়ান্তভাবে জমা দেননি; এই অবস্থা পাবলিক্যালি দেখা যাবে না।',
    pending_review: 'অ্যাডমিনের যাচাইয়ের অপেক্ষায় রয়েছে। যাচাই করে অনুমোদন বা ফেরত দিন।',
    approved: 'বিজ্ঞাপনটি সবার কাছে প্রকাশিত এবং ভাড়াটিয়ারা এখন অনুরোধ পাঠাতে পারেন।',
    rejected: 'মালিককে কারণসহ ফেরত পাঠানো হয়েছে। সংশোধন করে পুনরায় জমা দিলে আবার যাচাই হবে।',
    unavailable: 'বাসা/সিট বর্তমানে ভাড়ার জন্য উপলব্ধ নয়।',
    suspended: 'যেকোনো সমস্যার কারণে বিজ্ঞাপনটি সাময়িকভাবে স্থগিত।',
    archived: 'বিজ্ঞাপনটি আর্কাইভ; নতুন অবস্থায় ফিরিয়ে আনতে অ্যাডমিন অনুমোদন করুন।',
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <Link href="/admin" className="hover:text-emerald-800">অ্যাডমিন</Link>
          <span>/</span>
          <Link href="/admin/tolet" className="hover:text-emerald-800">To-Let</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">{listing.id.slice(0, 18)}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
                {listing.photos[0] ? (
                  <Image src={listing.photos[0]} alt="" fill sizes="64px" className="object-cover" referrerPolicy="no-referrer" />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {typeInfo?.labelBn}
                  </span>
                  <ListingStatusBadge status={listing.status} />
                  {listing.isVerified && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      ভেরিফাইড
                    </span>
                  )}
                </div>
                <h1 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-2">{listing.title}</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {area?.nameBn || listing.areaId} • {listing.specificAddress}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                disabled={busy !== ''}
                onClick={() => { setRejectMode(false); applyPatch({ status: 'approved' }, 'approve'); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-xs font-semibold hover:bg-emerald-900 disabled:opacity-50"
              >
                {busy === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>অনুমোদন করুন</span>
              </button>
              {listing.status !== 'archived' && (
                <button
                  type="button"
                  disabled={busy !== ''}
                  onClick={() => applyPatch({ status: 'archived' }, 'archive')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  {busy === 'archive' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  <span>আর্কাইভ</span>
                </button>
              )}
            </div>
          </div>

          {notice && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              {notice}
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {listing.rejectionReason && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <span className="font-bold">প্রত্যাখানের কারণ:</span> {listing.rejectionReason}
            </div>
          )}

          {/* Action row */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy !== ''}
              onClick={() => setRejectMode((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold hover:bg-rose-100 disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>রিভিউ ফেরত দিন</span>
            </button>
            <button
              type="button"
              disabled={busy !== ''}
              onClick={() => applyPatch({ status: 'suspended' }, 'suspend')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold hover:bg-red-100 disabled:opacity-50"
            >
              {busy === 'suspend' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PauseCircle className="w-3.5 h-3.5" />}
              <span>স্থগিত</span>
            </button>
            <button
              type="button"
              disabled={busy !== ''}
              onClick={() => applyPatch({ status: 'unavailable' }, 'unavailable')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>চলমান নয়</span>
            </button>
            <button
              type="button"
              disabled={busy !== ''}
              onClick={() => applyPatch({ isVerified: !listing.isVerified }, 'verify')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold disabled:opacity-50 ${
                listing.isVerified
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {busy === 'verify' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{listing.isVerified ? 'ভেরিফাইড (ক্লিক করে বাতিল)' : 'ভেরিফাইড করুন'}</span>
            </button>
            <Link
              href={`/admin/tolet/${listing.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </Link>
            {listing.status === 'approved' && (
              <Link
                href={`/tolet/${listing.id}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-100"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>পাবলিক ভিউ</span>
              </Link>
            )}
          </div>

          {rejectMode && (
            <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200">
              <label className="block text-xs font-semibold text-rose-900 mb-2">
                মালিককে জানানোর কারণ (সংক্ষেপে লিখুন)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="যেমন: ঠিকানা অস্পষ্ট, মূল ছবি প্রয়োজন..."
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy !== '' || rejectReason.trim().length < 5}
                  onClick={() =>
                    applyPatch(
                      { status: 'rejected', rejectionReason: rejectReason.trim() },
                      'reject'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
                >
                  {busy === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> : null}
                  নিশ্চিত করুন
                </button>
                <button
                  type="button"
                  onClick={() => { setRejectMode(false); setRejectReason(''); }}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Listing details */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">বিজ্ঞাপনের তথ্য</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-slate-500 mb-0.5">আয়তন / মেস</p>
                  <p className="font-bold text-slate-900">{typeInfo?.labelBn} / {typeInfo?.shortLabelBn}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-slate-500 mb-0.5">ভাড়া</p>
                  <p className="font-bold text-slate-900">৳{listing.rentPrice.toLocaleString('bn-BD')}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-slate-500 mb-0.5">বেড</p>
                  <p className="font-bold text-slate-900">{listing.bedrooms}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50">
                  <p className="text-slate-500 mb-0.5">বাথ</p>
                  <p className="font-bold text-slate-900">{listing.bathrooms}</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 mt-4 leading-relaxed whitespace-pre-line">
                {listing.description || 'কোনো বিবরণ নেই।'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {listing.facilities.map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-900 text-[11px] font-medium">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                মালিক
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                  {(listing.ownerName || '?').slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    {listing.ownerName || '—'}
                    {listing.ownerVerified && (
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </p>
                  {listing.ownerPhone && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" />
                      {listing.ownerPhone}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                পোস্ট: {new Date(listing.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' } as Intl.DateTimeFormatOptions)}
                {listing.publishedAt ? ` • প্রকাশ: ${new Date(listing.publishedAt).toLocaleDateString('bn-BD')}` : ''}
              </p>
            </div>

            {/* Requests */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-700" />
                এই বাড়ির জন্য অনুরোধ ({requests.length})
              </h3>
              {requests.length === 0 ? (
                <p className="text-xs text-slate-500">এখনও কোনো অনুরোধ নেই।</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div key={req.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <span className="text-xs font-bold text-slate-900">{req.customerName}</span>
                        <RequestStatusBadge status={req.status} />
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        {req.customerPhone} • {new Date(req.createdAt).toLocaleDateString('bn-BD')}
                      </p>
                      {req.message && (
                        <p className="text-[11px] text-slate-700 mt-1 flex items-start gap-1.5">
                          <MessageSquareText className="w-3 h-3 shrink-0 mt-0.5" />
                          {req.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reports */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                রিপোর্ট ({reports.length})
              </h3>
              {reports.length === 0 ? (
                <p className="text-xs text-slate-500">এই বিজ্ঞাপনের বিরুদ্ধে কোনো রিপোর্ট নেই।</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div key={rep.id} className="p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">রিপোর্ট #{rep.id.slice(-6)}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          rep.status === 'open'
                            ? 'bg-amber-100 text-amber-800'
                            : rep.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}>
                          {rep.status === 'open' ? 'খোলা' : rep.status === 'resolved' ? 'সমাধান হয়েছে' : 'ফেলে দেওয়া হয়েছে'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 mt-1 font-medium">{rep.reason}</p>
                      {rep.details && <p className="text-[11px] text-slate-500 mt-0.5">{rep.details}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {rep.reporterName} • {new Date(rep.createdAt).toLocaleDateString('bn-BD')}
                      </p>
                      {rep.status === 'open' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-semibold hover:bg-emerald-100"
                            onClick={() => applyReportStatus(rep.id, 'resolved')}
                          >
                            সমাধান হয়েছে
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-100"
                            onClick={() => applyReportStatus(rep.id, 'dismissed')}
                          >
                            বাতিল করুন
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold text-slate-900 mb-2">
                {TOLET_LISTING_STATUS_INFO[listing.status].labelBn}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {statusDescription[listing.status]}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}