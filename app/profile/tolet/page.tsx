'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Home,
  Plus,
  Pencil,
  Eye,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Phone,
  Clock,
  MapPin,
  MessageSquareText,
  Inbox,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAreaById } from '@/lib/locations';
import {
  fetchMyListings,
  fetchToletRequestsAsOwner,
  archiveOwnListing,
  updateToletRequestStatus,
} from '@/lib/tolet-service';
import type { ToletListing, ToletRequest, ToletRequestStatus } from '@/lib/tolet-types';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { ListingStatusBadge, RequestStatusBadge } from '@/components/tolet/ListingStatusBadge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

export default function MyToletListingsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [listings, setListings] = useState<ToletListing[]>([]);
  const [requests, setRequests] = useState<ToletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(searchParams.get('created') ? 'created' : searchParams.get('updated') ? 'updated' : '');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [mine, inbox] = await Promise.all([
        fetchMyListings(user.id),
        fetchToletRequestsAsOwner(user.id),
      ]);
      if (!active) return;
      setListings(mine);
      setRequests(inbox);
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
      setError('তালিকা লোড করতে সমস্যা হয়েছে।');
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleArchive = async (listing: ToletListing) => {
    setBusyId(listing.id);
    setError('');
    const result = await archiveOwnListing(listing.id, user!.id);
    setBusyId(null);
    if (result.success) {
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: 'archived' as const } : l))
      );
    } else {
      setError(result.error || 'আর্কাইভ করতে ব্যর্থ হয়েছে।');
    }
  };

  const handleRequestStatus = async (reqId: string, status: ToletRequestStatus) => {
    setBusyId(reqId);
    const result = await updateToletRequestStatus(reqId, status);
    setBusyId(null);
    if (result.success) {
      setRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status } : r)));
    }
  };

  const activeRequests = useMemo(
    () => requests.filter((r) => r.status === 'submitted' || r.status === 'contacted'),
    [requests]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/profile" className="hover:text-emerald-800 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">মাই প্রপার্টিজ</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">মাই প্রপার্টিজ</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              আপনার পোস্ট করা বাসা ভাড়ার বিজ্ঞাপন ও ভাড়াটিয়ার অনুরোধ
            </p>
          </div>
          <Link
            href="/profile/tolet/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিজ্ঞাপন</span>
          </Link>
        </div>

        {notice && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            {notice === 'created'
              ? 'আপনার বিজ্ঞাপন জমা হয়েছে। প্রকাশের আগে এটি যাচাইয়ের অপেক্ষায় থাকবে।'
              : 'বিজ্ঞাপনের পরিবর্তন সংরক্ষণ করা হয়েছে।'}
          </div>
        )}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            <span>লোড হচ্ছে...</span>
          </div>
        ) : (
          <>
            {/* LISTINGS */}
            {listings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">এখনও কোনো বিজ্ঞাপন নেই</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
                  আপনার ফ্ল্যাট, মেস বা সিট ভাড়া দিতে চাইলে প্রথম বিজ্ঞাপনটি পোস্ট করুন।
                </p>
                <Link
                  href="/profile/tolet/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>বিজ্ঞাপন পোস্ট করুন</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => {
                  const area = getAreaById(listing.areaId);
                  const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
                  const cover = listing.photos[0];
                  return (
                    <div key={listing.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-4">
                      <div className="relative w-full sm:w-36 h-40 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        {cover ? (
                          <Image src={cover} alt={listing.title} fill sizes="144px" className="object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-emerald-800 text-xs font-semibold">ছবি নেই</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {typeInfo?.labelBn}
                          </span>
                          <ListingStatusBadge status={listing.status} />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">{listing.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {area?.nameBn || listing.areaId} • ৳{listing.rentPrice.toLocaleString('bn-BD')}/মাস
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          পোস্ট: {new Date(listing.createdAt).toLocaleDateString('bn-BD')}
                          {listing.publishedAt ? ` • প্রকাশ: ${new Date(listing.publishedAt).toLocaleDateString('bn-BD')}` : ''}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <Link
                            href={`/tolet/${listing.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            দেখা যাবে
                          </Link>
                          <Link
                            href={`/profile/tolet/${listing.id}/edit`}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold hover:bg-emerald-100"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            সম্পাদনা
                          </Link>
                          {listing.status !== 'archived' && (
                            <button
                              type="button"
                              disabled={busyId === listing.id}
                              onClick={() => handleArchive(listing)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                            >
                              {busyId === listing.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                              আর্কাইভ
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* REQUEST INBOX (owner authorized view) */}
            <div className="mt-10">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-emerald-700" />
                ভাড়াটিয়ার অনুরোধ
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                বাসা দেখতে ইচ্ছুকদের অনুরোধগুলো এখানে পাবেন। যোগাযোগের পর অবস্থা আপডেট করুন।
              </p>

              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
                  এখনও কোনো অনুরোধ আসেনি। বিজ্ঞাপন প্রকাশিত হলে অনুরোধগুলো এখানে দেখা যাবে।
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => {
                    const area = req.areaId ? getAreaById(req.areaId) : undefined;
                    return (
                      <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{req.customerName}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{req.listingTitle}</p>
                          </div>
                          <RequestStatusBadge status={req.status} />
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{req.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{area?.nameBn || req.areaId || 'এলাকা নেই'}</span>
                          </div>
                          {req.preferredTime && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{req.preferredTime}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{new Date(req.createdAt).toLocaleString('bn-BD', { dateStyle: 'short', timeStyle: 'short' } as Intl.DateTimeFormatOptions)}</span>
                          </div>
                        </div>

                        {req.message && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                            <MessageSquareText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            {req.message}
                          </div>
                        )}

                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                            {req.status === 'submitted' && (
                              <button
                                type="button"
                                disabled={busyId === req.id}
                                onClick={() => handleRequestStatus(req.id, 'contacted')}
                                className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold hover:bg-indigo-100 disabled:opacity-50"
                              >
                                যোগাযোগ হয়েছে
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busyId === req.id}
                              onClick={() => handleRequestStatus(req.id, 'completed')}
                              className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold hover:bg-emerald-100 disabled:opacity-50"
                            >
                              সম্পন্ন
                            </button>
                            <button
                              type="button"
                              disabled={busyId === req.id}
                              onClick={() => handleRequestStatus(req.id, 'cancelled')}
                              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {activeRequests.length === 0 && requests.length > 0 && (
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  সব অনুরোধ প্রক্রিয়া করা হয়েছে।
                </p>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}