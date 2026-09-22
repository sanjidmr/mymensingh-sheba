'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, Send, CheckCircle2, Loader2, Camera } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { KAJER_BUA_WORK_TYPES, ELECTRICIAN_SERVICE_TYPES, PLUMBING_SERVICE_TYPES } from '@/lib/filter-definitions';
import { STAFF_PREFERRED_TIMES } from '@/lib/staff-types';
import type { StaffProfile, StaffServiceUiConfig } from '@/lib/staff-types';
import { STAFF_ACCENT_CLASSES } from '@/lib/staff-labels';
import { uploadRequestAttachment } from '@/lib/staff-service';
import { getAllMCCAreas } from '@/lib/locations';

const WORK_TYPE_OPTIONS: Record<string, Array<{ id: string; labelBn: string }>> = {
  'kajer-bua': KAJER_BUA_WORK_TYPES.filter((o) => o.id !== 'all'),
  electrician: ELECTRICIAN_SERVICE_TYPES.filter((o) => o.id !== 'all'),
  plumber: PLUMBING_SERVICE_TYPES.filter((o) => o.id !== 'all'),
};

interface StaffRequestFormProps {
  profile: StaffProfile;
  serviceUi: StaffServiceUiConfig;
}

export function StaffRequestForm({ profile, serviceUi }: StaffRequestFormProps) {
  const { user, createServiceRequest } = useAuth();
  const accent = STAFF_ACCENT_CLASSES[serviceUi.accent] || STAFF_ACCENT_CLASSES.emerald;

  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [visitorName, setVisitorName] = useState(user?.fullName || '');
  const [visitorPhone, setVisitorPhone] = useState(user?.phone || '');
  const [visitorArea, setVisitorArea] = useState(user?.primaryAreaId || '');
  const [addressLine, setAddressLine] = useState('');
  const [workType, setWorkType] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [details, setDetails] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const handlePhoto = async (file?: File) => {
    if (!file) {
      setAttachmentUrl('');
      return;
    }
    if (!user) return;
    setUploadingPhoto(true);
    const res = await uploadRequestAttachment(user.id, file);
    setUploadingPhoto(false);
    if (res.success && res.url) setAttachmentUrl(res.url);
    else setRequestError(res.error || 'ছবি সংযুক্ত করতে ব্যর্থ হয়েছে।');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setRequestError('');
    setSubmitting(true);
    await createServiceRequest({
      serviceSlug: profile.serviceSlug,
      profileId: profile.id,
      profileTitleBn: profile.titleBn,
      serviceType: workType || undefined,
      contactName: visitorName.trim(),
      contactPhone: visitorPhone.trim(),
      areaId: visitorArea,
      addressLine: addressLine.trim(),
      details: details.trim(),
      preferredDate: preferredDate || undefined,
      preferredTime: preferredTime || undefined,
      attachmentUrl: serviceUi.hasPhotoOnRequest ? attachmentUrl || undefined : undefined,
    });
    setSubmitting(false);
    setRequestSent(true);
  };

  const title = serviceUi.hasPhotoOnRequest
    ? 'সার্ভিসের অনুরোধ করুন'
    : 'কাজের জন্য অনুরোধ করুন';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 mb-2">
        <Lock className={`w-4 h-4 ${accent.text}`} />
        <span>নিরাপদ যোগাযোগ প্রোটোকল</span>
      </div>
      <h4 className="text-base font-bold text-slate-900 mb-2">{title}</h4>
      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        স্প্যাম ও হয়রানি রোধে কর্মীর ফোন নম্বর সরাসরি উন্মুক্ত নয়। আপনার অনুরোধ প্ল্যাটফর্মের মাধ্যমে
        সরাসরি কর্মী ও অ্যাডমিনের কাছে পৌঁছাবে।
      </p>

      {requestSent ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
          <div className="font-bold mb-1">অনুরোধ জমা হয়েছে!</div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            আপনার অনুরোধ কর্মীর কাছে পৌঁছে দেওয়া হয়েছে। তিনি/তিনি শীঘ্রই যোগাযোগ করবেন।
          </p>
          <Link href="/profile/requests" className="underline font-semibold text-xs inline-block mt-2">
            আমার অনুরোধ দেখুন
          </Link>
        </div>
      ) : !user ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <Lock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">
            অনুরোধ পাঠাতে অ্যাকাউন্টে লগইন করুন। আপনার তথ্য গোপন রাখা হবে।
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/login" className={`px-4 py-2 rounded-xl text-white text-xs font-semibold ${accent.btn} ${accent.btnHover}`}>
              লগইন করুন
            </Link>
            <Link href="/register" className={`px-4 py-2 rounded-xl border text-xs font-semibold ${accent.btn} ${accent.btn} border-current`}>
              অ্যাকাউন্ট খুলুন
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার নাম:</label>
              <input
                type="text"
                required
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder="পূর্ণ নাম"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর:</label>
              <input
                type="tel"
                required
                value={visitorPhone}
                onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">আপনার এলাকা:</label>
            <select
              required
              value={visitorArea}
              onChange={(e) => setVisitorArea(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">এলাকা নির্বাচন করুন</option>
              {getAllMCCAreas({ activeOnly: true }).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nameBn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">বাসা/প্রতিষ্ঠানের ঠিকানা:</label>
            <input
              type="text"
              required
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="যেমন: বাড়ি ১২, রোড ৫, সেক্টর ২..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {profile.serviceSlug === 'kajer-bua' ? 'কী ধরনের কাজ প্রয়োজন:' : 'প্রয়োজনীয় কাজের ধরন:'}
            </label>
            <select
              required
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            >
              <option value="">নির্বাচন করুন</option>
              {(WORK_TYPE_OPTIONS[profile.serviceSlug] || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {o.labelBn}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {profile.serviceSlug === 'kajer-bua' ? 'কোন তারিখ থেকে (ঐচ্ছিক):' : 'পছন্দের তারিখ (ঐচ্ছিক):'}
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">পছন্দের সময়:</label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="">যেকোনো সময়</option>
                {STAFF_PREFERRED_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">বিস্তারিত (ঐচ্ছিক):</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={profile.serviceSlug === 'kajer-bua' ? 'যেমন: ৩ জনের পরিবারে রান্না, ৪ দিন/সপ্তাহ...' : 'সমস্যার সংক্ষিপ্ত বিবরণ দিন...'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {serviceUi.hasPhotoOnRequest && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ছবি সংযুক্ত করুন (ঐচ্ছিক):</label>
              <label className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:border-slate-400 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-600">
                  {uploadingPhoto ? 'আপলোড হচ্ছে...' : attachmentUrl ? 'ছবি যুক্ত হয়েছে ✓' : 'সমস্যার ছবি (সর্বোচ্চ ৫MB)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingPhoto}
                  onChange={(e) => handlePhoto(e.target.files?.[0])}
                />
              </label>
              {attachmentUrl && (
                <button
                  type="button"
                  onClick={() => setAttachmentUrl('')}
                  className="text-[11px] text-slate-500 underline mt-1"
                >
                  ছবি বাদ দিন
                </button>
              )}
            </div>
          )}

          {requestError && <p className="text-xs text-rose-600">{requestError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-60 ${accent.btn} ${accent.btnHover}`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{submitting ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}</span>
          </button>
        </form>
      )}
    </div>
  );
}