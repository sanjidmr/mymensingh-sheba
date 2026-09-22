'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ArrowLeft,
  Camera,
  Loader2,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Briefcase,
  DollarSign,
  Phone,
} from 'lucide-react';
import { adminCreateStaffProfile, adminUpdateStaffProfile, uploadStaffProfilePhoto, resolveStaffImageUrl } from '@/lib/staff-service';
import type { StaffProfile, StaffProfileInput, StaffServiceKey } from '@/lib/staff-types';
import { STAFF_SERVICE_UI, STAFF_WORK_MODE_LABELS, formatSalaryBn } from '@/lib/staff-types';
import {
  KAJER_BUA_WORK_TYPES,
  KAJER_BUA_WORK_MODES,
  KAJER_BUA_TIME_SLOTS,
  KAJER_BUA_SALARY_PRESETS,
  ELECTRICIAN_SERVICE_TYPES,
  PLUMBING_SERVICE_TYPES,
  STAFF_AVAILABILITY_OPTIONS,
} from '@/lib/filter-definitions';
import { getAllMCCAreas } from '@/lib/locations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface StaffProfileFormProps {
  mode: 'create' | 'edit';
  initialProfile?: StaffProfile | null;
}

function optionList(list: Array<{ id: string; labelBn: string }>) {
  return list.filter((o) => o.id !== 'all');
}

export default function StaffProfileForm({ mode, initialProfile }: StaffProfileFormProps) {
  const router = useRouter();
  const allAreas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);

  const [serviceSlug, setServiceSlug] = useState<StaffServiceKey>(
    initialProfile?.serviceSlug || 'kajer-bua'
  );
  const [nameBn, setNameBn] = useState(initialProfile?.nameBn || '');
  const [titleBn, setTitleBn] = useState(initialProfile?.titleBn || '');
  const [imageUrl, setImageUrl] = useState(initialProfile?.imageUrl || '');
  const [areaIds, setAreaIds] = useState<string[]>(initialProfile?.areaIds || []);
  const [workTypes, setWorkTypes] = useState<string[]>(initialProfile?.workTypes || []);
  const [workMode, setWorkMode] = useState(initialProfile?.workMode || '');
  const [timeSlot, setTimeSlot] = useState(initialProfile?.timeSlot || '');
  const [experienceYears, setExperienceYears] = useState<string>(
    initialProfile?.experienceYears != null ? String(initialProfile.experienceYears) : ''
  );
  const [availability, setAvailability] = useState(initialProfile?.availability || 'available');
  const [isEmergency, setIsEmergency] = useState(initialProfile?.isEmergency || false);
  const [salaryMin, setSalaryMin] = useState<string>(
    initialProfile?.salaryMin != null ? String(initialProfile.salaryMin) : ''
  );
  const [salaryMax, setSalaryMax] = useState<string>(
    initialProfile?.salaryMax != null ? String(initialProfile.salaryMax) : ''
  );
  const [rateLabel, setRateLabel] = useState(initialProfile?.rateLabel || '');
  const [aboutBn, setAboutBn] = useState(initialProfile?.aboutBn || '');
  const [phonePrivate, setPhonePrivate] = useState(initialProfile?.phonePrivate || '');
  const [isVerified, setIsVerified] = useState(initialProfile?.isVerified || false);
  const [isActive, setIsActive] = useState(initialProfile?.isActive ?? true);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ui = STAFF_SERVICE_UI[serviceSlug];

  const workTypeOptions = useMemo(() => {
    if (serviceSlug === 'kajer-bua') return optionList(KAJER_BUA_WORK_TYPES);
    if (serviceSlug === 'electrician') return optionList(ELECTRICIAN_SERVICE_TYPES);
    return optionList(PLUMBING_SERVICE_TYPES);
  }, [serviceSlug]);

  const handleServiceChange = (next: StaffServiceKey) => {
    setServiceSlug(next);
    setWorkTypes([]);
    setWorkMode('');
    setTimeSlot('');
    setSalaryMin('');
    setSalaryMax('');
    setIsEmergency(false);
  };

  const toggleArea = (id: string) => {
    setAreaIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleWorkType = (id: string) => {
    setWorkTypes((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError('');
    const res = await uploadStaffProfilePhoto(file);
    setUploading(false);
    if (res.success && res.url) {
      setImageUrl(res.url);
    } else {
      setError(res.error || 'ছবি আপলোড ব্যর্থ হয়েছে');
    }
  };

  const buildInput = (): StaffProfileInput => {
    const exp = Number(experienceYears) || 0;
    const min = salaryMin ? Number(salaryMin) : undefined;
    const max = salaryMax ? Number(salaryMax) : undefined;
    return {
      serviceSlug,
      nameBn: nameBn.trim(),
      titleBn: titleBn.trim(),
      imageUrl,
      areaIds,
      workTypes,
      workMode: ui.usesSalary ? (workMode || undefined) : undefined,
      timeSlot: ui.usesSalary ? (timeSlot || undefined) : undefined,
      experienceYears: exp,
      availability,
      isEmergency: ui.usesEmergency ? isEmergency : undefined,
      salaryMin: ui.usesSalary ? min : undefined,
      salaryMax: ui.usesSalary ? max : undefined,
      rateLabel: rateLabel.trim() || undefined,
      aboutBn: aboutBn.trim(),
      isVerified,
      isActive,
      phonePrivate: phonePrivate.trim() || undefined,
    };
  };

  const validate = (): string => {
    if (nameBn.trim().length < 2) return 'নাম লিখুন (সর্বনিম্ন ২ অক্ষর)';
    if (titleBn.trim().length < 2) return 'পদবি / সংক্ষিপ্ত পরিচয় লিখুন';
    if (areaIds.length === 0) return 'অন্তত একটি কাজের এলাকা বাছাই করুন';
    if (workTypes.length === 0) return 'অন্তত একটি কাজের ধরন বাছাই করুন';
    if (aboutBn.trim().length < 10) return 'বিস্তারিত তথ্য লিখুন (সর্বনিম্ন ১০ অক্ষর)';
    if (ui.usesSalary && salaryMin) {
      const min = Number(salaryMin);
      const max = salaryMax ? Number(salaryMax) : min;
      if (min < 0 || max < min) return 'সম্মানীর সীমা সঠিক নয়';
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
    let result: { success: boolean; profile?: StaffProfile; error?: string };
    if (mode === 'create') {
      result = await adminCreateStaffProfile(input);
    } else if (initialProfile) {
      result = await adminUpdateStaffProfile(initialProfile.id, input);
    } else {
      result = { success: false, error: 'প্রোফাইল পাওয়া যায়নি' };
    }
    setSaving(false);
    if (!result.success || !result.profile) {
      setError(result.error || 'সংরক্ষণ ব্যর্থ হয়েছে');
      return;
    }
    setSuccess('প্রোফাইল সফলভাবে সংরক্ষণ হয়েছে');
    setTimeout(() => router.replace(`/admin/services/${result.profile!.id}`), 900);
  };

  const inputCls =
    'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700';

  const labelCls = 'block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5';

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFDFB]">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            অ্যাডমিন যাচাইয়ের পরই প্রোফাইলটি পাবলিক ওয়েবসাইটে প্রকাশিত হয়। অনুগ্রহ করে বাস্তব তথ্য দিন।
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
                </select>
              </div>
              <div>
                <label className={labelCls}>প্রকাশনার অবস্থা</label>
                <select
                  value={isActive ? 'active' : 'inactive'}
                  onChange={(e) => setIsActive(e.target.value === 'active')}
                  className={inputCls}
                >
                  <option value="active">সক্রিয় (পাবলিকে দেখা যাবে)</option>
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

          {/* Identity + photo */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4">পরিচয় ও ছবি</h3>
            <div className="flex flex-col sm:flex-row gap-5">
              <div className="shrink-0">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                  {imageUrl ? (
                    <Image
                      src={resolveStaffImageUrl(imageUrl)}
                      alt={nameBn || 'প্রোফাইল ছবি'}
                      fill
                      sizes="128px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <label className="mt-2 block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {uploading ? 'আপলোড হচ্ছে...' : 'ছবি আপলোড'}
                  </span>
                </label>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <>
                    <div>
                      <label className={labelCls}>প্রতীক্ষিত সম্মানী (নিম্ন)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          min={0}
                          value={salaryMin}
                          onChange={(e) => setSalaryMin(e.target.value)}
                          placeholder="৩০০০"
                          className={`${inputCls} pl-9`}
                        />
                      </div>
                    </div>
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
                  </>
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
                </div>
              </div>
            </div>
          </section>

          {/* Work + availability */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              কাজের তথ্য
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelCls}>অভিজ্ঞতা (বছর)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="যেমন: ৫"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>সর্বশেষ প্রাপ্যতা</label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as StaffProfileInput['availability'])}
                  className={inputCls}
                >
                  {optionList(STAFF_AVAILABILITY_OPTIONS).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.labelBn}
                    </option>
                  ))}
                </select>
              </div>
              {ui.usesSalary && (
                <div>
                  <label className={labelCls}>কাজের ধরন (শিফট)</label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">যে কোনো ধরন</option>
                    {optionList(KAJER_BUA_WORK_MODES).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.labelBn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {ui.usesSalary && (
                <div>
                  <label className={labelCls}>পছন্দের সময়</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">যে কোনো সময়</option>
                    {optionList(KAJER_BUA_TIME_SLOTS).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.labelBn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {ui.usesEmergency && (
                <div>
                  <label className={labelCls}>জরুরি অন-কল</label>
                  <div className="flex items-center h-[42px]">
                    <button
                      type="button"
                      onClick={() => setIsEmergency((v) => !v)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                        isEmergency
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {isEmergency ? 'জরুরি সেবা সক্রিয়' : 'জরুরি সেবা দেওয়া হয়'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className={labelCls}>কাজের ধরন / দক্ষতা*</label>
              <div className="flex flex-wrap gap-2">
                {workTypeOptions.map((o) => {
                  const selected = workTypes.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleWorkType(o.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                        selected
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {o.labelBn}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Service areas */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-700" />
              কর্মক্ষেত্র এলাকা*
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
              {allAreas.map((area) => {
                const selected = areaIds.includes(area.id);
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {area.nameBn}
                  </button>
                );
              })}
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
      </main>
      <Footer />
    </div>
  );
}