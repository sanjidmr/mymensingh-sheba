'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Search,
  Home,
  Sparkles,
  GraduationCap,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { adminFetchAllReports, reportTargetLink, type AdminReportRow, type AdminReportStatus } from '@/lib/admin-service';
import { setReportStatus } from '@/app/admin/actions/reports';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminError, AdminLoading } from '@/components/admin/States';
import { useToast } from '@/components/admin/ToastProvider';

const TYPE_LABELS: Record<AdminReportRow['type'], { label: string; icon: React.ReactNode }> = {
  listing: { label: 'বিজ্ঞাপন রিপোর্ট', icon: <Home className="w-4 h-4" /> },
  staff: { label: 'কর্মী রিপোর্ট', icon: <Sparkles className="w-4 h-4" /> },
  tutor: { label: 'টিউটর রিপোর্ট', icon: <GraduationCap className="w-4 h-4" /> },
  donor: { label: 'রক্তদাতা রিপোর্ট', icon: <Heart className="w-4 h-4" /> },
};

const STATUS_META: Record<AdminReportStatus, { label: string; class: string }> = {
  open: { label: 'খোলা', class: 'bg-red-50 text-red-800 border-red-200' },
  resolved: { label: 'সমাধান', class: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  dismissed: { label: 'বাতিল', class: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { notify } = useToast();
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
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'রিপোর্ট লোড ব্যর্থ হয়েছে');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleStatusChange = async (id: string, type: AdminReportRow['type'], newStatus: AdminReportStatus) => {
    setBusyId(id);
    setError('');
    const table = {
      listing: 'listing_reports',
      staff: 'staff_profile_reports',
      tutor: 'tutor_reports',
      donor: 'blood_donor_reports',
    }[type];
    try {
      const result = await setReportStatus(table, id, newStatus);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      notify('success', result.message ?? 'রিপোর্টের অবস্থা হালনাগাদ হয়েছে।');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'রিপোর্ট আপডেট ব্যর্থ হয়েছে।');
    } finally {
      setBusyId(null);
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
    return <AdminLoading label="রিপোর্ট লোড হচ্ছে…" />;
  }

  return (
    <div>
      <PageHeader
        title="মডারেশন রিপোর্ট হাব"
        description="সকল রিপোর্ট (বিজ্ঞাপন, কর্মী, টিউটর, রক্তদাতা) এক জায়গায়"
        count={`মোট ${filtered.length} টি রিপোর্ট`}
      />
      {error && (
        <AdminError
          title={reports.length === 0 ? 'রিপোর্ট লোড করা যায়নি' : 'রিপোর্ট আপডেট করা যায়নি'}
          message={error}
          className="mb-4"
        />
      )}

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
              <option value="resolved">সমাধান</option>
              <option value="dismissed">বাতিল</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-mist-200 bg-white p-10 text-center text-sm text-ink-500">
            {reports.length === 0 ? 'কোনো রিপোর্ট নেই।' : 'এই ফিল্টারে কোনো রিপোর্ট পাওয়া যায়নি।'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered
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
                              disabled={r.status === s || busyId === r.id}
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
    </div>
  );
}