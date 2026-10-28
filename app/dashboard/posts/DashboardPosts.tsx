'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Archive, Eye, Loader2, Pencil, PlusCircle, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  deleteCommunityPost,
  deleteCommunityPostDraft,
  fetchMyPosts,
  loadCommunityPostDraft,
  setMyMarketplaceStatus,
} from '@/lib/catalog-service';
import {
  archiveOwnListing,
  fetchMyListings,
  permanentlyDeleteOwnListing,
  restoreOwnListing,
} from '@/lib/tolet-service';
import type { CommunityPost, MarketplaceStatus, PostKind } from '@/lib/catalog-types';
import type { ToletListing, ToletListingStats } from '@/lib/tolet-types';
import { fetchOwnListingStats } from '@/lib/tolet-tracking';
import { communityDraftRow, mergeRows, type DashboardRow } from '@/lib/dashboard';
import { ListingMedia } from '@/components/catalog/CatalogCards';
import { LIGHT_FOCUS } from '@/components/about/AboutSectionBits';

const STATUS_FILTERS = [
  { id: 'all', label: 'সব অবস্থা' },
  { id: 'draft', label: 'জমা দেওয়া হয়নি' },
  { id: 'pending', label: 'অপেক্ষমাণ' },
  { id: 'published', label: 'প্রকাশিত' },
  { id: 'needs_edit', label: 'সংশোধন প্রয়োজন' },
  { id: 'rejected', label: 'বাতিল' },
  { id: 'expired', label: 'মেয়াদ শেষ' },
  { id: 'sold', label: 'বিক্রি হয়েছে' },
  { id: 'closed', label: 'বন্ধ' },
  { id: 'archived', label: 'সরানো পোস্ট' },
  { id: 'paused', label: 'বিরতিতে' },
  { id: 'suspended', label: 'স্থগিত' },
];

const CATEGORY_FILTERS = [
  { id: 'all', label: 'সব ক্যাটাগরি' },
  { id: 'tolet', label: 'বাসাভাড়া' },
  { id: 'tutor', label: 'গৃহশিক্ষক' },
  { id: 'donor', label: 'রক্তদাতা' },
  { id: 'job', label: 'চাকরি' },
  { id: 'buy_sell', label: 'কেনাবেচা' },
];

const DRAFT_KINDS: PostKind[] = ['job', 'buy_sell'];

function draftValues(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== 'object' || !('values' in value)) return null;
  const values = (value as { values?: unknown }).values;
  if (!values || typeof values !== 'object' || Array.isArray(values)) return null;
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}

function draftImage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('photos' in value)) return undefined;
  const photos = (value as { photos?: unknown }).photos;
  return Array.isArray(photos)
    ? photos.find((photo): photo is string => typeof photo === 'string')
    : undefined;
}

function displayDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'তারিখ পাওয়া যায়নি';
  return new Intl.DateTimeFormat('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function DashboardPosts() {
  const { user, homeTutorProfile, bloodDonorProfile } = useAuth();
  const params = useSearchParams();
  const draftCleanupValue = params.get('draftCleanup');
  const draftCleanupKind: PostKind | null =
    draftCleanupValue === 'job' || draftCleanupValue === 'buy_sell'
      ? draftCleanupValue
      : null;
  const initialStatus = params.get('status');
  const [statusFilter, setStatusFilter] = useState(
    initialStatus === 'approved' ? 'published' : initialStatus || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [listingStats, setListingStats] = useState<Record<string, ToletListingStats>>({});
  const [analyticsError, setAnalyticsError] = useState('');
  const [draftRows, setDraftRows] = useState<DashboardRow[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupComplete, setCleanupComplete] = useState(false);
  const [cleanupError, setCleanupError] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [userPosts, userListings, ...draftResults] = await Promise.all([
          fetchMyPosts(true),
          fetchMyListings(user.id, true),
          ...DRAFT_KINDS.map((kind) => loadCommunityPostDraft(kind)),
        ]);
        if (!active) return;
        const drafts = draftResults.flatMap((result, index) => {
          if (!result.success) throw new Error(`জমা দেওয়া হয়নি পোস্ট লোড করা যায়নি: ${result.error}`);
          const values = draftValues(result.data.draft);
          if (!values || !result.data.updatedAt) return [];
          return [
            communityDraftRow(
              DRAFT_KINDS[index],
              values,
              result.data.updatedAt,
              draftImage(result.data.draft)
            ),
          ];
        });
        setPosts(userPosts.filter((post) => post.kind !== 'news'));
        setListings(userListings);
        setDraftRows(drafts);
        setLoadError('');
        try {
          const stats = await fetchOwnListingStats(userListings.map((listing) => listing.id));
          if (active) {
            setListingStats(stats);
            setAnalyticsError('');
          }
        } catch (cause) {
          if (active) {
            setListingStats({});
            setAnalyticsError(
              cause instanceof Error ? cause.message : 'বাসাভাড়ার পরিসংখ্যান লোড করা যায়নি।'
            );
          }
        }
      } catch (cause) {
        if (active) {
          setPosts([]);
          setListings([]);
          setDraftRows([]);
          setLoadError(cause instanceof Error ? cause.message : 'পোস্ট লোড করা যায়নি।');
        }
      } finally {
        if (active) setLoadedUserId(user.id);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const rows = useMemo(
    () => mergeRows(posts, listings, homeTutorProfile, bloodDonorProfile, draftRows, listingStats),
    [posts, listings, homeTutorProfile, bloodDonorProfile, draftRows, listingStats]
  );
  const shown = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      const matchesStatus = statusFilter === 'all' || row.statusFilter === statusFilter;
      const matchesCategory = categoryFilter === 'all' || row.categoryFilter === categoryFilter;
      const matchesSearch =
        !needle ||
        `${row.title} ${row.typeLabel} ${row.categoryLabel || ''}`
          .toLocaleLowerCase()
          .includes(needle);
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [rows, search, statusFilter, categoryFilter]);

  const removeRemainingDraft = async () => {
    if (!draftCleanupKind) return;
    setCleanupBusy(true);
    setCleanupError('');
    try {
      const result = await deleteCommunityPostDraft(draftCleanupKind);
      if (!result.success) throw new Error(result.error);
      setCleanupComplete(true);
      setDraftRows((current) => current.filter((row) => row.draftKind !== draftCleanupKind));
    } catch (cause) {
      setCleanupError(cause instanceof Error ? cause.message : 'জমা দেওয়া হয়নি পোস্ট মুছতে সমস্যা হয়েছে।');
    } finally {
      setCleanupBusy(false);
    }
  };

  const updateMarketplaceStatus = async (post: CommunityPost, status: MarketplaceStatus) => {
    if (post.kind !== 'buy_sell' || post.status !== 'approved' || !user) return;
    setBusyId(post.id);
    setError('');
    try {
      const result = await setMyMarketplaceStatus(post.id, status);
      if (!result.success) throw new Error(result.error);
      setPosts((current) =>
        current.map((item) =>
          item.id === post.id ? { ...item, marketplaceStatus: result.data } : item
        )
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'বিক্রির অবস্থা আপডেট করা যায়নি।');
    } finally {
      setBusyId(null);
    }
  };

  const archiveListing = async (listing: ToletListing) => {
    if (!user || !confirm(`“${listing.title}” ডিসপ্লে থেকে সরাবেন? পোস্টটি আপনার অ্যাকাউন্টে থাকবে এবং পরে পুনরুদ্ধার করা যাবে।`)) return;
    setBusyId(listing.id);
    setError('');
    try {
      const result = await archiveOwnListing(listing.id, user.id);
      if (!result.success) throw new Error(result.error);
      setListings((current) =>
        current.map((item) => item.id === listing.id ? { ...item, status: 'archived' } : item)
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'পোস্টটি ডিসপ্লে থেকে সরানো যায়নি।');
    } finally {
      setBusyId(null);
    }
  };

  const restoreListing = async (listing: ToletListing) => {
    if (!user) return;
    setBusyId(listing.id);
    setError('');
    try {
      const result = await restoreOwnListing(listing.id, user.id);
      if (!result.success) throw new Error(result.error);
      setListings((current) =>
        current.map((item) =>
          item.id === listing.id
            ? { ...item, status: 'pending_review', rejectionReason: undefined }
            : item
        )
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'পোস্টটি পুনরুদ্ধার করা যায়নি।');
    } finally {
      setBusyId(null);
    }
  };

  const permanentlyDeleteListing = async (listing: ToletListing) => {
    if (!user) return;
    if (!confirm(`“${listing.title}” স্থায়ীভাবে ডিলিট করবেন?\n\nএই কাজ ফেরানো যাবে না। বিজ্ঞাপন, অব্যবহৃত ছবি এবং যুক্ত ভাড়াটিয়ার অনুরোধ ও রিপোর্ট মুছে যাবে; অন্য বিজ্ঞাপনে ব্যবহৃত ছবি রাখা হবে।`)) return;
    setBusyId(listing.id);
    setError('');
    try {
      const result = await permanentlyDeleteOwnListing(listing.id, user.id);
      if (!result.success) throw new Error(result.error);
      setListings((current) => current.filter((item) => item.id !== listing.id));
      setListingStats((current) => {
        const next = { ...current };
        delete next[listing.id];
        return next;
      });
      if (result.warning) setError(result.warning);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'পোস্টটি স্থায়ীভাবে ডিলিট করা যায়নি।');
    } finally {
      setBusyId(null);
    }
  };

  const removeRow = async (row: DashboardRow) => {
    if (!user || !row.canRemove) return;
    if (row.source === 'tolet') return;
    if (!confirm(`“${row.title}” স্থায়ীভাবে মুছে ফেলবেন?\n\nএই কাজ ফেরানো যাবে না।`)) return;
    setBusyId(row.id);
    setError('');
    try {
      if (row.source === 'post') {
        const result = await deleteCommunityPost(row.id);
        if (!result.success) throw new Error(result.error);
        setPosts((current) => current.filter((post) => post.id !== row.id));
      } else if (row.source === 'draft' && row.draftKind) {
        const result = await deleteCommunityPostDraft(row.draftKind);
        if (!result.success) throw new Error(result.error);
        setDraftRows((current) => current.filter((draft) => draft.id !== row.id));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'পোস্টটি সরানো যায়নি।');
    } finally {
      setBusyId(null);
    }
  };

  if (!user || loadedUserId !== user.id) {
    return <div className="h-64 animate-pulse rounded-2xl bg-mist-100" aria-hidden="true" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink-900">আমার পোস্টসমূহ</h1>
          <p className="mt-1 text-[12.5px] text-ink-500">আপনার সব ক্যাটাগরির {rows.length}টি পোস্ট ও প্রোফাইল।</p>
        </div>
        <Link
          href="/dashboard/new"
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-brand-700 px-4 text-[13px] font-bold text-white hover:bg-brand-800 ${LIGHT_FOCUS}`}
        >
          <PlusCircle className="h-4 w-4" /> নতুন পোস্ট
        </Link>
      </div>

      {draftCleanupKind && (
        <div
          role={cleanupError ? 'alert' : 'status'}
          className={`rounded-xl border px-3 py-2.5 text-[12px] ${cleanupError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
        >
          {cleanupComplete ? (
            'জমা দেওয়া হয়নি পোস্টটি মুছে ফেলা হয়েছে।'
          ) : (
            <>
              পোস্ট জমা হয়েছে, তবে জমা দেওয়া হয়নি পোস্টটি রয়ে গেছে।{' '}
              <button
                type="button"
                onClick={() => void removeRemainingDraft()}
                disabled={cleanupBusy}
                className="font-bold underline disabled:opacity-50"
              >
                {cleanupBusy ? 'মুছছে…' : 'জমা দেওয়া হয়নি পোস্ট মুছুন'}
              </button>
              {cleanupError && <span className="ml-2">{cleanupError}</span>}
            </>
          )}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="শিরোনাম বা ক্যাটাগরি খুঁজুন"
            aria-label="পোস্ট খুঁজুন"
            className={`min-h-[44px] w-full rounded-xl border border-brand-100 bg-white pl-9 pr-3 text-[13px] text-ink-900 placeholder:text-ink-400 ${LIGHT_FOCUS}`}
          />
        </label>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          aria-label="ক্যাটাগরি অনুযায়ী ছাঁকুন"
          className={`min-h-[44px] rounded-xl border border-brand-100 bg-white px-3 text-[13px] text-ink-800 ${LIGHT_FOCUS}`}
        >
          {CATEGORY_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>{filter.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="অবস্থা অনুযায়ী ছাঁকুন"
          className={`min-h-[44px] rounded-xl border border-brand-100 bg-white px-3 text-[13px] text-ink-800 ${LIGHT_FOCUS}`}
        >
          {STATUS_FILTERS.map((filter) => (
            <option key={filter.id} value={filter.id}>{filter.label}</option>
          ))}
        </select>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-800">
          {loadError}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[12.5px] text-red-800">
          {error}
        </div>
      )}
      {analyticsError && (
        <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-900">
          {analyticsError}
        </div>
      )}

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-200 bg-white px-4 py-10 text-center">
          <p className="text-[13px] font-bold text-ink-900">
            {rows.length ? 'এই অনুসন্ধানে কোনো পোস্ট পাওয়া যায়নি' : 'এখনো কোনো পোস্ট নেই'}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-[12px] text-ink-500">
            {rows.length ? 'ক্যাটাগরি বা অবস্থা বদলে আবার চেষ্টা করুন।' : 'নতুন পোস্ট তৈরি করলে এখানে দেখা যাবে।'}
          </p>
          {!rows.length && (
            <Link
              href="/dashboard/new"
              className={`mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-brand-700 px-5 text-[13px] font-bold text-white ${LIGHT_FOCUS}`}
            >
              <PlusCircle className="h-4 w-4" /> নতুন পোস্ট করুন
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((row) => (
            <li key={`${row.source}-${row.id}`} className="rounded-2xl border border-brand-100 bg-white p-3">
              <div className="flex min-w-0 gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-mist-100">
                  <ListingMedia src={row.image} alt={row.title} label={row.title} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-px text-[10px] font-extrabold ${row.statusClass}`}>
                      {row.statusLabel}
                    </span>
                    <span className="text-[10.5px] font-bold text-brand-600">
                      {row.typeLabel}{row.categoryLabel ? ` · ${row.categoryLabel}` : ''}
                    </span>
                  </div>
                  <h2 className="mt-1 line-clamp-2 break-words text-[13px] font-bold leading-snug text-ink-900">
                    {row.title}
                  </h2>
                  <p className="mt-1 text-[11px] text-ink-500">তৈরি: {displayDate(row.date)}</p>
                  {row.source === 'tolet' && row.analytics && (
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                      দেখা {row.analytics.views} · যোগাযোগের বাটন {row.analytics.contactClicks} ·
                      পছন্দ {row.analytics.favorites}
                    </p>
                  )}
                  {row.rejectionReason && (
                    <p className="mt-1 rounded-lg bg-red-50 px-2 py-1.5 text-[11.5px] leading-relaxed text-red-800">
                      কারণ: {row.rejectionReason}
                    </p>
                  )}
                  {row.post?.kind === 'buy_sell' && row.post.status === 'approved' && (
                    <label className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-ink-600">
                      বিক্রির অবস্থা
                      <select
                        value={row.post.marketplaceStatus ?? 'available'}
                        disabled={busyId === row.id}
                        onChange={(event) => {
                          const value = event.target.value;
                          const post = row.post;
                          if (
                            post &&
                            (value === 'available' || value === 'sold' || value === 'closed')
                          ) {
                            void updateMarketplaceStatus(post, value);
                          }
                        }}
                        aria-label={`${row.title} - বিক্রির অবস্থা`}
                        className={`min-h-[36px] rounded-lg border border-brand-100 bg-white px-2 text-[11px] text-ink-800 disabled:opacity-50 ${LIGHT_FOCUS}`}
                      >
                        <option value="available">বিক্রির জন্য আছে</option>
                        <option value="sold">বিক্রি হয়েছে</option>
                        <option value="closed">বন্ধ</option>
                      </select>
                    </label>
                  )}
                </div>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-brand-100/70 pt-2.5 sm:grid-cols-3">
                <Link
                  href={row.viewHref}
                  className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-brand-200 text-[12px] font-bold text-brand-700 hover:bg-mist-50 ${LIGHT_FOCUS}`}
                >
                  <Eye className="h-3.5 w-3.5" /> দেখুন
                </Link>
                {row.editHref ? (
                  <Link
                    href={row.editHref}
                    className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-brand-200 text-[12px] font-bold text-brand-700 hover:bg-mist-50 ${LIGHT_FOCUS}`}
                  >
                    <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
                  </Link>
                ) : (
                  <span className="flex min-h-[40px] items-center justify-center rounded-lg bg-mist-50 text-[11px] font-bold text-ink-400">
                    সম্পাদনা নয়
                  </span>
                )}
                {row.canRemove && (
                  row.source === 'tolet' && row.listing ? (
                    <div className="col-span-2 grid gap-2 sm:col-span-1">
                      {row.listing.status === 'archived' ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void restoreListing(row.listing!)}
                          className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-brand-200 text-[12px] font-bold text-brand-700 hover:bg-mist-50 disabled:opacity-50 ${LIGHT_FOCUS}`}
                        >
                          {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          পুনরুদ্ধার · অনুমোদন লাগবে
                        </button>
                      ) : row.canArchive ? (
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void archiveListing(row.listing!)}
                          className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-brand-200 text-[12px] font-bold text-brand-700 hover:bg-mist-50 disabled:opacity-50 ${LIGHT_FOCUS}`}
                        >
                          {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
                          ডিসপ্লে থেকে সরান
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void permanentlyDeleteListing(row.listing!)}
                        className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-red-200 text-[12px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 ${LIGHT_FOCUS}`}
                      >
                        {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        স্থায়ীভাবে ডিলিট
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void removeRow(row)}
                      className={`col-span-2 flex min-h-[40px] items-center justify-center gap-1 rounded-lg border border-red-200 text-[12px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 sm:col-span-1 ${LIGHT_FOCUS}`}
                    >
                      {busyId === row.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      {row.source === 'draft' ? 'জমা দেওয়া হয়নি পোস্ট মুছুন' : 'স্থায়ীভাবে মুছুন'}
                    </button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
