'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Phone,
} from 'lucide-react';
import { saveStaffProfile } from '@/app/admin/actions/staff';
import type { StaffProfile, StaffProfileInput, StaffServiceKey } from '@/lib/staff-types';
import { STAFF_SERVICE_UI } from '@/lib/staff-types';

interface StaffProfileFormProps {
  mode: 'create' | 'edit';
  initialProfile?: StaffProfile | null;
}

/**
 * Internal worker-directory form.
 *
 * This form is the ONLY place worker details are recorded, and it lives behind
 * `/admin`. It intentionally collects just what an admin needs to contact and
 * describe a worker (name, service, phone, honourarium, notes). Customers never
 * see this form or its data — they submit a service request and an admin
 * assigns a worker from the directory.
 */
export default function StaffProfileForm({ mode, initialProfile }: StaffProfileFormProps) {
  const router = useRouter();

  const [serviceSlug, setServiceSlug] = useState<StaffServiceKey>(
    initialProfile?.serviceSlug || 'kajer-bua'
  );
  const [nameBn, setNameBn] = useState(initialProfile?.nameBn || '');
  const [titleBn, setTitleBn] = useState(initialProfile?.titleBn || '');
  const imageUrl = initialProfile?.imageUrl || '';
  const [salaryMax, setSalaryMax] = useState<string>(
    initialProfile?.salaryMax != null ? String(initialProfile.salaryMax) : ''
  );
  const [rateLabel, setRateLabel] = useState(initialProfile?.rateLabel || '');
  const [aboutBn, setAboutBn] = useState(initialProfile?.aboutBn || '');
  const [phonePrivate, setPhonePrivate] = useState(initialProfile?.phonePrivate || '');
  const [isVerified, setIsVerified] = useState(initialProfile?.isVerified || false);
  const [isActive, setIsActive] = useState(initialProfile?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ui = STAFF_SERVICE_UI[serviceSlug];

  const handleServiceChange = (next: StaffServiceKey) => {
    setServiceSlug(next);
    setSalaryMax('');
    setRateLabel('');
  };

  const buildInput = (): StaffProfileInput => {
    const max = salaryMax ? Number(salaryMax) : undefined;
    return {
      serviceSlug,
      nameBn: nameBn.trim(),
      titleBn: titleBn.trim(),
      imageUrl,
      salaryMax: ui.usesSalary ? max : undefined,
      rateLabel: rateLabel.trim() || undefined,
      aboutBn: aboutBn.trim(),
      isVerified,
      isActive,
      // Sent even when empty, so an admin can clear a stale number.
      phonePrivate: phonePrivate.trim(),
    };
  };

  const validate = (): string => {
    if (nameBn.trim().length < 2) return 'নাম লিখুন (সর্বনিম্ন ২ অক্ষর)';
    if (titleBn.trim().length < 2) return 'পদবি / সংক্ষিপ্ত পরিচয় লিখুন';
    if (aboutBn.trim().length < 10) return 'বিস্তারিত তথ্য লিখুন (সর্বনিম্ন ১০ অক্ষর)';
    if (ui.usesSalary && salaryMax) {
      const max = Number(salaryMax);
      if (max < 0) return 'সম্মানীর পরিমাণ ঋণাত্মক হতে পারবে না';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const input = buildInput();
    const result = mode === 'create'
      ? await saveStaffProfile(input)
      : initialProfile
        ? await saveStaffProfile(input, initialProfile.id)
        : { ok: false as const, error: 'প্রোফাইল পাওয়া যায়নি' };
    setSaving(false);
    if (!result.ok || !result.id) {
      setError(result.ok ? 'সংরক্ষণ সম্পন্ন হয়েছে, তবে প্রোফাইল আইডি পাওয়া যায়নি।' : result.error);
      return;
    }
    setSuccess('প্রোফাইল সফলভাবে সংরক্ষণ হয়েছে');
    setTimeout(() => router.replace(`/admin/services/${result.id}`), 900);
  };

  const inputCls =
    'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700';

  const labelCls = 'block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5';

  return (
    <div className="w-full max-w-5xl">
        <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/admin/services')}
            className="hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>কর্মী প্রোফাইল তালিকা</span>
          </button>
          <span>/</span>
          <span className="text-slate-800 font-semibold">
            {mode === 'create' ? 'নতুন প্রোফাইল' : 'প্রোফাইল সম্পাদনা'}
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'create' ? 'নতুন কর্মী প্রোফাইল' : 'কর্মী প্রোফাইল সম্পাদনা'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            এটি অ্যাডমিনের অভ্যন্তরীণ কর্মী-তালিকা। কর্মীর নাম ও মোবাইল নম্বর কোথাও প্রকাশ্যে দেখানো হয় না।
            গ্রাহক সেবা-অনুরোধ পাঠালে অ্যাডমিন এখান থেকেই উপযুক্ত কর্মী নির্ধারণ করেন।
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Service + status */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">সার্ভিস ও গ্রহণযোগ্যতা</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>সার্ভিস</label>
                <select
                  value={serviceSlug}
                  onChange={(e) => handleServiceChange(e.target.value as StaffServiceKey)}
                  className={inputCls}
                  disabled={mode === 'edit'}
                >
                  <option value="kajer-bua">কাজের বুয়া</option>
                  <option value="electrician">Electrician</option>
                  <option value="plumber">Plumber</option>
                  <option value="ac-fridge">এসি ও ফ্রিজ মেরামত</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>প্রকাশনার অবস্থা</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className={inputCls}
                >
                  <option value="active">সক্রিয় (নির্ধারণের জন্য প্রস্তুত)</option>
                  <option value="inactive">নিষ্ক্রিয় (লুকানো)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>যাচাইয়ের অবস্থা</label>
                <div className="flex items-center gap-3 h-[42px]">
                  <button
                    type="button"
                    onClick={() => setIsVerified((v) => !v)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                      isVerified
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isVerified ? 'ভেরিফাইড' : 'ভেরিফাইড নয়'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Identity */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">পরিচয়</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>নাম*</label>
                  <input
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="যেমন: রশিদা বেগম"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>পদবি / সংক্ষিপ্ত পরিচয়*</label>
                  <input
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    placeholder="যেমন: অভিজ্ঞ গৃহকর্মী / মাস্টার ইলেক্ট্রিশিয়ান"
                    className={inputCls}
                  />
                </div>
                {ui.usesSalary && (
                  <div>
                    <label className={labelCls}>প্রতীক্ষিত সম্মানী (সর্বোচ্চ)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min={0}
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                        placeholder="৫০০০"
                        className={`${inputCls} pl-9`}
                      />
                    </div>
                  </div>
                )}
                {!ui.usesSalary && (
                  <div>
                    <label className={labelCls}>দক্ষতা / চার্জ নোট</label>
                    <input
                      value={rateLabel}
                      onChange={(e) => setRateLabel(e.target.value)}
                      placeholder="যেমন: ভিজিট ২০০৳ + কাজ ভেদে"
                      className={inputCls}
                    />
                  </div>
                )}
                <div>
                  <label className={labelCls}>নিজস্ব মোবাইল (অ্যাডমিন-শুধু)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={phonePrivate}
                      onChange={(e) => setPhonePrivate(e.target.value)}
                      placeholder="কাজের মোবাইল নম্বর"
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    এই নম্বর কোনো পাবলিক পেজে প্রকাশিত হয় না — শুধু অ্যাডমিন দেখতে পান।
                  </p>
                </div>
            </div>
          </section>

          {/* About */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className={labelCls}>বিস্তারিত পরিচয় ও কর্মসূত্র*</label>
            <textarea
              value={aboutBn}
              onChange={(e) => setAboutBn(e.target.value)}
              rows={5}
              placeholder="অভিজ্ঞতা, দক্ষতা, সময়সূচি, যোগাযোগ সংক্রান্ত তথ্য ও অন্যান্য কাজের বর্ণনা দিন।"
              className={`${inputCls} leading-relaxed`}
            />
          </section>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/admin/services')}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-semibold shadow-xs disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
    </div>
  );
}
