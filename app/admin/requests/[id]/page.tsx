'use client';

import React, { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Home,
  Calendar,
  Clock,
  Phone,
  User,
  Package,
  Building2,
  Truck,
  FileText,
  CheckCircle2,
  MessageSquare,
  Save,
  Camera,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { adminFetchManagedRequestById, adminUpdateHomeMovingRequest, adminUpdateManagedRequest, getRequestAttachmentViewUrl } from '@/lib/home-moving-service';
import { adminUpdateStaffRequest } from '@/lib/staff-service';
import type { AdminRequestRow } from '@/lib/home-moving-service';
import { getAreaById } from '@/lib/locations';
import type { ServiceRequestStatus } from '@/lib/supabase/types';
import { HOME_MOVING_STATUS_INFO } from '@/lib/home-moving-types';
import { TUTOR_SUBJECTS } from '@/lib/filter-definitions';

const ALL_STATUSES: ServiceRequestStatus[] = [
  'new',
  'reviewing',
  'contacted',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
];

const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  new: 'নতুন',
  reviewing: 'পর্যালোচনাধীন',
  contacted: 'যোগাযোগ হয়েছে',
  assigned: 'নির্ধারিত',
  in_progress: 'কাজ চলছে',
  completed: 'সম্পন্ন',
  cancelled: 'বাতিল',
  rejected: 'প্রত্যাখ্যাত',
  submitted: 'জমা দেওয়া হয়েছে',
};

export default function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [req, setReq] = useState<AdminRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ServiceRequestStatus>('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [quotation, setQuotation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await adminFetchManagedRequestById(id);
      if (active && data) {
        setReq(data);
        setStatus(data.status);
        setAdminNotes(data.adminNotes || '');
        setQuotation(data.quotation || '');
        const urls: string[] = [];
        for (const p of data.photoUrls || []) {
          const resolved = await getRequestAttachmentViewUrl(p);
          if (resolved) urls.push(resolved);
        }
        if (active) setPhotoUrls(urls);
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const isHomeMoving = req?.serviceSlug === 'home-moving';
  const isTutor = req?.serviceSlug === 'home-tutor';

  const handleSave = async () => {
    if (!req) return;
    setSaving(true);
    setSaveMsg('');
    setError('');
    let ok = false;
    if (isHomeMoving) {
      const res = await adminUpdateHomeMovingRequest(req.id, { status, adminNotes, quotation });
      ok = res.success;
    } else if (isTutor) {
      const res = await adminUpdateManagedRequest(req.id, 'home-tutor', status, adminNotes);
      ok = res.success;
    } else {
      const res = await adminUpdateStaffRequest(req.id, status, adminNotes);
      ok = res.success;
    }
    setSaving(false);
    if (ok) {
      setReq((prev) => (prev ? { ...prev, status, adminNotes, quotation } : prev));
      setSaveMsg('সংরক্ষণ সফল হয়েছে।');
      setTimeout(() => setSaveMsg(''), 2500);
    } else {
      setError('সংরক্ষণ ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
          <span>রিকোয়েস্ট লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">রিকোয়েস্ট পাওয়া যায়নি</h3>
          <p className="text-sm text-slate-500 mb-5">রিকোয়েস্ট মুছে ফেলা হয়েছে বা ভুল আইডি।</p>
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            রিকোয়েস্ট তালিকা
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = HOME_MOVING_STATUS_INFO[status];

  const pickupArea = getAreaById(req.pickupAreaId);
  const destArea = getAreaById(req.destinationAreaId);
  const area = getAreaById(req.areaId);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <Link
            href="/admin/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:underline mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            রিকোয়েস্ট তালিকায় ফিরুন
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isHomeMoving
                  ? 'বাসা পাল্টানো রিকোয়েস্ট'
                  : isTutor
                    ? 'গৃহশিক্ষক রিকোয়েস্ট'
                    : 'সার্ভিস রিকোয়েস्ट'}{' '}
                <span className="text-slate-400 font-semibold">#{req.id}</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                >
                  {STATUS_LABELS[status] || status}
                </span>
                <span className="text-[11px] text-slate-500">
                  জমার তারিখ:{' '}
                  {req.createdAt ? new Date(req.createdAt).toLocaleDateString('bn-BD') : '—'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              গোপনীয় তথ্য — শুধুমাত্র অ্যাডমিন দেখবেন
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}
        {saveMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {saveMsg}
          </div>
        )}

        {/* Route / Key info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            {isHomeMoving ? (
              <Truck className="w-4 h-4 text-emerald-700" />
            ) : isTutor ? (
              <GraduationCap className="w-4 h-4 text-emerald-700" />
            ) : (
              <FileText className="w-4 h-4 text-emerald-700" />
            )}
            মূল তথ্য
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            {isHomeMoving ? (
              <>
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> কোথা থেকে (পিকআপ)
                  </div>
                  <div className="font-bold text-slate-900">
                    {pickupArea?.nameBn || req.pickupAreaId}
                    {pickupArea?.wardLabelBn ? ` (${pickupArea.wardLabelBn})` : ''}
                  </div>
                  <div className="text-slate-600 mt-0.5">{req.pickupAddress}</div>
                  {req.pickupFloor && (
                    <div className="text-[11px] text-slate-500 mt-1">তলা: {req.pickupFloor}</div>
                  )}
                </div>
                <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-50/40 border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-700 mb-1 flex items-center gap-1">
                    <Home className="w-3 h-3" /> কোথায় যাবেন (গন্তব্য)
                  </div>
                  <div className="font-bold text-slate-900">
                    {destArea?.nameBn || req.destinationAreaId}
                    {destArea?.wardLabelBn ? ` (${destArea.wardLabelBn})` : ''}
                  </div>
                  <div className="text-slate-600 mt-0.5">{req.destinationAddress}</div>
                  {req.destinationFloor && (
                    <div className="text-[11px] text-slate-500 mt-1">তলা: {req.destinationFloor}</div>
                  )}
                </div>
                <div>
                  <strong className="text-slate-400 block mb-1">লিফট</strong>
                  {req.hasLift ? 'আছে' : 'নেই'}
                </div>
                {req.parkingInfo && (
                  <div>
                    <strong className="text-slate-400 block mb-1">পার্কিং</strong>
                    {req.parkingInfo}
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <strong className="text-slate-400 block mb-1">এলাকা</strong>
                  {area?.nameBn || req.areaId}, {req.addressLine}
                </div>
                {req.profileTitleBn && (
                  <div>
                    <strong className="text-slate-400 block mb-1">প্রোফাইল</strong>
                    {req.profileTitleBn}
                  </div>
                )}
                {req.serviceType && (
                  <div>
                    <strong className="text-slate-400 block mb-1">{isTutor ? 'বিষয়' : 'কার্য ধরন'}</strong>
                    {isTutor
                      ? TUTOR_SUBJECTS.find((s) => s.id === req.serviceType)?.labelBn ||
                        req.serviceType
                      : req.serviceType}
                  </div>
                )}
              </>
            )}

            {req.preferredDate && (
              <div>
                <strong className="text-slate-400 block mb-1">প্রত্যাশিত তারিখ</strong>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {req.preferredDate}
                </span>
              </div>
            )}
            {req.preferredTime && (
              <div>
                <strong className="text-slate-400 block mb-1">পছন্দের সময়</strong>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {req.preferredTime}
                </span>
              </div>
            )}

            {req?.movingItems && req.movingItems.length > 0 && (
              <div className="sm:col-span-2">
                <strong className="text-slate-400 block mb-1 flex items-center gap-1 mt-2">
                  <Package className="w-3.5 h-3.5" /> মালামাল ({req.movingItems.length} প্রকার)
                </strong>
                <div className="flex flex-wrap gap-2">
                  {req.movingItems.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      {item.labelBn}
                      {item.quantity ? <span className="text-emerald-700">×{item.quantity}</span> : null}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact + description */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            গ্রাহক ও বিবরণ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-400 block mb-0.5">নাম</strong>
                {req.contactName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong className="text-slate-400 block mb-0.5">মোবাইল</strong>
                {req.contactPhone}
              </span>
            </div>
            {req.description && (
              <div className="sm:col-span-2">
                <strong className="text-slate-400 block mb-1">বিবরণ</strong>
                <div className="p-3 bg-slate-50 rounded-xl text-slate-700">{req.description}</div>
              </div>
            )}
            {req.quotation && (
              <div className="sm:col-span-2">
                <strong className="text-slate-400 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> উল্লেখিত কোয়োটেশন (অ্যাডমিন)
                </strong>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold">
                  {req.quotation}
                </div>
              </div>
            )}
          </div>

          {photoUrls.length > 0 && (
            <div className="mt-4">
              <strong className="text-slate-400 block mb-1 flex items-center gap-1 text-xs">
                <Camera className="w-3.5 h-3.5" /> সংযুক্ত ছবি ({photoUrls.length})
              </strong>
              <div className="grid grid-cols-3 gap-2">
                {photoUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`মালামালের ছবি ${i + 1}`} className="w-full h-24 object-cover rounded-xl" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status update + notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            স্ট্যাটাস ও নোট ম্যানেজমেন্ট
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">স্ট্যাটাস</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      status === s
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {isHomeMoving && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  কোয়োটেশন (শিফটিং খরচ — ম্যানুয়ালি লিখুন)
                </label>
                <input
                  type="text"
                  value={quotation}
                  onChange={(e) => setQuotation(e.target.value)}
                  placeholder="যেমন: ৳২,৫০০ (শ্রমিক + পিকআপ)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  খরচের হিসাব অ্যাডমিন ম্যানুয়ালি নিশ্চিত করবেন — কোনও স্বয়ংক্রিয় মূল্য গণনা নেই।
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> অ্যাডমিন নোট (গ্রাহক/জনসাধারণ দেখতে পাবেন না)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="গ্রাহকের সাথে কথা বলার সারসংক্ষেপ, শ্রমিক দল বা গাড়ির সমন্বয়..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href="/admin/requests"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                বাতিল
              </Link>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}