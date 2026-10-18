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
  RotateCcw,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Phone,
  Clock,
  MapPin,
  MessageSquareText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAreaById } from '@/lib/locations';
import {
  fetchMyListings,
  archiveOwnListing,
  restoreOwnListing,
  permanentlyDeleteOwnListing,
} from '@/lib/tolet-service';
import type { ToletListing } from '@/lib/tolet-types';
import { TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { ListingStatusBadge } from '@/components/tolet/ListingStatusBadge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

export default function MyToletListingsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [listings, setListings] = useState<ToletListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(
    searchParams.get('created')
      ? 'created'
      : searchParams.get('updated')
        ? 'updated'
        : searchParams.get('draft')
          ? 'draft'
          : ''
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const mine = await fetchMyListings(user.id, true);
      if (!active) return;
      setListings(mine);
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
    if (!window.confirm('এই বিজ্ঞাপনটি ডিসপ্লে থেকে সরাবেন? তথ্য আপনার অ্যাকাউন্টে থাকবে, পরে ফিরিয়ে আনতে পারবেন।')) return;
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

  const handleRestore = async (listing: ToletListing) => {
    setBusyId(listing.id);
    setError('');
    const result = await restoreOwnListing(listing.id, user!.id);
    setBusyId(null);
    if (result.success) {
      setListings((prev) =>
        prev.map((item) =>
          item.id === listing.id
            ? { ...item, status: 'pending_review', rejectionReason: undefined }
            : item
        )
      );
      setNotice('restored');
    } else {
      setError(result.error || 'বিজ্ঞাপনটি পুনরুদ্ধার করা যায়নি।');
    }
  };

  const handlePermanentDelete = async (listing: ToletListing) => {
    const linkedRequests = requests.filter((request) => request.listingId === listing.id).length;
    const relatedDataNotice = linkedRequests
      ? `\n\nএর সঙ্গে যুক্ত ${linkedRequests}টি ভাড়াটিয়ার অনুরোধ ও সংশ্লিষ্ট রিপোর্টও মুছে যাবে।`
      : '\n\nএর সঙ্গে যুক্ত ভাড়াটিয়ার অনুরোধ ও রিপোর্টও মুছে যাবে।';
    if (!window.confirm(`“${listing.title}” স্থায়ীভাবে ডিলিট করবেন?\n\nএই কাজ ফেরানো যাবে না। বিজ্ঞাপন ও অব্যবহৃত ছবি মুছে যাবে; অন্য বিজ্ঞাপনে ব্যবহৃত ছবি রাখা হবে।${relatedDataNotice}`)) return;
    setBusyId(listing.id);
    setError('');
    const result = await permanentlyDeleteOwnListing(listing.id, user!.id);
    setBusyId(null);
    if (result.success) {
      setListings((prev) => prev.filter((item) => item.id !== listing.id));
      setNotice(result.warning || 'বিজ্ঞাপন, এর সংযুক্ত অনুরোধ এবং ছবি স্থায়ীভাবে মুছে ফেলা হয়েছে।');
    } else {
      setError(result.error || 'বিজ্ঞাপন স্থায়ীভাবে ডিলিট করা যায়নি।');
    }
  };

  const displayedListings = listings.filter((listing) => listing.status !== 'archived');
  const archivedListings = listings.filter((listing) => listing.status === 'archived');

  const renderListingCard = (listing: ToletListing, archived = false) => {
    const area = getAreaById(listing.areaId);
    const typeInfo = TOLET_PROPERTY_TYPE_INFO[listing.propertyType];
    const cover = listing.photos[0];
    return (
      <div key={listing.id} className="flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-4 sm:flex-row sm:p-5">
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-brand-100 sm:h-28 sm:w-36">
          {cover ? (
            <Image src={cover} alt={listing.title} fill sizes="144px" className="object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-brand-700">ছবি নেই</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-ink-700">{typeInfo?.labelBn}</span>
            <ListingStatusBadge status={listing.status} />
          </div>
          <h3 className="line-clamp-2 break-words text-sm font-bold text-ink-900 sm:text-base">{listing.title}</h3>
          <p className="mt-0.5 text-xs text-ink-400">
            {area?.nameBn || listing.areaId} · ৳{listing.rentPrice.toLocaleString('bn-BD')}/মাস
          </p>
          <p className="mt-0.5 text-[11px] text-ink-400">
            পোস্ট: {new Date(listing.createdAt).toLocaleDateString('bn-BD')}
            {listing.publishedAt ? ` · প্রকাশ: ${new Date(listing.publishedAt).toLocaleDateString('bn-BD')}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!archived ? (
              <>
                <Link href={`/tolet/${listing.id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-brand-100 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-mist-50">
                  <Eye className="h-3.5 w-3.5" /> দেখুন
                </Link>
                <Link href={`/profile/tolet/${listing.id}/edit`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-100">
                  <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                </Link>
              </>
            ) : (
              <Link href={`/profile/tolet/${listing.id}/edit`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-100">
                <Pencil className="h-3.5 w-3.5" /> তথ্য সম্পাদনা
              </Link>
            )}
            {archived ? (
              <button type="button" disabled={busyId === listing.id} onClick={() => void handleRestore(listing)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-50">
                {busyId === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                পুনরুদ্ধার
              </button>
            ) : listing.status !== 'suspended' && (
              <button type="button" disabled={busyId === listing.id} onClick={() => void handleArchive(listing)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-brand-100 px-3 py-2 text-xs font-semibold text-ink-600 hover:bg-mist-50 disabled:opacity-50">
                {busyId === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                ডিসপ্লে থেকে সরান
              </button>
            )}
            <button type="button" disabled={busyId === listing.id} onClick={() => void handlePermanentDelete(listing)} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
              {busyId === listing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              স্থায়ীভাবে ডিলিট করুন
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-mist-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 sm:py-12">
        <div className="mb-4 flex items-center gap-2 text-xs text-ink-400">
          <Link href="/profile" className="hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>প্রোফাইলে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-ink-800 font-semibold">মাই প্রপার্টিজ</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">মাই প্রপার্টিজ</h1>
            <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
              আপনার পোস্ট করা বাসা ভাড়ার বিজ্ঞাপন ও ভাড়াটিয়ার অনুরোধ
            </p>
          </div>
          <Link
            href="/profile/tolet/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold  shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন বিজ্ঞাপন</span>
          </Link>
        </div>

        {notice && (
          <div className="mb-5 p-3.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
            {notice === 'created'
              ? 'আপনার বিজ্ঞাপন জমা হয়েছে। প্রকাশের আগে এটি যাচাইয়ের অপেক্ষায় থাকবে।'
              : notice === 'updated'
                ? 'বিজ্ঞাপনের পরিবর্তন সংরক্ষণ করা হয়েছে।'
                : notice === 'draft'
                  ? 'আপনার জমা দেওয়া হয়নি সংরক্ষণ করা হয়েছে। চাইলে পরে সম্পাদনা করে প্রকাশ করতে পারবেন।'
                  : notice}
          </div>
        )}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-2 text-ink-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
            <span>লোড হচ্ছে...</span>
          </div>
        ) : (
          <>
            {/* LISTINGS */}
            {displayedListings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-brand-100 p-12 text-center">
                <Home className="mx-auto mb-3 h-12 w-12 text-brand-200" />
                <h3 className="text-base font-bold text-ink-900">{archivedListings.length ? 'ডিসপ্লেতে কোনো বিজ্ঞাপন নেই' : 'এখনও কোনো বিজ্ঞাপন নেই'}</h3>
                <p className="text-xs text-ink-400 mt-1 max-w-sm mx-auto mb-5">
                  {archivedListings.length ? 'সরানো বিজ্ঞাপনগুলো নিচের “সরানো পোস্ট” অংশে পাবেন।' : 'আপনার ফ্ল্যাট, মেস বা সিট ভাড়া দিতে চাইলে প্রথম বিজ্ঞাপনটি পোস্ট করুন।'}
                </p>
                <Link
                  href="/profile/tolet/new"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-700 text-white text-xs font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>বিজ্ঞাপন পোস্ট করুন</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedListings.map((listing) => renderListingCard(listing))}
              </div>
            )}
            {archivedListings.length > 0 && (
              <section className="mt-8" aria-labelledby="archived-tolet-heading">
                <div className="mb-3 border-b border-brand-100 pb-3">
                  <h2 id="archived-tolet-heading" className="text-base font-bold text-ink-900">সরানো পোস্ট</h2>
                  <p className="mt-1 text-xs text-ink-500">এগুলো পাবলিক ডিসপ্লে থেকে সরানো হয়েছে। পুনরুদ্ধার করলে অ্যাডমিন অনুমোদনের অপেক্ষায় যাবে।</p>
                </div>
                <div className="space-y-3">{archivedListings.map((listing) => renderListingCard(listing, true))}</div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
