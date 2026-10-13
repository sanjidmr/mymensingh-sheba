'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';
import { saveServiceListing } from '@/app/admin/actions/service-listings';
import { uploadMedia } from '@/app/admin/actions/media';
import { COACHING_CATEGORIES, COACHING_CLASSES, COACHING_SUBJECTS, VEHICLE_KINDS, type ServiceCategory, type ServiceListingInput, type VehicleKind } from '@/lib/catalog-types';
import type { AdminServiceListingRow } from '@/lib/admin/queries';
import { getAllMCCAreas } from '@/lib/locations';
import { PageHeader } from '@/components/admin/PageHeader';
import { Panel } from '@/components/admin/PageHeader';

const LABEL: Record<ServiceCategory, string> = {
  vehicle: 'যানবাহন ভাড়া',
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

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : Number.NaN;
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
    areaIds: row?.area_ids ?? [],
    tags: row?.tags ?? [],
    monthlyFeeMin: row?.monthly_fee_min ?? undefined,
    monthlyFeeMax: row?.monthly_fee_max ?? undefined,
    priceMin: row?.price_min ?? undefined,
    priceMax: row?.price_max ?? undefined,
    speedMbps: row?.speed_mbps ?? undefined,
    fareMin: row?.fare_min ?? undefined,
    fareMax: row?.fare_max ?? undefined,
    originBn: row?.origin_bn ?? '',
    destinationBn: row?.destination_bn ?? '',
    seatCount: row?.seat_count ?? undefined,
    photos: row?.photos ?? [],
    modelNameBn: row?.model_name_bn ?? '',
    modelYear: row?.model_year ?? undefined,
    hasAc: row?.has_ac ?? undefined,
    driverIncluded: row?.driver_included ?? undefined,
    availableTimeBn: row?.available_time_bn ?? '',
    priceNoteBn: row?.price_note_bn ?? '',
    contactPhonePrivate: row?.contact_phone_private ?? '',
    isActive: row?.is_active ?? false,
    isFeatured: row?.is_featured ?? false,
  };
}

export default function ServiceListingForm({
  category,
  listing,
}: {
  category: ServiceCategory;
  listing?: AdminServiceListingRow;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ServiceListingInput>(() => initialForm(category, listing));
  const [tagText, setTagText] = useState(() => (listing?.tags ?? [])
    .filter((tag) => category !== 'vehicle' || !VEHICLE_KINDS.includes(tag as VehicleKind))
    .join(', '));
  const [areaText, setAreaText] = useState('');
  const [photoText, setPhotoText] = useState(() => (listing?.photos ?? []).join('\n'));
  const [priceMinText, setPriceMinText] = useState(() => String(values.priceMin ?? ''));
  const [priceMaxText, setPriceMaxText] = useState(() => String(values.priceMax ?? ''));
  const [feeMinText, setFeeMinText] = useState(() => String(values.monthlyFeeMin ?? ''));
  const [feeMaxText, setFeeMaxText] = useState(() => String(values.monthlyFeeMax ?? ''));
  const [fareMinText, setFareMinText] = useState(() => String(values.fareMin ?? ''));
  const [fareMaxText, setFareMaxText] = useState(() => String(values.fareMax ?? ''));
  const [speedText, setSpeedText] = useState(() => String(values.speedMbps ?? ''));
  const [seatText, setSeatText] = useState(() => String(values.seatCount ?? ''));
  const [yearText, setYearText] = useState(() => String(values.modelYear ?? ''));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const areas = useMemo(() => getAllMCCAreas({ activeOnly: true }), []);
  const taxonomy = category === 'coaching'
    ? [...COACHING_CLASSES, ...COACHING_SUBJECTS, ...COACHING_CATEGORIES]
    : category === 'bus'
      ? BUS_TYPES
      : [];

  const set = <K extends keyof ServiceListingInput>(key: K, value: ServiceListingInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const uploadImage = async (
    event: React.ChangeEvent<HTMLInputElement>,
    applyUrl: (url: string) => void,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('folder', category === 'vehicle' ? 'service/vehicles' : `service/${category}`);
      const result = await uploadMedia(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (!result.url) {
        setError('আপলোড সম্পন্ন হয়েছে, তবে ছবির URL পাওয়া যায়নি।');
        return;
      }
      applyUrl(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'ছবি আপলোড ব্যর্থ হয়েছে।');
    } finally {
      setUploading(false);
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
    const input: ServiceListingInput = {
      ...values,
      priceMin: toOptionalNumber(priceMinText),
      priceMax: toOptionalNumber(priceMaxText),
      monthlyFeeMin: toOptionalNumber(feeMinText),
      monthlyFeeMax: toOptionalNumber(feeMaxText),
      fareMin: toOptionalNumber(fareMinText),
      fareMax: toOptionalNumber(fareMaxText),
      speedMbps: toOptionalNumber(speedText),
      seatCount: toOptionalNumber(seatText),
      modelYear: toOptionalNumber(yearText),
      tags: category === 'vehicle'
        ? [
            ...values.tags.filter((tag): tag is VehicleKind => VEHICLE_KINDS.includes(tag as VehicleKind)),
            ...tagText.split(',').map((item) => item.trim()).filter(Boolean),
          ]
        : taxonomy.length > 0
          ? values.tags
          : tagText.split(',').map((item) => item.trim()).filter(Boolean),
      photos: category === 'vehicle'
        ? photoText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
        : [],
    };
    const result = await saveServiceListing(category, input, listing?.id);
    setBusy(false);
    if (!result.ok || !result.id) {
      setError(result.ok ? 'সংরক্ষিত হয়েছে, তবে রেকর্ড আইডি পাওয়া যায়নি।' : result.error);
      return;
    }
    router.push(`/admin/catalog/${category}`);
    router.refresh();
  };

  const inputClass = 'h-11 w-full rounded-md border border-admin-border bg-white px-3 text-sm text-admin-text';
  const textAreaClass = 'w-full rounded-md border border-admin-border bg-white px-3 py-2.5 text-sm text-admin-text';
  const field = (label: string, control: React.ReactNode, hint?: string) => (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-semibold text-admin-text">{label}</span>
      {control}
      {hint && <span className="mt-1 block text-xs leading-relaxed text-admin-muted">{hint}</span>}
    </div>
  );

  return (
    <>
      <PageHeader
        title={`${listing ? 'তালিকা সম্পাদনা' : 'নতুন তালিকা'} · ${LABEL[category]}`}
        description="শুধু সরবরাহ করা তথ্য লিখুন। তথ্য যাচাইয়ের আলাদা ডেটাবেস ক্ষেত্র নেই; প্রকাশনার অবস্থা তথ্য-যাচাইয়ের প্রমাণ নয়।"
        breadcrumb={{ href: `/admin/catalog/${category}`, label: `${LABEL[category]} তালিকা` }}
      />
      <form onSubmit={submit} className="space-y-4">
        <Panel title="সাধারণ তথ্য">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('নাম / শিরোনাম *', <input required minLength={2} maxLength={160} value={values.titleBn} onChange={(e) => set('titleBn', e.target.value)} className={inputClass} />)}
            {field('URL স্লাগ *', <input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={100} value={values.slug} onChange={(e) => set('slug', e.target.value)} className={inputClass} placeholder="english-lowercase-with-hyphens" />, 'পাবলিক URL-এ ব্যবহৃত হবে; একই ক্যাটাগরিতে অবশ্যই অনন্য হতে হবে।')}
            {field('উপশিরোনাম', <input maxLength={240} value={values.subtitleBn ?? ''} onChange={(e) => set('subtitleBn', e.target.value)} className={inputClass} />)}
            {field('সংক্ষিপ্ত পরিচয়', <input maxLength={800} value={values.summaryBn ?? ''} onChange={(e) => set('summaryBn', e.target.value)} className={inputClass} />)}
            {field('প্রধান ছবি URL / site path', <div className="space-y-2"><input value={values.imageUrl ?? ''} onChange={(e) => set('imageUrl', e.target.value)} className={inputClass} placeholder="/uploads/example.jpg" /><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => void uploadImage(event, (url) => set('imageUrl', url))} className="block min-h-11 w-full text-sm file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-admin-page file:px-3 file:font-semibold" /></div>, 'নিজস্ব সাইটের path অথবা HTTPS URL দিন, অথবা site স্টোরেজে ছবি আপলোড করুন।')}
            {category === 'coaching' && field('লোগো URL / site path', <input value={values.logoUrl ?? ''} onChange={(e) => set('logoUrl', e.target.value)} className={inputClass} />)}
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
            {category === 'vehicle' && (
              <>
                {field('গাড়ির মডেল', <input value={values.modelNameBn ?? ''} onChange={(e) => set('modelNameBn', e.target.value)} className={inputClass} />)}
                {field('মডেল বছর', <input type="number" min={1900} max={new Date().getFullYear() + 1} value={yearText} onChange={(e) => setYearText(e.target.value)} className={inputClass} />)}
                {field('আসন সংখ্যা *', <input required type="number" min={1} max={100} value={seatText} onChange={(e) => setSeatText(e.target.value)} className={inputClass} />)}
                {field('ভাড়ার সর্বনিম্ন মূল্য', <input type="number" min={0} value={priceMinText} onChange={(e) => setPriceMinText(e.target.value)} className={inputClass} />)}
                {field('ভাড়ার সর্বোচ্চ মূল্য', <input type="number" min={0} value={priceMaxText} onChange={(e) => setPriceMaxText(e.target.value)} className={inputClass} />)}
                {field('মূল্যের একক / শর্ত', <input value={values.priceNoteBn ?? ''} onChange={(e) => set('priceNoteBn', e.target.value)} className={inputClass} placeholder="যেমন: প্রতি কিলোমিটার / প্রতি দিন" />)}
                {field('উপলভ্য সময় (যদি সরবরাহকৃত)', <input value={values.availableTimeBn ?? ''} onChange={(e) => set('availableTimeBn', e.target.value)} className={inputClass} />)}
                {field('গ্যালারি ছবি URL / path (প্রতি লাইনে একটি)', <div className="space-y-2"><textarea rows={4} value={photoText} onChange={(e) => setPhotoText(e.target.value)} className={textAreaClass} /><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={(event) => void uploadImage(event, (url) => setPhotoText((current) => [current.trim(), url].filter(Boolean).join('\n')))} className="block min-h-11 w-full text-sm file:mr-3 file:min-h-10 file:rounded-md file:border-0 file:bg-admin-page file:px-3 file:font-semibold" /></div>, 'সর্বোচ্চ ১০টি ছবি। আপলোডের জন্য site স্টোরেজ ব্যবহৃত হয়।')}
                <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={values.hasAc === true} onChange={(e) => set('hasAc', e.target.checked)} className="h-4 w-4 accent-admin-navy" />AC আছে (যাচাইকৃত হলে)</label>
                <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={values.driverIncluded === true} onChange={(e) => set('driverIncluded', e.target.checked)} className="h-4 w-4 accent-admin-navy" />চালক অন্তর্ভুক্ত (যাচাইকৃত হলে)</label>
              </>
            )}
            {category === 'bus' && (
              <>
                {field('যাত্রার শুরু *', <input required value={values.originBn ?? ''} onChange={(e) => set('originBn', e.target.value)} className={inputClass} />)}
                {field('গন্তব্য *', <input required value={values.destinationBn ?? ''} onChange={(e) => set('destinationBn', e.target.value)} className={inputClass} />)}
                {field('সময়সূচি (শুধু সরবরাহকৃত)', <input value={values.availableTimeBn ?? ''} onChange={(e) => set('availableTimeBn', e.target.value)} className={inputClass} />)}
                {field('সর্বনিম্ন ভাড়া', <input type="number" min={0} value={fareMinText} onChange={(e) => setFareMinText(e.target.value)} className={inputClass} />)}
                {field('সর্বোচ্চ ভাড়া', <input type="number" min={0} value={fareMaxText} onChange={(e) => setFareMaxText(e.target.value)} className={inputClass} />)}
                {field('অপারেটর/বাসের ধরন', <div className="flex flex-wrap gap-3">{BUS_TYPES.map((item) => <label key={item.id} className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={values.tags.includes(item.id)} onChange={() => toggleValue('tags', item.id)} className="h-4 w-4 accent-admin-navy" />{item.labelBn}</label>)}</div>)}
              </>
            )}
            {category === 'wifi' && (
              <>
                {field('স্পিড (Mbps)', <input type="number" min={1} value={speedText} onChange={(e) => setSpeedText(e.target.value)} className={inputClass} />)}
                {field('মাসিক সর্বনিম্ন মূল্য', <input type="number" min={0} value={priceMinText} onChange={(e) => setPriceMinText(e.target.value)} className={inputClass} />)}
                {field('মাসিক সর্বোচ্চ মূল্য', <input type="number" min={0} value={priceMaxText} onChange={(e) => setPriceMaxText(e.target.value)} className={inputClass} />)}
                {field('প্যাকেজ / তথ্য ট্যাগ (কমা দিয়ে আলাদা)', <textarea rows={3} value={tagText} onChange={(e) => setTagText(e.target.value)} className={textAreaClass} />)}
              </>
            )}
            {category === 'coaching' && (
              <>
                {field('মাসিক সর্বনিম্ন ফি', <input type="number" min={0} value={feeMinText} onChange={(e) => setFeeMinText(e.target.value)} className={inputClass} />)}
                {field('মাসিক সর্বোচ্চ ফি', <input type="number" min={0} value={feeMaxText} onChange={(e) => setFeeMaxText(e.target.value)} className={inputClass} />)}
                {field('ক্লাস, বিষয় ও প্রস্তুতির ধরন', <div className="max-h-56 overflow-y-auto rounded-md border border-admin-border p-2">{taxonomy.map((item) => <label key={item.id} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" checked={values.tags.includes(item.id)} onChange={() => toggleValue('tags', item.id)} className="h-4 w-4 accent-admin-navy" />{item.labelBn}</label>)}</div>, 'সূচি, শিক্ষক ও যোগ্যতার তথ্য কেবল সরবরাহকৃত হলে বিস্তারিত ঘরে লিখুন।')}
              </>
            )}
            {category === 'vehicle' && field('যানের ধরন *', <div className="flex flex-wrap gap-3">{VEHICLE_KINDS.map((kind) => <label key={kind} className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={values.tags.includes(kind)} onChange={() => toggleValue('tags', kind)} className="h-4 w-4 accent-admin-navy" />{kind}</label>)}</div>, 'স্কিমায় আলাদা যানবাহন-ধরন কলাম নেই; বিদ্যমান tags-এ এই শ্রেণি সংরক্ষিত হয়। একটি সঠিক ধরন বাছুন।')}
            {category !== 'coaching' && category !== 'bus' && field(category === 'vehicle' ? 'সুবিধা / রুট / অন্যান্য ট্যাগ (কমা দিয়ে আলাদা)' : 'এলাকা/রুট/সেবা ট্যাগ (কমা দিয়ে আলাদা)', <textarea rows={3} value={tagText} onChange={(e) => setTagText(e.target.value)} className={textAreaClass} />)}
            {category === 'bus' && field('রুট/বুকিং নির্দেশনা', <textarea rows={3} value={values.summaryBn ?? ''} onChange={(e) => set('summaryBn', e.target.value)} className={textAreaClass} />)}
          </div>
        </Panel>

        <Panel title="সার্ভিস এলাকা">
          <div className="mb-3 flex gap-2">
            <input value={areaText} onChange={(e) => setAreaText(e.target.value)} list="listing-areas" className={inputClass} placeholder="এলাকার নাম বা আইডি খুঁজুন…" />
            <datalist id="listing-areas">{areas.map((area) => <option key={area.id} value={`${area.nameBn} (${area.id})`} />)}</datalist>
            <button type="button" onClick={() => { const match = areas.find((area) => `${area.nameBn} (${area.id})` === areaText || area.id === areaText); if (match && !values.areaIds.includes(match.id)) set('areaIds', [...values.areaIds, match.id]); setAreaText(''); }} className="min-h-11 shrink-0 rounded-md border border-admin-border px-3 text-sm font-semibold">যোগ করুন</button>
          </div>
          {values.areaIds.length === 0 ? (
            <p className="text-xs text-admin-muted">কোনো নির্দিষ্ট এলাকা না বাছাই করলে পেজের বর্তমান নিয়ম অনুযায়ী city-wide হিসেবে বিবেচিত হতে পারে। কভারেজ যাচাই ছাড়া সক্রিয় করবেন না।</p>
          ) : (
            <div className="flex flex-wrap gap-2">{values.areaIds.map((id) => <button key={id} type="button" onClick={() => set('areaIds', values.areaIds.filter((area) => area !== id))} className="rounded-md border border-admin-border px-2 py-1 text-xs">{areas.find((area) => area.id === id)?.nameBn ?? id} ×</button>)}</div>
          )}
        </Panel>
        {error && <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={`/admin/catalog/${category}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-admin-border px-4 text-sm font-semibold text-admin-text">ফিরে যান</Link>
          <button type="submit" disabled={busy || uploading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-admin-navy px-4 text-sm font-semibold text-white disabled:opacity-60">
            {busy || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {uploading ? 'ছবি আপলোড হচ্ছে…' : busy ? 'সংরক্ষণ হচ্ছে…' : 'সংরক্ষণ'}
          </button>
        </div>
      </form>
    </>
  );
}
