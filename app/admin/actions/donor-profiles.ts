'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import type { BloodDonorStatus, BloodGroup } from '@/lib/supabase/types';

export interface DonorProfileUpdate {
  fullName?: string;
  bloodGroup?: BloodGroup;
  areaId?: string;
  gender?: 'male' | 'female';
  birthYear?: number | null;
  weightKg?: number | null;
  isAvailable?: boolean;
  lastDonationDate?: string | null;
  donationCount?: number;
  intro?: string | null;
  status?: BloodDonorStatus;
  isVerified?: boolean;
  rejectionReason?: string | null;
  adminNotes?: string | null;
}

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DONOR_STATUSES: BloodDonorStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'paused',
  'suspended',
];

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function updateDonorProfile(
  id: string,
  input: DonorProfileUpdate
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return { ok: false, error: 'রক্তদাতার আইডি সঠিক নয়।' };
    }

    const patch: Record<string, string | number | boolean | null> = {};
    if (input.fullName !== undefined) {
      const fullName = input.fullName.trim();
      if (!fullName || fullName.length > 120) {
        return { ok: false, error: 'নাম ১ থেকে ১২০ অক্ষরের মধ্যে লিখুন।' };
      }
      patch.full_name = fullName;
    }
    if (input.bloodGroup !== undefined) {
      if (!BLOOD_GROUPS.includes(input.bloodGroup)) {
        return { ok: false, error: 'রক্তের গ্রুপ সঠিক নয়।' };
      }
      patch.blood_group = input.bloodGroup;
    }
    if (input.areaId !== undefined) {
      const areaId = input.areaId.trim();
      if (!areaId || areaId.length > 100) {
        return { ok: false, error: 'এলাকা নির্বাচন বা লিখুন (সর্বোচ্চ ১০০ অক্ষর)।' };
      }
      patch.area_id = areaId;
    }
    if (input.gender !== undefined) {
      if (input.gender !== 'male' && input.gender !== 'female') {
        return { ok: false, error: 'লিঙ্গের মান সঠিক নয়।' };
      }
      patch.gender = input.gender;
    }
    if (input.birthYear !== undefined) {
      if (input.birthYear !== null && (!Number.isInteger(input.birthYear) || input.birthYear < 1900 || input.birthYear > new Date().getFullYear())) {
        return { ok: false, error: 'জন্মসাল সঠিক নয়।' };
      }
      patch.birth_year = input.birthYear;
    }
    if (input.weightKg !== undefined) {
      if (input.weightKg !== null && (!Number.isFinite(input.weightKg) || input.weightKg < 1 || input.weightKg > 500)) {
        return { ok: false, error: 'ওজন অবশ্যই ১ থেকে ৫০০ কেজির মধ্যে হতে হবে।' };
      }
      patch.weight_kg = input.weightKg;
    }
    if (input.isAvailable !== undefined) patch.is_available = input.isAvailable;
    if (input.lastDonationDate !== undefined) {
      if (input.lastDonationDate !== null && !validDate(input.lastDonationDate)) {
        return { ok: false, error: 'সর্বশেষ রক্তদানের তারিখ সঠিক নয়।' };
      }
      patch.last_donation_date = input.lastDonationDate;
    }
    if (input.donationCount !== undefined) {
      if (!Number.isInteger(input.donationCount) || input.donationCount < 0 || input.donationCount > 1000) {
        return { ok: false, error: 'রক্তদানের সংখ্যা ০ থেকে ১০০০-এর মধ্যে হতে হবে।' };
      }
      patch.donation_count = input.donationCount;
    }
    if (input.intro !== undefined) {
      const intro = input.intro?.trim() ?? '';
      if (intro.length > 1000) return { ok: false, error: 'পরিচিতি ১০০০ অক্ষরের মধ্যে লিখুন।' };
      patch.intro = intro || null;
    }
    if (input.isVerified !== undefined) patch.is_verified = input.isVerified;
    if (input.adminNotes !== undefined) {
      const notes = input.adminNotes?.trim() ?? '';
      if (notes.length > 1000) return { ok: false, error: 'অ্যাডমিন নোট ১০০০ অক্ষরের মধ্যে লিখুন।' };
      patch.admin_notes = notes || null;
    }
    if (input.status !== undefined) {
      if (!DONOR_STATUSES.includes(input.status)) {
        return { ok: false, error: 'স্ট্যাটাসের মান সঠিক নয়।' };
      }
      if (input.status === 'rejected') {
        const reason = input.rejectionReason?.trim() ?? '';
        if (!reason || reason.length > 500) {
          return { ok: false, error: 'প্রত্যাখ্যানের কারণ ১ থেকে ৫০০ অক্ষরের মধ্যে লিখুন।' };
        }
        patch.rejection_reason = reason;
      } else {
        patch.rejection_reason = null;
      }
      patch.status = input.status;
      if (input.status === 'approved') patch.published_at = new Date().toISOString();
    }

    if (Object.keys(patch).length === 0) {
      return { ok: false, error: 'সংরক্ষণের জন্য কোনো পরিবর্তন পাওয়া যায়নি।' };
    }

    const { data, error } = await client
      .from('blood_donor_profiles')
      .update(patch)
      .eq('id', id)
      .select('id, user_id, status')
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'রক্তদাতার প্রোফাইলটি পাওয়া যায়নি।' };

    if (input.status !== undefined) {
      const notification = await client.from('notifications').insert([
        {
          user_id: data.user_id,
          target_role: 'customer',
          title: `রক্তদাতা প্রোফাইলের অবস্থা: ${data.status}`,
          body: 'আপনার প্রোফাইলের পর্যালোচনা সম্পন্ন হয়েছে।',
          type: data.status === 'approved' ? 'success' : 'warning',
          related_type: 'blood_donor_profile',
          related_id: id,
        },
        {
          user_id: null,
          target_role: 'admin',
          title: 'রক্তদাতা প্রোফাইল আপডেট',
          body: `প্রোফাইল ${id} এর অবস্থা "${data.status}" হয়েছে।`,
          type: data.status === 'approved' ? 'success' : 'info',
          related_type: 'donor_profile',
          related_id: id,
        },
      ]);
      if (notification.error) {
        console.error('Donor moderation notification could not be recorded.');
      }
    }

    revalidatePath('/admin/blood');
    revalidatePath('/admin/blood/donors');
    revalidatePath(`/admin/blood/donors/${id}`);
    revalidatePath('/blood-donor');
    return { ok: true, message: 'রক্তদাতার প্রোফাইল আপডেট হয়েছে।' };
  });
}
