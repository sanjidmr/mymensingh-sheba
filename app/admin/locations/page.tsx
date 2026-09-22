'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Filter,
  PlusCircle,
  ExternalLink,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import RoutePlaceholderShell from '@/components/RoutePlaceholderShell';
import {
  getAllMCCWards,
  getAllMCCAreas,
  MCCArea,
  MCCWard,
} from '@/lib/locations';

export default function AdminLocationsPage() {
  const allWards = getAllMCCWards();
  const initialAreas = getAllMCCAreas({ activeOnly: false });

  const [areas, setAreas] = useState<MCCArea[]>(initialAreas);
  const [activeTab, setActiveTab] = useState<'areas' | 'wards'>('areas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAreaForDetail, setSelectedAreaForDetail] = useState<MCCArea | null>(null);

  // Toggle active status for demonstration of admin control
  const toggleAreaStatus = (id: string) => {
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  // Filtered areas
  const filteredAreas = areas.filter((a) => {
    if (selectedWardFilter !== 'all' && a.wardNo !== selectedWardFilter) return false;
    if (statusFilter === 'active' && !a.isActive) return false;
    if (statusFilter === 'inactive' && a.isActive) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      a.nameBn.toLowerCase().includes(q) ||
      a.nameEn.toLowerCase().includes(q) ||
      a.aliases.some((al) => al.toLowerCase().includes(q)) ||
      a.wardLabelBn.includes(q)
    );
  });

  const totalActive = areas.filter((a) => a.isActive).length;
  const totalInactive = areas.filter((a) => !a.isActive).length;

  return (
    <RoutePlaceholderShell
      title="ময়মনসিংহ সিটি কর্পোরেশন লোকেশন ডেটাসেট"
      subtitle="অ্যাডমিন লোকেশন ম্যানেজমেন্ট — বাংলাদেশ গেজেট ২০১৯ অনুযায়ী ৩৩টি সাধারণ ওয়ার্ড ও অনুমোদিত প্রধান এলাকা সমূহ।"
      categoryBadge="অ্যাডমিন ভৌগোলিক সিস্টেম"
      breadcrumbs={[{ label: 'অ্যাডমিন ড্যাশবোর্ড', href: '/admin' }, { label: 'লোকেশন ডেটাসেট' }]}
    >
      {/* Top Statistical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">মোট সাধারণ ওয়ার্ড</div>
          <div className="text-2xl font-black text-slate-900">৩৩ টি</div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1">
            গেজেট অনুযায়ী ১০০% কাভারেজ
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">তালিকাভুক্ত প্রধান এলাকা</div>
          <div className="text-2xl font-black text-emerald-800">{areas.length} টি</div>
          <div className="text-[11px] text-slate-500 mt-1">যাচাইকৃত স্থানীয় পরিচিত নাম</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">সক্রিয় সার্ভিস এলাকা</div>
          <div className="text-2xl font-black text-emerald-600">{totalActive} টি</div>
          <div className="text-[11px] text-slate-500 mt-1">বর্তমানে গ্রাহক সার্চে দৃশ্যমান</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 mb-1">নিষ্ক্রিয় / সংরক্ষিত</div>
          <div className="text-2xl font-black text-amber-600">{totalInactive} টি</div>
          <div className="text-[11px] text-slate-500 mt-1">সীমানা যাচাই চলমান</div>
        </div>
      </div>

      {/* Official Gazette Source Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-950 leading-relaxed">
            <strong>লোকেশন সত্যতার উৎস (Source of Truth):</strong> ময়মনসিংহ সিটি কর্পোরেশন ওয়ার্ড
            পুনর্বিন্যাস সংক্রান্ত বাংলাদেশ গেজেট (অতিরিক্ত), ২৮ ফেব্রুয়ারি ২০১৯। কোনো এলাকা সিটি
            কর্পোরেশনের বাইরে হলে প্ল্যাটফর্মে অনুমোদন করা যাবে না। সাধারণ ব্যবহারকারী সরাসরি এলাকা
            তৈরি করতে পারবে না; শুধুমাত্র অ্যাডমিন যাচাই সাপেক্ষে যোগ করতে পারবে।
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('areas')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'areas'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>প্রধান এলাকাসমূহ ({areas.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wards')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors ${
                activeTab === 'wards'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>৩৩টি ওয়ার্ডের তালিকা</span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="এলাকা, ইংরেজি নাম বা অ্যালিয়াস সার্চ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>
        </div>

        {/* Filter bar for Areas */}
        {activeTab === 'areas' && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>ওয়ার্ড ফিল্টার:</span>
            </div>

            <select
              value={selectedWardFilter}
              onChange={(e) =>
                setSelectedWardFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="all">সকল ওয়ার্ড (৩৩টি)</option>
              {allWards.map((w) => (
                <option key={w.wardNo} value={w.wardNo}>
                  {w.nameBn} ({w.headquarterBn})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-slate-500">অবস্থা:</span>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                }
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="all">সকল অবস্থা</option>
                <option value="active">শুধুমাত্র সক্রিয়</option>
                <option value="inactive">নিষ্ক্রিয়</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: AREAS TABLE / GRID */}
      {activeTab === 'areas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">এলাকার নাম (বাংলা)</th>
                  <th className="px-4 py-3">স্ট্যান্ডার্ড আইডি ও ইংরেজি</th>
                  <th className="px-4 py-3">ওয়ার্ড নং</th>
                  <th className="px-4 py-3">সার্চ অ্যালিয়াস (Bangla/English)</th>
                  <th className="px-4 py-3">অবস্থা</th>
                  <th className="px-4 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAreas.map((area) => (
                  <tr key={area.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{area.nameBn}</span>
                        {area.isPopular && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-sm font-semibold">
                            জনপ্রিয়
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {area.popularFor}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      <div>{area.id}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{area.nameEn}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-md font-semibold">
                        {area.wardLabelBn}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {area.aliases.slice(0, 4).map((al, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-xs text-[10px]"
                          >
                            {al}
                          </span>
                        ))}
                        {area.aliases.length > 4 && (
                          <span className="text-[10px] text-slate-400">
                            +{area.aliases.length - 4}টি
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleAreaStatus(area.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                          area.isActive
                            ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                        }`}
                        title="ক্লিক করে সক্রিয়/নিষ্ক্রিয় পরিবর্তন করুন"
                      >
                        {area.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>সক্রিয়</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>নিষ্ক্রিয়</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedAreaForDetail(area)}
                        className="text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: 33 WARDS OVERVIEW */}
      {activeTab === 'wards' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allWards.map((w) => {
            const wardAreas = areas.filter((a) => a.wardNo === w.wardNo);
            return (
              <div
                key={w.wardNo}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {w.nameBn}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{w.nameEn}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">
                    {w.headquarterBn}
                  </h4>

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {w.descriptionBn}
                  </p>

                  <div className="border-t border-slate-100 pt-3">
                    <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                      অন্তর্ভুক্ত প্রধান এলাকাসমূহ ({wardAreas.length}টি):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wardAreas.map((a) => (
                        <span
                          key={a.id}
                          className="bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-md font-medium"
                        >
                          {a.nameBn}
                        </span>
                      ))}
                      {wardAreas.length === 0 && (
                        <span className="text-xs text-slate-400 italic">
                          গেজেট ডেটা অনুযায়ী ম্যাপিং রয়েছে
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                  উৎস: {w.sourceGazette}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal for Area */}
      {selectedAreaForDetail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setSelectedAreaForDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-lg">
                  {selectedAreaForDetail.nameBn} ({selectedAreaForDetail.nameEn})
                </h3>
              </div>
              <button
                onClick={() => setSelectedAreaForDetail(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <div>
                <span className="font-bold text-slate-900 block mb-1">স্ট্যান্ডার্ড আইডি:</span>
                <span className="font-mono bg-slate-100 px-2 py-1 rounded-md">
                  {selectedAreaForDetail.id}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">ওয়ার্ড ম্যাপিং:</span>
                <span>{selectedAreaForDetail.wardLabelBn} (ময়মনসিংহ সিটি কর্পোরেশন)</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">উল্লেখযোগ্য ল্যান্ডমার্ক:</span>
                <span>{selectedAreaForDetail.prominentLandmarks.join(', ')}</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">সার্চ অ্যালিয়াস:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedAreaForDetail.aliases.map((al, i) => (
                    <span key={i} className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-mono">
                      {al}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-900 block mb-1">গেজেট সূত্র ও নোট:</span>
                <span className="text-slate-500 bg-slate-50 p-2.5 rounded-xl block border border-slate-200">
                  {selectedAreaForDetail.sourceNote}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAreaForDetail(null)}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </RoutePlaceholderShell>
  );
}
