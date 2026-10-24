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
 * Coaching batch schedules can be added alongside a new listing and are saved
 * as independent child rows after the parent exists. Saved schedules and WiFi
 * packages are managed on the listing's page.
 *
 * Mobile-first: every control is full width, tap targets are >= 44px, and the
 * area picker reuses the searchable MCC selector rather than a native multi-select.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, ImagePlus, Loader2, MapPin, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { MCC_AREA_SOURCE } from '@/lib/locations';
import {
  createOwnCoachingBatch,
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
  COACHING_SUBJECTS_BY_CATEGORY,
  COACHING_WEEKDAY_GROUPS,
  toBn,
  type CoachingWeekday,
  type CustomerServiceCategory,
  type CustomerServiceListingInput,
  type CoachingCategory,
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
  coachingCategory: CoachingCategory | '';
  /** wifi free-form facilities, comma separated */
  facilitiesText: string;
}

interface PendingBatch {
  key: string;
  batchYear: string;
  batchStatus: 'new' | 'old';
  startDate: string;
  weekdayIds: CoachingWeekday[];
  startTimeLocal: string;
  endTimeLocal: string;
  noteBn: string;
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

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
    imageUrl: listing?.imageUrl ?? listing?.logoUrl ?? '',
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
    coachingCategory: listing?.coachingCategory ?? '',
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
  const [selectedAreaId, setSelectedAreaId] = useState(initialListing?.areaIds[0] ?? '');
  const [pendingBatches, setPendingBatches] = useState<PendingBatch[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [currentListing, setCurrentListing] = useState(initialListing ?? null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [wifiPackagesLoading, setWifiPackagesLoading] = useState(category === 'wifi' && Boolean(initialListing));
  const [wifiPackagesReady, setWifiPackagesReady] = useState(category !== 'wifi' || !initialListing);
  const [wifiPackagesError, setWifiPackagesError] = useState('');
  const submittingRef = useRef(false);

  const [areaSearch, setAreaSearch] = useState('');
  const [areaOpen, setAreaOpen] = useState(false);
  const areaWrapperRef = useRef<HTMLDivElement>(null);
  const areaOptions = useMemo(() => {
    if (category !== 'coaching') return [];
    const q = areaSearch.trim().toLowerCase();
    if (!q) return MCC_AREA_SOURCE.all().slice(0, 12);
    return MCC_AREA_SOURCE.search(areaSearch).slice(0, 15);
  }, [areaSearch, category]);
  const selectedArea = useMemo(() => (selectedAreaId ? MCC_AREA_SOURCE.byId(selectedAreaId) : null), [selectedAreaId]);

  useEffect(() => {
    if (category !== 'coaching') return;
    const handleClick = (e: MouseEvent) => {
      if (areaWrapperRef.current && !areaWrapperRef.current.contains(e.target as Node)) {
        setAreaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [category]);

  const isEditing = Boolean(currentListing);
  const busy = submitting || uploading || wifiPackagesLoading;
  const requiresBatchYear = ['ssc', 'hsc', 'bba'].includes(form.coachingCategory);

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

  const changeCoachingCategory = (coachingCategory: CoachingCategory | '') => {
    setForm((prev) => {
      const subjectIds = new Set(COACHING_SUBJECTS.map((subject) => subject.id));
      const retainedTags = prev.tags.filter((tag) => !subjectIds.has(tag));
      return {
        ...prev,
        coachingCategory,
        tags: [
          ...retainedTags,
          ...(coachingCategory
            ? prev.tags.filter((tag) =>
                COACHING_SUBJECTS_BY_CATEGORY[coachingCategory].some((subject) => subject.id === tag)
              )
            : []),
        ],
      };
    });
    setError('');
  };

  const addCustomSubject = () => {
    const subject = customSubject.trim();
    if (!subject) return;
    if (form.tags.length >= 60) {
      setError('সর্বোচ্চ ৬০টি ক্লাস ও বিষয় যোগ করা যাবে।');
      return;
    }
    setForm((prev) => {
      const normalized = subject.toLocaleLowerCase();
      const isDuplicate = prev.tags.some((tag) =>
        tag.toLocaleLowerCase() === normalized ||
        COACHING_SUBJECTS.find((option) => option.id === tag)?.labelBn.toLocaleLowerCase() === normalized
      );
      return isDuplicate ? prev : { ...prev, tags: [...prev.tags, subject] };
    });
    setCustomSubject('');
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

  const onPickGalleryImage = async (file: File | undefined) => {
    if (!file) return;
    if (form.photos.length >= 4) {
      setError('প্রচ্ছদ ছবির বাইরে সর্বোচ্চ ৪টি ছবি যোগ করা যাবে।');
      return;
    }
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
      setForm((prev) => ({ ...prev, photos: [...prev.photos, result.data].slice(0, 4) }));
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
      coachingCategory: category === 'coaching' ? form.coachingCategory || undefined : undefined,
      titleBn: form.titleBn.trim(),
      subtitleBn: form.subtitleBn.trim() || undefined,
      summaryBn: currentListing?.summaryBn,
      descriptionBn: form.descriptionBn.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      photos: category === 'coaching' ? form.photos : currentListing?.photos,
      addressBn: form.addressBn.trim() || undefined,
      areaIds: category === 'coaching'
        ? selectedAreaId ? [selectedAreaId] : []
        : currentListing?.areaIds.length
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
    if (!form.imageUrl.trim()) {
      setError('প্রতিষ্ঠানের একটি ছবি যোগ করুন।');
      return;
    }
    if (category === 'coaching' && !form.coachingCategory) {
      setError('কোচিংয়ের শ্রেণি বা পরীক্ষার ক্যাটাগরি বেছে নিন।');
      return;
    }
    if (category === 'coaching' && !selectedAreaId) {
      setError('কোচিং সেন্টারের এলাকা বেছে নিন।');
      return;
    }
    if (
      mode === 'submit' &&
      category === 'coaching' &&
      !form.tags.some((tag) =>
        COACHING_SUBJECTS_BY_CATEGORY[form.coachingCategory as CoachingCategory]?.some(
          (subject) => subject.id === tag
        ) ||
        (!COACHING_SUBJECTS.some((subject) => subject.id === tag) &&
          !COACHING_CLASSES.some((item) => item.id === tag))
      )
    ) {
      setError('অন্তত একটি বিষয় নির্বাচন বা যোগ করুন।');
      return;
    }
    if (category === 'coaching' && !initialListing && pendingBatches.some((batch) =>
      !isValidDateInput(batch.startDate) ||
      batch.weekdayIds.length === 0 ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(batch.startTimeLocal) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(batch.endTimeLocal) ||
      batch.endTimeLocal <= batch.startTimeLocal ||
      (requiresBatchYear && !/^(202[7-9])$/.test(batch.batchYear)) ||
      (batch.batchStatus !== 'new' && batch.batchStatus !== 'old')
    )) {
      setError('প্রতিটি ব্যাচে প্রযোজ্য বছর, নতুন/পুরাতন অবস্থা, তারিখ, সপ্তাহের দিন এবং সঠিক সময় দিন।');
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
      if (category === 'coaching' && pendingBatches.length > 0) {
        const remaining: PendingBatch[] = [];
        for (let index = 0; index < pendingBatches.length; index += 1) {
          const batch = pendingBatches[index];
          const batchResult = await createOwnCoachingBatch(savedListing.id, {
            titleBn: 'নতুন ব্যাচ',
            batchYear: requiresBatchYear ? Number(batch.batchYear) : undefined,
            batchStatus: batch.batchStatus,
            startDate: batch.startDate,
            weekdayIds: batch.weekdayIds,
            startTimeLocal: batch.startTimeLocal,
            endTimeLocal: batch.endTimeLocal,
            noteBn: batch.noteBn,
            isActive: true,
          });
          if (!batchResult.success) {
            remaining.push(...pendingBatches.slice(index));
            setPendingBatches(remaining);
            setError(`তালিকা সংরক্ষিত হয়েছে, কিন্তু ব্যাচ সংরক্ষণ হয়নি: ${batchResult.error}`);
            return;
          }
        }
        setPendingBatches([]);
      }
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
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  e.currentTarget.value = '';
                  void onPickImage(file);
                }}
              />
            </label>
            {form.imageUrl && (
              <button type="button" onClick={() => set('imageUrl', '')} className={ghostBtn}>
                <X className="h-4 w-4" /> ছবি সরান
              </button>
            )}
            <p className="text-[11.5px] text-ink-400">একটি ছবি দিন; সর্বোচ্চ ৫MB, JPG/PNG/WebP/AVIF।</p>
          </div>
        </div>
        {category === 'coaching' && (
          <div className="mt-4 border-t border-brand-100 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[12.5px] font-bold text-ink-800">অতিরিক্ত ছবি</p>
                <p className="text-[11.5px] text-ink-400">প্রচ্ছদ ছবির পাশে সর্বোচ্চ ৪টি ছবি দেখানো হবে।</p>
              </div>
              <label className={`${ghostBtn} min-h-9 w-auto cursor-pointer px-3 text-[12px]`}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                ছবি যোগ করুন ({toBn(form.photos.length)}/৪)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  disabled={uploading || form.photos.length >= 4}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    void onPickGalleryImage(file);
                  }}
                />
              </label>
            </div>
            {form.photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {form.photos.map((photo, index) => (
                  <div key={`${photo}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-brand-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo} alt={`অতিরিক্ত ছবি ${toBn(index + 1)}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => set('photos', form.photos.filter((_, itemIndex) => itemIndex !== index))}
                      className="absolute right-1 top-1 inline-flex min-h-8 items-center gap-1 rounded-md bg-white/95 px-2 text-[11px] font-bold text-rose-700 shadow-sm"
                      aria-label={`অতিরিক্ত ছবি ${toBn(index + 1)} সরান`}
                    >
                      <X className="h-3.5 w-3.5" /> সরান
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
        {category === 'coaching' && (
          <Field label="কোচিং ক্যাটাগরি" required>
            <select
              required
              value={form.coachingCategory}
              onChange={(event) => changeCoachingCategory(event.target.value as CoachingCategory | '')}
              className={inputClass}
            >
              <option value="">ক্যাটাগরি বেছে নিন</option>
              {COACHING_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>{item.labelBn}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="সংক্ষিপ্ত পরিচিতি">
          <input
            value={form.subtitleBn}
            onChange={(e) => set('subtitleBn', e.target.value)}
            className={inputClass}
            placeholder="এক লাইনে প্রতিষ্ঠান সম্পর্কে"
          />
        </Field>
        <Field label="বিস্তারিত বর্ণনা (ঐচ্ছিক)">
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
        {category === 'coaching' && (
          <Field label="এলাকা নির্বাচন করুন" required>
            <input
              value={areaSearch || selectedArea?.nameBn || ''}
              onChange={(e) => {
                const val = e.target.value;
                setAreaSearch(val);
                const match = MCC_AREA_SOURCE.all().find(
                  (area) => area.nameBn.toLowerCase() === val.trim().toLowerCase()
                );
                setSelectedAreaId(match ? match.id : '');
              }}
              className={inputClass}
              placeholder="এলাকার নাম লিখুন"
              autoComplete="off"
            />
          </Field>
        )}
        <Field label="সম্পূর্ণ ঠিকানা" required hint="বাড়ি/প্রতিষ্ঠান, সড়ক, বিস্তারিত ঠিকানা লিখুন।">
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
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={0}
                  value={form.admissionFee === '0' ? '' : form.admissionFee}
                  onChange={(e) => set('admissionFee', e.target.value)}
                  disabled={form.admissionFee === '0'}
                  className={inputClass}
                  placeholder="ঐচ্ছিক"
                />
                <button
                  type="button"
                  onClick={() => set('admissionFee', form.admissionFee === '0' ? '' : '0')}
                  className={`min-h-11 px-4 rounded-lg border text-sm font-extrabold whitespace-nowrap transition-colors ${form.admissionFee === '0' ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}
                >
                  {form.admissionFee === '0' ? 'ভর্তি ফ্রি' : 'ফ্রি'}
                </button>
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  step={1}
                  min={0}
                  value={form.connectionFee === '0' ? '' : form.connectionFee}
                  onChange={(e) => set('connectionFee', e.target.value)}
                  disabled={form.connectionFee === '0'}
                  className={inputClass}
                  placeholder="১০০০"
                />
                <button
                  type="button"
                  onClick={() => set('connectionFee', form.connectionFee === '0' ? '' : '0')}
                  className={`min-h-11 px-4 rounded-lg border text-sm font-extrabold whitespace-nowrap transition-colors ${form.connectionFee === '0' ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'}`}
                >
                  {form.connectionFee === '0' ? 'সংযোগ ফ্রি' : 'ফ্রি'}
                </button>
              </div>
            </Field>
          </div>
          <Field label="সংযোগের শর্ত (ঐচ্ছিক)">
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
            <h2 className="text-[14px] font-extrabold text-ink-900">ক্লাস ও বিষয়</h2>
            <p className="text-[11.5px] leading-relaxed text-ink-400">
              প্রযোজ্য সবগুলো নির্বাচন করুন — এগুলো দিয়েই পাঠকরা ফিল্টার করেন।
            </p>
            <div>
              <span className="mb-1 block text-[12.5px] font-bold text-ink-700">ক্লাস</span>
              <div className="flex flex-wrap gap-1.5">
                {COACHING_CLASSES.map((item) => {
                  const checked = form.tags.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleTag(item.id)}
                      aria-pressed={checked}
                      className={`min-h-9 rounded-full border px-3 text-[12px] font-semibold transition-colors ${
                        checked
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-brand-200 bg-white text-ink-600 hover:bg-mist-50'
                      }`}
                    >
                      {item.labelBn}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="mb-1 block text-[12.5px] font-bold text-ink-700">বিষয়</span>
              {!form.coachingCategory ? (
                <p className="text-[12px] text-ink-400">আগে কোচিং ক্যাটাগরি নির্বাচন করুন।</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {COACHING_SUBJECTS_BY_CATEGORY[form.coachingCategory].map((item) => {
                    const checked = form.tags.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleTag(item.id)}
                        aria-pressed={checked}
                        className={`min-h-9 rounded-full border px-3 text-[12px] font-semibold transition-colors ${
                          checked
                            ? 'border-brand-700 bg-brand-700 text-white'
                            : 'border-brand-200 bg-white text-ink-600 hover:bg-mist-50'
                        }`}
                      >
                        {item.labelBn}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={customSubject}
                  maxLength={120}
                  onChange={(event) => setCustomSubject(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addCustomSubject();
                    }
                  }}
                  className={inputClass}
                  placeholder="অন্য বিষয় লিখুন"
                  aria-label="নতুন বিষয়"
                />
                <button type="button" onClick={addCustomSubject} className={ghostBtn}>
                  <Plus className="h-4 w-4" /> বিষয় যোগ করুন
                </button>
              </div>
              {form.tags.filter((tag) =>
                !COACHING_CLASSES.some((item) => item.id === tag) &&
                !COACHING_SUBJECTS_BY_CATEGORY[form.coachingCategory as CoachingCategory]?.some(
                  (item) => item.id === tag
                ) &&
                !COACHING_SUBJECTS.some((item) => item.id === tag)
              ).map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => toggleTag(subject)}
                  className="mt-2 mr-1 inline-flex min-h-8 items-center gap-1 rounded-full border border-brand-300 bg-brand-50 px-3 text-[12px] font-semibold text-brand-800"
                  aria-label={`${subject} সরান`}
                >
                  {subject}<X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
            </div>
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

      {category === 'coaching' && !initialListing && (
        <section className="space-y-3 rounded-2xl border border-brand-100 bg-white p-3.5 sm:p-5">
          <div>
            <h2 className="text-[14px] font-extrabold text-ink-900">নতুন ব্যাচের সময়সূচি</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-ink-400">
              প্রতিটি ব্যাচ আলাদাভাবে যোগ করুন। তারিখ, সপ্তাহের দিন এবং শুরু ও শেষের সময় দিন। নতুন ব্যাচ শুরু হলে এখানে এসে আপডেট করতে পারবেন।
            </p>
          </div>
          {pendingBatches.map((batch, index) => (
            <div key={batch.key} className="space-y-3 rounded-xl border border-brand-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-extrabold text-ink-800">ব্যাচ {toBn(index + 1)}</p>
                <button
                  type="button"
                  onClick={() => setPendingBatches((rows) => rows.filter((row) => row.key !== batch.key))}
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-brand-200 px-2 text-[12px] font-bold text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" /> সরান
                </button>
              </div>
              {requiresBatchYear && (
                <Field label="ব্যাচের বছর" required>
                  <select
                    value={batch.batchYear}
                    onChange={(event) => setPendingBatches((rows) => rows.map((row) =>
                      row.key === batch.key ? { ...row, batchYear: event.target.value } : row
                    ))}
                    className={inputClass}
                  >
                    <option value="">বছর নির্বাচন করুন</option>
                    {[2027, 2028, 2029].map((year) => (
                      <option key={year} value={year}>{toBn(year)}</option>
                    ))}
                  </select>
                </Field>
              )}
              <div>
                <span className="mb-1 block text-[12.5px] font-bold text-ink-700">ব্যাচের ধরন *</span>
                <div className="flex gap-2">
                  {([
                    ['new', 'নতুন ব্যাচ'],
                    ['old', 'পুরাতন ব্যাচ'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={batch.batchStatus === value}
                      onClick={() => setPendingBatches((rows) => rows.map((row) =>
                        row.key === batch.key ? { ...row, batchStatus: value } : row
                      ))}
                      className={`min-h-10 rounded-lg border px-3 text-[12px] font-bold ${
                        batch.batchStatus === value
                          ? 'border-brand-700 bg-brand-700 text-white'
                          : 'border-brand-200 bg-white text-brand-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="শুরুর তারিখ" required>
                  <input
                    type="date"
                    value={batch.startDate}
                    onChange={(event) => setPendingBatches((rows) => rows.map((row) =>
                      row.key === batch.key ? { ...row, startDate: event.target.value } : row
                    ))}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div>
                <span className="mb-1 block text-[12.5px] font-bold text-ink-700">সপ্তাহের দিন *</span>
                <div className="flex flex-wrap gap-1.5">
                  {COACHING_WEEKDAY_GROUPS.map((group) => {
                    const selected = group.weekdayIds.every((day) => batch.weekdayIds.includes(day)) &&
                      batch.weekdayIds.length === group.weekdayIds.length;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setPendingBatches((rows) => rows.map((row) =>
                          row.key === batch.key
                            ? { ...row, weekdayIds: selected ? [] : group.weekdayIds }
                            : row
                        ))}
                        className={`min-h-9 rounded-full border px-3 text-[12px] font-semibold ${
                          selected ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-200 bg-white text-ink-600'
                        }`}
                      >
                        {group.labelBn}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="শুরুর সময়" required>
                  <input
                    type="time"
                    value={batch.startTimeLocal}
                    onChange={(event) => setPendingBatches((rows) => rows.map((row) =>
                      row.key === batch.key ? { ...row, startTimeLocal: event.target.value } : row
                    ))}
                    className={inputClass}
                  />
                </Field>
                <Field label="শেষের সময়" required>
                  <input
                    type="time"
                    value={batch.endTimeLocal}
                    onChange={(event) => setPendingBatches((rows) => rows.map((row) =>
                      row.key === batch.key ? { ...row, endTimeLocal: event.target.value } : row
                    ))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPendingBatches((rows) => [...rows, {
              key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              batchYear: '',
              batchStatus: 'new',
              startDate: '',
              weekdayIds: [],
              startTimeLocal: '',
              endTimeLocal: '',
              noteBn: '',
            }])}
            className={ghostBtn}
          >
            <Plus className="h-4 w-4" /> ব্যাচ যোগ করুন
          </button>
        </section>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={() => void submit('submit')} disabled={busy} className={primaryBtn}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          জমা দিন
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
