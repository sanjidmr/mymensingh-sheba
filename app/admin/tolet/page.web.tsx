'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Search, ShieldCheck, Plus, ChevronLeft, ChevronRight, Eye, Phone, MessageCircle, ClipboardCheck, Pencil, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import { adminFetchListingsPage } from '@/lib/tolet-service';
import type { ToletListing, ToletListingStatus } from '@/lib/tolet-types';
import { adminFetchToletListingMetrics } from '@/lib/tolet-tracking';
import { TOLET_LISTING_STATUS_INFO, TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { ListingStatusBadge } from '@/components/tolet/ListingStatusBadge';
import { ToletAnalyticsTable } from '@/components/tolet/admin/ToletAnalytics';
import { getToletAreaById, TOLET_AREA_SOURCE } from '@/lib/tolet-areas';
import LocationSelectInput from '@/components/LocationSelectInput';
import ToletListingDeleteAction from '@/components/admin/ToletListingDeleteAction';
import ToletAnalyticsSummary from '@/components/tolet/admin/ToletAnalyticsSummary';

const STATUS_TABS: Array<{ key: ToletListingStatus | 'all'; label: string; color: string; active: string }> = [
  { key: 'all', label: 'সব', color: 'bg-slate-200 text-slate-700', active: 'bg-slate-800 text-white' },
  { key: 'pending_review', label: 'যাচাইয়ের অপেক্ষায়', color: 'bg-amber-100 text-amber-800', active: 'bg-amber-700 text-white' },
  { key: 'approved', label: 'প্রকাশিত', color: 'bg-emerald-100 text-emerald-800', active: 'bg-emerald-800 text-white' },
  { key: 'rejected', label: 'প্রত্যাখ্যাত', color: 'bg-rose-100 text-rose-800', active: 'bg-rose-700 text-white' },
  { key: 'suspended', label: 'স্থগিত', color: 'bg-red-100 text-red-800', active: 'bg-red-700 text-white' },
  { key: 'unavailable', label: 'অনুপলব্ধ', color: 'bg-slate-100 text-slate-600', active: 'bg-slate-700 text-white' },
  { key: 'draft', label: 'জমা দেওয়া হয়নি', color: 'bg-slate-100 text-slate-600', active: 'bg-slate-700 text-white' },
  { key: 'archived', label: 'আর্কাইভ', color: 'bg-slate-100 text-slate-600', active: 'bg-slate-700 text-white' },
];

export default function AdminToletPage() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<ToletListing[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [tab, setTab] = useState<ToletListingStatus | 'all'>(() => {
    const requestedStatus = searchParams.get('status');
    return STATUS_TABS.find((option) => option.key === requestedStatus)?.key ?? 'all';
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [areaId, setAreaId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const listingIds = listings.map((item) => item.id);
  const listingKey = listingIds.join(',');
  const statsRequestKey = `${listingKey}:${refreshTick}`;
  const [statsResult, setStatsResult] = useState<{
    key: string;
    metrics: Record<string, { views: number; callClicks: number; whatsappClicks: number }>;
  } | null>(null);
  const [statsFailure, setStatsFailure] = useState<{ key: string; message: string } | null>(null);
  const listingStats = statsResult?.key === statsRequestKey ? statsResult.metrics : {};
  const statsError = statsFailure?.key === statsRequestKey ? statsFailure.message : '';
  const statsLoading = Boolean(listingKey) &&
    statsResult?.key !== statsRequestKey &&
    statsFailure?.key !== statsRequestKey;
  const pageSize = 20;

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setRefreshTick((tick) => tick + 1);
    };
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setListError('');
      const data = await adminFetchListingsPage({
        page,
        pageSize,
        status: tab,
        search: debouncedSearch,
        propertyType,
        areaId,
        from: fromDate,
        to: toDate,
      });
      if (!active) return;
      if (data.error) {
        setListError(data.error);
        setListings([]);
        setResultCount(0);
      } else {
        setListings(data.rows);
        setResultCount(data.total);
        setStatusCounts(data.counts);
      }
      setLoading(false);
    })().catch((err: unknown) => {
      if (!active) return;
      setListError(err instanceof Error ? err.message : 'বাসা ভাড়ার তালিকা লোড ব্যর্থ হয়েছে।');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [tab, debouncedSearch, propertyType, areaId, fromDate, toDate, page, refreshTick]);

  useEffect(() => {
    let active = true;
    const requestedIds = statsRequestKey.slice(0, statsRequestKey.lastIndexOf(':'));
    if (!requestedIds) return () => {
      active = false;
    };
    adminFetchToletListingMetrics(requestedIds.split(','))
      .then((metrics) => {
        if (!active) return;
        setStatsResult({ key: statsRequestKey, metrics });
      })
      .catch((err: unknown) => {
        if (active) {
          setStatsFailure({
            key: statsRequestKey,
            message: err instanceof Error ? err.message : 'বাসাভাড়ার পরিসংখ্যান লোড করা যায়নি।',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [statsRequestKey]);

  const totalPages = Math.max(1, Math.ceil(resultCount / pageSize));
  const clearListingFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setPropertyType('');
    setAreaId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  return (
    <div>
      
      <PageHeader
        title="বাসা ভাড়া ব্যবস্থাপনা"
        description="বাসা ভাড়ার বিজ্ঞাপন পর্যালোচনা ও অনুমোদন করুন।"
        count={`মোট ${resultCount.toLocaleString('bn-BD')} টি ফলাফল · সব বিজ্ঞাপন ${Number(statusCounts.all ?? 0).toLocaleString('bn-BD')} টি`}
        actions={<>
          <Link href="/admin/tolet/new" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-admin-navy px-3.5 text-xs font-semibold text-white hover:bg-admin-navy/90">
            <Plus className="h-4 w-4" aria-hidden="true" /> নতুন বিজ্ঞাপন
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>অ্যাডমিন কন্ট্রোল</span>
          </span>
        </>}
      />
      {listError && <AdminError title="বাসা ভাড়ার তালিকায় সমস্যা" message={listError} className="mb-4" />}
      {statsError && <AdminError title="ভিজিট ও কলের সংখ্যা লোড করা যায়নি" message={statsError} className="mb-4" />}

        <ToletAnalyticsSummary />
        <div className="min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900">বিজ্ঞাপন মডারেশন ও অনুমোদন</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="শিরোনাম / মালিক / এলাকা খুঁজুন..."
                  className="w-full sm:w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['all', 'মোট বিজ্ঞাপন', statusCounts.all ?? 0],
                ['pending_review', 'পর্যালোচনায়', statusCounts.pending_review ?? 0],
                ['approved', 'প্রকাশিত', statusCounts.approved ?? 0],
                ['rejected', 'প্রত্যাখ্যাত', statusCounts.rejected ?? 0],
                ['unavailable', 'অনুপলব্ধ', statusCounts.unavailable ?? 0],
                ['archived', 'আর্কাইভ', statusCounts.archived ?? 0],
              ].map(([key, label, count]) => (
                <button key={key} type="button" onClick={() => { setTab(key as ToletListingStatus | 'all'); setPage(1); }}
                  className={`rounded-xl border px-3 py-2 text-left ${tab === key ? 'border-admin-navy bg-admin-page' : 'border-slate-200 bg-white'}`}>
                  <span className="block text-[11px] text-slate-500">{label}</span>
                  <span className="block text-lg font-bold text-slate-900">{Number(count).toLocaleString('bn-BD')}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setTab(t.key); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 whitespace-nowrap transition-colors ${
                    tab === t.key ? t.active : t.color
                  }`}
                >
                  {t.label}
                  <span className="ml-1 opacity-70">({t.key === 'all' ? (statusCounts.all ?? 0) : (statusCounts[t.key] ?? 0)})</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <select aria-label="প্রপার্টির ধরন" value={propertyType} onChange={(event) => { setPropertyType(event.target.value); setPage(1); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs">
                <option value="">সব ধরনের বাসা</option>
                {Object.entries(TOLET_PROPERTY_TYPE_INFO).map(([value, item]) => <option key={value} value={value}>{item.labelBn}</option>)}
              </select>
              <LocationSelectInput
                id="admin-tolet-area"
                value={areaId || null}
                onChange={(selectedId) => { setAreaId(selectedId ?? ''); setPage(1); }}
                placeholder="সব এলাকা"
                source={TOLET_AREA_SOURCE}
                size="sm"
              />
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-500">
                <span className="shrink-0">তারিখ থেকে</span>
                <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => { setFromDate(event.target.value); setPage(1); }} className="min-w-0 flex-1 bg-transparent text-slate-800" />
              </label>
              <label className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-500">
                <span className="shrink-0">তারিখ পর্যন্ত</span>
                <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => { setToDate(event.target.value); setPage(1); }} className="min-w-0 flex-1 bg-transparent text-slate-800" />
              </label>
            </div>
            {(propertyType || areaId || fromDate || toDate || search) && (
              <button type="button" onClick={clearListingFilters} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50">ফিল্টার মুছুন</button>
            )}
            <p className="text-[11px] leading-relaxed text-slate-500">
              ভিজিট ও কল বাটনের সংখ্যা সবসময়ের। কল বাটন চাপা হয়েছে—এটি সম্পন্ন ফোনকলের সংখ্যা নয়।
            </p>

            {loading ? (
              <AdminLoading label="বিজ্ঞাপন লোড হচ্ছে..." />
            ) : listError ? null : listings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
                এই বিভাগে কোনো বিজ্ঞাপন নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((item) => {
                  const typeInfo = TOLET_PROPERTY_TYPE_INFO[item.propertyType];
                  const area = getToletAreaById(item.areaId);
                  const cover = item.photos[0];
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-start gap-3">
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
                        {cover && (
                          <Image src={cover} alt="" fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {typeInfo?.labelBn}
                          </span>
                          <ListingStatusBadge status={item.status} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {area?.nameBn || item.areaId} • মালিক: {item.ownerName || '—'}{' '}
                          {item.ownerVerified ? '(ভেরিফাইড)' : ''}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          ভাড়া: ৳{item.rentPrice.toLocaleString('bn-BD')}/মাস • বিছানা: {item.bedrooms} • বাথ: {item.bathrooms}
                        </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Link href={`/admin/tolet/${item.id}`} aria-label="পর্যালোচনা করুন" title="পর্যালোচনা করুন" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-admin-navy hover:bg-admin-page">
                            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link href={`/admin/tolet/${item.id}/edit`} aria-label="সম্পাদনা" title="সম্পাদনা" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-admin-muted hover:bg-admin-page hover:text-admin-navy">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <ToletListingDeleteAction
                            id={item.id}
                            title={item.title}
                            onDeleted={() => setRefreshTick((tick) => tick + 1)}
                          />
                          {item.status === 'approved' && (
                            <Link href={`/tolet/${item.id}`} aria-label="পাবলিক ভিউ" title="পাবলিক ভিউ" target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100">
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                        </div>
                        <div className="mt-1.5 flex flex-nowrap items-center gap-x-3 overflow-x-auto pb-0.5 text-[10px] font-medium text-slate-600" aria-label="বিজ্ঞাপনের মোট এনগেজমেন্ট">
                          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                            <Eye className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                            {statsLoading ? 'লোড হচ্ছে…' : statsError ? 'ভিজিট —' : `${(listingStats[item.id]?.views ?? 0).toLocaleString('bn-BD')} মোট ভিজিট`}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                            <Phone className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                            {statsLoading ? 'লোড হচ্ছে…' : statsError ? 'কল বাটনে চাপ —' : `${(listingStats[item.id]?.callClicks ?? 0).toLocaleString('bn-BD')} বার কল বাটন চাপ`}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
                            {statsLoading ? 'লোড হচ্ছে…' : statsError ? 'WhatsApp বাটনে চাপ —' : `${(listingStats[item.id]?.whatsappClicks ?? 0).toLocaleString('bn-BD')} বার WhatsApp চাপ`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !listError && resultCount > 0 && (
              <nav aria-label="বিজ্ঞাপন পেজ" className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">{((page - 1) * pageSize + 1).toLocaleString('bn-BD')}–{Math.min(page * pageSize, resultCount).toLocaleString('bn-BD')} / {resultCount.toLocaleString('bn-BD')} বিজ্ঞাপন</p>
                <div className="flex gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40"><ChevronLeft className="h-4 w-4" />আগের</button>
                  <span className="flex min-h-10 items-center px-2 text-xs text-slate-600">পৃষ্ঠা {page.toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-semibold disabled:opacity-40">পরের<ChevronRight className="h-4 w-4" /></button>
                </div>
              </nav>
            )}
          </div>

          {/* Property-wise engagement, across every listing rather than one row
              of the moderation list. Rendered last so a moderator reads the
              queue first and the numbers second. */}
          <div className="mt-2 min-w-0">
            <ToletAnalyticsTable limit={25} />
          </div>
        </div>
  );
}