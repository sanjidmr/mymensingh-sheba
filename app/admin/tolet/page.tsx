'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Settings, CheckCircle2, Save, Search, ShieldCheck, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getToletFeeRules, loadToletFeeRules, setToletFeeRules } from '@/lib/tolet-fees';
import { saveToletFeeRules } from '@/app/admin/actions/settings';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import type { ToletFeeRules } from '@/lib/tolet-fees';
import { adminFetchListingsPage } from '@/lib/tolet-service';
import type { ToletListing, ToletListingStatus } from '@/lib/tolet-types';
import { TOLET_LISTING_STATUS_INFO, TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { ListingStatusBadge } from '@/components/tolet/ListingStatusBadge';
import { ToletAnalyticsTable } from '@/components/tolet/admin/ToletAnalytics';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';

const STATUS_TABS: Array<{ key: ToletListingStatus | 'all'; label: string; color: string; active: string }> = [
  { key: 'all', label: 'সব', color: 'bg-slate-200 text-slate-700', active: 'bg-slate-800 text-white' },
  { key: 'pending_review', label: 'যাচাইয়ের অপেক্ষায়', color: 'bg-amber-100 text-amber-800', active: 'bg-amber-700 text-white' },
  { key: 'approved', label: 'প্রকাশিত', color: 'bg-emerald-100 text-emerald-800', active: 'bg-emerald-800 text-white' },
  { key: 'rejected', label: 'প্রত্যাখ্যাত', color: 'bg-rose-100 text-rose-800', active: 'bg-rose-700 text-white' },
  { key: 'suspended', label: 'স্থগিত', color: 'bg-red-100 text-red-800', active: 'bg-red-700 text-white' },
  { key: 'unavailable', label: 'অনুপলব্ধ', color: 'bg-slate-100 text-slate-600', active: 'bg-slate-700 text-white' },
  { key: 'draft', label: 'খসড়া', color: 'bg-slate-100 text-slate-600', active: 'bg-slate-700 text-white' },
  { key: 'archived', label: 'আর্কাইভ', color: 'bg-slate-100 text-slate-600', active: 'bg-slate-700 text-white' },
];

export default function AdminToletPage() {
  const searchParams = useSearchParams();
  const [feeRules, setFeeRules] = useState<ToletFeeRules>(getToletFeeRules());
  const [feeSaved, setFeeSaved] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [feeLoading, setFeeLoading] = useState(true);

  const [listings, setListings] = useState<ToletListing[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [savingFee, setSavingFee] = useState(false);
  const [tab, setTab] = useState<ToletListingStatus | 'all'>(() => {
    const requestedStatus = searchParams.get('status');
    return STATUS_TABS.find((option) => option.key === requestedStatus)?.key ?? 'pending_review';
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [areaId, setAreaId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
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
    loadToletFeeRules()
      .then(() => {
        if (active) setFeeRules(getToletFeeRules());
      })
      .catch((err: unknown) => {
        if (active) setFeeError(err instanceof Error ? err.message : 'প্ল্যাটফর্ম ফি লোড ব্যর্থ হয়েছে।');
      })
      .finally(() => {
        if (active) setFeeLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeError('');
    setSavingFee(true);
    try {
      const result = await saveToletFeeRules(feeRules);
      if (result.ok) {
        setToletFeeRules(feeRules);
        setFeeSaved(true);
        setTimeout(() => setFeeSaved(false), 3000);
      } else {
        setFeeError(result.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setFeeError(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setSavingFee(false);
    }
  };

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
        title="To-Let ও প্ল্যাটফর্ম ফি ম্যানেজমেন্ট"
        description="বিজ্ঞাপন অনুমোদন, মালিকদের প্রপার্টি যাচাই ও প্ল্যাটফর্ম সার্ভিস ফি স্ল্যাব কনফিগারেশন।"
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

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Fee config */}
          <div className="min-w-0 space-y-6 lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:sticky lg:top-6">
              <div className="flex items-center gap-2 text-emerald-800 text-sm font-bold mb-2">
                <Settings className="w-4 h-4" />
                <span>প্ল্যাটফর্ম ফি (সার্ভিস ফি স্ল্যাব)</span>
              </div>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                এই স্ল্যাবগুলো পরিবর্তন করলে বিজ্ঞাপনের মোট হিসাব স্বয়ংক্রিয়ভাবে আপডেট হবে।
              </p>

              {feeSaved && (
                <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>ফি স্ল্যাব সংরক্ষিত হয়েছে!</span>
                </div>
              )}
              {feeError && (
                <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                  {feeError}
                </div>
              )}

              {feeLoading ? (
                <AdminLoading label="প্ল্যাটফর্ম ফি লোড হচ্ছে..." rows={2} />
              ) : feeError ? (
                <AdminError title="প্ল্যাটফর্ম ফি লোড করা যায়নি" message={feeError} />
              ) : <form onSubmit={handleSaveFee} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মেস / হোস্টেল / সিট ফি (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={feeRules.messSeatFee}
                    onChange={(e) => setFeeRules({ ...feeRules, messSeatFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ভাড়া ১০,০০০ পর্যন্ত (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={feeRules.tier1Max10k}
                    onChange={(e) => setFeeRules({ ...feeRules, tier1Max10k: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ভাড়া ১০,০০০–২০,০০০ (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={feeRules.tier2Max20k}
                    onChange={(e) => setFeeRules({ ...feeRules, tier2Max20k: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ভাড়া ২০,০০০-এর ঊর্ধ্বে (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={feeRules.tier3Above20k}
                    onChange={(e) => setFeeRules({ ...feeRules, tier3Above20k: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingFee}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingFee ? 'সংরক্ষণ হচ্ছে...' : 'কনফিগারেশন সেভ করুন'}</span>
                </button>
              </form>}
            </div>
          </div>

          {/* Listings moderation */}
          <div className="min-w-0 space-y-4 lg:col-span-8">
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
              <select aria-label="এলাকা" value={areaId} onChange={(event) => { setAreaId(event.target.value); setPage(1); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs">
                <option value="">সব এলাকা</option>
                {getAllMCCAreas({ activeOnly: false }).map((area) => <option key={area.id} value={area.id}>{area.nameBn}</option>)}
              </select>
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
                  const area = getAreaById(item.areaId);
                  const cover = item.photos[0];
                  return (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex items-start gap-4">
                      <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 hidden sm:block">
                        {cover && (
                          <Image src={cover} alt="" fill sizes="80px" className="object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {typeInfo?.labelBn}
                          </span>
                          <ListingStatusBadge status={item.status} />
                          <span className="text-[11px] text-slate-400">{item.id.slice(0, 18)}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {area?.nameBn || item.areaId} • মালিক: {item.ownerName || '—'}{' '}
                          {item.ownerVerified ? '(ভেরিফাইড)' : ''}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          ভাড়া: ৳{item.rentPrice.toLocaleString('bn-BD')}/মাস • বিছানা: {item.bedrooms} • বাথ: {item.bathrooms}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Link
                            href={`/admin/tolet/${item.id}`}
                            className="px-3.5 py-2 rounded-xl bg-emerald-800 text-white text-[11px] font-semibold hover:bg-emerald-900"
                          >
                            পর্যালোচনা করুন
                          </Link>
                          <Link
                            href={`/admin/tolet/${item.id}/edit`}
                            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50"
                          >
                            সম্পাদনা
                          </Link>
                          {item.status === 'approved' && (
                            <Link
                              href={`/tolet/${item.id}`}
                              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-semibold hover:bg-slate-100"
                            >
                              পাবলিক ভিউ
                            </Link>
                          )}
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
          <div className="mt-2 min-w-0 lg:col-span-12">
            <ToletAnalyticsTable limit={25} />
          </div>
        </div>
    </div>
  );
}