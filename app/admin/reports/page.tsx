'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  Home,
  Sparkles,
  GraduationCap,
  Heart,
  ArrowLeft,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { adminFetchAllReports, adminUpdateReportStatus, reportTargetLink, type AdminReportRow, type AdminReportStatus } from '@/lib/admin-service';

const TYPE_LABELS: Record<AdminReportRow['type'], { label: string; icon: React.ReactNode }> = {
  listing: { label: 'বিজ্ঞাপন রিপোর্ট', icon: <Home className="w-4 h-4" /> },
  staff: { label: 'কর্মী রিপোর্ট', icon: <Sparkles className="w-4 h-4" /> },
  tutor: { label: 'টিউটর রিপোর্ট', icon: <GraduationCap className="w-4 h-4" /> },
  donor: { label: 'রক্তদাতা রিপোর্ট', icon: <Heart className="w-4 h-4" /> },
};

const STATUS_META: Record<AdminReportStatus, { label: string; class: string }> = {
  open: { label: 'খোলা', class: 'bg-red-50 text-red-800 border-red-200' },
  reviewed: { label: 'রিভিউড', class: 'bg-amber-50 text-amber-800 border-amber-200' },
  resolved: { label: 'সমাধান', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  dismissed: { label: 'বাতিল', class: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AdminReportRow['type']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminReportStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminFetchAllReports()
      .then((data) => {
        if (active) setReports(data);
      })
      .catch(() => {
        if (active) setError('রিপোর্ট লোড ব্যর্থ হয়েছে');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleStatusChange = async (id: string, type: AdminReportRow['type'], newStatus: AdminReportStatus) => {
    setBusyId(id);
    const res = await adminUpdateReportStatus(type, id, newStatus);
    setBusyId(null);
    if (res.success) {
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    }
  };

  const filtered = reports.filter((r) => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.reason.toLowerCase().includes(q) && !(r.title?.toLowerCase().includes(q)) && !r.id.includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span className="text-sm">রিপোর্ট লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800">
              <ArrowLeft className="w-3.5 h-3.5" /> অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">মডারেশন রিপোর্ট হাব</h1>
            <p className="text-xs text-slate-500 mt-1">সকল রিপোর্ট (বিজ্ঞাপন, কর্মী, টিউটর, রক্তদাতা) এক জায়গায়</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কারণ / আইডি খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | AdminReportRow['type'])}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">সব ধরনের রিপোর্ট</option>
              <option value="listing">বিজ্ঞাপন রিপোর্ট</option>
              <option value="staff">কর্মী রিপোর্ট</option>
              <option value="tutor">টিউটর রিপোর্ট</option>
              <option value="donor">রক্তদাতা রিপোর্ট</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AdminReportStatus)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="open">খোলা</option>
              <option value="reviewed">রিভিউড</option>
              <option value="resolved">সমাধান</option>
              <option value="dismissed">বাতিল</option>
            </select>
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            কোনো রিপোর্ট নেই।
          </div>
        ) : (
          <div className="space-y-3">
            {reports
              .filter((r) => {
                if (typeFilter !== 'all' && r.type !== typeFilter) return false;
                if (statusFilter !== 'all' && r.status !== statusFilter) return false;
                if (search) {
                  const q = search.toLowerCase();
                  if (!r.reason.toLowerCase().includes(q) && !(r.title?.toLowerCase().includes(q)) && !r.id.includes(q)) {
                    return false;
                  }
                }
                return true;
              })
              .map((r) => {
                const typeMeta = TYPE_LABELS[r.type];
                const statusMeta = STATUS_META[r.status as AdminReportStatus];
                const isOpen = expandedId === r.id;
                const link = reportTargetLink(r.type, r.relatedId);
                return (
                  <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        {typeMeta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{typeMeta.label}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusMeta.class}`}>
                            {statusMeta.label}
                          </span>
                          <span className="text-[11px] text-slate-400">{new Date(r.createdAt).toLocaleString('bn-BD')}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 truncate">{r.title || r.reason}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={link}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
                        >
                          বিস্তারিত
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : r.id)}
                          className="p-2 rounded-lg hover:bg-slate-100"
                        >
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-2">
                          <p><strong>কারণ:</strong> {r.reason}</p>
                          {r.title && <p><strong>শিরোনাম:</strong> {r.title}</p>}
                          <p><strong>আইডি:</strong> {r.id}</p>
                          <p><strong>টাইপ:</strong> {typeMeta.label}</p>
                          <p><strong>সময়:</strong> {new Date(r.createdAt).toLocaleString('bn-BD')}</p>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">স্ট্যাটাস পরিবর্তন:</span>
                          {(Object.keys(STATUS_META) as AdminReportStatus[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              disabled={r.status === s}
                              onClick={() => handleStatusChange(r.id, r.type, s)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${STATUS_META[s].class} disabled:opacity-50`}
                            >
                              {STATUS_META[s].label}
                            </button>
                          ))}
                        </div>
                        <Link
                          href={reportTargetLink(r.type, r.relatedId)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
                        >
                          প্রশাসনিক প্যানেলে দেখুন →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </div>
  );
}