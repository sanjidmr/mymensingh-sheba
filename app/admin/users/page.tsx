'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ShieldOff,
} from 'lucide-react';
import { adminFetchUsers } from '@/lib/admin-service';
import { setAdminRole, setUserStatus } from '@/app/admin/actions/users';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/admin/ToastProvider';
import type { AdminUserRow } from '@/lib/admin-types';
import { DONOR_STATUS_META } from '@/lib/blood-donor-types';
import { TUTOR_STATUS_META } from '@/lib/home-tutor-types';
import { ServiceProfileStatus } from '@/lib/supabase/types';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import { StatusPill } from '@/components/admin/StatCard';

const SERVICE_STATUS_LABELS: Record<ServiceProfileStatus, string> = {
  draft: 'খসড়া',
  pending_approval: 'পর্যালোচনায়',
  approved: 'সক্রিয়',
  rejected: 'প্রত্যাখ্যাত',
  paused: 'বিরতি',
  suspended: 'নিষ্ক্রিয়',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUserRow | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);

  useEffect(() => {
    let active = true;
    adminFetchUsers()
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'ইউজার লোড ব্যর্থ হয়েছে');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleStatusChange = async (userId: string, newStatus: AdminUserRow['status']) => {
    setBusyId(userId);
    setError('');
    try {
      const res = await setUserStatus(userId, newStatus);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      notify('success', res.message ?? 'অ্যাকাউন্টের অবস্থা হালনাগাদ হয়েছে।');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = async () => {
    if (!roleTarget) return;
    const target = roleTarget;
    const nextRole = target.role === 'admin' ? 'customer' : 'admin';
    setRoleBusy(true);
    setError('');
    try {
      const result = await setAdminRole(target.id, nextRole);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUsers((prev) =>
        prev.map((user) => user.id === target.id ? { ...user, role: nextRole } : user)
      );
      setRoleTarget(null);
      notify('success', result.message ?? 'भूमिका হালনাগাদ হয়েছে');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'অ্যাডমিন ভূমিকা পরিবর্তন ব্যর্থ হয়েছে।');
    } finally {
      setRoleBusy(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.phone.includes(q) || u.id.includes(q);
  });

  if (loading) {
    return <AdminLoading label="ইউজার লোড হচ্ছে…" />;
  }

  return (
    <div>
      <PageHeader
        title="ইউজার ও প্রোফাইল ম্যানেজমেন্ট"
        description="One Account System — এক ইউজার, একাধিক সার্ভিস প্রোফাইল"
        count={`মোট ${filtered.length} / ${users.length} জন`}
      />

      {error && <AdminError title="ইউজার ব্যবস্থাপনায় সমস্যা" message={error} className="mb-4" />}

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="নাম / ফোন / আইডি খুঁজুন..."
          aria-label="নাম, ফোন বা আইডি দিয়ে ইউজার খুঁজুন"
          className="h-11 w-full rounded-lg border border-mist-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-mist-200 bg-white p-10 text-center text-sm text-ink-500">
            কোনো ইউজার পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="rounded-xl border border-mist-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-base">
                        <Link href={`/admin/users/${u.id}`} className="hover:text-brand-800 hover:underline">
                          {u.fullName}
                        </Link>
                      </h3>
                      <span className="text-xs text-slate-500">ফোন: {u.phone}</span>
                      {u.email && <span className="text-xs text-slate-500">ইমেইল: {u.email}</span>}
                      <span className="text-[11px] text-slate-500">যোগদান: {new Date(u.createdAt).toLocaleDateString('bn-BD')}</span>
                      <span className="flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-800">
                        <ShieldCheck className="w-3 h-3" />
                        {u.role === 'admin' ? 'অ্যাডমিন' : 'কাস্টমার'}
                      </span>
                      <StatusPill
                        label={u.status === 'active' ? 'সক্রিয়' : u.status === 'suspended' ? 'নিষ্ক্রিয়' : 'ব্লকড'}
                        tone={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'warning' : 'danger'}
                      />
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                      <span>To-Let: <strong>{u.toletStatus ? SERVICE_STATUS_LABELS[u.toletStatus as ServiceProfileStatus] : 'না'}</strong></span>
                      <span>টিউটর: <strong>{u.tutorStatus ? TUTOR_STATUS_META[u.tutorStatus as keyof typeof TUTOR_STATUS_META]?.labelBn || u.tutorStatus : 'না'}</strong></span>
                      <span>রক্তদাতা: <strong>{u.donorStatus ? DONOR_STATUS_META[u.donorStatus as keyof typeof DONOR_STATUS_META]?.labelBn || u.donorStatus : 'না'}</strong></span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {u.role !== 'admin' ? (
                      <button
                        type="button"
                        disabled={roleBusy || busyId === u.id}
                        onClick={() => setRoleTarget(u)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        অ্যাডমিন করুন
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={roleBusy || busyId === u.id}
                        onClick={() => setRoleTarget(u)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                      >
                        <ShieldOff className="h-3.5 w-3.5" />
                        অ্যাডমিন ভূমিকা সরান
                      </button>
                    )}
                    {u.role !== 'admin' && u.status !== 'active' && (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleStatusChange(u.id, 'active')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'সক্রিয় করুন'}
                      </button>
                    )}
                    {u.role !== 'admin' && u.status !== 'suspended' && (
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => handleStatusChange(u.id, 'suspended')}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold disabled:opacity-50"
                      >
                        {busyId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'নিষ্ক্রিয় করুন'}
                      </button>
                    )}
                    {u.role !== 'admin' && u.status !== 'blocked' && (
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
      <ConfirmDialog
        open={roleTarget !== null}
        title={roleTarget?.role === 'admin' ? 'অ্যাডমিন ভূমিকা সরাবেন?' : 'অ্যাডমিন ভূমিকা দেবেন?'}
        description={
          roleTarget?.role === 'admin'
            ? <><strong>{roleTarget.fullName}</strong> অ্যাডমিন কন্ট্রোল আর ব্যবহার করতে পারবেন না। সর্বশেষ সক্রিয় অ্যাডমিনকে সরানো যাবে না।</>
            : <><strong>{roleTarget?.fullName}</strong> সব অ্যাডমিন রেকর্ড ও ব্যক্তিগত তথ্য দেখতে এবং পরিবর্তন করতে পারবেন।</>
        }
        confirmLabel={roleTarget?.role === 'admin' ? 'অ্যাডমিন ভূমিকা সরান' : 'অ্যাডমিন করুন'}
        tone={roleTarget?.role === 'admin' ? 'danger' : 'primary'}
        requireText="অ্যাডমিন"
        isLoading={roleBusy}
        onConfirm={handleRoleChange}
        onCancel={() => setRoleTarget(null)}
      />
    </div>
  );
}