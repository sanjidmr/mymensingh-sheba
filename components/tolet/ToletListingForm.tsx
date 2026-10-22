'use client';

import React, { useRef, useState } from 'react';
import { AlertTriangle, Loader2, Save, Send } from 'lucide-react';
import { TOLET_AREA_SOURCE } from '@/lib/tolet-areas';
import LocationSelectInput from '@/components/LocationSelectInput';
import { TOLET_FACILITY_OPTIONS } from '@/lib/filter-definitions';
import {
  TOLET_PROPERTY_TYPE_INFO,
  type ToletListing,
  type ToletListingInput,
  type ToletPropertyType,
} from '@/lib/tolet-types';
import { PhotoUploader } from '@/components/tolet/PhotoUploader';
import { cn } from '@/lib/utils';

/**
 * One-page To-Let listing form.
 *
 * Design intent
 * -------------
 * Posting a rental ad used to be a nine-step wizard, which made owners click
 * "next" eight times before they could publish. The whole listing is a short,
 * flat set of facts, so it is presented as a single continuous form: title →
 * description → photos → type → area/address → floor & start month → rent →
 * room counts → available facilities → missing facilities → publish.
 *
 * Everything else is deliberately unchanged: Supabase is called through the
 * same service layer, photos go to the same bucket, new listings still land in
 * `pending_review`, and the platform-fee engine is untouched. The owner is
 * never shown a fee, a fee tier, or a commission — they only type the rent.
 */

/** Every field the form can raise a validation error on. */
type FieldKey = keyof FormState;

interface FormState {
  title: string;
  description: string;
  photos: string[];
  propertyType: ToletPropertyType;
  areaId: string;
  specificAddress: string;
  floor: string;
  availableFrom: string;
  rentPrice: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  hasDrawingRoom: boolean;
  hasDiningRoom: boolean;
  totalRooms?: number;
  facilitiesText: string;
  unavailableFacilitiesText: string;
}

const defaultForm: FormState = {
  title: '',
  description: '',
  photos: [],
  propertyType: 'family',
  areaId: '',
  specificAddress: '',
  floor: '',
  availableFrom: '',
  rentPrice: 0,
  bedrooms: 1,
  bathrooms: 1,
  balconies: 0,
  hasDrawingRoom: false,
  hasDiningRoom: false,
  totalRooms: undefined,
  facilitiesText: '',
  unavailableFacilitiesText: '',
};

const AVAILABLE_FROM_OPTIONS = [
  'তাৎক্ষণিক সম্ভব',
  'চলতি মাস থেকে',
  'আগামী মাস থেকে',
  '১লা অক্টোবর থেকে',
  '১লা নভেম্বর থেকে',
];

// ---------------------------------------------------------------------------
// Facilities: free text on screen, tokens in the database
// ---------------------------------------------------------------------------
//
// The owner writes plain sentences, but `tolet_listings.facilities` is a
// `TEXT[]` and the public directory filters on it. A token that exactly matches
// a known facility label (or id) is therefore stored as its canonical id — so
// directory filters keep working — while anything the directory has never heard
// of is stored verbatim and simply rendered as written. Existing listings that
// already hold ids are shown back to the owner as readable Bangla labels.

const FACILITY_LABEL_BY_ID = new Map<string, string>();
const FACILITY_ID_BY_KEY = new Map<string, string>();

/** Normalises a token for duplicate detection and known-label lookup. */
function facilityKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

for (const option of TOLET_FACILITY_OPTIONS) {
  FACILITY_LABEL_BY_ID.set(option.id, option.labelBn);
  FACILITY_ID_BY_KEY.set(facilityKey(option.labelBn), option.id);
  FACILITY_ID_BY_KEY.set(facilityKey(option.id), option.id);
}

/** Stored token array → textarea text. Known ids become their Bangla label. */
function facilitiesToText(items?: string[]): string {
  if (!items || items.length === 0) return '';
  return items
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .map((item) => FACILITY_LABEL_BY_ID.get(item) ?? item)
    .join('\n');
}

/** Textarea text → stored token array. Comma, semicolon or newline separated. */
function textToFacilities(text: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/[\n,;،，]+/)) {
    const token = raw.trim().replace(/\s+/g, ' ');
    if (!token) continue;
    const value = FACILITY_ID_BY_KEY.get(facilityKey(token)) ?? token;
    const dedupe = value.toLowerCase();
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push(value);
    if (out.length >= 40) break;
  }
  return out;
}

function fromListing(listing: ToletListing): FormState {
  return {
    title: listing.title,
    description: listing.description,
    photos: listing.photos,
    propertyType: listing.propertyType,
    areaId: listing.areaId,
    specificAddress: listing.specificAddress,
    floor: listing.floor || '',
    availableFrom: listing.availableFrom || '',
    rentPrice: listing.rentPrice,
    bedrooms: listing.bedrooms || 1,
    bathrooms: listing.bathrooms || 1,
    balconies: listing.balconies || 0,
    hasDrawingRoom: listing.hasDrawingRoom ?? false,
    hasDiningRoom: listing.hasDiningRoom ?? false,
    totalRooms: listing.totalRooms,
    facilitiesText: facilitiesToText(listing.facilities),
    unavailableFacilitiesText: facilitiesToText(listing.unavailableFacilities),
  };
}

/** Shared input styling: full-width, touch-friendly, small readable type. */
function controlClass(invalid?: boolean): string {
  return cn(
    'w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-700/15',
    invalid ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  group,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** True when the field wraps several controls instead of one labelled input. */
  group?: boolean;
  children: React.ReactNode;
}) {
  const labelClass = 'mb-1.5 block text-[13px] font-semibold text-slate-800';
  const labelContent = (
    <>
      {label}
      {required && (
        <span className="ml-0.5 text-rose-500" aria-hidden="true">
          *
        </span>
      )}
    </>
  );

  return (
    <div id={`tolet-field-${id}`} {...(group ? { role: 'group', 'aria-label': label } : {})}>
      {group ? (
        <span className={labelClass}>{labelContent}</span>
      ) : (
        <label htmlFor={`tolet-${id}`} className={labelClass}>
          {labelContent}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div
      id={`tolet-field-${id}`}
      className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5"
    >
      <span className="text-[13px] font-semibold text-slate-700">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`${label} কমান`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-slate-700 transition-colors active:scale-95 disabled:opacity-40"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-bold tabular-nums text-slate-900">{value}</span>
        <button
          type="button"
          aria-label={`${label} বাড়ান`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lg font-bold text-emerald-800 transition-colors active:scale-95 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export interface ToletListingFormProps {
  mode: 'owner' | 'admin';
  initialListing?: ToletListing;
  onUploadFile: (file: File) => Promise<string>;
  onSubmit: (
    input: ToletListingInput,
    draft: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  onDone: (action: 'created' | 'updated' | 'draft_saved') => void;
}

export function ToletListingForm({
  mode,
  initialListing,
  onUploadFile,
  onSubmit,
  onDone,
}: ToletListingFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    initialListing ? fromListing(initialListing) : { ...defaultForm }
  );
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  // A ref, not the state flag: two clicks in the same tick both read the old
  // state, and only the ref closes that window.
  const submittingRef = useRef(false);

  const typeInfo = TOLET_PROPERTY_TYPE_INFO[form.propertyType];
  const isMessLike = typeInfo?.isMessLike ?? false;
  const isEditing = Boolean(initialListing);
  const alreadyPublished = initialListing?.status === 'approved';
  const busy = submitting || uploadingPhotos;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError('');
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /** First blocking problem, checked in the same order the fields are shown. */
  const validate = (forDraft: boolean): { field: FieldKey; message: string } | null => {
    if (form.title.trim().length < 8) {
      return { field: 'title', message: 'বিজ্ঞাপনের শিরোনাম অন্তত ৮ অক্ষর লিখুন।' };
    }
    // A draft only needs to be identifiable; the rest can wait.
    if (forDraft) return null;
    if (!form.areaId) return { field: 'areaId', message: 'এলাকা নির্বাচন করুন।' };
    if (form.specificAddress.trim().length < 5) {
      return { field: 'specificAddress', message: 'সুনির্দিষ্ট ঠিকানা অন্তত ৫ অক্ষর লিখুন।' };
    }
    const rent = Number(form.rentPrice) || 0;
    if (rent < 100) {
      return { field: 'rentPrice', message: 'মাসিক ভাড়া ১০০ টাকার কম হতে পারবে না।' };
    }
    if (rent > 500000) {
      return { field: 'rentPrice', message: 'ভাড়া খুব বেশি মনে হচ্ছে (সর্বোচ্চ ৫,০০,০০০ টাকা)।' };
    }
    if (isMessLike) {
      if (!(form.totalRooms && form.totalRooms >= 1)) {
        return { field: 'totalRooms', message: 'মোট সিট/শয্যা সংখ্যা দিন।' };
      }
    } else if (form.bedrooms < 1) {
      return { field: 'bedrooms', message: 'বেডরুম সংখ্যা কমপক্ষে ১ হতে হবে।' };
    }
    return null;
  };

  const focusField = (field: FieldKey) => {
    if (typeof document === 'undefined') return;
    const wrapper = document.getElementById(`tolet-field-${field}`);
    if (!wrapper) return;
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    wrapper.querySelector<HTMLElement>('input, textarea, select, button, [role="button"]')?.focus({ preventScroll: true });
  };

  const buildInput = (): ToletListingInput => ({
    title: form.title.trim(),
    propertyType: form.propertyType,
    areaId: form.areaId,
    specificAddress: form.specificAddress.trim(),
    rentPrice: Number(form.rentPrice) || 0,
    bedrooms: form.bedrooms,
    bathrooms: form.bathrooms,
    balconies: form.balconies,
    hasDrawingRoom: form.hasDrawingRoom,
    hasDiningRoom: form.hasDiningRoom,
    totalRooms: isMessLike ? form.totalRooms : undefined,
    floor: form.floor.trim() || undefined,
    availableFrom: form.availableFrom.trim() || undefined,
    facilities: textToFacilities(form.facilitiesText),
    unavailableFacilities: textToFacilities(form.unavailableFacilitiesText),
    description: form.description.trim(),
    photos: form.photos,
  });

  const submit = async (draft: boolean) => {
    if (submittingRef.current) return;
    const problem = validate(draft);
    if (problem) {
      // Nothing is submitted and the form state is untouched, so every value the
      // owner already typed stays on screen.
      setErrors({ [problem.field]: problem.message });
      setFormError(problem.message);
      focusField(problem.field);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      const result = await onSubmit(buildInput(), draft);
      if (!result.success) {
        const raw = result.error || 'জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
        setFormError(
          raw.includes('row-level security')
            ? 'এই কাজটি সম্পাদনের অনুমতি নেই। আপনার সেশন বা ভূমিকা যাচাই করুন।'
            : raw
        );
        return;
      }
      onDone(draft ? 'draft_saved' : isEditing ? 'updated' : 'created');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'জমা দিতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'
      );
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit(false);
      }}
      className="space-y-4"
    >
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-[13px] font-medium text-rose-800"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        {/* 1 — শিরোনাম */}
        <Field
          id="title"
          label="বিজ্ঞাপনের শিরোনাম"
          required
          error={errors.title}
          hint="অন্তত ৮ অক্ষর — ভাড়াটিয়া যেন প্রথম নজরেই বুঝতে পারে।"
        >
          <input
            id="tolet-title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={120}
            placeholder="যেমন: চরপাড়ায় আলো-বাতাসপূর্ণ ফ্যামিলি ফ্ল্যাট"
            className={controlClass(Boolean(errors.title))}
          />
        </Field>

        {/* 2 — বিবরণ */}
        <Field
          id="description"
          label="বিবরণ"
          required
          error={errors.description}
          hint="বাসার আকার, পরিবেশ, বিদ্যুৎ-পানি, যাতায়াত ইত্যাদি লিখুন।"
        >
          <textarea
            id="tolet-description"
            rows={5}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={2000}
            placeholder="বাসাটি সম্পর্কে বিস্তারিত লিখুন..."
            className={cn(controlClass(Boolean(errors.description)), 'resize-y')}
          />
        </Field>

        {/* 3 — ছবি */}
        <div id="tolet-field-photos">
          <PhotoUploader
            photos={form.photos}
            onChange={(photos) => set('photos', photos)}
            onUpload={onUploadFile}
            onBusyChange={setUploadingPhotos}
            label="বাসার ছবি আপলোড"
          />
        </div>

        {/* 4 — বাসার ধরন */}
        <Field id="propertyType" label="বাসার ধরন নির্বাচন করুন" required group>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(TOLET_PROPERTY_TYPE_INFO) as ToletPropertyType[]).map((pt) => {
              const info = TOLET_PROPERTY_TYPE_INFO[pt];
              const selected = form.propertyType === pt;
              return (
                <button
                  key={pt}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => set('propertyType', pt)}
                  className={cn(
                    'min-h-11 rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors sm:text-[13px]',
                    selected
                      ? 'border-emerald-800 bg-emerald-800 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700/60'
                  )}
                >
                  {info.labelBn}
                </button>
              );
            })}
          </div>
        </Field>

        {/* 5 — এলাকা ও ঠিকানা */}
        <Field id="areaId" label="এলাকা" required error={errors.areaId}>
          <LocationSelectInput
            id="areaId"
            value={form.areaId || null}
            onChange={(areaId) => set('areaId', areaId ?? '')}
            placeholder="আপনার এলাকা নির্বাচন করুন"
            source={TOLET_AREA_SOURCE}
            size="md"
          />
        </Field>

        <Field
          id="specificAddress"
          label="সুনির্দিষ্ট ঠিকানা"
          required
          error={errors.specificAddress}
          hint="রোড, বাড়ি নম্বর বা নিকটবর্তী পরিচিত স্থান লিখুন।"
        >
          <textarea
            id="tolet-specificAddress"
            rows={2}
            value={form.specificAddress}
            onChange={(e) => set('specificAddress', e.target.value)}
            maxLength={200}
            placeholder="যেমন: চরপাড়া নাহার মেমোরিয়াল রোড, ময়মনসিংহ"
            className={cn(controlClass(Boolean(errors.specificAddress)), 'resize-y')}
          />
        </Field>

        {/* 6 — তলা ও শুরুর সময় */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="floor" label="কত তলায়" hint="ঐচ্ছিক">
            <input
              id="tolet-floor"
              value={form.floor}
              onChange={(e) => set('floor', e.target.value)}
              maxLength={40}
              placeholder="যেমন: ৩য় তলা"
              className={controlClass()}
            />
          </Field>
          <Field id="availableFrom" label="কোন মাস থেকে ভাড়া দেওয়া হবে" hint="ঐচ্ছিক">
            <input
              id="tolet-availableFrom"
              value={form.availableFrom}
              onChange={(e) => set('availableFrom', e.target.value)}
              maxLength={60}
              placeholder="যেমন: আগামী মাস থেকে"
              list="tolet-available-from-options"
              className={controlClass()}
            />
            <datalist id="tolet-available-from-options">
              {AVAILABLE_FROM_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </Field>
        </div>

        {/* 7 — মাসিক ভাড়া (কোনো প্ল্যাটফর্ম ফি এখানে দেখানো হয় না) */}
        <Field
          id="rentPrice"
          label="মাসিক ভাড়া (৳)"
          required
          error={errors.rentPrice}
          hint="শুধু মাসিক ভাড়ার পরিমাণ লিখুন।"
        >
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              ৳
            </span>
            <input
              id="tolet-rentPrice"
              type="number"
              inputMode="numeric"
              min={100}
              max={500000}
              step={100}
              value={form.rentPrice || ''}
              onChange={(e) => set('rentPrice', Number(e.target.value))}
              placeholder="12000"
              className={cn(controlClass(Boolean(errors.rentPrice)), 'pl-8 font-bold tabular-nums')}
            />
          </div>
        </Field>

        {/* 8 — বেডরুম, বাথরুম ও বারান্দা */}
        <Field
          id="rooms"
          label={isMessLike ? 'মোট সিট / শয্যা সংখ্যা' : 'বেডরুম, বাথরুম ও বারান্দার সংখ্যা'}
          error={errors.bedrooms || errors.totalRooms}
          group
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {isMessLike ? (
              <NumberField
                id="totalRooms"
                label="সিট / শয্যা"
                value={form.totalRooms ?? 0}
                onChange={(v) => set('totalRooms', v)}
                min={1}
                max={100}
              />
            ) : (
              <>
                <NumberField
                  id="bedrooms"
                  label="বেডরুম"
                  value={form.bedrooms}
                  onChange={(v) => set('bedrooms', v)}
                  min={1}
                  max={10}
                />
                <NumberField
                  id="bathrooms"
                  label="বাথরুম"
                  value={form.bathrooms}
                  onChange={(v) => set('bathrooms', v)}
                  min={1}
                  max={10}
                />
                <NumberField
                  id="balconies"
                  label="বারান্দা"
                  value={form.balconies}
                  onChange={(v) => set('balconies', v)}
                  min={0}
                  max={5}
                />
              </>
            )}
          </div>
          {!isMessLike && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {([
                ['hasDrawingRoom', 'ড্রয়িং রুম'],
                ['hasDiningRoom', 'ডাইনিং রুম'],
              ] as const).map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(event) => set(key, event.target.checked)}
                    className="h-4 w-4 accent-emerald-800"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </Field>

        {/* 9 — যেসব সুবিধা আছে */}
        <Field
          id="facilitiesText"
          label="যেসব সুবিধা আছে"
          hint="একাধিক সুবিধা কমা (,) বা নতুন লাইনে লিখুন।"
        >
          <textarea
            id="tolet-facilitiesText"
            rows={3}
            value={form.facilitiesText}
            onChange={(e) => set('facilitiesText', e.target.value)}
            maxLength={600}
            placeholder="যেমন: ২৪ ঘণ্টা পানি, লিফট, পার্কিং"
            className={cn(controlClass(), 'resize-y')}
          />
        </Field>

        {/* 10 — যেসব সুবিধা নেই */}
        <Field
          id="unavailableFacilitiesText"
          label="যেসব সুবিধা নেই"
          hint="ঐচ্ছিক — ভাড়াটিয়া যেন আগেই জেনে নিতে পারে।"
        >
          <textarea
            id="tolet-unavailableFacilitiesText"
            rows={3}
            value={form.unavailableFacilitiesText}
            onChange={(e) => set('unavailableFacilitiesText', e.target.value)}
            maxLength={600}
            placeholder="যেমন: লিফট নেই, পার্কিং নেই"
            className={cn(controlClass(), 'resize-y')}
          />
        </Field>
      </div>

      {/* 11 — বিজ্ঞাপন প্রকাশ করুন */}
      <div className="space-y-2.5">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : isEditing ? (
            <Save className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting
            ? 'অপেক্ষা করুন...'
            : isEditing
              ? 'পরিবর্তন সংরক্ষণ করুন'
              : 'বিজ্ঞাপন প্রকাশ করুন'}
        </button>

        {mode === 'owner' && !alreadyPublished && (
          <button
            type="button"
            onClick={() => submit(true)}
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            জমা দেওয়া হয়নি হিসেবে সংরক্ষণ
          </button>
        )}

        <p className="text-center text-[11px] leading-relaxed text-slate-500">
          {mode === 'admin'
            ? isEditing
              ? 'সংরক্ষণ করলে পরিবর্তনগুলো সাথে সাথে প্রয়োগ হবে।'
              : 'সংরক্ষণ করলে বিজ্ঞাপনটি যাচাইয়ের অপেক্ষায় থাকবে।'
            : alreadyPublished
              ? 'এই বিজ্ঞাপনটি ইতিমধ্যে প্রকাশিত — পরিবর্তন সংরক্ষিত হবে।'
              : 'জমা দেওয়ার পর বিজ্ঞাপনটি যাচাইয়ের অপেক্ষায় থাকবে। অনুমোদনের পর সবার কাছে প্রকাশিত হবে।'}
        </p>
      </div>
    </form>
  );
}
