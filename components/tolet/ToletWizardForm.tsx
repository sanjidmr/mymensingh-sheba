'use client';

import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Save, Send, Loader2 } from 'lucide-react';
import {
  getAllMCCAreas,
} from '@/lib/locations';
import {
  TOLET_FACILITY_OPTIONS,
} from '@/lib/filter-definitions';
import {
  TOLET_PROPERTY_TYPE_INFO,
  type ToletListing,
  type ToletListingInput,
  type ToletPropertyType,
} from '@/lib/tolet-types';
import { calculateToletFee, getToletFeeDescription } from '@/lib/tolet-fees';
import { PhotoUploader } from '@/components/tolet/PhotoUploader';
import { ToletListingCard } from '@/components/tolet/ToletListingCard';
import { cn } from '@/lib/utils';

const STEPS = [
  'বাসার ধরন',
  'এলাকা ও ঠিকানা',
  'ভাড়া নির্ধারণ',
  'বাসার তথ্য',
  'সুবিধাসমূহ',
  'ছবি',
  'বিবরণ',
  'প্রিভিউ',
  'জমা',
] as const;

const AVAILABLE_FROM_OPTIONS = [
  'তাৎক্ষণিক সম্ভব',
  'চলতি মাস থেকে',
  'আগামী মাস থেকে',
  '১লা অক্টোবর থেকে',
  '১লা নভেম্বর থেকে',
  'নিজে লিখুন/অন্যান্য',
];

interface ToletWizardFormProps {
  mode: 'owner' | 'admin';
  ownerId: string;
  ownerName: string;
  ownerVerified: boolean;
  initialListing?: ToletListing;
  onUploadFile: (file: File) => Promise<string>;
  onSubmit: (
    input: ToletListingInput,
    draft: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  onDone: (action: 'created' | 'updated' | 'draft_saved') => void;
}

const defaultForm: ToletListingInput = {
  title: '',
  propertyType: 'family',
  areaId: '',
  specificAddress: '',
  rentPrice: 0,
  bedrooms: 1,
  bathrooms: 1,
  balconies: 0,
  totalRooms: undefined,
  floor: '',
  availableFrom: undefined,
  facilities: [],
  description: '',
  photos: [],
};

function toInput(listing: ToletListing): ToletListingInput {
  return {
    title: listing.title,
    propertyType: listing.propertyType,
    areaId: listing.areaId,
    specificAddress: listing.specificAddress,
    rentPrice: listing.rentPrice,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    balconies: listing.balconies,
    totalRooms: listing.totalRooms,
    floor: listing.floor || '',
    availableFrom: listing.availableFrom,
    facilities: listing.facilities,
    description: listing.description,
    photos: listing.photos,
  };
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
      <span className="text-xs sm:text-sm font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-lg font-bold text-slate-700 active:scale-95"
        >
          −
        </button>
        <span className="w-8 text-center font-bold text-slate-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-lg font-bold text-emerald-800 active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function ToletWizardForm({
  mode,
  ownerId,
  ownerName,
  ownerVerified,
  initialListing,
  onUploadFile,
  onSubmit,
  onDone,
}: ToletWizardFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ToletListingInput>(() =>
    initialListing ? toInput(initialListing) : { ...defaultForm }
  );
  const [alreadyPublished] = useState(() => initialListing?.status === 'approved');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);
  const typeInfo = TOLET_PROPERTY_TYPE_INFO[form.propertyType];
  const isMessLike = typeInfo?.isMessLike ?? false;
  const isEditing = Boolean(initialListing);

  const set = <K extends keyof ToletListingInput>(key: K, value: ToletListingInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateStep = (s: number): string => {
    if (s === 0) return '';
    if (s === 1) {
      if (!form.areaId) return 'এলাকা নির্বাচন করুন।';
      if (form.specificAddress.trim().length < 5) return 'সুনির্দিষ্ট ঠিকানা অন্তত ৫ অক্ষর লিখুন।';
      return '';
    }
    if (s === 2) {
      if (!(form.rentPrice >= 100)) return 'মাসিক ভাড়া ১০০ টাকার কম হতে পারবে না।';
      if (form.rentPrice > 500000) return 'ভাড়া খুব বেশি মনে হচ্ছে (সর্বোচ্চ ৫,০০,০০০ টাকা)।';
      return '';
    }
    if (s === 3) {
      if (!isMessLike && form.bedrooms < 1) return 'বেডরুম সংখ্যা কমপক্ষে ১ হতে হবে।';
      if (isMessLike && !(form.totalRooms && form.totalRooms >= 1)) return 'মোট সিট/শয্যা সংখ্যা দিন।';
      return '';
    }
    if (s === 6) {
      if (form.title.trim().length < 8) return 'বিজ্ঞাপনের শিরোনাম অন্তত ৮ অক্ষর লিখুন।';
      if (form.description.trim().length < 20) return 'বিবরণ অন্তত ২০ অক্ষর লিখুন।';
      return '';
    }
    return '';
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = async (draft: boolean) => {
    const err = validateStep(7);
    if (err) {
      setError(err);
      setStep(7);
      return;
    }
    setSubmitting(true);
    setError('');
    setNotice('');
    const result = await onSubmit(form, draft);
    setSubmitting(false);
    if (!result.success) {
      if (result.error && result.error.includes('row-level security')) {
        setError('এই কর্মটি সম্পাদনের অনুমতি নেই। আপনার সেশন বা ভূমিকা যাচাই করুন।');
      } else {
        setError(result.error || 'জমা দিতে ব্যর্থ হয়েছে।');
      }
      return;
    }
    onDone(draft ? 'draft_saved' : isEditing ? 'updated' : 'created');
  };

  const fee = calculateToletFee(form.rentPrice, form.propertyType);

  const isLastStep = step === STEPS.length - 1;

  const previewListing: ToletListing = {
    id: initialListing?.id || 'preview',
    ownerId,
    ownerName,
    ownerVerified,
    title: form.title || 'শিরোনাম লিখুন',
    propertyType: form.propertyType,
    areaId: form.areaId,
    specificAddress: form.specificAddress,
    rentPrice: form.rentPrice,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    balconies: form.balconies,
    totalRooms: form.totalRooms,
    floor: form.floor,
    availableFrom: form.availableFrom,
    facilities: form.facilities,
    description: form.description,
    photos: form.photos,
    isVerified: false,
    status: 'pending_review',
    createdAt: '',
    updatedAt: '',
  };

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (i < step) setStep(i);
            }}
            className={cn(
              'shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors',
              i === step
                ? 'bg-emerald-800 text-white border-emerald-800'
                : i < step
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-white text-slate-500 border-slate-200'
            )}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold',
                i === step
                  ? 'bg-white/20'
                  : i < step
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-500'
              )}
            >
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 min-h-72">
        {/* STEP 1: TYPES */}
        {step === 0 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">বাসার ধরন নির্বাচন করুন</h3>
            <p className="text-xs text-slate-500 mb-4">প্রয়োজন অনুযায়ী সঠিক ধরন বেছে নিন।</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {(Object.keys(TOLET_PROPERTY_TYPE_INFO) as ToletPropertyType[]).map((pt) => {
                const info = TOLET_PROPERTY_TYPE_INFO[pt];
                const selected = form.propertyType === pt;
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => set('propertyType', pt)}
                    className={cn(
                      'p-4 rounded-2xl border text-center text-xs sm:text-sm font-semibold transition-all',
                      selected
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-700/50'
                    )}
                  >
                    {info.labelBn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: AREA & ADDRESS */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">এলাকা ও ঠিকানা</h3>
              <p className="text-xs text-slate-500 mb-4">ময়মনসিংহ সিটি কর্পোরেশনের এলাকা নির্বাচন করুন।</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">এলাকা *</label>
              <select
                value={form.areaId}
                onChange={(e) => set('areaId', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              >
                <option value="">এলাকা নির্বাচন করুন</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nameBn}
                    {a.wardNo ? ` (ওয়ার্ড ${a.wardNo})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">সুনির্দিষ্ট ঠিকানা *</label>
              <textarea
                rows={2}
                value={form.specificAddress}
                onChange={(e) => set('specificAddress', e.target.value)}
                placeholder="যেমন: চরপাড়া নাহার মেমোরিয়াল রোড, ময়মনসিংহ"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">তলা (ঐচ্ছিক)</label>
                <input
                  value={form.floor || ''}
                  onChange={(e) => set('floor', e.target.value)}
                  placeholder="যেমন: ৩য় তলা"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">প্রাপ্যতা (ঐচ্ছিক)</label>
                <input
                  value={form.availableFrom || ''}
                  onChange={(e) => set('availableFrom', e.target.value)}
                  placeholder="যেমন: আগামী মাস থেকে"
                  list="available-from-options"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
                <datalist id="available-from-options">
                  {AVAILABLE_FROM_OPTIONS.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RENT */}
        {step === 2 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">মাসিক ভাড়া নির্ধারণ</h3>
            <p className="text-xs text-slate-500 mb-4">স্বচ্ছ হিসাবে মূল ভাড়া + প্ল্যাটফর্ম ফি দেখানো হবে।</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">মাসিক ভাড়া (টাকা) *</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs text-slate-400">৳</span>
                <input
                  type="number"
                  min={100}
                  value={form.rentPrice || ''}
                  onChange={(e) => set('rentPrice', Number(e.target.value))}
                  placeholder="যেমন: 12000"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            {form.rentPrice >= 100 && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">মাসিক মূল ভাড়া</span>
                  <span className="font-bold text-slate-900">৳{form.rentPrice.toLocaleString('bn-BD')}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1.5">
                  <span className="text-slate-600">প্ল্যাটফর্ম ফি ({typeInfo?.labelBn})</span>
                  <span className="font-bold text-slate-900">+ ৳{fee}</span>
                </div>
                <div className="flex items-center justify-between font-bold border-t border-emerald-200 pt-2 mt-2 text-base">
                  <span className="text-slate-900">মোট প্রদেয়</span>
                  <span className="text-emerald-800">৳{(form.rentPrice + fee).toLocaleString('bn-BD')} /মাস</span>
                </div>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-500">{getToletFeeDescription()}।</p>
          </div>
        )}

        {/* STEP 4: HOME INFO */}
        {step === 3 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isMessLike ? 'সিট / শয্যা তথ্য' : 'বাসার তথ্য'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {isMessLike
                ? 'মেস/হোস্টেল/সিটের জন্য মোট সিট বা শয্যা সংখ্যা দিন।'
                : 'বেডরুম, বাথরুম ও বারান্দার সংখ্যা দিন।'}
            </p>
            <div className="space-y-3">
              {isMessLike ? (
                <NumberField
                  label="মোট সিট / শয্যা সংখ্যা"
                  value={form.totalRooms ?? 0}
                  onChange={(v) => set('totalRooms', v)}
                  min={1}
                  max={100}
                />
              ) : (
                <>
                  <NumberField label="বেডরুম" value={form.bedrooms} onChange={(v) => set('bedrooms', v)} min={1} max={10} />
                  <NumberField label="বাথরুম" value={form.bathrooms} onChange={(v) => set('bathrooms', v)} min={1} max={10} />
                  <NumberField label="বারান্দা" value={form.balconies} onChange={(v) => set('balconies', v)} min={0} max={5} />
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: FACILITIES */}
        {step === 4 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">সুবিধাসমূহ</h3>
            <p className="text-xs text-slate-500 mb-4">যেগুলো রয়েছে সেগুলো বেছে নিন।</p>
            <div className="grid grid-cols-2 gap-2.5">
              {TOLET_FACILITY_OPTIONS.map((fac) => {
                const selected = form.facilities.includes(fac.id);
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() =>
                      set(
                        'facilities',
                        selected
                          ? form.facilities.filter((f) => f !== fac.id)
                          : [...form.facilities, fac.id]
                      )
                    }
                    className={cn(
                      'p-3 rounded-xl text-xs font-medium border flex items-center justify-between gap-2 text-left transition-all',
                      selected
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-700 font-bold'
                        : 'bg-white text-slate-700 border-slate-200'
                    )}
                  >
                    <span>{fac.labelBn}</span>
                    {selected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 6: PHOTOS */}
        {step === 5 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">বাসার ছবি</h3>
            <PhotoUploader
              photos={form.photos}
              onChange={(photos) => set('photos', photos)}
              onUpload={onUploadFile}
            />
          </div>
        )}

        {/* STEP 7: TITLE & DESCRIPTION */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">শিরোনাম ও বিবরণ</h3>
              <p className="text-xs text-slate-500 mb-4">ভাড়াটিয়া যেন সহজে বুঝতে পারে সেরকম লিখুন।</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">বিজ্ঞাপনের শিরোনাম *</label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="যেমন: চরপাড়ায় আলো-বাতাসপূর্ণ ফ্যামিলি ফ্ল্যাট"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">অন্তত ৮ অক্ষর।</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">বিস্তারিত বিবরণ *</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="বাসার আকার, পরিবেশ, বিদ্যুৎ-পানি, যাতায়াত, পারিপার্শ্বিক সুবিধা ইত্যাদি উল্লেখ করুন..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">অন্তত ২০ অক্ষর।</p>
            </div>
          </div>
        )}

        {/* STEP 8: PREVIEW */}
        {step === 7 && (
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-1">প্রিভিউ</h3>
            <p className="text-xs text-slate-500 mb-4">পাবলিক পেজে যেমন দেখাবে। ঠিক আছে হলে পরের ধাপে।</p>
            <div className="max-w-sm mx-auto">
              <ToletListingCard listing={previewListing} />
            </div>
          </div>
        )}

        {/* STEP 9: SUBMIT */}
        {step === 8 && (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-800 mb-3">
              <Send className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">প্রকাশের জন্য জমা দিন</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {mode === 'admin'
                ? 'পরিবর্তনগুলো সংরক্ষণ করা হবে।'
                : alreadyPublished
                  ? 'এই বিজ্ঞাপনটি ইতিমধ্যে প্রকাশিত। পরিবর্তন সংরক্ষিত হবে।'
                  : 'আপনার বিজ্ঞাপনটি প্রথমে যাচাইয়ের জন্য পাঠানো হবে। অ্যাডমিন অনুমোদন দিলে তা সবার কাছে প্রকাশিত হবে।'}
            </p>
            {!alreadyPublished && !isEditing && mode === 'owner' && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs max-w-md mx-auto text-left">
                প্রকাশের পূর্বে বিজ্ঞাপনটি মোডারেশনের (যাচাই) মধ্যে থাকবে। প্রয়োজনে আপনি পরে এটি{' '}
                <span className="font-bold">মাই প্রপার্টিজ</span> থেকে সম্পাদনা বা আর্কাইভ করতে পারবেন।
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={goBack}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            আগের ধাপ
          </button>
        ) : (
          <span className="flex-1" />
        )}

        <div className="flex-1" />

        {!isLastStep && (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold"
          >
            পরের ধাপ
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {isLastStep && (
          <>
            {mode === 'owner' && !alreadyPublished && (
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                খসড়া হিসেবে সংরক্ষণ
              </button>
            )}
            <button
              type="button"
              onClick={() => submit(false)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold disabled:opacity-60 min-w-32 justify-center"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isEditing ? 'পরিবর্তন সংরক্ষণ করুন' : 'প্রকাশের জন্য জমা দিন'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}