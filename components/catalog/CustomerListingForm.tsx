'use client';

/**
 * CustomerListingForm — the owner-facing create/edit form for a coaching centre
 * or a WiFi provider.
 *
 * One component serves both categories because they share the same skeleton
 * (name, image, areas, address, contact number) and differ only in the numbers
 * each side cares about: a coaching centre quotes a monthly fee and admission
 * notes, a provider quotes price/speed with a connection fee and terms. The
 * category decides which block renders; nothing is invented for the other.
 *
 * It is deliberately a "listing-only" form. Teachers, batches and packages hang
 * off a listing that must exist first, so they are edited on the saved listing's
 * page (see OwnerCoachingSections / OwnerWifiSections). That split is why an
 * owner can update a batch date or a package offer any time without the form
 * trying to reconcile a diff.
 *
 * Mobile-first: every control is full width, tap targets are >= 44px, and the
 * area picker is a searchable checkbox list rather than a multi-select that
 * mobile browsers render badly.
 */
import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, Search, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getAllMCCAreas, getPopularMCCAreas, searchMCCAreas } from '@/lib/locations';
import {
  createCustomerServiceListing,
  normalizeBdPhone,
  updateCustomerServiceListing,
  uploadServiceListingImage,
} from '@/lib/catalog-service';
import {
  COACHING_CATEGORIES,
  COACHING_CLASSES,
  COACHING_SUBJECTS,
  toBn,
  type CustomerServiceCategory,
  type CustomerServiceListingInput,
  type ServiceListing,
} from '@/lib/catalog-types';

const inputClass =
  'min-h-11 w-full rounded-lg border border-brand-200 bg-white px-3 text-[14px] text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';
const textAreaClass =
  'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-[14px] leading-relaxed text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none';
const primaryBtn =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-[14px] font-extrabold text-white transition-colors hover:bg-brand-800 disabled:opacity-60 sm:w-auto';
const ghostBtn =
  'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-[14px] font-bold text-brand-700 transition-colors hover:bg-mist-50 disabled:opacity-60 sm:w-auto';

const CATEGORY_TITLE: Record<CustomerServiceCategory, string> = {
  coaching: 'কোচিং সেন্টার',
  wifi: 'WiFi / ইন্টারনেট প্রদানকারী',
};

interface FormState {
  titleBn: string;
  subtitleBn: string;
  summaryBn: string;
  descriptionBn: string;
  imageUrl: string;
  addressBn: string;
  areaIds: string[];
  contactPhonePublic: string;
  /** coaching */
  monthlyFeeMin: string;
  monthlyFeeMax: string;
  admissionInfoBn: string;
  /** wifi */
  priceMin: string;
  priceMax: string;
  speedMbps: string;
  connectionFee: string;
  termsBn: string;
  /** coaching taxonomy slugs */
  tags: string[];
  /** wifi free-form facilities, comma separated */
  facilitiesText: string;
}

function numToText(v?: number): string {
  return v == null ? '' : String(v);
}

function textToNum(v: string): number | undefined {
  const t = v.trim();
  if (t === '') return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function textToTags(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[,;\n]/)
        .map((t) => t.trim())
        .filter(Boolean)
    )
  );
}

function tagsToText(tags: string[]): string {
  return tags.join(', ');
}

function initialForm(category: CustomerServiceCategory, listing?: ServiceListing | null): FormState {
  return {
    titleBn: listing?.titleBn ?? '',
    subtitleBn: listing?.subtitleBn ?? '',
    summaryBn: listing?.summaryBn ?? '',
    descriptionBn: listing?.descriptionBn ?? '',
    imageUrl: listing?.imageUrl ?? '',
    addressBn: listing?.addressBn ?? '',
    areaIds: listing?.areaIds ?? [],
    contactPhonePublic: listing?.contactPhonePublic ?? '',
    monthlyFeeMin: numToText(listing?.monthlyFeeMin),
    monthlyFeeMax: numToText(listing?.monthlyFeeMax),
    admissionInfoBn: listing?.admissionInfoBn ?? '',
    priceMin: numToText(listing?.priceMin),
    priceMax: numToText(listing?.priceMax),
    speedMbps: numToText(listing?.speedMbps),
    connectionFee: numToText(listing?.connectionFee),
    termsBn: listing?.termsBn ?? '',
    tags: listing?.tags ?? [],
    facilitiesText: category === 'wifi' ? tagsToText(listing?.tags ?? []) : '',
  };
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[12.5px] font-bold text-ink-700">
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-400">{hint}</span>}
    </label>
  );
}

export interface CustomerListingFormProps {
  category: CustomerServiceCategory;
  /** Present when editing an existing owner listing. */
  initialListing?: ServiceListing | null;
  /**
   * Called after a successful save with the saved row (when the write returned
   * one) and the mode. The page decides whether to navigate to the edit page.
   */
  onSaved?: (listing: ServiceListing | undefined, mode: 'draft' | 'submit') => void;
}

export default function CustomerListingForm({
  category,
  initialListing,
  onSaved,
}: CustomerListingFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(() => initialForm(category, initialListing));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const submittingRef = useRef(false);

  const isEditing = Boolean(initialListing);
  const busy = submitting || uploading;

  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);
  const areaResults = useMemo(() => {
    const q = areaQuery.trim();
    if (!q) return getPopularMCCAreas().slice(0, 24);
    const hits = searchMCCAreas(q);
    return (hits.length > 0 ? hits : areas.filter((a) => a.nameBn.includes(q))).slice(0, 40);
  }, [areaQuery, areas]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setNotice('');
  };

  const toggleArea = (id: string) => {
    setForm((prev) => ({
      ...prev,
      areaIds: prev.areaIds.includes(id)
        ? prev.areaIds.filter((a) => a !== id)
        : [...prev.areaIds, id],
    }));
    setError('');
  };

  const toggleTag = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(id) ? prev.tags.filter((t) => t !== id) : [...prev.tags, id],
    }));
    setError('');
  };

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    if (!user) {
      setError('ছবি আপলোড করতে আগে লগইন করুন।');
      return;
    }
    setUploading(true);
    setError('');
    const result = await uploadServiceListingImage(user.id, file);
    setUploading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm((prev) => ({ ...prev, imageUrl: result.data }));
  };

  const buildInput = (): CustomerServiceListingInput => ({
    category,
    titleBn: form.titleBn.trim(),
    subtitleBn: form.subtitleBn.trim() || undefined,
    summaryBn: form.summaryBn.trim() || undefined,
    descriptionBn: form.descriptionBn.trim() || undefined,
    imageUrl: form.imageUrl.trim() || undefined,
    addressBn: form.addressBn.trim() || undefined,
    areaIds: form.areaIds,
    contactPhonePublic: form.contactPhonePublic.trim(),
    monthlyFeeMin: textToNum(form.monthlyFeeMin),
    monthlyFeeMax: textToNum(form.monthlyFeeMax),
    admissionInfoBn: form.admissionInfoBn.trim() || undefined,
    priceMin: textToNum(form.priceMin),
    priceMax: textToNum(form.priceMax),
    speedMbps: textToNum(form.speedMbps),
    connectionFee: textToNum(form.connectionFee),
    termsBn: form.termsBn.trim() || undefined,
    tags: category === 'coaching' ? form.tags : textToTags(form.facilitiesText),
  });

  const submit = async (mode: 'draft' | 'submit') => {
    if (submittingRef.current) return;
    if (!user) {
      setError('এই কাজটি করতে আগে লগইন করুন।');
      return;
    }

    // Client-side pre-checks mirroring the service layer, so the first problem
    // is pointed at rather than only returned as a banner.
    if (form.titleBn.trim().length < 2) {
      setError('প্রতিষ্ঠানের নাম লিখুন।');
      return;
    }
    if (mode === 'submit') {
      if (!normalizeBdPhone(form.contactPhonePublic)) {
        setError('সঠিক ১১-ডিজিটের মোবাইল নম্বর লিখুন (যেমন ০১৭xxxxxxxx)।');
        return;
      }
      if (form.areaIds.length === 0) {
        setError('অন্তত একটি এলাকা নির্বাচন করুন।');
        return;
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const input = buildInput();
      const result = isEditing && initialListing
        ? await updateCustomerServiceListing(initialListing.id, input, mode)
        : await createCustomerServiceListing(input, mode);
      if (!result.success) {
        setError(
          result.error.includes('row-level security')
            ? 'এই কাজটি সম্পাদনের অনুমতি নেই। আবার লগইন করে চেষ্টা করুন।'
            : result.error
        );
        return;
      }
      setNotice(
        mode === 'draft'
          ? 'খসড়া সংরক্ষণ হয়েছে।'
          : isEditing
            ? 'তথ্য হালনাগাদ হয়েছে। অনুমোদনের পর প্রকাশিত হবে।'
            : 'জমা দেওয়া হয়েছে। অনুমোদনের পর সবার জন্য প্রকাশিত হবে।'
      );
      onSaved?.(result.data, mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const selectedAreaNames = form.areaIds
    .map((id) => areas.find((a) => a.id === id)?.nameBn)
    .filter((n): n is string => Boolean(n));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
        <h1 className="text-base font-extrabold text-ink-900 sm:text-lg">
          {isEditing ? 'তথ্য সম্পাদনা' : 'নতুন যোগ করুন'} — {CATEGORY_TITLE[category]}
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          প্রতিষ্ঠানের তথ্য দিন। সংরক্ষণের পর শিক্ষক/ব্যাচ (কোচিং) বা প্যাকেজ (WiFi) যোগ
          করতে পারবেন। অ্যাডমিন অনুমোদনের পরই এটি সবার জন্য প্রকাশিত হবে।
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] font-semibold text-rose-800">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[13px] font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> {notice}
        </p>
      )}

      {/* Cover image */}
      <section className="rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
        <h2 className="text-[14px] font-extrabold text-ink-900">ছবি / লোগো</h2>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative h-32 w-full overflow-hidden rounded-xl border border-brand-100 bg-mist-50 sm:w-48">
            {form.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.imageUrl} alt="নির্বাচিত ছবি" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-400">
                <ImagePlus className="h-7 w-7" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className={`${ghostBtn} cursor-pointer`}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? 'আপলোড হচ্ছে…' : 'ছবি নির্বাচন করুন'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => void onPickImage(e.target.files?.[0])}
              />
            </label>
            {form.imageUrl && (
              <button type="button" onClick={() => set('imageUrl', '')} className={ghostBtn}>
                <X className="h-4 w-4" /> ছবি সরান
              </button>
            )}
            <p className="text-[11.5px] text-ink-400">সর্বোচ্চ ৫MB, JPG/PNG।</p>
          </div>
        </div>
      </section>

      {/* Basic info */}
      <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
        <h2 className="text-[14px] font-extrabold text-ink-900">প্রাথমিক তথ্য</h2>
        <Field label="প্রতিষ্ঠানের নাম" required>
          <input
            value={form.titleBn}
            onChange={(e) => set('titleBn', e.target.value)}
            className={inputClass}
            placeholder="যেমন: আল-ফুরকান কোচিং সেন্টার"
          />
        </Field>
        <Field label="সংক্ষিপ্ত পরিচিতি">
          <input
            value={form.subtitleBn}
            onChange={(e) => set('subtitleBn', e.target.value)}
            className={inputClass}
            placeholder="এক লাইনে প্রতিষ্ঠান সম্পর্কে"
          />
        </Field>
        <Field label="সারসংক্ষেপ">
          <textarea
            rows={2}
            value={form.summaryBn}
            onChange={(e) => set('summaryBn', e.target.value)}
            className={textAreaClass}
            placeholder="কার্ডে দেখানো ছোট বিবরণ"
          />
        </Field>
        <Field label="বিস্তারিত বর্ণনা">
          <textarea
            rows={4}
            value={form.descriptionBn}
            onChange={(e) => set('descriptionBn', e.target.value)}
            className={textAreaClass}
            placeholder="বিস্তারিত তথ্য। অনুচ্ছেদ আলাদা করতে ফাঁকা লাইন দিন।"
          />
        </Field>
      </section>

      {/* Location + contact */}
      <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
        <h2 className="text-[14px] font-extrabold text-ink-900">ঠিকানা ও যোগাযোগ</h2>
        <Field label="ঠিকানা">
          <input
            value={form.addressBn}
            onChange={(e) => set('addressBn', e.target.value)}
            className={inputClass}
            placeholder="যেমন: চরপাড়া মোড়, ময়মনসিংহ"
          />
        </Field>

        <div>
          <span className="mb-1 block text-[12.5px] font-bold text-ink-700">
            এলাকা <span className="text-rose-600">*</span>
          </span>
          {selectedAreaNames.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {form.areaIds.map((id) => {
                const name = areas.find((a) => a.id === id)?.nameBn ?? id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleArea(id)}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[11.5px] font-bold text-white"
                  >
                    {name}
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
            <input
              value={areaQuery}
              onChange={(e) => setAreaQuery(e.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="এলাকা খুঁজুন…"
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-brand-100 p-1">
            {areaResults.length === 0 ? (
              <p className="px-2 py-1.5 text-[12.5px] text-ink-500">কোনো এলাকা পাওয়া যায়নি।</p>
            ) : (
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {areaResults.map((area) => {
                  const checked = form.areaIds.includes(area.id);
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => toggleArea(area.id)}
                      aria-pressed={checked}
                      className={`min-h-9 rounded-md px-2 text-left text-[12px] font-semibold transition-colors ${
                        checked ? 'bg-brand-50 text-brand-800' : 'text-ink-600 hover:bg-mist-50'
                      }`}
                    >
                      {checked ? '✓ ' : ''}
                      {area.nameBn}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Field label="যোগাযোগের মোবাইল নম্বর" required hint="এই নম্বরেই পাঠকরা “কল করুন” চাপবেন।">
          <input
            type="tel"
            inputMode="tel"
            value={form.contactPhonePublic}
            onChange={(e) => set('contactPhonePublic', e.target.value)}
            className={inputClass}
            placeholder="01XXXXXXXXX"
          />
        </Field>
      </section>

      {/* Category-specific numbers */}
      {category === 'coaching' ? (
        <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
          <h2 className="text-[14px] font-extrabold text-ink-900">ফি ও ভর্তি তথ্য</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="মাসিক ফি (সর্বনিম্ন)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.monthlyFeeMin}
                onChange={(e) => set('monthlyFeeMin', e.target.value)}
                className={inputClass}
                placeholder="৫০০"
              />
            </Field>
            <Field label="মাসিক ফি (সর্বোচ্চ)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.monthlyFeeMax}
                onChange={(e) => set('monthlyFeeMax', e.target.value)}
                className={inputClass}
                placeholder="১৫০০"
              />
            </Field>
          </div>
          <Field label="ভর্তি ও ফি সংক্রান্ত তথ্য">
            <textarea
              rows={2}
              value={form.admissionInfoBn}
              onChange={(e) => set('admissionInfoBn', e.target.value)}
              className={textAreaClass}
              placeholder="যেমন: ভর্তি ফি ২০০ টাকা, মাসিক ফি ৮০০ টাকা"
            />
          </Field>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
          <h2 className="text-[14px] font-extrabold text-ink-900">দাম, স্পিড ও সংযোগ</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="মাসিক দাম (সর্বনিম্ন)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.priceMin}
                onChange={(e) => set('priceMin', e.target.value)}
                className={inputClass}
                placeholder="৫০০"
              />
            </Field>
            <Field label="মাসিক দাম (সর্বোচ্চ)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.priceMax}
                onChange={(e) => set('priceMax', e.target.value)}
                className={inputClass}
                placeholder="১০০০"
              />
            </Field>
            <Field label="স্পিড (Mbps)">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.speedMbps}
                onChange={(e) => set('speedMbps', e.target.value)}
                className={inputClass}
                placeholder="২০"
              />
            </Field>
            <Field label="সংযোগ ফি">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.connectionFee}
                onChange={(e) => set('connectionFee', e.target.value)}
                className={inputClass}
                placeholder="১০০০"
              />
            </Field>
          </div>
          <Field label="সংযোগের শর্ত">
            <textarea
              rows={2}
              value={form.termsBn}
              onChange={(e) => set('termsBn', e.target.value)}
              className={textAreaClass}
              placeholder="যেমন: ন্যূনতম ৬ মাসের চুক্তি"
            />
          </Field>
        </section>
      )}

      {/* Tags */}
      <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
        {category === 'coaching' ? (
          <>
            <h2 className="text-[14px] font-extrabold text-ink-900">ক্লাস, বিষয় ও ক্যাটাগরি</h2>
            <p className="text-[11.5px] leading-relaxed text-ink-400">
              প্রযোজ্য সবগুলো নির্বাচন করুন — এগুলো দিয়েই পাঠকরা ফিল্টার করেন।
            </p>
            {(
              [
                ['ক্লাস', COACHING_CLASSES],
                ['বিষয়', COACHING_SUBJECTS],
                ['ক্যাটাগরি', COACHING_CATEGORIES],
              ] as const
            ).map(([label, taxonomy]) => (
              <div key={label}>
                <span className="mb-1 block text-[12.5px] font-bold text-ink-700">{label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {taxonomy.map((t) => {
                    const checked = form.tags.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        aria-pressed={checked}
                        className={`min-h-9 rounded-full border px-3 text-[12px] font-semibold transition-colors ${
                          checked
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-brand-200 bg-white text-ink-600 hover:bg-mist-50'
                        }`}
                      >
                        {t.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <h2 className="text-[14px] font-extrabold text-ink-900">বিশেষ সুবিধা / ট্যাগ</h2>
            <Field label="সুবিধা" hint="কমা দিয়ে আলাদা করুন। যেমন: ফাইবার, ২৪/৭ সাপোর্ট">
              <input
                value={form.facilitiesText}
                onChange={(e) => set('facilitiesText', e.target.value)}
                className={inputClass}
                placeholder="ফাইবার, ২৪/৭ সাপোর্ট"
              />
            </Field>
          </>
        )}
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => void submit('submit')} disabled={busy} className={primaryBtn}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEditing ? 'হালনাগাদ করে জমা দিন' : 'অনুমোদনের জন্য জমা দিন'}
        </button>
        <button type="button" onClick={() => void submit('draft')} disabled={busy} className={ghostBtn}>
          খসড়া সংরক্ষণ করুন
        </button>
      </div>
      <p className="text-[11.5px] leading-relaxed text-ink-400">
        খসড়া শুধু আপনি দেখতে পাবেন। অনুমোদনের জন্য জমা দিলে অ্যাডমিন যাচাই করে প্রকাশ
        করবেন। {toBn(form.areaIds.length)}টি এলাকা নির্বাচিত।
      </p>
    </div>
  );
}
