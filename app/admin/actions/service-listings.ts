'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import { VEHICLE_KINDS, type ServiceCategory, type ServiceListingInput, type VehicleKind } from '@/lib/catalog-types';

const CATEGORIES: ServiceCategory[] = ['vehicle', 'bus', 'wifi', 'coaching'];

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isOptionalAmount(value: number | undefined): boolean {
  return value === undefined || (Number.isInteger(value) && value >= 0 && value <= 100_000_000);
}

function validate(category: ServiceCategory, input: ServiceListingInput): string | null {
  if (input.category !== category) return 'তালিকার ক্যাটাগরি ও ফর্মের ক্যাটাগরি মিলছে না।';
  if (input.titleBn.trim().length < 2 || input.titleBn.trim().length > 160) return 'নাম/শিরোনাম ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 100) return 'URL স্লাগ শুধু ইংরেজি ছোট অক্ষর, সংখ্যা ও হাইফেনে লিখুন।';
  if ((input.subtitleBn?.length ?? 0) > 240 || (input.summaryBn?.length ?? 0) > 800 || (input.descriptionBn?.length ?? 0) > 10_000) {
    return 'সংক্ষিপ্ত পরিচয় বা বিবরণের দৈর্ঘ্য অনুমোদিত সীমা ছাড়িয়েছে।';
  }
  if (!input.isActive && input.isFeatured) return 'নিষ্ক্রিয় তালিকাকে ফিচার করা যাবে না।';
  if (!Array.isArray(input.areaIds) || input.areaIds.length > 100 || input.areaIds.some((id) => typeof id !== 'string' || id.length > 100)) return 'এলাকার তালিকা সঠিক নয়।';
  if (!Array.isArray(input.tags) || input.tags.length > 60 || input.tags.some((tag) => typeof tag !== 'string' || !tag.trim() || tag.length > 120)) return 'সেবা/প্যাকেজ/সুবিধার তালিকা সঠিক নয়।';
  const amounts = [
    input.monthlyFeeMin, input.monthlyFeeMax, input.priceMin, input.priceMax,
    input.fareMin, input.fareMax,
  ];
  if (amounts.some((amount) => !isOptionalAmount(amount))) return 'দাম/ফি পূর্ণসংখ্যা এবং শূন্য বা তার বেশি হতে হবে।';
  if (input.monthlyFeeMin != null && input.monthlyFeeMax != null && input.monthlyFeeMax < input.monthlyFeeMin) return 'সর্বোচ্চ মাসিক ফি সর্বনিম্ন ফি থেকে কম হতে পারবে না।';
  if (input.priceMin != null && input.priceMax != null && input.priceMax < input.priceMin) return 'সর্বোচ্চ মূল্য সর্বনিম্ন মূল্যের চেয়ে কম হতে পারবে না।';
  if (input.fareMin != null && input.fareMax != null && input.fareMax < input.fareMin) return 'সর্বোচ্চ ভাড়া সর্বনিম্ন ভাড়ার চেয়ে কম হতে পারবে না।';
  if (input.speedMbps != null && (!Number.isInteger(input.speedMbps) || input.speedMbps <= 0 || input.speedMbps > 100_000)) return 'ইন্টারনেট স্পিড একটি বৈধ ধনাত্মক Mbps মান হতে হবে।';
  if (input.seatCount != null && (!Number.isInteger(input.seatCount) || input.seatCount < 1 || input.seatCount > 100)) return 'আসন সংখ্যা ১ থেকে ১০০-এর মধ্যে হতে হবে।';
  if (input.modelYear != null && (!Number.isInteger(input.modelYear) || input.modelYear < 1900 || input.modelYear > new Date().getFullYear() + 1)) return 'গাড়ির মডেল বছর সঠিক নয়।';
  if (input.category === 'bus' && (!input.originBn?.trim() || !input.destinationBn?.trim())) return 'বাসের শুরুর স্থান ও গন্তব্য দিতে হবে।';
  if (input.category === 'vehicle' && input.seatCount == null) return 'যানবাহনের আসন সংখ্যা দিতে হবে।';
  if (input.category === 'vehicle' && input.tags.filter((tag) => VEHICLE_KINDS.includes(tag as VehicleKind)).length !== 1) return 'যানের ধরন থেকে ঠিক একটি সঠিক ধরন বাছুন।';
  if (input.contactPhonePrivate && !/^[+0-9][0-9\s().-]{5,22}$/.test(input.contactPhonePrivate.trim())) return 'যোগাযোগ নম্বরের ফরম্যাট সঠিক নয়।';
  const urls = [input.imageUrl, input.logoUrl, ...(input.photos ?? [])].filter(Boolean) as string[];
  if (urls.some((url) => url.length > 2000 || !(url.startsWith('/') || /^https:\/\//i.test(url)))) return 'ছবির লিংক অবশ্যই সাইটের path অথবা HTTPS URL হতে হবে।';
  if ((input.photos?.length ?? 0) > 10) return 'সর্বোচ্চ ১০টি গ্যালারি ছবি যোগ করা যাবে।';
  return null;
}

function revalidateCategory(category: ServiceCategory, slug?: string) {
  const publicPath = {
    vehicle: '/gari-auto-cng',
    bus: '/bus-ticket',
    wifi: '/wifi',
    coaching: '/coaching',
  }[category];
  revalidatePath('/admin/catalog');
  revalidatePath(`/admin/catalog/${category}`);
  revalidatePath('/admin/vehicle-requests');
  revalidatePath(publicPath);
  if (slug) revalidatePath(`${publicPath}/${slug}`);
}

function databaseInput(input: ServiceListingInput) {
  return {
    category: input.category,
    slug: input.slug,
    title_bn: input.titleBn.trim(),
    subtitle_bn: input.subtitleBn?.trim() || null,
    summary_bn: input.summaryBn?.trim() || null,
    description_bn: input.descriptionBn?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    logo_url: input.logoUrl?.trim() || null,
    area_ids: input.areaIds,
    tags: input.tags.map((tag) => tag.trim()),
    monthly_fee_min: input.monthlyFeeMin ?? null,
    monthly_fee_max: input.monthlyFeeMax ?? null,
    price_min: input.priceMin ?? null,
    price_max: input.priceMax ?? null,
    speed_mbps: input.speedMbps ?? null,
    fare_min: input.fareMin ?? null,
    fare_max: input.fareMax ?? null,
    origin_bn: input.originBn?.trim() || null,
    destination_bn: input.destinationBn?.trim() || null,
    seat_count: input.seatCount ?? null,
    photos: input.photos ?? [],
    model_name_bn: input.modelNameBn?.trim() || null,
    model_year: input.modelYear ?? null,
    has_ac: input.hasAc ?? null,
    driver_included: input.driverIncluded ?? null,
    available_time_bn: input.availableTimeBn?.trim() || null,
    price_note_bn: input.priceNoteBn?.trim() || null,
    contact_phone_private: input.contactPhonePrivate?.trim() || null,
    is_active: input.isActive,
    is_featured: input.isFeatured,
  };
}

export async function saveServiceListing(
  category: ServiceCategory,
  input: ServiceListingInput,
  id?: string,
): Promise<ActionResult & { id?: string; slug?: string }> {
  return runAdminAction(async (client) => {
    if (!CATEGORIES.includes(category)) return { ok: false, error: 'ক্যাটাগরি সঠিক নয়।' };
    if (id && !isUuid(id)) return { ok: false, error: 'তালিকার আইডি সঠিক নয়।' };
    const invalid = validate(category, input);
    if (invalid) return { ok: false, error: invalid };
    if (id) {
      const { data: existing, error: lookupError } = await client
        .from('service_listings')
        .select('id, category, slug')
        .eq('id', id)
        .maybeSingle();
      if (lookupError) return { ok: false, error: `তালিকা যাচাই ব্যর্থ হয়েছে: ${lookupError.message}` };
      if (!existing || existing.category !== category) return { ok: false, error: 'এই ক্যাটাগরির তালিকাটি পাওয়া যায়নি।' };
    }
    const { data: duplicate, error: duplicateError } = await client
      .from('service_listings')
      .select('id')
      .eq('category', category)
      .eq('slug', input.slug)
      .neq('id', id ?? '00000000-0000-0000-0000-000000000000')
      .maybeSingle();
    if (duplicateError) return { ok: false, error: `URL স্লাগ যাচাই ব্যর্থ হয়েছে: ${duplicateError.message}` };
    if (duplicate) return { ok: false, error: 'এই ক্যাটাগরিতে URL স্লাগটি আগে থেকেই ব্যবহৃত হয়েছে।' };

    const saved = databaseInput(input);
    if (id) {
      const { data, error } = await client
        .from('service_listings')
        .update(saved)
        .eq('id', id)
        .select('id, slug')
        .maybeSingle();
      if (error) return { ok: false, error: `তালিকা আপডেট ব্যর্থ হয়েছে: ${error.message}` };
      if (!data) return { ok: false, error: 'তালিকাটি পাওয়া যায়নি।' };
      revalidateCategory(category, data.slug);
      return { ok: true, id: data.id, slug: data.slug, message: 'তালিকার তথ্য সংরক্ষিত হয়েছে।' };
    }
    const { data, error } = await client
      .from('service_listings')
      .insert(saved)
      .select('id, slug')
      .single();
    if (error) return { ok: false, error: `তালিকা তৈরি ব্যর্থ হয়েছে: ${error.message}` };
    revalidateCategory(category, data.slug);
    return { ok: true, id: data.id, slug: data.slug, message: 'তালিকা তৈরি হয়েছে।' };
  });
}

export async function deleteAdminServiceListing(id: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isUuid(id)) return { ok: false, error: 'তালিকার আইডি সঠিক নয়।' };
    const { data: listing, error: lookupError } = await client
      .from('service_listings')
      .select('id, category, slug')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) return { ok: false, error: `তালিকা যাচাই ব্যর্থ হয়েছে: ${lookupError.message}` };
    if (!listing) return { ok: false, error: 'তালিকাটি পাওয়া যায়নি।' };
    if (listing.category === 'vehicle') {
      const { data: requests, error: requestError } = await client
        .from('vehicle_requests')
        .select('id')
        .eq('vehicle_listing_id', id)
        .limit(1);
      if (requestError) return { ok: false, error: `যানবাহন অনুরোধ যাচাই ব্যর্থ হয়েছে: ${requestError.message}` };
      if (requests?.length) {
        return { ok: false, error: 'এই যানবাহনের সঙ্গে ঐতিহাসিক রিকোয়েস্ট যুক্ত আছে। সেগুলোর সম্পর্ক রক্ষায় মুছে না দিয়ে অপ্রকাশিত করুন।' };
      }
    }
    const { error } = await client.from('service_listings').delete().eq('id', id);
    if (error) return { ok: false, error: `তালিকা মুছে ফেলা যায়নি: ${error.message}` };
    revalidateCategory(listing.category as ServiceCategory, listing.slug);
    return { ok: true, message: 'তালিকাটি মুছে ফেলা হয়েছে।' };
  });
}

export async function setAdminServiceListingActive(id: string, active: boolean): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isUuid(id)) return { ok: false, error: 'তালিকার আইডি সঠিক নয়।' };
    const { data, error } = await client
      .from('service_listings')
      .update({ is_active: active })
      .eq('id', id)
      .select('id, category, slug')
      .maybeSingle();
    if (error) return { ok: false, error: `প্রকাশনা অবস্থা সংরক্ষণ ব্যর্থ হয়েছে: ${error.message}` };
    if (!data) return { ok: false, error: 'তালিকাটি পাওয়া যায়নি।' };
    revalidateCategory(data.category as ServiceCategory, data.slug);
    return { ok: true, message: active ? 'তালিকাটি প্রকাশ করা হয়েছে।' : 'তালিকাটি অপ্রকাশিত হয়েছে।' };
  });
}
