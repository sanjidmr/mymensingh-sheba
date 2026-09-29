'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { uploadRequestAttachment } from '@/lib/staff-service';
import { getAreaById } from '@/lib/locations';

export interface ServiceRequestDraft {
  serviceSlug: string;
  areaId: string;
  addressLine: string;
  contactName: string;
  contactPhone: string;
  serviceType?: string;
  details?: string;
  preferredDate?: string;
  preferredTime?: string;
  /** Optional photo, e.g. the AC unit or the leaking pipe. */
  file?: File | null;
  /** Set when the request is tied to a specific listing or staff profile. */
  profileId?: string;
  profileTitle?: string;
}

export type ServiceRequestResult =
  | { ok: true; attachmentUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Bangla mobile validation: 11 digits starting 01, tolerant of +88 / spaces. */
export function validateBdPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  const local = digits.startsWith('880') ? digits.slice(3) : digits;
  if (!/^01[3-9]\d{8}$/.test(local)) {
    return 'সঠিক মোবাইল নম্বর দিন (যেমন ০১৭১২৩৪৫৬৭৮)';
  }
  return null;
}

export function validateServiceRequest(draft: ServiceRequestDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.contactName?.trim()) {
    errors.contactName = 'আপনার নাম লিখুন';
  } else if (draft.contactName.trim().length < 3) {
    errors.contactName = 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে';
  }
  const phoneError = validateBdPhone(draft.contactPhone ?? '');
  if (phoneError) errors.contactPhone = phoneError;
  if (!draft.areaId) {
    errors.areaId = 'এলাকা নির্বাচন করুন';
  } else if (!getAreaById(draft.areaId)) {
    errors.areaId = 'নির্বাচিত এলাকাটি সঠিক নয়';
  }
  if (!draft.addressLine?.trim()) {
    errors.addressLine = 'বিস্তারিত ঠিকানা লিখুন';
  }
  if (draft.file) {
    if (!draft.file.type.startsWith('image/')) {
      errors.file = 'শুধুমাত্র ছবি আপলোড করা যাবে';
    } else if (draft.file.size > 5 * 1024 * 1024) {
      errors.file = 'ছবির সাইজ ৫MB এর কম হতে হবে';
    }
  }
  return errors;
}

/**
 * Submits a service request to `public.service_requests`.
 *
 * Two things this does differently from `AuthContext.createServiceRequest`:
 *
 *  1. It returns a real result. That older helper optimistically pushed the
 *     request into local state *before* awaiting the insert and returned
 *     `void`, so a failed write rendered as a success screen. Here the UI only
 *     advances when Supabase confirms the row.
 *  2. It carries the fields the table already has but the helper dropped —
 *     `service_type`, `details` and `attachment_url` — which are exactly the
 *     fields an admin needs to act on an AC or basha-paltano request.
 *
 * Requires a signed-in user: `service_requests.customer_id` is NOT NULL and
 * RLS ties rows to the caller. Callers must gate on auth before submitting.
 */
export async function submitServiceRequest(
  draft: ServiceRequestDraft,
  customerId: string
): Promise<ServiceRequestResult> {
  const fieldErrors = validateServiceRequest(draft);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'কিছু তথ্য ঠিক করতে হবে', fieldErrors };
  }

  if (!customerId) {
    return { ok: false, error: 'অনুগ্রহ করে আগে লগইন করুন।' };
  }

  let attachmentUrl: string | undefined;
  if (draft.file) {
    const upload = await uploadRequestAttachment(customerId, draft.file);
    if (!upload.success || !upload.url) {
      return { ok: false, error: upload.error || 'ছবিটি আপলোড করা যায়নি', fieldErrors: { file: 'ছবিটি আপলোড করা যায়নি' } };
    }
    attachmentUrl = upload.url;
  }

  if (!isSupabaseConfigured) {
    // No backend in this environment. Say so plainly rather than showing a
    // success screen for a request that was never stored.
    return {
      ok: false,
      error: 'সার্ভার সংযোগ কাজ করছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
    };
  }

  const client = createClient();
  if (!client) {
    return { ok: false, error: 'সার্ভার সংযোগ কাজ করছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।' };
  }

  const { error } = await client.from('service_requests').insert({
    customer_id: customerId,
    service_slug: draft.serviceSlug,
    status: 'new',
    area_id: draft.areaId,
    address_line: draft.addressLine.trim(),
    contact_name: draft.contactName.trim(),
    contact_phone: draft.contactPhone.replace(/[^\d+]/g, ''),
    service_type: draft.serviceType || null,
    details: draft.details?.trim() || null,
    preferred_date: draft.preferredDate || null,
    preferred_time: draft.preferredTime || null,
    attachment_url: attachmentUrl ?? null,
    profile_id: draft.profileId ?? null,
    profile_title: draft.profileTitle ?? null,
  });

  if (error) {
    return { ok: false, error: `অনুরোধ পাঠানো যায়নি: ${error.message}` };
  }

  return { ok: true, attachmentUrl };
}
