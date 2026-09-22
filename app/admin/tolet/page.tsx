'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, CheckCircle2, Save, Search, Loader2, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  getToletFeeRules,
  loadToletFeeRules,
  saveToletFeeRules,
} from '@/lib/tolet-fees';
import type { ToletFeeRules } from '@/lib/tolet-fees';
import { adminFetchListings } from '@/lib/tolet-service';
import type { ToletListing, ToletListingStatus } from '@/lib/tolet-types';
import { TOLET_LISTING_STATUS_INFO, TOLET_PROPERTY_TYPE_INFO } from '@/lib/tolet-types';
import { ListingStatusBadge } from '@/components/tolet/ListingStatusBadge';
import { getAreaById } from '@/lib/locations';

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
  const [feeRules, setFeeRules] = useState<ToletFeeRules>(getToletFeeRules());
  const [feeSaved, setFeeSaved] = useState(false);
  const [feeError, setFeeError] = useState('');

  const [listings, setListings] = useState<ToletListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ToletListingStatus | 'all'>('pending_review');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      await loadToletFeeRules();
      setFeeRules(getToletFeeRules());
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await adminFetchListings();
      if (!active) return;
      setListings(data);
      setLoading(false);
    })().catch(() => {
      if (!active) return;
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeeError('');
    const result = await saveToletFeeRules(feeRules);
    if (result.success) {
      setFeeSaved(true);
      setTimeout(() => setFeeSaved(false), 3000);
    } else {
      setFeeError(result.error || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  };

  const visible = listings.filter((l) => {
    if (tab !== 'all' && l.status !== tab) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      l.title.toLowerCase().includes(q) ||
      (l.ownerName || '').toLowerCase().includes(q) ||
      l.areaId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-emerald-800">হোম</Link>
          <span>/</span>
          <Link href="/admin" className="hover:text-emerald-800">অ্যাডমিন</Link>
          <span>/</span>
          <span className="font-medium text-slate-800">To-Let ম্যানেজমেন্ট</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 mb-8 shadow-2xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>অ্যাডমিন কন্ট্রোল</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            To-Let ও প্ল্যাটফর্ম ফি ম্যানেজমেন্ট
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-3xl">
            বিজ্ঞাপন অনুমোদন, মালিকদের প্রপার্টি যাচাই ও প্ল্যাটফর্ম সার্ভিস ফি স্ল্যাব কনফিগারেশন।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Fee config */}
          <div className="lg:col-span-4 space-y-6">
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

              <form onSubmit={handleSaveFee} className="space-y-4">
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
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>কনফিগারেশন সেভ করুন</span>
                </button>
              </form>
            </div>
          </div>

          {/* Listings moderation */}
          <div className="lg:col-span-8 space-y-4">
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

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold shrink-0 whitespace-nowrap transition-colors ${
                    tab === t.key ? t.active : t.color
                  }`}
                >
                  {t.label}
                  {t.key !== 'all' && (
                    <span className="ml-1 opacity-70">({listings.filter((l) => l.status === t.key).length})</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-16 flex flex-col items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                <span>লোড হচ্ছে...</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
                এই বিভাগে কোনো বিজ্ঞাপন নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map((item) => {
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}