'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import type { TutorProfileStatus, ServiceRequestStatus } from '@/lib/supabase/types';

const TUTOR_STATUSES: TutorProfileStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'paused',
  'suspended',
];

const REQUEST_STATUSES: ServiceRequestStatus[] = [
  'new',
  'reviewing',
  'contacted',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'submitted',
  'assigned',
];

export async function moderateTutorProfile(input: {
  id: string;
  status: TutorProfileStatus;
  reason?: string;
}): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.id) || !TUTOR_STATUSES.includes(input.status)) {
      return { ok: false, error: 'প্রোফাইল বা স্ট্যাটাস সঠিক নয়।' };
    }
    if (input.status === 'rejected' && !input.reason?.trim()) {
      return { ok: false, error: 'প্রত্যাখ্যান বা সংশোধনের কারণ লিখুন।' };
    }

    const { data: tutor, error: lookupError } = await client
      .from('home_tutor_profiles')
      .select('id,user_id,full_name')
      .eq('id', input.id)
      .maybeSingle();
    if (lookupError || !tutor) return { ok: false, error: 'টিউটর প্রোফাইলটি পাওয়া যায়নি।' };

    const patch = {
      status: input.status,
      rejection_reason: input.status === 'rejected' ? input.reason!.trim() : null,
      published_at: input.status === 'approved' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    };
    const { error } = await client
      .from('home_tutor_profiles')
      .update(patch)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };

    const statusLabel = input.status === 'approved' ? 'অনুমোদিত ও প্রকাশিত' : input.status;
    const { error: notificationError } = await client.from('notifications').insert([
      {
        user_id: tutor.user_id,
        target_role: 'customer',
        title: `গৃহশিক্ষক প্রোফাইলের অবস্থা: ${statusLabel}`,
        body: input.status === 'rejected' ? input.reason!.trim() : 'আপনার প্রোফাইলের পর্যালোচনা সম্পন্ন হয়েছে।',
        type: input.status === 'approved' ? 'success' : 'warning',
        related_type: 'home_tutor_profile',
        related_id: input.id,
      },
      {
        user_id: null,
        target_role: 'admin',
        title: 'গৃহশিক্ষক প্রোফাইল আপডেট',
        body: `প্রোফাইল ${input.id} এর অবস্থা "${input.status}" হয়েছে।`,
        type: input.status === 'approved' ? 'success' : 'info',
        related_type: 'tutor_profile',
        related_id: input.id,
      },
    ]);

    revalidatePath('/admin/verifications');
    revalidatePath(`/admin/verifications/${input.id}`);
    revalidatePath('/admin');
    return {
      ok: true,
      message: notificationError
        ? 'প্রোফাইলের অবস্থা সংরক্ষিত হয়েছে, তবে নোটিফিকেশন পাঠানো যায়নি।'
        : 'প্রোফাইলের অবস্থা সংরক্ষিত ও নোটিফিকেশন পাঠানো হয়েছে।',
    };
  });
}

export interface TutorProfileEdit {
  fullName: string;
  institution: string;
  department: string;
  qualification: string;
  experienceYears: number;
  preferredAreas: string[];
  preferredClasses: string[];
  preferredSubjects: string[];
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  daysPerWeek: number;
  classDurationMinutes?: number | null;
  preferredStudentType?: string;
  bio?: string;
}

export async function editTutorProfile(
  id: string,
  input: TutorProfileEdit
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: 'প্রোফাইল আইডি সঠিক নয়।' };
    const requiredText = [input.fullName, input.institution, input.department, input.qualification];
    if (requiredText.some((value) => !value.trim() || value.length > 160)) {
      return { ok: false, error: 'নাম, প্রতিষ্ঠান, বিভাগ ও যোগ্যতা লিখুন (প্রতিটি সর্বোচ্চ ১৬০ অক্ষর)।' };
    }
    if (
      !Number.isInteger(input.experienceYears) || input.experienceYears < 0 || input.experienceYears > 60 ||
      !Number.isInteger(input.expectedSalaryMin) || input.expectedSalaryMin < 0 ||
      !Number.isInteger(input.expectedSalaryMax) || input.expectedSalaryMax < input.expectedSalaryMin ||
      !Number.isInteger(input.daysPerWeek) || input.daysPerWeek < 1 || input.daysPerWeek > 7 ||
      (input.classDurationMinutes != null && (!Number.isInteger(input.classDurationMinutes) || input.classDurationMinutes < 15 || input.classDurationMinutes > 480))
    ) {
      return { ok: false, error: 'অভিজ্ঞতা, বেতন, দিন বা ক্লাসের সময় সঠিক সীমার মধ্যে লিখুন।' };
    }
    if ([input.preferredAreas, input.preferredClasses, input.preferredSubjects].some((items) => items.length > 30 || items.some((item) => item.length > 100))) {
      return { ok: false, error: 'এলাকা, শ্রেণি বা বিষয়ের তথ্য অতিরিক্ত বড়।' };
    }

    const { data: existing, error: readError } = await client
      .from('home_tutor_profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (readError || !existing) return { ok: false, error: 'টিউটর প্রোফাইলটি পাওয়া যায়নি।' };

    const { error } = await client
      .from('home_tutor_profiles')
      .update({
        full_name: input.fullName.trim(),
        institution: input.institution.trim(),
        department: input.department.trim(),
        qualification: input.qualification.trim(),
        experience_years: input.experienceYears,
        preferred_areas: input.preferredAreas.map((value) => value.trim()).filter(Boolean),
        preferred_classes: input.preferredClasses.map((value) => value.trim()).filter(Boolean),
        preferred_subjects: input.preferredSubjects.map((value) => value.trim()).filter(Boolean),
        expected_salary_min: input.expectedSalaryMin,
        expected_salary_max: input.expectedSalaryMax,
        days_per_week: input.daysPerWeek,
        class_duration_minutes: input.classDurationMinutes ?? null,
        preferred_student_type: input.preferredStudentType?.trim() || null,
        bio: input.bio?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/verifications');
    revalidatePath(`/admin/verifications/${id}`);
    revalidatePath('/home-tutor');
    revalidatePath(`/home-tutor/${id}`);
    return { ok: true, message: 'টিউটর প্রোফাইলের তথ্য সংরক্ষিত হয়েছে।' };
  });
}

export async function updateTutorRequest(input: {
  id: string;
  status: ServiceRequestStatus;
  adminNotes?: string;
}): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f-]{36}$/i.test(input.id) || !REQUEST_STATUSES.includes(input.status)) {
      return { ok: false, error: 'রিকোয়েস্ট বা স্ট্যাটাস সঠিক নয়।' };
    }
    const { data: request, error: lookupError } = await client
      .from('service_requests')
      .select('id')
      .eq('id', input.id)
      .eq('service_slug', 'home-tutor')
      .maybeSingle();
    if (lookupError || !request) return { ok: false, error: 'টিউটর রিকোয়েস্টটি পাওয়া যায়নি।' };

    const patch: { status: ServiceRequestStatus; admin_notes?: string | null; updated_at: string } = {
      status: input.status,
      updated_at: new Date().toISOString(),
    };
    if (input.adminNotes !== undefined) patch.admin_notes = input.adminNotes.trim() || null;
    const { error } = await client
      .from('service_requests')
      .update(patch)
      .eq('id', input.id)
      .eq('service_slug', 'home-tutor');
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/tutor-requests');
    revalidatePath(`/admin/tutor-requests/${input.id}`);
    return { ok: true, message: 'রিকোয়েস্টের অবস্থা সংরক্ষিত হয়েছে।' };
  });
}
