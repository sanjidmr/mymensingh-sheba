'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import { requireAdminAction } from '@/lib/admin/actions';
import type { StaffProfileInput, StaffServiceKey } from '@/lib/staff-types';

const STAFF_SERVICES: StaffServiceKey[] = ['kajer-bua', 'electrician', 'plumber', 'ac-fridge'];
const STAFF_AVAILABILITY = ['available', 'limited', 'busy'] as const;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function validateInput(input: StaffProfileInput): string | null {
  if (!STAFF_SERVICES.includes(input.serviceSlug)) return 'কর্মীর সেবার ধরন সঠিক নয়।';
  if (input.nameBn.trim().length < 2 || input.nameBn.trim().length > 120) return 'কর্মীর নাম ২ থেকে ১২০ অক্ষরের মধ্যে লিখুন।';
  if (input.titleBn.trim().length < 2 || input.titleBn.trim().length > 160) return 'পদবি ২ থেকে ১৬০ অক্ষরের মধ্যে লিখুন।';
  if (input.aboutBn.trim().length < 10 || input.aboutBn.length > 5000) return 'কর্মীর পরিচিতি ১০ থেকে ৫০০০ অক্ষরের মধ্যে লিখুন।';
  if (input.availability != null && !STAFF_AVAILABILITY.includes(input.availability)) return 'কর্মীর প্রাপ্যতার মান সঠিক নয়।';
  if (input.experienceYears != null && (!Number.isInteger(input.experienceYears) || input.experienceYears < 0 || input.experienceYears > 100)) return 'অভিজ্ঞতার বছর সঠিক নয়।';
  if (input.areaIds != null && input.areaIds.some((area) => typeof area !== 'string' || area.length > 80)) return 'কর্ম-এলাকার তথ্য সঠিক নয়।';
  if (input.workTypes != null && input.workTypes.some((type) => typeof type !== 'string' || type.length > 100)) return 'কাজের ধরনের তথ্য সঠিক নয়।';
  if ((input.salaryMin != null && input.salaryMin < 0) || (input.salaryMax != null && input.salaryMax < 0)) return 'সম্মানীর পরিমাণ ঋণাত্মক হতে পারবে না।';
  if (input.salaryMin != null && input.salaryMax != null && input.salaryMax < input.salaryMin) return 'সর্বোচ্চ সম্মানী সর্বনিম্ন সম্মানীর চেয়ে কম হতে পারবে না।';
  if (input.phonePrivate && !/^[+\d][\d\s().-]{5,24}$/.test(input.phonePrivate.trim())) return 'ফোন নম্বরের ফরম্যাট সঠিক নয়।';
  if (input.imageUrl && input.imageUrl.length > 2000) return 'ছবির ঠিকানাটি অনেক বড়।';
  return null;
}

/**
 * Maps the form payload to a `staff_profiles` row.
 *
 * Optional keys are written ONLY when the caller supplied them. The internal
 * directory form no longer edits areas / work types / experience / shift /
 * preferred time / emergency flag / lower salary bound, so those columns are
 * left alone: on create the database defaults apply, and on edit a legacy
 * value is preserved instead of being overwritten with `null`.
 */
function toDatabaseInput(input: StaffProfileInput): Record<string, unknown> {
  const row: Record<string, unknown> = {
    service_slug: input.serviceSlug,
    name_bn: input.nameBn.trim(),
    title_bn: input.titleBn.trim(),
    image_url: input.imageUrl || null,
    about_bn: input.aboutBn.trim(),
    // Always written so an admin can also clear a bad number.
    phone_private: input.phonePrivate?.trim() || null,
    is_verified: input.isVerified,
    is_active: input.isActive,
  };
  if (input.areaIds !== undefined) row.areas = input.areaIds;
  if (input.workTypes !== undefined) row.work_types = input.workTypes;
  if (input.workMode !== undefined) row.work_mode = input.workMode || null;
  if (input.timeSlot !== undefined) row.time_slot = input.timeSlot || null;
  if (input.experienceYears !== undefined) row.experience_years = input.experienceYears;
  if (input.availability !== undefined) row.availability = input.availability;
  if (input.isEmergency !== undefined) row.is_emergency = input.isEmergency;
  if (input.salaryMin !== undefined) row.salary_min = input.salaryMin;
  if (input.salaryMax !== undefined) row.salary_max = input.salaryMax;
  if (input.rateLabel !== undefined) row.rate_label = input.rateLabel.trim() || null;
  return row;
}

function revalidateStaffPaths(id?: string) {
  revalidatePath('/admin/services');
  revalidatePath('/admin/requests');
  revalidatePath('/admin');
  revalidatePath('/kajer-bua');
  revalidatePath('/electrician');
  revalidatePath('/plumber');
  if (id) revalidatePath(`/admin/services/${id}`);
}

export async function saveStaffProfile(input: StaffProfileInput, id?: string): Promise<ActionResult & { id?: string }> {
  return runAdminAction(async (client) => {
    if (id && !isUuid(id)) return { ok: false, error: 'কর্মী আইডি সঠিক নয়।' };
    const invalid = validateInput(input);
    if (invalid) return { ok: false, error: invalid };

    let query = client
      .from('staff_profiles')
      .select('id')
      .eq('service_slug', input.serviceSlug)
      .eq('name_bn', input.nameBn.trim())
      .eq('title_bn', input.titleBn.trim());
    if (id) query = query.neq('id', id);
    const { data: duplicates, error: duplicateError } = await query.limit(1);
    if (duplicateError) return { ok: false, error: `সম্ভাব্য ডুপ্লিকেট যাচাই ব্যর্থ হয়েছে: ${duplicateError.message}` };
    if (duplicates?.length) return { ok: false, error: 'একই সেবা, নাম ও পদবির কর্মী প্রোফাইল আগে থেকেই আছে।' };

    if (id) {
      const { data, error } = await client
        .from('staff_profiles')
        .update(toDatabaseInput(input))
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) return { ok: false, error: `কর্মী প্রোফাইল আপডেট ব্যর্থ হয়েছে: ${error.message}` };
      if (!data) return { ok: false, error: 'কর্মী প্রোফাইলটি পাওয়া যায়নি।' };
      revalidateStaffPaths(id);
      return { ok: true, id: data.id, message: 'কর্মী প্রোফাইল সংরক্ষিত হয়েছে।' };
    }

    const { data, error } = await client
      .from('staff_profiles')
      .insert(toDatabaseInput(input))
      .select('id')
      .single();
    if (error) return { ok: false, error: `কর্মী প্রোফাইল তৈরি ব্যর্থ হয়েছে: ${error.message}` };
    revalidateStaffPaths(data.id);
    return { ok: true, id: data.id, message: 'কর্মী প্রোফাইল তৈরি হয়েছে।' };
  });
}

export async function setStaffActive(id: string, isActive: boolean): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isUuid(id)) return { ok: false, error: 'কর্মী আইডি সঠিক নয়।' };
    const { data, error } = await client
      .from('staff_profiles')
      .update({ is_active: isActive })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: `কর্মীর অবস্থা আপডেট ব্যর্থ হয়েছে: ${error.message}` };
    if (!data) return { ok: false, error: 'কর্মী প্রোফাইলটি পাওয়া যায়নি।' };
    revalidateStaffPaths(id);
    return { ok: true, message: isActive ? 'কর্মী প্রোফাইল সক্রিয় করা হয়েছে।' : 'কর্মী প্রোফাইল নিষ্ক্রিয় করা হয়েছে।' };
  });
}

export async function removeStaffProfile(id: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!isUuid(id)) return { ok: false, error: 'কর্মী আইডি সঠিক নয়।' };
    const { data: references, error: referenceError } = await client
      .from('service_requests')
      .select('id')
      .eq('profile_id', id)
      .limit(1);
    if (referenceError) return { ok: false, error: `রিকোয়েস্ট-সম্পর্ক যাচাই ব্যর্থ হয়েছে: ${referenceError.message}` };
    if (references?.length) return { ok: false, error: 'এই কর্মীর সঙ্গে সেবা রিকোয়েস্ট যুক্ত আছে। ইতিহাস অক্ষত রাখতে মুছে না দিয়ে নিষ্ক্রিয় করুন।' };
    const { data: reports, error: reportError } = await client
      .from('staff_profile_reports')
      .select('id')
      .eq('profile_id', id)
      .limit(1);
    if (reportError) return { ok: false, error: `কর্মী-সম্পর্কিত রিপোর্ট যাচাই ব্যর্থ হয়েছে: ${reportError.message}` };
    if (reports?.length) return { ok: false, error: 'এই কর্মীর বিরুদ্ধে রিপোর্টের ইতিহাস আছে। ইতিহাস অক্ষত রাখতে মুছে না দিয়ে নিষ্ক্রিয় করুন।' };

    const { data, error } = await client
      .from('staff_profiles')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: `কর্মী প্রোফাইল মুছে ফেলা যায়নি: ${error.message}` };
    if (!data) return { ok: false, error: 'কর্মী প্রোফাইলটি পাওয়া যায়নি।' };
    revalidateStaffPaths(id);
    return { ok: true, message: 'কর্মী প্রোফাইল মুছে ফেলা হয়েছে।' };
  });
}

export async function getAssignableStaffOptions(serviceSlug: string): Promise<
  | { ok: true; rows: Array<{ id: string; name_bn: string; title_bn: string; areas: string[]; availability: string }> }
  | { ok: false; error: string }
> {
  const context = await requireAdminAction();
  if (!context.ok) return context;
  if (!STAFF_SERVICES.includes(serviceSlug as StaffServiceKey)) {
    return { ok: true, rows: [] };
  }
  const { data, error } = await context.client
    .from('staff_profiles')
    .select('id, name_bn, title_bn, areas, availability')
    .eq('service_slug', serviceSlug)
    .eq('is_active', true)
    .neq('availability', 'busy')
    .order('name_bn', { ascending: true });
  if (error) return { ok: false, error: `উপযুক্ত কর্মী তালিকা লোড ব্যর্থ হয়েছে: ${error.message}` };
  return { ok: true, rows: data ?? [] };
}
