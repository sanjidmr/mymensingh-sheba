'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  Home,
  GraduationCap,
  Heart,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
  XCircle,
  RotateCcw,
  PauseCircle,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { adminFetchUsers, adminUpdateUserStatus } from '@/lib/admin-service';
import type { AdminUserRow } from '@/lib/admin-types';
import { DONOR_STATUS_META } from '@/lib/blood-donor-types';
import { TUTOR_STATUS_META } from '@/lib/home-tutor-types';
import { ServiceProfileStatus } from '@/lib/supabase/types';

const SERVICE_STATUS_LABELS: Record<ServiceProfileStatus, string> = {
  draft: 'খসড়া',
  pending_approval: 'পর্যালোচনায়',
  approved: 'সক্রিয়',
  paused: 'বিরতি',
  suspended: 'নিষ্ক্রিয়',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    adminFetchUsers()
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch(() => {
        if (active) setError('ইউজার লোড ব্যর্থ হয়েছে');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleStatusChange = async (userId: string, newStatus: AdminUserRow['status']) => {
    setBusyId(userId);
    setError('');
    const res = await adminUpdateUserStatus(userId, newStatus);
    setBusyId(null);
    if (res.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    } else {
      setError(res.error || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.phone.includes(q) || u.id.includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span className="text-sm">ইউজার লোড হচ্ছে...</span>
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
              ← অ্যাডমিন ড্যাশবোর্ড
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">ইউজার ও প্রোফাইল ম্যানেজমেন্ট</h1>
            <p className="text-xs text-slate-500 mt-1">One Account System — এক ইউজার, একাধিক সার্ভিস প্রোফাইল</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম / ফোন / আইডি খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            মোট: <span className="font-bold text-slate-900">{filtered.length}</span> / {users.length}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            কোনো ইউজার পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-base">{u.fullName}</h3>
                      <span className="text-xs text-slate-500">ফোন: {u.phone}</span>
                      {u.email && <span className="text-xs text-slate-500">ইমেইল: {u.email}</span>}
                      <span className="text-[11px] text-slate-500">যোগদান: {new Date(u.createdAt).toLocaleDateString('bn-BD')}</span>
                      <span className={`px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold flex items-center gap-1 text-xs`}>
                        <ShieldCheck className="w-3 h-3" />
                        {u.role === 'admin' ? 'অ্যাডমিন' : 'কাস্টমার'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-800' :
                        u.status === 'suspended' ? 'bg-amber-50 text-amber-800' :
                        'bg-rose-50 text-rose-800'
                      }`}>
                        {u.status === 'active' ? 'সক্রিয়' : u.status === 'suspended' ? 'নিষ্ক্রিয়' : 'ব্লকড'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      <span>To-Let: <strong>{u.toletStatus ? SERVICE_STATUS_LABELS[u.toletStatus as ServiceProfileStatus] : 'না'}</strong></span>
                      <span>টিউটর: <strong>{u.tutorStatus ? TUTOR_STATUS_META[u.tutorStatus as keyof typeof TUTOR_STATUS_META]?.labelBn || u.tutorStatus : 'না'}</strong></span>
                      <span>রক্তদাতা: <strong>{u.donorStatus ? DONOR_STATUS_META[u.donorStatus as keyof typeof DONOR_STATUS_META]?.labelBn || u.donorStatus : 'না'}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {u.status !== 'active' && (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleStatusChange(u.id, 'active')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'সক্রিয় করুন'}
                      </button>
                    )}
                    {u.status !== 'suspended' && (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleStatusChange(u.id, 'suspended')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'নিষ্ক্রিয় করুন'}
                      </button>
                    )}
                    {u.status !== 'blocked' && (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleStatusChange(u.id, 'blocked')}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'ব্লক করুন'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}