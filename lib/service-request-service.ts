'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { uploadRequestAttachment } from '@/lib/staff-service';
import { getAreaById } from '@/lib/locations';
import {
  formatAnswersBn,
  type ServiceRequestPageConfig,
} from '@/lib/service-request-pages';

/** Which address block a location belongs to. 'work' is the primary one. */
export type ServiceLocationKey = 'work' | 'destination';

/** One address block from the "ঠিকানা" section. */
export interface ServiceRequestLocationInput {
  areaId: string;
  road: string;
  house: string;
  landmark: string;
  /** Filled from the browser's geolocation, when the user shares it. */
  geo?: { lat: number; lng: number } | null;
}

export interface ServiceRequestDraft {
  serviceSlug: string;
  areaId: string;
  addressLine: string;
  contactName: string;
  contactPhone: string;
  /** Optional second number, when the primary one is busy. */
  altPhone?: string;
  serviceType?: string;
  details?: string;
  preferredDate?: string;
  preferredTime?: string;
  /** Structured per-service answers (also serialised into `details`). */
  answers?: Record<string, string | string[]>;
  /** Full location blocks, so nothing is lost when composing `address_line`. */
  locations?: Partial<Record<ServiceLocationKey, ServiceRequestLocationInput>>;
  /** Optional photo, e.g. the AC unit or the leaking pipe. */
  file?: File | null;
  /** Set when the request is tied to a specific listing or staff profile. */
  profileId?: string;
  profileTitle?: string;
  /** Only used by the typed service request pages, for the Bangla summary. */
  pageConfig?: ServiceRequestPageConfig;
}

export type ServiceRequestResult =
  | { ok: true; attachmentUrl?: string; reference?: string; requestId?: string }
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
  // The alternative number is optional, but if typed it still has to be a real
  // number — a typo here means the fallback never reaches anyone.
  if (draft.altPhone?.trim()) {
    const altError = validateBdPhone(draft.altPhone);
    if (altError) errors.altPhone = 'বিকল্প নম্বরটি সঠিক নয় (যেমন ০১৮১২৩৪৫৬৭৮)';
  }
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
 * Builds one readable line from a location block.
 * Order matters: house → road → landmark, so the reader gets the most specific
 * detail first.
 */
export function formatLocationBn(location: ServiceRequestLocationInput | undefined): string {
  if (!location) return '';
  return [location.house, location.road, location.landmark]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Composes `service_requests.details`.
 *
 * The admin request screen renders `details` verbatim, so instead of dumping a
 * JSON blob into a field an admin reads as prose, the structured answers are
 * flattened into "প্রশ্ন উত্তর" lines and the customer's own note is kept last,
 * clearly separated.
 */
export function composeDetailsBn(
  config: ServiceRequestPageConfig | undefined,
  answers: Record<string, string | string[]> | undefined,
  note: string | undefined
): string {
  const lines: string[] = [];

  if (config && answers) {
    lines.push(...formatAnswersBn(config, answers));
  }

  const trimmedNote = note?.trim();
  if (trimmedNote) {
    if (lines.length > 0) lines.push('');
    lines.push('কাজ সম্পর্কে বিস্তারিত:', trimmedNote);
  }

  return lines.join('\n');
}

/**
 * A short, human-quotable reference for the request.
 *
 * Derived from the row id rather than stored, so it can be regenerated
 * identically anywhere the request is displayed (customer's request list, admin
 * screen) without another column. Short enough to read out over the phone.
 */
export function formatRequestReference(serviceSlug: string, id: string): string {
  const code = (serviceSlug || 'req')
    .split('-')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  return `MS-${code}-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
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

  // `service_type` stores the Bangla label rather than the option id: the admin
  // request screens render this column as-is, so an id would show up as
  // "short_circuit" to the person who has to act on the request. The id is kept
  // in `service_meta` for anything that needs to query it.
  const answers = draft.answers ?? {};
  const serviceTypeLabel = draft.pageConfig?.serviceTypes.find(
    (type) => type.id === answers.serviceType
  )?.labelBn;

  const locations = draft.locations ?? {};
  const summaryLines = draft.pageConfig ? formatAnswersBn(draft.pageConfig, answers) : [];

  const filledLocations = Object.fromEntries(
    Object.entries(locations).filter(([, value]) => Boolean(value))
  ) as Record<string, ServiceRequestLocationInput>;

  const serviceMeta = {
    serviceTypeId: answers.serviceType ?? null,
    altPhone: draft.altPhone?.trim() || null,
    locations: filledLocations,
    answers,
    summaryBn: summaryLines.length > 0 ? summaryLines.join('\n') : null,
  };

  const hasServiceMeta =
    serviceMeta.serviceTypeId !== null ||
    serviceMeta.altPhone !== null ||
    Object.keys(filledLocations).length > 0 ||
    Object.keys(answers).length > 0;

  const details = composeDetailsBn(draft.pageConfig, answers, draft.details);

  const { data, error } = await client
    .from('service_requests')
    .insert({
      customer_id: customerId,
      service_slug: draft.serviceSlug,
      status: 'new',
      area_id: draft.areaId,
      address_line: draft.addressLine.trim(),
      contact_name: draft.contactName.trim(),
      contact_phone: draft.contactPhone.replace(/[^\d+]/g, ''),
      service_type: serviceTypeLabel ?? draft.serviceType ?? null,
      details: details || null,
      preferred_date: draft.preferredDate || null,
      preferred_time: draft.preferredTime || null,
      attachment_url: attachmentUrl ?? null,
      profile_id: draft.profileId ?? null,
      profile_title: draft.profileTitle ?? null,
      service_meta: hasServiceMeta ? serviceMeta : null,
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, error: `অনুরোধ পাঠানো যায়নি: ${error.message}` };
  }

  const requestId = data?.id;
  return {
    ok: true,
    attachmentUrl,
    requestId,
    reference: requestId ? formatRequestReference(draft.serviceSlug, requestId) : undefined,
  };
}