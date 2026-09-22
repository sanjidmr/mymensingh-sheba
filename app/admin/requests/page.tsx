'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Loader2,
  X,
  UserCheck,
  MapPin,
  Home,
  Package,
  Truck,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { adminFetchAllManagedRequests } from '@/lib/home-moving-service';
import type { AdminRequestRow } from '@/lib/home-moving-service';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';
import { STAFF_ACCENT_CLASSES } from '@/lib/staff-labels';
import { getAllMCCAreas, getAreaById } from '@/lib/locations';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import { TUTOR_SUBJECTS } from '@/lib/filter-definitions';

type StatusKey = keyof typeof STATUS_CONFIGS;

const STATUS_CONFIGS: Record<
  ServiceRequestStatus,
  { label: string; badgeClass: string; icon: React.ComponentType<{ className?: string }> }
> = {
  new: { label: 'নতুন', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200', icon: FileText },
  reviewing: { label: 'পর্যালোচনাধীন', badgeClass: 'bg-violet-50 text-violet-900 border-violet-200', icon: UserCheck },
  contacted: { label: 'যোগাযোগ করা হয়েছে', badgeClass: 'bg-violet-50 text-violet-900 border-violet-200', icon: Phone },
  in_progress: { label: 'কাজ চলছে', badgeClass: 'bg-indigo-50 text-indigo-900 border-indigo-200', icon: Clock },
  completed: { label: 'সম্পন্ন', badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200', icon: CheckCircle2 },
  cancelled: { label: 'বাতিল', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200', icon: X },
  rejected: { label: 'প্রত্যাখ্যাত', badgeClass: 'bg-rose-50 text-rose-900 border-rose-200', icon: AlertCircle },
  submitted: { label: 'জমা দেওয়া হয়েছে', badgeClass: 'bg-amber-50 text-amber-900 border-amber-200', icon: Clock },
  assigned: { label: 'নির্ধারিত হয়েছে', badgeClass: 'bg-sky-50 text-sky-900 border-sky-200', icon: UserCheck },
};

const SERVICE_FILTERS = [
  { id: 'all', labelBn: 'সব সেবা' },
  { id: 'home-moving', labelBn: 'বাসা পাল্টানো' },
  { id: 'kajer-bua', labelBn: 'কাজের বুয়া' },
  { id: 'electrician', labelBn: 'Electrician' },
  { id: 'plumber', labelBn: 'Plumber' },
  { id: 'home-tutor', labelBn: 'গৃহশিক্ষক' },
];

function AdminRequestsContent() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<AdminRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusKey>('all');
  const [serviceFilter, setServiceFilter] = useState(() => {
    const fromQuery = searchParams.get('service');
    return SERVICE_FILTERS.some((s) => s.id === fromQuery) ? fromQuery! : 'all';
  });
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await adminFetchAllManagedRequests();
      if (active) setRequests(data);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = requests;
    if (serviceFilter !== 'all') result = result.filter((r) => r.serviceSlug === serviceFilter);
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (areaFilter !== 'all') {
      result = result.filter(
        (r) =>
          r.areaId === areaFilter ||
          r.pickupAreaId === areaFilter ||
          r.destinationAreaId === areaFilter
      );
    }
    if (dateFilter) {
      result = result.filter((r) => {
        const createdAt = r.createdAt ? r.createdAt.slice(0, 10) : '';
        const preferred = r.preferredDate ? r.preferredDate.slice(0, 10) : '';
        return createdAt === dateFilter || preferred === dateFilter;
      });
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.contactName.toLowerCase().includes(q) ||
          r.contactPhone.toLowerCase().includes(q) ||
          (r.profileTitleBn?.toLowerCase().includes(q) ?? false) ||
          (getAreaById(r.areaId)?.nameBn.toLowerCase().includes(q) ?? false) ||
          (getAreaById(r.destinationAreaId)?.nameBn.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [requests, search, statusFilter, serviceFilter, areaFilter, dateFilter]);

  const homeMovingCount = requests.filter((r) => r.serviceSlug === 'home-moving').length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">সার্ভিস রিকোয়েস্ট ম্যানেজমেন্ট</h1>
          <p className="text-sm text-slate-600 mt-1">
            কাজের বুয়া, ইলেকট্রিশিয়ান, প্লাম্বার, বাসা পাল্টানো ও গৃহশিক্ষক রিকোয়েস্ট দেখুন, স্ট্যাটাস ও নোট আপডেট করুন।
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-900">
              <Truck className="w-3.5 h-3.5" />
              বাসা পাল্টানো: {homeMovingCount}টি
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 border border-teal-200 text-teal-900">
              <GraduationCap className="w-3.5 h-3.5" />
              গৃহশিক্ষক: {requests.filter((r) => r.serviceSlug === 'home-tutor').length}টি
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-700">
              মোট: {requests.length}টি
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="আইডি, নাম, ফোন, এলাকা দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              {SERVICE_FILTERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.labelBn}
                </option>
              ))}
            </select>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="all">সব এলাকা</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | StatusKey)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="all">সব স্ট্যাটাস</option>
              {(Object.keys(STATUS_CONFIGS) as StatusKey[]).map((k) => (
                <option key={k} value={k}>
                  {STATUS_CONFIGS[k].label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:col-span-2 lg:col-span-1"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            <span>রিকোয়েস্ট লোড হচ্ছে...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">কোনো রিকোয়েস্ট পাওয়া যায়নি</h3>
            <p className="text-sm text-slate-500 mt-1">ফিল্টার বা সার্চ পরিবর্তন করে চেষ্টা করুন।</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((req) => {
              const statusConf = STATUS_CONFIGS[req.status];
              const StatusIcon = statusConf.icon;
              const isMoving = req.serviceSlug === 'home-moving';
              const isTutor = req.serviceSlug === 'home-tutor';
              const area = req.areaId ? getAreaById(req.areaId) : undefined;
              const destArea = req.destinationAreaId ? getAreaById(req.destinationAreaId) : undefined;
              const ui = !isMoving && !isTutor
                ? STAFF_SERVICE_UI[req.serviceSlug as keyof typeof STAFF_SERVICE_UI]
                : undefined;
              const accent = ui ? STAFF_ACCENT_CLASSES[ui.accent] : STAFF_ACCENT_CLASSES.emerald;

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          আইডি: #{req.id}
                        </span>
                        {isMoving ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-medium bg-sky-50 border border-sky-200 text-sky-900">
                            <Truck className="w-3 h-3" /> বাসা পাল্টানো
                          </span>
                        ) : isTutor ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-medium bg-teal-50 border border-teal-200 text-teal-900">
                            <GraduationCap className="w-3 h-3" /> গৃহশিক্ষক
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-medium ${accent.chip}`}>
                            {ui?.nameBn || req.serviceSlug}
                          </span>
                        )}
                      </div>
                      {isMoving ? (
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-slate-700 font-semibold">
                          <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{area?.nameBn || req.pickupAreaId}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <Home className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>{destArea?.nameBn || req.destinationAreaId}</span>
                        </div>
                      ) : (
                        req.profileTitleBn &&
                        req.profileId && (
                          <Link
                            href={`/${req.serviceSlug}/${req.profileId}`}
                            className="inline-flex items-center gap-1 mt-1 text-sm text-emerald-800 font-semibold hover:underline"
                          >
                            {req.profileTitleBn}
                          </Link>
                        )
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${statusConf.badgeClass}`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusConf.label}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <strong>নাম:</strong> {req.contactName} ({req.contactPhone})
                    </div>
                    {isMoving ? (
                      <>
                        <div>
                          <strong>ঠিকানা:</strong> {req.pickupAddress} → {req.destinationAddress}
                        </div>
                        {req.movingItems && req.movingItems.length > 0 && (
                          <div className="sm:col-span-2">
                            <strong>মালামাল:</strong>{' '}
                            {req.movingItems
                              .map((i) => `${i.labelBn}${i.quantity ? ` ×${i.quantity}` : ''}`)
                              .join(', ')}
                          </div>
                        )}
                      </>
                    ) : (
                      <div>
                        <strong>এলাকা:</strong> {area?.nameBn || req.areaId}, {req.addressLine}
                      </div>
                    )}
                    {isTutor && (
                      <div>
                        <strong>বিষয়:</strong>{' '}
                        {TUTOR_SUBJECTS.find((s) => s.id === req.serviceType)?.labelBn ||
                          req.serviceType ||
                          '—'}
                      </div>
                    )}
                    {req.createdAt && (
                      <div>
                        <strong>জমার তারিখ:</strong>{' '}
                        {new Date(req.createdAt).toLocaleDateString('bn-BD')}
                      </div>
                    )}
                    {req.preferredDate && (
                      <div>
                        <strong>প্রত্যাশিত তারিখ:</strong> {req.preferredDate}
                      </div>
                    )}
                    {req.preferredTime && (
                      <div>
                        <strong>পছন্দের সময়:</strong> {req.preferredTime}
                      </div>
                    )}
                    {req.serviceType && (
                      <div>
                        <strong>কার্য ধরন:</strong> {req.serviceType}
                      </div>
                    )}
                    {req.quotation && (
                      <div className="sm:col-span-2">
                        <strong>কোয়োটেশন:</strong>{' '}
                        <span className="text-emerald-800 font-bold">{req.quotation}</span>
                      </div>
                    )}
                    {req.adminNotes && (
                      <div className="sm:col-span-2 p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-900">
                        <strong>অ্যাডমিন নোট:</strong> {req.adminNotes}
                      </div>
                    )}
                  </div>

                  {req.movingItems && req.movingItems.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {req.movingItems.map((item, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700"
                        >
                          <Package className="w-3 h-3 text-slate-400" />
                          {item.labelBn}
                          {item.quantity ? (
                            <span className="text-emerald-700">×{item.quantity}</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/admin/requests/${req.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                    >
                      বিস্তারিত দেখুন ও আপডেট করুন
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
            <span>রিকোয়েস্ট লোড হচ্ছে...</span>
          </div>
        </div>
      }
    >
      <AdminRequestsContent />
    </Suspense>
  );
}