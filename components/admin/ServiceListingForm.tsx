'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, ImagePlus, Loader2, Save, X } from 'lucide-react';
import { saveServiceListing } from '@/app/admin/actions/service-listings';
import { uploadMedia } from '@/app/admin/actions/media';
import { COACHING_CATEGORIES, COACHING_CLASSES, COACHING_SUBJECTS, VEHICLE_KINDS, toBn, type CoachingCategory, type ServiceCategory, type ServiceListingInput, type VehicleKind } from '@/lib/catalog-types';
import type { AdminServiceListingRow } from '@/lib/admin/queries';
import { createAreaSource, getAllMCCAreas } from '@/lib/locations';
import LocationSelectInput from '@/components/LocationSelectInput';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/PageHeader';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { cn } from '@/lib/utils';

const LABEL: Record<ServiceCategory, string> = {
  vehicle: 'যানবাহন',
  bus: 'বাস টিকিট তথ্য',
  wifi: 'WiFi প্রদানকারী',
  coaching: 'কোচিং সেন্টার',
};

const BUS_TYPES = [
  { id: 'ac', labelBn: 'এসি' },
  { id: 'non-ac', labelBn: 'নন-এসি' },
  { id: 'sleeper', labelBn: 'স্লিপার' },
  { id: 'sitting', labelBn: 'সিটিং' },
];
const BUS_DAYS = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

const inputClass = 'h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text';
const textAreaClass = 'w-full rounded-md border border-admin-border bg-white px-3 py-2.5 text-sm text-admin-text';

/**
 * How many photos one vehicle may carry.
 *
 * Four to five angles is what a renter actually scrolls; past that the strip
 * becomes a gallery nobody opens. The database allows more (`photos` caps at 10)
 * and older rows keep whatever they had — this only limits new uploads here.
 */
const MAX_VEHICLE_IMAGES = 5;

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
}

/**
 * A stable, human-readable slug for a vehicle.
 *
 * The vehicle form deliberately hides the URL slug — the person adding a car is
 * thinking in Bengali about a Toyota, not in English about a URL. So one is
 * minted here instead. It is only generated when a listing is *created*; an edit
 * keeps the slug it already has so a public link never breaks.
 */
function makeVehicleSlug(): string {
  const random = Math.random().toString(36).slice(2, 8).padEnd(4, '0');
  return `vehicle-${Date.now().toString(36)}-${random}`;
}

/** The cover first, then the gallery; an older single-image row still shows. */
function initialVehicleImages(row?: AdminServiceListingRow): string[] {
  if (!row) return [];
  const photos = (row.photos ?? []).filter((photo): photo is string => Boolean(photo));
  if (photos.length > 0) return photos.slice(0, MAX_VEHICLE_IMAGES);
  return row.image_url ? [row.image_url] : [];
}

function initialForm(category: ServiceCategory, row?: AdminServiceListingRow): ServiceListingInput {
  return {
    category,
    slug: row?.slug ?? '',
    titleBn: row?.title_bn ?? '',
    subtitleBn: row?.subtitle_bn ?? '',
    summaryBn: row?.summary_bn ?? '',
    descriptionBn: row?.description_bn ?? '',
    imageUrl: row?.image_url ?? '',
    logoUrl: row?.logo_url ?? '',
    coachingCategory: row?.coaching_category ?? undefined,
    areaIds: row?.area_ids ?? [],
    tags: row?.tags ?? [],
    monthlyFeeMin: row?.monthly_fee_min ?? undefined,
    monthlyFeeMax: row?.monthly_fee_max ?? undefined,
    admissionFee: row?.admission_fee ?? undefined,
    priceMin: row?.price_min ?? undefined,
    priceMax: row?.price_max ?? undefined,
    speedMbps: row?.speed_mbps ?? undefined,
    fareMin: row?.fare_min ?? undefined,
    fareMax: row?.fare_max ?? undefined,
    originBn: row?.origin_bn ?? '',
    destinationBn: row?.destination_bn ?? '',
    travelDays: row?.travel_days ?? [],
    stops: row?.stops_bn ?? [],
    journeyDurationBn: row?.journey_duration_bn ?? '',
    operatorBn: row?.operator_bn ?? '',
    addressBn: row?.address_bn ?? '',
    seatCount: row?.seat_count ?? undefined,
    photos: row?.photos ?? [],
    modelNameBn: row?.model_name_bn ?? '',
    modelYear: row?.model_year ?? undefined,
    hasAc: row?.has_ac ?? undefined,
    driverIncluded: row?.driver_included ?? undefined,
    driverNameBn: row?.driver_name_bn ?? '',
    availableTimeBn: row?.available_time_bn ?? '',
    priceNoteBn: row?.price_note_bn ?? '',
    ratePerKm: row?.rate_per_km ?? undefined,
    minimumFare: row?.minimum_fare ?? undefined,
    additionalFee: row?.additional_fee ?? undefined,
    additionalFeeNoteBn: row?.additional_fee_note_bn ?? '',
    availableFacilities: row?.available_facilities ?? [],
    unavailableFacilities: row?.unavailable_facilities ?? [],
    contactPhonePrivate: row?.contact_phone_private ?? '',
    isActive: row?.is_active ?? false,
    isFeatured: row?.is_featured ?? false,
  };
}

/**
 * "যা আছে / যা নেই" as a small tag builder rather than a textarea.
 *
 * On a phone the old "one item per line" box is a keyboard over a blank field
 * with no feedback; typing a benefit and pressing যোগ leaves a visible chip that
 * can be tapped away. Duplicates are dropped and each entry is capped at the
 * same 100 characters the server validates.
 */
function FacilityEditor({
  label,
  marker,
  markerClassName,
  hint,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  marker: string;
  markerClassName: string;
  hint: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = () => {
    const value = draft.trim().slice(0, 100);
    if (!value) return;
    if (!items.includes(value)) onChange([...items, value]);
    setDraft('');
  };

  return (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-semibold text-admin-text">{label}</span>
      <div className="flex gap-2">
        <input
          value={draft}
          maxLength={100}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-admin-border px-3 text-sm font-semibold text-admin-text"
        >
          যোগ
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-admin-muted">{hint}</p>
      ) : (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-page py-1 pl-2.5 pr-1.5 text-xs font-medium text-admin-text"
            >
              <span aria-hidden="true" className={markerClassName}>{marker}</span>
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label={`${item} সরান`}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full text-admin-muted hover:bg-white hover:text-status-danger"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ServiceListingForm({
  category,
  listing,
}: {
  category: ServiceCategory;
  listing?: AdminServiceListingRow;
}) {
  const router = useRouter();
  const isVehicle = category === 'vehicle';
  const currentYear = new Date().getFullYear();
  const [values, setValues] = useState<ServiceListingInput>(() => initialForm(category, listing));
  const [tagText, setTagText] = useState(() => (listing?.tags ?? [])
    .filter((tag) => category !== 'vehicle' || !VEHICLE_KINDS.includes(tag as VehicleKind))
    .join(', '));
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [vehicleImages, setVehicleImages] = useState<string[]>(() => initialVehicleImages(listing));
  const [busStopsText, setBusStopsText] = useState(() => (listing?.stops_bn ?? []).join(', '));
  const [busFacilitiesText, setBusFacilitiesText] = useState(() => (listing?.available_facilities ?? []).join(', '));
  const [priceMinText, setPriceMinText] = useState(() => String(values.priceMin ?? ''));
  const [priceMaxText, setPriceMaxText] = useState(() => String(values.priceMax ?? ''));
  const [ratePerKmText, setRatePerKmText] = useState(() => String(values.ratePerKm ?? ''));
  const [minimumFareText, setMinimumFareText] = useState(() => String(values.minimumFare ?? ''));
  const [additionalFeeText, setAdditionalFeeText] = useState(() => String(values.additionalFee ?? ''));
  const [availableFacilitiesText, setAvailableFacilitiesText] = useState(() => (values.availableFacilities ?? []).join('\n'));
  const [unavailableFacilitiesText, setUnavailableFacilitiesText] = useState(() => (values.unavailableFacilities ?? []).join('\n'));
  const [feeMinText, setFeeMinText] = useState(() => String(values.monthlyFeeMin ?? ''));
  const [feeMaxText, setFeeMaxText] = useState(() => String(values.monthlyFeeMax ?? ''));
  const [admissionFeeText, setAdmissionFeeText] = useState(() => String(values.admissionFee ?? ''));
  const [fareMinText, setFareMinText] = useState(() => String(values.fareMin ?? ''));
  const [fareMaxText, setFareMaxText] = useState(() => String(values.fareMax ?? ''));
  const [speedText, setSpeedText] = useState(() => String(values.speedMbps ?? ''));
  const [seatText, setSeatText] = useState(() => String(values.seatCount ?? ''));
  const [yearText, setYearText] = useState(() => String(values.modelYear ?? ''));
  const [busy, setBusy] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState('');
  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);
  const taxonomy = category === 'coaching'
    ? [...COACHING_CLASSES, ...COACHING_SUBJECTS]
    : category === 'bus'
      ? BUS_TYPES
      : [];

  const set = <K extends keyof ServiceListingInput>(key: K, value: ServiceListingInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const uploading = uploadCount > 0;
  const trackUpload = (active: boolean) =>
    setUploadCount((count) => Math.max(0, count + (active ? 1 : -1)));

  /** Uploads one or more chosen files, appending until the photo cap is reached. */
  const uploadVehicleImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;
    setError('');
    const room = MAX_VEHICLE_IMAGES - vehicleImages.length;
    if (room <= 0) {
      setError(`সর্বোচ্চ ${toBn(MAX_VEHICLE_IMAGES)}টি ছবি যোগ করা যাবে।`);
      return;
    }
    trackUpload(true);
    try {
      const uploaded: string[] = [];
      let failure = '';
      for (const file of files.slice(0, room)) {
        const formData = new FormData();
        formData.set('file', file);
        formData.set('folder', `service/${category}`);
        const result = await uploadMedia(formData);
        if (!result.ok) {
          failure = result.error;
          break;
        }
        if (result.url) uploaded.push(result.url);
      }
      if (uploaded.length > 0) {
        setVehicleImages((current) => [...current, ...uploaded].slice(0, MAX_VEHICLE_IMAGES));
        if (category === 'bus') {
          setValues((current) => ({ ...current, imageUrl: current.imageUrl || uploaded[0] }));
        }
      }
      if (failure) setError(failure);
      else if (files.length > room) setError(`সর্বোচ্চ ${toBn(MAX_VEHICLE_IMAGES)}টি ছবি যোগ করা যাবে; বাকি ছবিগুলো যোগ করা হয়নি।`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      trackUpload(false);
    }
  };

  const toggleValue = (key: 'areaIds' | 'tags', value: string) => {
    setValues((current) => {
      const currentValues = current[key];
      return {
        ...current,
        [key]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    if (isVehicle && values.tags.filter((tag) => VEHICLE_KINDS.includes(tag as VehicleKind)).length !== 1) {
      setError('যানের ধরন থেকে ঠিক একটি বাছুন।');
      setBusy(false);
      return;
    }
    const input: ServiceListingInput = {
      ...values,
      // Vehicle hides the slug and the price bounds: mint a slug on create only,
      // and the fee is expressed solely as a per-kilometre rate.
      slug: isVehicle ? values.slug.trim() || makeVehicleSlug() : values.slug,
      subtitleBn: isVehicle ? '' : values.subtitleBn,
      summaryBn: isVehicle ? '' : values.summaryBn,
      imageUrl: isVehicle ? vehicleImages[0] ?? '' : values.imageUrl,
      photos: isVehicle || category === 'bus' ? vehicleImages : [],
      priceMin: isVehicle ? undefined : toOptionalNumber(priceMinText),
      priceMax: isVehicle ? undefined : toOptionalNumber(priceMaxText),
      priceNoteBn: isVehicle ? '' : values.priceNoteBn,
      ratePerKm: toOptionalNumber(ratePerKmText),
      minimumFare: isVehicle ? undefined : toOptionalNumber(minimumFareText),
      additionalFee: isVehicle ? undefined : toOptionalNumber(additionalFeeText),
      additionalFeeNoteBn: isVehicle ? '' : values.additionalFeeNoteBn,
      availableFacilities: isVehicle
        ? values.availableFacilities ?? []
        : category === 'bus'
          ? busFacilitiesText.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
        : availableFacilitiesText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      travelDays: category === 'bus' ? values.travelDays ?? [] : [],
      stops: category === 'bus' ? busStopsText.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean) : [],
      journeyDurationBn: category === 'bus' ? values.journeyDurationBn : '',
      unavailableFacilities: isVehicle
        ? values.unavailableFacilities ?? []
        : unavailableFacilitiesText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
      monthlyFeeMin: toOptionalNumber(feeMinText),
      monthlyFeeMax: toOptionalNumber(feeMaxText),
      admissionFee: toOptionalNumber(admissionFeeText),
      fareMin: toOptionalNumber(fareMinText),
      fareMax: toOptionalNumber(fareMaxText),
      speedMbps: toOptionalNumber(speedText),
      seatCount: toOptionalNumber(seatText),
      modelYear: toOptionalNumber(yearText),
      tags: isVehicle
        ? values.tags.filter((tag): tag is VehicleKind => VEHICLE_KINDS.includes(tag as VehicleKind))
        : taxonomy.length > 0
          ? values.tags
          : tagText.split(',').map((item) => item.trim()).filter(Boolean),
    };
    const result = await saveServiceListing(category, input, listing?.id);
    setBusy(false);
    if (!result.ok || !result.id) {
      setError(result.ok ? 'সংরক্ষিত হয়েছে, তবে রেকর্ড আইডি পাওয়া যায়নি।' : result.error);
      return;
    }
    router.push(`/admin/directories/${category}`);
    router.refresh();
  };

  const field = (label: string, control: React.ReactNode, hint?: string) => (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-semibold text-admin-text">{label}</span>
      {control}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-admin-muted">{hint}</span>}
    </div>
  );

  const areaPicker = (
    <>
      <div className="mb-3 flex gap-2">
        <LocationSelectInput
          id="admin-service-area"
          value={selectedAreaId}
          onChange={(areaId) => setSelectedAreaId(areaId ?? '')}
          placeholder="আপনার এলাকা নির্বাচন করুন"
          source={createAreaSource(areas)}
          size="sm"
        />
        <button
          type="button"
          onClick={() => {
            if (selectedAreaId && !values.areaIds.includes(selectedAreaId)) {
              set('areaIds', [...values.areaIds, selectedAreaId]);
            }
            setSelectedAreaId('');
          }}
          disabled={!selectedAreaId}
          className="min-h-11 shrink-0 rounded-md border border-admin-border px-3 text-sm font-semibold disabled:opacity-50"
        >
          যোগ করুন
        </button>
      </div>
      {values.areaIds.length === 0 ? (
        <p className="text-xs text-admin-muted">কোনো নির্দিষ্ট এলাকা না বাছাই করলে পেজের বর্তমান নিয়ম অনুযায়ী city-wide হিসেবে বিবেচিত হতে পারে। কভারেজ যাচাই ছাড়া সক্রিয় করবেন না।</p>
      ) : (
        <div className="flex flex-wrap gap-2">{values.areaIds.map((id) => <button key={id} type="button" onClick={() => set('areaIds', values.areaIds.filter((area) => area !== id))} className="rounded-md border border-admin-border px-2 py-1 text-xs">{areas.find((area) => area.id === id)?.nameBn ?? id} ×</button>)}</div>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        title={`${listing ? 'তালিকা সম্পাদনা' : 'নতুন তালিকা'} · ${LABEL[category]}`}
        description={isVehicle
          ? 'গাড়ির নাম, ধরন, ছবি ও প্রতি কিলোমিটার ভাড়া দিন। বিস্তারিত ও সুবিধাগুলো লিখলে ভাড়া নিতে আগ্রহীরা দ্রুত সিদ্ধান্ত নিতে পারে।'
          : 'শুধু সরবরাহ করা তথ্য লিখুন। তথ্য যাচাইয়ের আলাদা ডেটাবেস ক্ষেত্র নেই; প্রকাশনার অবস্থা তথ্য-যাচাইয়ের প্রমাণ নয়।'}
        breadcrumb={{ href: `/admin/directories/${category}`, label: `${LABEL[category]} তালিকা` }}
      />
      <form onSubmit={submit} className="space-y-4">
        {isVehicle ? (
          <>
            <Panel
              title="যানবাহনের মূল তথ্য"
              description="এই তথ্যগুলোই তালিকার কার্ডে ও বিস্তারিত পাতায় সবার আগে দেখানো হয়।"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field(
                  'গাড়ির নাম *',
                  <input required minLength={2} maxLength={160} value={values.titleBn} onChange={(e) => set('titleBn', e.target.value)} className={inputClass} placeholder="যেমন: টয়োটা অ্যাক্সিও (সাদা)" />,
                )}
                <div className="min-w-0 sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-admin-text">যানের ধরন *</span>
                  <div role="radiogroup" aria-label="যানের ধরন" className="flex flex-wrap gap-2">
                    {VEHICLE_KINDS.map((kind) => {
                      const selected = values.tags.includes(kind);
                      return (
                        <button
                          key={kind}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => set('tags', [kind])}
                          className={cn(
                            'inline-flex min-h-11 min-w-24 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors',
                            selected
                              ? 'border-admin-navy bg-admin-navy text-white'
                              : 'border-admin-border bg-white text-admin-text hover:bg-admin-page',
                          )}
                        >
                          {kind}
                        </button>
                      );
                    })}
                  </div>
                  <span className="mt-1 block text-xs leading-relaxed text-admin-muted">গাড়ি, অটো ও CNG-এর মধ্যে ঠিক একটি বাছুন — এটি তালিকাকে সঠিক ধরনে দেখায় ও ফিল্টারে কাজ করে।</span>
                </div>
                {field(
                  'মডেল',
                  <input value={values.modelNameBn ?? ''} onChange={(e) => set('modelNameBn', e.target.value)} className={inputClass} placeholder="যেমন: Toyota Axio, Bajaj RE" />,
                )}
                {field(
                  'আসন সংখ্যা *',
                  <input required type="number" min={1} max={100} value={seatText} onChange={(e) => setSeatText(e.target.value)} className={inputClass} />,
                  'সর্বোচ্চ কতজন যাত্রী বহন করা যাবে। কার্ডে “কত সিট” হিসেবে দেখা যায়।',
                )}
                {field(
                  'ড্রাইভারের নাম',
                  <input
                    value={values.driverNameBn ?? ''}
                    maxLength={120}
                    onChange={(e) => set('driverNameBn', e.target.value)}
                    className={inputClass}
                    placeholder="যেমন: মো. রহিম"
                  />,
                  'চালকের তথ্য জানা থাকলে দিন; এটি যানবাহনের বিস্তারিত পাতায় দেখানো হবে।',
                )}
              </div>
            </Panel>

            <Panel
              title="গাড়ির ছবি"
              description="প্রথম ছবিটি কভার। ভালো আলোয় তোলা ৪–৫টি পরিষ্কার ছবি দিলে তালিকা অনেক বিশ্বাসযোগ্য দেখায়।"
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {vehicleImages.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-admin-border bg-admin-page">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`ছবি ${toBn(index + 1)}`} className="h-full w-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-admin-navy px-2 py-0.5 text-[10px] font-bold text-white">কভার</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVehicleImages((current) => [current[index], ...current.filter((_, i) => i !== index)])}
                        title="কভার করুন"
                        className="absolute left-1.5 top-1.5 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-admin-navy shadow-sm"
                      >
                        কভার করুন
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const next = vehicleImages.filter((_, i) => i !== index);
                        setVehicleImages(next);
                      }}
                      aria-label={`ছবি ${toBn(index + 1)} সরান`}
                      className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-status-danger shadow-sm"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {vehicleImages.length < MAX_VEHICLE_IMAGES && (
                  <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-admin-border bg-admin-page text-center text-admin-muted transition-colors hover:border-admin-navy hover:text-admin-navy">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" aria-hidden="true" />}
                    <span className="px-2 text-[11px] font-semibold">{uploading ? 'আপলোড হচ্ছে…' : vehicleImages.length === 0 ? 'ছবি যোগ করুন' : 'আরও ছবি'}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      multiple
                      disabled={uploading}
                      onChange={(e) => void uploadVehicleImages(e)}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-admin-muted">
                {toBn(vehicleImages.length)}/{toBn(MAX_VEHICLE_IMAGES)} টি ছবি যুক্ত হয়েছে। JPG / PNG / WebP, প্রতি ছবি সর্বোচ্চ ৫MB।
              </p>
            </Panel>

            <Panel title="ভাড়া" description="শুধু প্রতি কিলোমিটার হার দিন — বুকিংয়ের সময় আনুমানিক মোট ভাড়া এই হার থেকে হিসাব হয়।">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field(
                  'প্রতি কিলোমিটারের ভাড়া (৳)',
                  <input type="number" min="0.01" max="1000000" step="0.01" value={ratePerKmText} onChange={(e) => setRatePerKmText(e.target.value)} className={inputClass} placeholder="যেমন: 35" />,
                  'খালি রাখলে তালিকায় “আলোচনা সাপেক্ষে” দেখানো হবে।',
                )}
              </div>
            </Panel>

            <Panel title="বিস্তারিত পরিচয়">
              {field(
                'বিস্তারিত',
                <textarea rows={6} maxLength={10_000} value={values.descriptionBn ?? ''} onChange={(e) => set('descriptionBn', e.target.value)} className={textAreaClass} placeholder="গাড়ির অবস্থা, মডেলের বৈশিষ্ট্য, ভাড়ার শর্ত, অতিরিক্ত তথ্য — যা জানানো দরকার।" />,
                'ভাড়া নিতে ইচ্ছুক ব্যক্তি যেন বুঝতে পারেন গাড়িটি আসলে কেমন — সংক্ষেপে কিন্তু নির্দিষ্টভাবে লিখুন।',
              )}
            </Panel>

            <Panel
              title="গাড়িতে যা আছে ও যা নেই"
              description="স্পষ্টভাবে লিখলে ভুল প্রত্যাশা কমে — যেমন “এসি আছে” বা “এসি নেই”, “চালকসহ”, “মিউজিক সিস্টেম”।"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FacilityEditor
                  label="যে সুবিধাগুলো আছে"
                  marker="✓"
                  markerClassName="text-emerald-700"
                  hint="একটি একটি করে লিখে যোগ দিন। যেমন: এসি, চার্জার, মিউজিক সিস্টেম।"
                  placeholder="যেমন: এসি"
                  items={values.availableFacilities ?? []}
                  onChange={(items) => set('availableFacilities', items)}
                />
                <FacilityEditor
                  label="যে সুবিধাগুলো নেই"
                  marker="—"
                  markerClassName="text-admin-muted"
                  hint="যা নেই সেটিও লিখলে ভাড়া নেওয়ার আগেই সবাই জেনে যায়। যেমন: এসি নেই, চালক নেই।"
                  placeholder="যেমন: এসি নেই"
                  items={values.unavailableFacilities ?? []}
                  onChange={(items) => set('unavailableFacilities', items)}
                />
              </div>
            </Panel>

            <Panel title="প্রকাশনা">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field(
                  'অ্যাডমিন-শুধু যোগাযোগ নম্বর',
                  <input value={values.contactPhonePrivate ?? ''} onChange={(e) => set('contactPhonePrivate', e.target.value)} className={inputClass} inputMode="tel" />,
                  'ফোন নম্বর পাবলিক লিস্টিং query-তে অন্তর্ভুক্ত নয়।',
                )}
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-admin-text">
                  <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-admin-navy" />
                  {values.isActive ? 'প্রকাশিত / সক্রিয়' : 'অপ্রকাশিত / নিষ্ক্রিয়'}
                </label>
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-admin-text">
                  <input type="checkbox" checked={values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-admin-navy" />
                  ফিচারড তালিকা
                </label>
              </div>
            </Panel>

            <details className="group rounded-admin-card border border-admin-border bg-white shadow-admin-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-admin-text [&::-webkit-details-marker]:hidden">
                <span>আরও তথ্য (ঐচ্ছিক)</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-admin-muted transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="grid grid-cols-1 gap-4 border-t border-admin-border px-4 py-4 sm:grid-cols-2">
                {field(
                  'মডেল বছর',
                  <input type="number" min={1900} max={currentYear + 1} value={yearText} onChange={(e) => setYearText(e.target.value)} className={inputClass} />,
                )}
                {field(
                  'এসি',
                  <select
                    value={values.hasAc === true ? 'yes' : values.hasAc === false ? 'no' : ''}
                    onChange={(e) => set('hasAc', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)}
                    className={inputClass}
                  >
                    <option value="">জানা নেই</option>
                    <option value="yes">আছে</option>
                    <option value="no">নেই</option>
                  </select>,
                )}
                {field(
                  'চালক',
                  <select
                    value={values.driverIncluded === true ? 'yes' : values.driverIncluded === false ? 'no' : ''}
                    onChange={(e) => set('driverIncluded', e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined)}
                    className={inputClass}
                  >
                    <option value="">জানা নেই</option>
                    <option value="yes">চালকসহ</option>
                    <option value="no">চালক ছাড়া (সেলফ ড্রাইভ)</option>
                  </select>,
                )}
                {field(
                  'উপলভ্য সময়',
                  <input value={values.availableTimeBn ?? ''} onChange={(e) => set('availableTimeBn', e.target.value)} className={inputClass} placeholder="যেমন: সকাল ৭টা – রাত ১০টা" />,
                )}
                <div className="min-w-0 sm:col-span-2">
                  <span className="mb-1 block text-xs font-semibold text-admin-text">সার্ভিস এলাকা</span>
                  {areaPicker}
                </div>
              </div>
            </details>
          </>
        ) : (
          <>
            <Panel title="সাধারণ তথ্য">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field('নাম / শিরোনাম *', <input required minLength={2} maxLength={160} value={values.titleBn} onChange={(e) => set('titleBn', e.target.value)} className={inputClass} />)}
                {field('URL স্লাগ *', <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} value={values.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} placeholder="english-lowercase-with-hyphens" />, 'পাবলিক URL-এ ব্যবহৃত হবে; একই ক্যাটাগরিতে অবশ্যই অনন্য হতে হবে।')}
                {field('উপশিরোনাম', <input maxLength={240} value={values.subtitleBn ?? ''} onChange={(e) => set('subtitleBn', e.target.value)} className={inputClass} />)}
                {category === 'coaching' && field(
                  'কোচিং ক্যাটাগরি *',
                  <select
                    required
                    value={values.coachingCategory ?? ''}
                    onChange={(event) => set('coachingCategory', (event.target.value || undefined) as CoachingCategory | undefined)}
                    className={inputClass}
                  >
                    <option value="">ক্যাটাগরি বেছে নিন</option>
                    {COACHING_CATEGORIES.map((item) => (
                      <option key={item.id} value={item.id}>{item.labelBn}</option>
                    ))}
                  </select>,
                )}
                {field('সংক্ষিপ্ত পরিচয়', <input maxLength={800} value={values.summaryBn ?? ''} onChange={(e) => set('summaryBn', e.target.value)} className={inputClass} />)}
                {field(
                  'প্রধান ছবি',
                  <ImageUpload
                    value={values.imageUrl ?? ''}
                    onChange={(url) => set('imageUrl', url)}
                    folder={`service/${category}`}
                    disabled={busy}
                    onBusyChange={trackUpload}
                  />,
                  'ছবি আপলোড করুন (JPG, PNG, WebP বা AVIF, সর্বোচ্চ ৫MB)।',
                )}
                {category === 'coaching' && field(
                  'লোগো',
                  <ImageUpload
                    value={values.logoUrl ?? ''}
                    onChange={(url) => set('logoUrl', url)}
                    folder="service/coaching"
                    disabled={busy}
                    onBusyChange={trackUpload}
                  />,
                  'কোচিং সেন্টারের লোগো আপলোড করুন।',
                )}
                {category === 'coaching' && (
                  <div className="min-w-0 sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-admin-text">কোচিং সেন্টারের এলাকা *</span>
                    {areaPicker}
                  </div>
                )}
                {field('বিস্তারিত', <textarea rows={5} maxLength={10_000} value={values.descriptionBn ?? ''} onChange={(e) => set('descriptionBn', e.target.value)} className={textAreaClass} />, category === 'bus' ? 'প্রকৃত অপারেটরের বুকিং/যোগাযোগ নির্দেশনা এখানে দিন। এটি বুকিং বা আসন নিশ্চিতকরণ নয়।' : undefined)}
                {field('অ্যাডমিন-শুধু যোগাযোগ নম্বর', <input value={values.contactPhonePrivate ?? ''} onChange={(e) => set('contactPhonePrivate', e.target.value)} className={inputClass} inputMode="tel" />, 'ফোন নম্বর পাবলিক লিস্টিং query-তে অন্তর্ভুক্ত নয়।')}
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-admin-text">
                  <input type="checkbox" checked={values.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 accent-admin-navy" />
                  {values.isActive ? 'প্রকাশিত / সক্রিয়' : 'অপ্রকাশিত / নিষ্ক্রিয়'}
                </label>
                <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-admin-text">
                  <input type="checkbox" checked={values.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 accent-admin-navy" />
                  ফিচারড তালিকা
                </label>
              </div>
            </Panel>

            <Panel title="ক্যাটাগরি-নির্দিষ্ট তথ্য">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {category === 'bus' && (
                  <>
                    {field('যাত্রার শুরু *', <input required value={values.originBn ?? ''} onChange={(e) => set('originBn', e.target.value)} className={inputClass} />)}
                    {field('গন্তব্য *', <input required value={values.destinationBn ?? ''} onChange={(e) => set('destinationBn', e.target.value)} className={inputClass} />)}
                    {field('অপারেটর / বাস কোম্পানি', <input maxLength={160} value={values.operatorBn ?? ''} onChange={(e) => set('operatorBn', e.target.value)} className={inputClass} placeholder="যেমন: নির্দিষ্ট কোম্পানির নাম" />, 'নাম দিলে অপারেটর অনুযায়ীও খুঁজে পাওয়া যাবে।')}
                    {field('একাধিক ছাড়ার সময়সূচি', <textarea rows={2} maxLength={500} value={values.availableTimeBn ?? ''} onChange={(e) => set('availableTimeBn', e.target.value)} className={textAreaClass} placeholder="যেমন: সকাল ৭টা, ৯টা এবং রাত ১০টা" />)}
                    {field('যাত্রার দিন', <div className="flex flex-wrap gap-x-4 gap-y-2">{BUS_DAYS.map((day) => <label key={day} className="inline-flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={(values.travelDays ?? []).includes(day)} onChange={() => set('travelDays', values.travelDays?.includes(day) ? values.travelDays.filter((value) => value !== day) : [...(values.travelDays ?? []), day])} className="h-4 w-4 accent-admin-navy" />{day}</label>)}</div>)}
                    {field('যাত্রার সময়কাল', <input maxLength={120} value={values.journeyDurationBn ?? ''} onChange={(e) => set('journeyDurationBn', e.target.value)} className={inputClass} placeholder="যেমন: ৩ ঘণ্টা ৩০ মিনিট" />)}
                    {field('পথের স্টপসমূহ (কমা দিয়ে আলাদা)', <textarea rows={2} maxLength={2000} value={busStopsText} onChange={(e) => setBusStopsText(e.target.value)} className={textAreaClass} placeholder="যেমন: ভালুকা, ত্রিশাল, গফরগাঁও" />)}
                    {field('সর্বনিম্ন ভাড়া', <input type="number" min={0} value={fareMinText} onChange={(e) => setFareMinText(e.target.value)} className={inputClass} />)}
                    {field('সর্বোচ্চ ভাড়া', <input type="number" min={0} value={fareMaxText} onChange={(e) => setFareMaxText(e.target.value)} className={inputClass} />)}
                    {field('অপারেটর/বাসের ধরন', <div className="flex flex-wrap gap-3">{BUS_TYPES.map((item) => <label key={item.id} className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={values.tags.includes(item.id)} onChange={() => toggleValue('tags', item.id)} className="h-4 w-4 accent-admin-navy" />{item.labelBn}</label>)}</div>)}
                    {field('বাসের সুবিধা (কমা দিয়ে আলাদা)', <textarea rows={2} maxLength={2000} value={busFacilitiesText} onChange={(e) => setBusFacilitiesText(e.target.value)} className={textAreaClass} placeholder="যেমন: ওয়াইফাই, এসি, খাবার বিরতি" />)}
                  </>
                )}
                {category === 'wifi' && (
                  <>
                    {field('কভারেজ / এলাকার বিবরণ', <input maxLength={400} value={values.addressBn ?? ''} onChange={(e) => set('addressBn', e.target.value)} className={inputClass} placeholder="যেসব এলাকায় সার্ভিস দেয়" />)}
                    {field('স্পিড (Mbps)', <input type="number" min={1} value={speedText} onChange={(e) => setSpeedText(e.target.value)} className={inputClass} />)}
                    {field('মাসিক সর্বনিম্ন মূল্য', <input type="number" min={0} value={priceMinText} onChange={(e) => setPriceMinText(e.target.value)} className={inputClass} />)}
                    {field('মাসিক সর্বোচ্চ মূল্য', <input type="number" min={0} value={priceMaxText} onChange={(e) => setPriceMaxText(e.target.value)} className={inputClass} />)}
                    {field('প্যাকেজ / তথ্য ট্যাগ (কমা দিয়ে আলাদা)', <textarea rows={3} value={tagText} onChange={(e) => setTagText(e.target.value)} className={textAreaClass} />)}
                  </>
                )}
                {category === 'coaching' && (
                  <>
                    {field('ঠিকানা', <input maxLength={400} value={values.addressBn ?? ''} onChange={(e) => set('addressBn', e.target.value)} className={inputClass} placeholder="রোড, এলাকা, ময়মনসিংহ" />)}
                    {field('মাসিক সর্বনিম্ন ফি', <input type="number" min={0} value={feeMinText} onChange={(e) => setFeeMinText(e.target.value)} className={inputClass} />)}
                    {field('মাসিক সর্বোচ্চ ফি', <input type="number" min={0} value={feeMaxText} onChange={(e) => setFeeMaxText(e.target.value)} className={inputClass} />)}
                    {field('ভর্তি ফি (ঐচ্ছিক)', <input type="number" min={0} value={admissionFeeText} onChange={(e) => setAdmissionFeeText(e.target.value)} className={inputClass} />)}
                    {field('ক্লাস, বিষয় ও প্রস্তুতির ধরন', <div className="max-h-56 overflow-y-auto rounded-md border border-admin-border p-2">{taxonomy.map((item) => <label key={item.id} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={values.tags.includes(item.id)} onChange={() => toggleValue('tags', item.id)} className="h-4 w-4 accent-admin-navy" />{item.labelBn}</label>)}</div>, 'সূচি, শিক্ষক ও যোগ্যতার তথ্য কেবল সরবরাহকৃত হলে বিস্তারিত ঘরে লিখুন।')}
                  </>
                )}
                {category === 'wifi' && field('এলাকা/রুট/সেবা ট্যাগ (কমা দিয়ে আলাদা)', <textarea rows={3} value={tagText} onChange={(e) => setTagText(e.target.value)} className={textAreaClass} />)}
                {category === 'bus' && field('রুট/বুকিং নির্দেশনা', <textarea rows={3} value={values.summaryBn ?? ''} onChange={(e) => set('summaryBn', e.target.value)} className={textAreaClass} />)}
              </div>
            </Panel>

            {category === 'bus' && (
              <Panel title="বাসের ছবি" description="একাধিক প্রকৃত ছবি আপলোড করুন। প্রথম ছবিটি কভার হিসেবে ব্যবহৃত হবে।">
                <div className="flex flex-wrap gap-3">
                  {vehicleImages.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative h-24 w-32 overflow-hidden rounded-lg border border-admin-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`বাসের ছবি ${toBn(index + 1)}`} className="h-full w-full object-cover" />
                      {index === 0 && <span className="absolute left-1 top-1 rounded bg-admin-navy px-1.5 py-0.5 text-[10px] font-bold text-white">কভার</span>}
                      <button type="button" onClick={() => { const next = vehicleImages.filter((_, i) => i !== index); setVehicleImages(next); if (index === 0) set('imageUrl', next[0] ?? ''); }} className="absolute right-1 top-1 rounded bg-white px-1 text-sm font-bold text-rose-700" aria-label={`ছবি ${toBn(index + 1)} সরান`}>×</button>
                    </div>
                  ))}
                  {vehicleImages.length < MAX_VEHICLE_IMAGES && <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-admin-border text-xs font-bold text-admin-muted">{uploading ? 'আপলোড হচ্ছে…' : 'ছবি যোগ করুন'}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} onChange={(event) => void uploadVehicleImages(event)} className="sr-only" /></label>}
                </div>
              </Panel>
            )}

            <Panel title="সার্ভিস এলাকা">{areaPicker}</Panel>
          </>
        )}

        {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={`/admin/directories/${category}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-admin-border px-4 text-sm font-semibold text-admin-text">ফিরে যান</Link>
          <button type="submit" disabled={busy || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
            {busy || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {uploading ? 'ছবি আপলোড হচ্ছে…' : busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}
          </button>
        </div>
      </form>
    </>
  );
}
