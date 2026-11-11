'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import { TOLET_PROPERTY_TYPE_INFO, type ToletListingInput, type ToletListingStatus } from '@/lib/tolet-types';
import { notifyOrder } from '@/lib/notify-order.server';

const TOLET_STATUSES: ToletListingStatus[] = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'unavailable',
  'suspended',
  'archived',
];

export async function createAdminToletListing(
  input: ToletListingInput,
  mode: 'draft' | 'submit' = 'submit'
): Promise<ActionResult & { listingId?: string }> {
  return runAdminAction(async (client, userId) => {
    const isMessLike = input && TOLET_PROPERTY_TYPE_INFO[input.propertyType]?.isMessLike;
    if (
      !input ||
      (mode !== 'draft' && mode !== 'submit') ||
      typeof input.title !== 'string' ||
      input.title.trim().length < 8 ||
      input.title.length > 180 ||
      isMessLike === undefined ||
      typeof input.areaId !== 'string' ||
      input.areaId.length > 120 ||
      typeof input.specificAddress !== 'string' ||
      input.specificAddress.length > 500 ||
      typeof input.description !== 'string' ||
      input.description.length > 8000 ||
      (input.floor !== undefined && (typeof input.floor !== 'string' || input.floor.length > 80)) ||
      (input.availableFrom !== undefined &&
        (typeof input.availableFrom !== 'string' || input.availableFrom.length > 80)) ||
      (input.hasDrawingRoom !== undefined && typeof input.hasDrawingRoom !== 'boolean') ||
      (input.hasDiningRoom !== undefined && typeof input.hasDiningRoom !== 'boolean') ||
      !Number.isInteger(input.rentPrice) ||
      input.rentPrice < 0 ||
      input.rentPrice > 500_000 ||
      !Number.isInteger(input.bedrooms) ||
      input.bedrooms < 0 ||
      input.bedrooms > 100 ||
      !Number.isInteger(input.bathrooms) ||
      input.bathrooms < 0 ||
      input.bathrooms > 100 ||
      !Number.isInteger(input.balconies) ||
      input.balconies < 0 ||
      input.balconies > 100 ||
      !Array.isArray(input.facilities) ||
      input.facilities.length > 100 ||
      input.facilities.some((item) => typeof item !== 'string' || item.length > 120) ||
      !Array.isArray(input.unavailableFacilities ?? []) ||
      (input.unavailableFacilities ?? []).length > 100 ||
      (input.unavailableFacilities ?? []).some((item) => typeof item !== 'string' || item.length > 120) ||
      !Array.isArray(input.photos) ||
      input.photos.length > 20 ||
      input.photos.some((photo) => typeof photo !== 'string' || photo.length > 2000) ||
      (input.totalRooms != null && (!Number.isInteger(input.totalRooms) || input.totalRooms < 1 || input.totalRooms > 500))
    ) {
      return { ok: false, error: 'বিজ্ঞাপনের তথ্য সঠিকভাবে পূরণ করুন।' };
    }

    if (
      mode === 'submit' &&
      (!input.areaId.trim() ||
        input.specificAddress.trim().length < 5 ||
        input.rentPrice < 100 ||
        (isMessLike ? !input.totalRooms || input.totalRooms < 1 : input.bedrooms < 1))
    ) {
      return { ok: false, error: 'প্রকাশের আগে ঠিকানা, ভাড়া এবং কক্ষ/সিটের তথ্য পূরণ করুন।' };
    }

    const { data, error } = await client
      .from('tolet_listings')
      .insert({
        owner_id: userId,
        title: input.title.trim(),
        property_type: input.propertyType,
        area_id: input.areaId.trim(),
        specific_address: input.specificAddress.trim(),
        rent_price: input.rentPrice,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        balconies: input.balconies,
        has_drawing_room: input.hasDrawingRoom ?? false,
        has_dining_room: input.hasDiningRoom ?? false,
        total_rooms: input.totalRooms ?? null,
        floor: input.floor?.trim() || null,
        available_from: input.availableFrom?.trim() || null,
        facilities: input.facilities.map((item) => item.trim()).filter(Boolean),
        unavailable_facilities: (input.unavailableFacilities ?? []).map((item) => item.trim()).filter(Boolean),
        description: input.description.trim(),
        photos: input.photos,
        status: mode === 'draft' ? 'draft' : 'pending_review',
      })
      .select('id,title,owner_id,property_type,area_id,specific_address,rent_price,status,created_at')
      .single();

    if (error) return { ok: false, error: `বিজ্ঞাপন সংরক্ষণ করা যায়নি: ${error.message}` };

    if (mode === 'submit') {
      const { data: owner, error: ownerError } = await client
        .from('profiles')
        .select('full_name, phone')
        .eq('id', userId)
        .maybeSingle();
      if (ownerError) {
        console.error('Admin-created To-Let notification owner lookup failed.', ownerError.message);
      }
      try {
        await notifyOrder(
          { ...data, owner_name: owner?.full_name, owner_phone: owner?.phone },
          'tolet_listing',
          '/admin/tolet'
        );
      } catch (notificationError) {
        console.error('Admin-created To-Let listing notification failed.', notificationError);
      }
    }

    revalidatePath('/admin/tolet');
    revalidatePath('/tolet');
    return {
      ok: true,
      listingId: data.id,
      message: mode === 'draft' ? 'বিজ্ঞাপনটি ড্রাফট হিসেবে সংরক্ষিত হয়েছে।' : 'বিজ্ঞাপনটি যাচাইয়ের অপেক্ষায় জমা হয়েছে।',
    };
  });
}

export async function deleteAdminToletListing(id: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return { ok: false, error: 'বিজ্ঞাপনের আইডি সঠিক নয়।' };
    }

    const { data: listing, error: readError } = await client
      .from('tolet_listings')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (readError) return { ok: false, error: `বিজ্ঞাপন যাচাই করা যায়নি: ${readError.message}` };
    if (!listing) return { ok: false, error: 'বিজ্ঞাপনটি পাওয়া যায়নি।' };

    const { data, error } = await client
      .from('tolet_listings')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: `বিজ্ঞাপন মুছে ফেলা যায়নি: ${error.message}` };
    if (!data) return { ok: false, error: 'বিজ্ঞাপনটি মুছে ফেলা যায়নি; আবার রিফ্রেশ করে চেষ্টা করুন।' };

    const { error: eventsError } = await client
      .from('tolet_listing_events')
      .delete()
      .eq('listing_id', id);

    revalidatePath('/admin/tolet');
    revalidatePath('/profile/tolet');
    revalidatePath('/tolet');
    revalidatePath(`/tolet/${id}`);
    return {
      ok: true,
      message: eventsError
        ? 'বিজ্ঞাপন মুছে গেছে, তবে এর পুরোনো ভিজিট/কলের পরিসংখ্যান পরিষ্কার করা যায়নি।'
        : 'বিজ্ঞাপনটি স্থায়ীভাবে মুছে ফেলা হয়েছে।',
    };
  });
}

export async function moderateToletListing(input: {
  id: string;
  status: ToletListingStatus;
  reason?: string;
  decision?: 'reject' | 'request_edits';
}): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.id) || !TOLET_STATUSES.includes(input.status)) {
      return { ok: false, error: 'বিজ্ঞাপন বা অবস্থা সঠিক নয়।' };
    }
    if (input.status === 'rejected' && !input.reason?.trim()) {
      return { ok: false, error: 'মালিককে জানাতে প্রত্যাখ্যান বা সংশোধনের কারণ লিখুন।' };
    }

    const { data: listing, error: lookupError } = await client
      .from('tolet_listings')
      .select('id,owner_id')
      .eq('id', input.id)
      .maybeSingle();
    if (lookupError || !listing) return { ok: false, error: 'বিজ্ঞাপনটি পাওয়া যায়নি।' };

    const patch: {
      status: ToletListingStatus;
      rejection_reason: string | null;
      updated_at: string;
      published_at?: string;
    } = {
      status: input.status,
      rejection_reason: input.status === 'rejected' ? input.reason!.trim() : null,
      updated_at: new Date().toISOString(),
    };
    if (input.status === 'approved') patch.published_at = new Date().toISOString();

    const { error } = await client
      .from('tolet_listings')
      .update(patch)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };

    const label = input.status === 'approved' ? 'অনুমোদিত ও প্রকাশিত' : input.status;
    const { error: notificationError } = await client.from('notifications').insert([
      {
        user_id: listing.owner_id,
        target_role: 'customer',
        title: input.status === 'rejected'
          ? input.decision === 'request_edits' ? 'বিজ্ঞাপনে সংশোধন প্রয়োজন' : 'বিজ্ঞাপন প্রত্যাখ্যান করা হয়েছে'
          : `বিজ্ঞাপনের অবস্থা: ${label}`,
        body: input.status === 'rejected'
          ? input.reason!.trim()
          : 'আপনার বিজ্ঞাপনের পর্যালোচনা সম্পন্ন হয়েছে।',
        type: input.status === 'approved' ? 'success' : 'warning',
        related_type: 'tolet_listing',
        related_id: input.id,
      },
      {
        user_id: null,
        target_role: 'admin',
        title: 'To-Let বিজ্ঞাপন আপডেট',
        body: `বিজ্ঞাপন ${input.id} এর অবস্থা "${input.status}" হয়েছে।`,
        type: input.status === 'approved' ? 'success' : 'info',
        related_type: 'tolet_listing',
        related_id: input.id,
      },
    ]);

    revalidatePath('/admin/tolet');
    revalidatePath('/profile/tolet');
    revalidatePath(`/admin/tolet/${input.id}`);
    revalidatePath(`/tolet/${input.id}`);
    revalidatePath('/admin');
    return {
      ok: true,
      message: notificationError
        ? 'বিজ্ঞাপনের অবস্থা সংরক্ষিত হয়েছে, তবে নোটিফিকেশন পাঠানো যায়নি।'
        : 'বিজ্ঞাপনের অবস্থা সংরক্ষিত ও নোটিফিকেশন পাঠানো হয়েছে।',
    };
  });
}
