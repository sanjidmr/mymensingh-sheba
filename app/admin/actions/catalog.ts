'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

/**
 * Curated catalog: `service_listings` (coaching / wifi / bus / vehicle) and
 * `emergency_contacts`.
 *
 * Both tables already had complete admin CRUD in `lib/catalog-service.ts` and
 * full `USING (public.is_admin())` policies — but no screen ever called them,
 * and the "edit" link on every public curated detail page pointed at
 * `/admin/catalog`, a route that did not exist. This is the missing UI.
 *
 * `is_active` is the only publish switch: the public reads filter on it, so
 * hiding a listing here removes it from the directory immediately.
 */

// --- service_listings -------------------------------------------------------

export async function setServiceListingActive(
  listingId: string,
  isActive: boolean
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client
      .from('service_listings')
      .update({ is_active: isActive })
      .eq('id', listingId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/catalog');
    revalidatePath('/coaching');
    revalidatePath('/wifi');
    revalidatePath('/bus-ticket');
    revalidatePath('/gari-auto-cng');
    return { ok: true, message: isActive ? 'তালিকাটি চালু হয়েছে।' : 'তালিকাটি বন্ধ হয়েছে।' };
  });
}

export async function setServiceListingFeatured(
  listingId: string,
  isFeatured: boolean
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client
      .from('service_listings')
      .update({ is_featured: isFeatured })
      .eq('id', listingId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/catalog');
    return { ok: true, message: isFeatured ? 'ফিচার করা হয়েছে।' : 'ফিচার থেকে সরানো হয়েছে।' };
  });
}

export async function deleteServiceListing(listingId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('service_listings').delete().eq('id', listingId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/catalog');
    return { ok: true, message: 'তালিকাটি মুছে ফেলা হয়েছে।' };
  });
}

// --- emergency_contacts -----------------------------------------------------

export async function setEmergencyContactActive(
  contactId: string,
  isActive: boolean
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (isActive) {
      const { data, error: readError } = await client
        .from('emergency_contacts')
        .select('source_note')
        .eq('id', contactId)
        .maybeSingle();
      if (readError) return { ok: false, error: readError.message };
      if (!data || !data.source_note?.trim()) {
        return { ok: false, error: 'যাচাইকৃত নম্বরের উৎস যোগ না করা পর্যন্ত এটি চালু করা যাবে না।' };
      }
    }

    const { error } = await client
      .from('emergency_contacts')
      .update({ is_active: isActive })
      .eq('id', contactId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/catalog');
    revalidatePath('/doctor');
    revalidatePath('/doctors');
    revalidatePath('/police');
    revalidatePath('/ambulance');
    revalidatePath('/fire-service');
    revalidatePath('/fireservice');
    return { ok: true, message: isActive ? 'নম্বরটি চালু হয়েছে।' : 'নম্বরটি বন্ধ হয়েছে।' };
  });
}

export async function setEmergencyContactOrder(
  contactId: string,
  sortOrder: number
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      return { ok: false, error: 'ক্রম অবশ্যই ০ থেকে ৯৯৯৯-এর মধ্যে হতে হবে।' };
    }

    const { error } = await client
      .from('emergency_contacts')
      .update({ sort_order: Math.round(sortOrder) })
      .eq('id', contactId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/catalog');
    revalidatePath('/doctors');
    revalidatePath('/doctor');
    revalidatePath('/police');
    revalidatePath('/ambulance');
    revalidatePath('/fireservice');
    revalidatePath('/fire-service');
    return { ok: true, message: 'ক্রম সংরক্ষিত হয়েছে।' };
  });
}

export async function deleteEmergencyContact(contactId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('emergency_contacts').delete().eq('id', contactId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/catalog');
    revalidatePath('/doctor');
    revalidatePath('/doctors');
    revalidatePath('/police');
    revalidatePath('/ambulance');
    revalidatePath('/fire-service');
    revalidatePath('/fireservice');
    return { ok: true, message: 'নম্বরটি মুছে ফেলা হয়েছে।' };
  });
}