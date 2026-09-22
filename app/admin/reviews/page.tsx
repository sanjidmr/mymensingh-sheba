'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Star,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Link,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { adminFetchTutorReviews, adminUpdateTutorReview } from '@/lib/admin-service';
import type { TutorReview } from '@/lib/supabase/types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<(TutorReview & { tutorName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminFetchTutorReviews()
      .then((data) => {
        if (active) setReviews(data);
      })
      .catch(() => {
        if (active) setError('রিভিউ লোড ব্যর্থ হয়েছে');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handlePublishToggle = async (id: string, isPublished: boolean) => {
    setBusyId(id);
    const res = await adminUpdateTutorReview(id, { isPublished });
    setBusyId(null);
    if (res.success) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isPublished } : r)));
    }
  };

  const filtered = reviews.filter((r) => {
    if (statusFilter === 'published' && !r.isPublished) return false;
    if (statusFilter === 'unpublished' && r.isPublished) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.comment?.toLowerCase().includes(q) && !r.id.includes(q) && !(r.tutorName?.toLowerCase().includes(q))) {
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
          <span className="text-sm">রিভিউ লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <Link href="/admin" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-800">
              ← অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">গৃহশিক্ষক রিভিউ মডারেশন</h1>
            <p className="text-xs text-slate-500 mt-1">কমপ্লিটেড ক্লাসের পর রিভিউ অনুমোদন/অনুপ্রকাশন</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="রিভিউ / টিউটর নাম / আইডি খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'unpublished')}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 shrink-0"
          >
            <option value="all">সব রিভিউ</option>
            <option value="published">প্রকাশিত</option>
            <option value="unpublished">অপ্রকাশিত</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            কোনো রিভিউ পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const isOpen = expandedId === r.id;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-900 text-sm">রিভিউ #{r.id.slice(0, 8)}</h3>
                        <span className="text-[11px] text-slate-500">টিউটর: {r.tutorName || '—'}</span>
                        <span className="text-[11px] text-slate-500">দ্বারা: {r.customerName || '—'}</span>
                        {renderStars(r.rating)}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          r.isPublished
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {r.isPublished ? 'প্রকাশিত' : 'অপ্রকাশিত'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{r.comment || 'কমেন্ট নেই'}</p>
                      <div className="text-[11px] text-slate-400">
                        সময়: {new Date(r.createdAt).toLocaleString('bn-BD')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : r.id)}
                        className="p-2 rounded-lg hover:bg-slate-100"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1.5">
                        <p><strong>আইডি:</strong> {r.id}</p>
                        <p><strong>টিউটর আইডি:</strong> {r.tutorId}</p>
                        <p><strong>গ্রাহক আইডি:</strong> {r.customerId}</p>
                        <p><strong>রিকোয়েস্ট আইডি:</strong> {r.requestId || '—'}</p>
                        <p><strong>রেটিং:</strong> {r.rating}/৫</p>
                        <p><strong>প্রকাশিত:</strong> {r.isPublished ? 'হ্যাঁ' : 'না'}</p>
                        <p><strong>সময়:</strong> {new Date(r.createdAt).toLocaleString('bn-BD')}</p>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          disabled={r.isPublished}
                          onClick={() => handlePublishToggle(r.id, true)}
                          className="px-3 py-2 rounded-lg bg-emerald-800 text-white text-xs font-semibold disabled:opacity-50"
                        >
                          প্রকাশ করুন
                        </button>
                        <button
                          type="button"
                          disabled={!r.isPublished}
                          onClick={() => handlePublishToggle(r.id, false)}
                          className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-50"
                        >
                          অনুপ্রকাশন করুন
                        </button>
                      </div>
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