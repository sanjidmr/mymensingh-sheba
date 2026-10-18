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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  createCustomerServiceListing,
  fetchOwnWifiPackages,
  normalizeBdPhone,
  saveOwnWifiPricingPackages,
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
  descriptionBn: string;
  imageUrl: string;
  photos: string[];
  addressBn: string;
  contactPhonePublic: string;
  /** coaching */
  monthlyFee: string;
  admissionFee: string;
  /** wifi */
  wifiPricingRows: { id?: string; speedMbps: string; price: string }[];
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
  return Number.isFinite(n) ? n : Number.NaN;
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

function emptyWifiPricingRow() {
  return { speedMbps: '', price: '' };
}

function initialForm(category: CustomerServiceCategory, listing?: ServiceListing | null): FormState {
  return {
    titleBn: listing?.titleBn ?? '',
    subtitleBn: listing?.subtitleBn ?? '',
    descriptionBn: listing?.descriptionBn ?? '',
    imageUrl: listing?.imageUrl ?? '',
    photos: listing?.photos ?? [],
    addressBn: listing?.addressBn ?? '',
    contactPhonePublic: listing?.contactPhonePublic ?? '',
    monthlyFee:
      listing?.monthlyFeeMin === listing?.monthlyFeeMax
        ? numToText(listing?.monthlyFeeMin)
        : '',
    admissionFee: numToText(listing?.admissionFee),
    wifiPricingRows: category === 'wifi' ? [emptyWifiPricingRow()] : [],
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
  const [currentListing, setCurrentListing] = useState(initialListing ?? null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [wifiPackagesLoading, setWifiPackagesLoading] = useState(category === 'wifi' && Boolean(initialListing));
  const [wifiPackagesReady, setWifiPackagesReady] = useState(category !== 'wifi' || !initialListing);
  const [wifiPackagesError, setWifiPackagesError] = useState('');
  const submittingRef = useRef(false);

  const isEditing = Boolean(currentListing);
  const busy = submitting || uploading || wifiPackagesLoading;

  const loadWifiPackages = useCallback(async () => {
    if (category !== 'wifi' || !initialListing) return;
    setWifiPackagesLoading(true);
    setWifiPackagesError('');
    try {
      const packages = await fetchOwnWifiPackages(initialListing.id, true);
      setForm((prev) => ({
        ...prev,
        wifiPricingRows: packages.length > 0
          ? packages.map((item) => ({
              id: item.id,
              speedMbps: numToText(item.speedMbps),
              price: numToText(item.price),
            }))
          : [],
      }));
      setWifiPackagesReady(true);
    } catch (cause) {
      setWifiPackagesError(cause instanceof Error ? cause.message : 'WiFi প্যাকেজ লোড করা যায়নি।');
      setWifiPackagesReady(false);
    } finally {
      setWifiPackagesLoading(false);
    }
  }, [category, initialListing]);

  useEffect(() => {
    if (category !== 'wifi' || !initialListing) return;
    let active = true;
    void (async () => {
      try {
        const packages = await fetchOwnWifiPackages(initialListing.id, true);
        if (!active) return;
        setForm((prev) => ({
          ...prev,
          wifiPricingRows: packages.map((item) => ({
            id: item.id,
            speedMbps: numToText(item.speedMbps),
            price: numToText(item.price),
          })),
        }));
        setWifiPackagesReady(true);
      } catch (cause) {
        if (active) {
          setWifiPackagesError(cause instanceof Error ? cause.message : 'WiFi প্যাকেজ লোড করা যায়নি।');
          setWifiPackagesReady(false);
        }
      } finally {
        if (active) setWifiPackagesLoading(false);
      }
    })();
    return () => { active = false; };
  }, [category, initialListing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
    setNotice('');
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
    try {
      const result = await uploadServiceListingImage(user.id, file);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setForm((prev) => ({ ...prev, imageUrl: result.data }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const onPickGallery = async (files: File[]) => {
    if (!user) {
      setError('ছবি আপলোড করতে আগে লগইন করুন।');
      return;
    }
    const remaining = 5 - form.photos.length;
    if (remaining <= 0) {
      setError('সর্বোচ্চ ৫টি অতিরিক্ত ছবি যোগ করা যাবে।');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, remaining)) {
        const result = await uploadServiceListingImage(user.id, file);
        if (!result.success) {
          setError(result.error);
          break;
        }
        uploaded.push(result.data);
      }
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded] }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setUploading(false);
    }
  };

  const parseWifiPricingRows = () => {
    const rows: { id?: string; speedMbps: number; price: number }[] = [];
    for (const row of form.wifiPricingRows) {
      const speedText = row.speedMbps.trim();
      const priceText = row.price.trim();
      if (!speedText && !priceText) continue;
      const speedMbps = Number(speedText);
      const price = Number(priceText);
      if (
        !speedText || !priceText ||
        !Number.isInteger(speedMbps) || speedMbps < 1 || speedMbps > 100_000 ||
        !Number.isInteger(price) || price < 0 || price > 100_000_000
      ) return null;
      rows.push({ id: row.id, speedMbps, price });
    }
    return rows;
  };

  const buildInput = (
    wifiPricingRows: { id?: string; speedMbps: number; price: number }[]
  ): CustomerServiceListingInput => {
    const monthlyFee = textToNum(form.monthlyFee);
    const prices = wifiPricingRows.map((row) => row.price);
    return {
      category,
      titleBn: form.titleBn.trim(),
      subtitleBn: form.subtitleBn.trim() || undefined,
      summaryBn: currentListing?.summaryBn,
      descriptionBn: form.descriptionBn.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      photos: form.photos,
      addressBn: form.addressBn.trim() || undefined,
      areaIds: currentListing?.areaIds.length
        ? currentListing.areaIds
        : user?.primaryAreaId ? [user.primaryAreaId] : [],
      contactPhonePublic: form.contactPhonePublic.trim(),
      monthlyFeeMin: category === 'coaching' ? monthlyFee ?? currentListing?.monthlyFeeMin : undefined,
      monthlyFeeMax: category === 'coaching' ? monthlyFee ?? currentListing?.monthlyFeeMax : undefined,
      admissionInfoBn: currentListing?.admissionInfoBn,
      admissionFee: category === 'coaching'
        ? textToNum(form.admissionFee)
        : undefined,
      priceMin: category === 'wifi'
        ? prices.length ? Math.min(...prices) : currentListing?.priceMin
        : undefined,
      priceMax: category === 'wifi'
        ? prices.length ? Math.max(...prices) : currentListing?.priceMax
        : undefined,
      speedMbps: category === 'wifi'
        ? wifiPricingRows.length
          ? Math.max(...wifiPricingRows.map((row) => row.speedMbps))
          : currentListing?.speedMbps
        : undefined,
      connectionFee: textToNum(form.connectionFee),
      termsBn: form.termsBn.trim() || undefined,
      tags: category === 'coaching' ? form.tags : textToTags(form.facilitiesText),
    };
  };

  const submit = async (mode: 'draft' | 'submit') => {
    if (submittingRef.current) return;
    if (!user) {
      setError('এই কাজটি করতে আগে লগইন করুন।');
      return;
    }
    if (category === 'wifi' && !wifiPackagesReady) {
      setError('আগের WiFi প্যাকেজ লোড না হওয়া পর্যন্ত সংরক্ষণ করা যাবে না।');
      return;
    }

    // Client-side pre-checks mirroring the service layer, so the first problem
    // is pointed at rather than only returned as a banner.
    if (form.titleBn.trim().length < 2) {
      setError('প্রতিষ্ঠানের নাম লিখুন।');
      return;
    }
    if (!form.addressBn.trim()) {
      setError('প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা লিখুন।');
      return;
    }
    const wifiPricingRows = category === 'wifi' ? parseWifiPricingRows() : [];
    if (wifiPricingRows === null) {
      setError('প্রতিটি WiFi প্যাকেজে সঠিক Mbps স্পিড ও মাসিক দাম লিখুন।');
      return;
    }
    if (mode === 'submit' && category === 'wifi' && wifiPricingRows.length === 0) {
      setError('অন্তত একটি WiFi স্পিড ও দামের প্যাকেজ যোগ করুন।');
      return;
    }
    if (mode === 'submit' && category === 'coaching' && textToNum(form.monthlyFee) == null) {
      setError('মাসিক ফি লিখুন।');
      return;
    }
    if (mode === 'submit') {
      if (!normalizeBdPhone(form.contactPhonePublic)) {
        setError('সঠিক ১১-ডিজিটের মোবাইল নম্বর লিখুন (যেমন ০১৭xxxxxxxx)।');
        return;
      }
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    setNotice('');
    try {
      const input = buildInput(wifiPricingRows);
      const result = isEditing && currentListing
        ? await updateCustomerServiceListing(currentListing.id, input, mode)
        : await createCustomerServiceListing(input, mode);
      if (!result.success) {
        setError(
          result.error.includes('row-level security')
            ? 'এই কাজটি সম্পাদনের অনুমতি নেই। আবার লগইন করে চেষ্টা করুন।'
            : result.error
        );
        return;
      }
      const savedListing = result.data ?? currentListing;
      if (!savedListing) {
        setError('তথ্য সংরক্ষিত হয়েছে, কিন্তু তালিকার আইডি পাওয়া যায়নি। আবার তালিকা দেখুন।');
        return;
      }
      setCurrentListing(savedListing);
      if (category === 'wifi') {
        const packageResult = await saveOwnWifiPricingPackages(savedListing.id, wifiPricingRows);
        if (!packageResult.success) {
          setError(`প্রতিষ্ঠানের তথ্য সংরক্ষিত হয়েছে, কিন্তু WiFi প্যাকেজ সংরক্ষণ হয়নি: ${packageResult.error}`);
          return;
        }
        setForm((prev) => ({
          ...prev,
          wifiPricingRows: packageResult.data.map((item) => ({
            id: item.id,
            speedMbps: numToText(item.speedMbps),
            price: numToText(item.price),
          })),
        }));
      }
      setNotice(
        mode === 'draft'
          ? 'জমা দেওয়া হয়নি হিসেবে সংরক্ষণ হয়েছে।'
          : isEditing
            ? 'তথ্য হালনাগাদ হয়েছে। অনুমোদনের পর প্রকাশিত হবে।'
            : 'জমা দেওয়া হয়েছে। অনুমোদনের পর সবার জন্য প্রকাশিত হবে।'
      );
      onSaved?.(savedListing, mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
        <h1 className="text-base font-extrabold text-ink-900 sm:text-lg">
          {isEditing ? 'তথ্য সম্পাদনা' : 'নতুন যোগ করুন'} — {CATEGORY_TITLE[category]}
        </h1>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা, ফি এবং প্রযোজ্য সেবা-তথ্য দিন। অ্যাডমিন অনুমোদনের পরই
          তালিকাটি সবার জন্য প্রকাশিত হবে।
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
        <div className="mt-3">
          <p className="text-xs font-bold text-ink-700">আরও ছবি (সর্বোচ্চ ৫টি)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.photos.map((url, index) => (
              <div key={`${url}-${index}`} className="relative h-20 w-24 overflow-hidden rounded-lg border border-brand-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`অতিরিক্ত ছবি ${index + 1}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => set('photos', form.photos.filter((_, i) => i !== index))} className="absolute right-1 top-1 rounded bg-white px-1 text-xs font-bold text-rose-700" aria-label={`অতিরিক্ত ছবি ${index + 1} সরান`}>×</button>
              </div>
            ))}
            {form.photos.length < 5 && (
              <label className={`${ghostBtn} cursor-pointer`}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                আরও ছবি
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" disabled={uploading} onChange={(event) => { const files = Array.from(event.target.files ?? []); event.target.value = ''; void onPickGallery(files); }} />
              </label>
            )}
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
        <Field label="সম্পূর্ণ ঠিকানা" required hint="বাড়ি/প্রতিষ্ঠান, সড়ক, এলাকা ও প্রয়োজনীয় পরিচিতিসহ ঠিকানা লিখুন।">
          <textarea
            rows={3}
            maxLength={400}
            required
            value={form.addressBn}
            onChange={(e) => set('addressBn', e.target.value)}
            className={textAreaClass}
            placeholder="যেমন: বাড়ি ১২, ৩য় তলা, চরপাড়া মোড়, ময়মনসিংহ"
          />
        </Field>

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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="মাসিক ফি (টাকা)" required>
              <input
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                required
                value={form.monthlyFee}
                onChange={(e) => set('monthlyFee', e.target.value)}
                className={inputClass}
                placeholder="৮০০"
              />
            </Field>
            <Field label="ভর্তি ফি (টাকা)" hint="ভর্তি ফি না থাকলে ফাঁকা রাখুন।">
              <input
                type="number"
                inputMode="numeric"
                step={1}
                min={0}
                value={form.admissionFee}
                onChange={(e) => set('admissionFee', e.target.value)}
                className={inputClass}
                placeholder="ঐচ্ছিক"
              />
            </Field>
          </div>
        </section>
      ) : (
        <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
          <h2 className="text-[14px] font-extrabold text-ink-900">দাম, স্পিড ও সংযোগ</h2>
          {wifiPackagesLoading && <p className="text-sm text-ink-500">আগের প্যাকেজ লোড হচ্ছে…</p>}
          {wifiPackagesError && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              <p>{wifiPackagesError}</p>
              <button type="button" onClick={() => void loadWifiPackages()} className="mt-2 min-h-10 font-bold underline">
                প্যাকেজ আবার লোড করুন
              </button>
            </div>
          )}
          <div className="space-y-2">
            {form.wifiPricingRows.map((row, index) => (
              <div key={row.id ?? `new-${index}`} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-lg border border-brand-100 p-2">
                <Field label={`স্পিড (Mbps) · প্যাকেজ ${toBn(index + 1)}`}>
                  <input
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={1}
                    max={100000}
                    value={row.speedMbps}
                    onChange={(event) => set('wifiPricingRows', form.wifiPricingRows.map((item, i) =>
                      i === index ? { ...item, speedMbps: event.target.value } : item
                    ))}
                    className={inputClass}
                    placeholder="২০"
                  />
                </Field>
                <Field label="মাসিক দাম (টাকা)">
                  <input
                    type="number"
                    inputMode="numeric"
                    step={1}
                    min={0}
                    value={row.price}
                    onChange={(event) => set('wifiPricingRows', form.wifiPricingRows.map((item, i) =>
                      i === index ? { ...item, price: event.target.value } : item
                    ))}
                    className={inputClass}
                    placeholder="৮০০"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => set('wifiPricingRows', form.wifiPricingRows.filter((_, i) => i !== index))}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-rose-200 text-rose-700"
                  aria-label={`প্যাকেজ ${toBn(index + 1)} সরান`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={form.wifiPricingRows.length >= 30}
            onClick={() => set('wifiPricingRows', [...form.wifiPricingRows, emptyWifiPricingRow()])}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 px-3 text-sm font-bold text-brand-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {form.wifiPricingRows.length >= 30 ? 'সর্বোচ্চ ৩০টি প্যাকেজ' : 'আরও প্যাকেজ যোগ করুন'}
          </button>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="সংযোগ ফি">
              <input
                type="number"
                inputMode="numeric"
                step={1}
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
          জমা দেওয়া হয়নি হিসেবে সংরক্ষণ করুন
        </button>
      </div>
      <p className="text-[11.5px] leading-relaxed text-ink-400">
        জমা দেওয়া হয়নি অবস্থায় এটি শুধু আপনি দেখতে পাবেন। অনুমোদনের জন্য জমা দিলে অ্যাডমিন যাচাই করে প্রকাশ
        করবেন।
      </p>
    </div>
  );
}
