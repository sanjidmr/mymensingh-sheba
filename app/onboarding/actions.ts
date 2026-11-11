'use server';

import { revalidatePath } from 'next/cache';
import { createServerSideClient } from '@/lib/supabase/server';
import { normalizeAreaName } from '@/lib/area-names';
import { isOnboardingComplete, normalizeBangladeshPhone } from '@/lib/onboarding';

export async function completeOnboarding(input: {
  fullName: string;
  phone: string;
  primaryAreaId: string;
}): Promise<{ success: boolean; error?: string; fullName?: string }> {
  const client = await createServerSideClient();
  if (!client) {
    return { success: false, error: 'ডেটাবেজ সংযোগ নেই। পরে আবার চেষ্টা করুন।' };
  }

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'তথ্য সংরক্ষণের আগে লগইন করুন।' };
  }

  const fullName = typeof input?.fullName === 'string' ? input.fullName.trim() : '';
  const phone = normalizeBangladeshPhone(
    typeof input?.phone === 'string' ? input.phone.trim() : ''
  );
  const primaryAreaId = normalizeAreaName(
    typeof input?.primaryAreaId === 'string' ? input.primaryAreaId : ''
  );

  if (fullName.length < 2) {
    return { success: false, error: 'নাম কমপক্ষে ২ অক্ষরের লিখুন।' };
  }
  if (!phone) {
    return { success: false, error: 'সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন।' };
  }
  if (!primaryAreaId || primaryAreaId.length > 100) {
    return { success: false, error: 'আপনার এলাকার নাম লিখুন (সর্বোচ্চ ১০০ অক্ষর)।' };
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role, full_name, phone, primary_area_id, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Onboarding profile lookup failed:', profileError);
    return { success: false, error: 'আপনার প্রোফাইল যাচাই করা যায়নি। আবার চেষ্টা করুন।' };
  }
  if (!profile) {
    return { success: false, error: 'আপনার প্রোফাইল পাওয়া যায়নি। সহায়তার জন্য যোগাযোগ করুন।' };
  }
  if (profile.role === 'admin' || profile.role === 'news_editor') {
    return { success: false, error: 'এই অ্যাকাউন্টের জন্য গ্রাহক সেটআপ প্রয়োজন নেই।' };
  }

  const existingProfile = {
    fullName: profile.full_name,
    phone: profile.phone,
    primaryAreaId: profile.primary_area_id,
    onboardingCompletedAt: profile.onboarding_completed_at,
  };
  if (isOnboardingComplete(existingProfile)) {
    return { success: true, fullName: profile.full_name };
  }

  const { data: savedProfile, error: saveError } = await client
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone.local,
      primary_area_id: primaryAreaId,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('full_name')
    .maybeSingle();

  if (saveError) {
    console.error('Onboarding profile save failed:', saveError);
    if (saveError.code === '23505') {
      return {
        success: false,
        error: 'এই মোবাইল নম্বরটি অন্য একটি অ্যাকাউন্টে ব্যবহার করা হয়েছে। অন্য নম্বর দিন।',
      };
    }
    return { success: false, error: 'তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
  }
  if (!savedProfile) {
    return { success: false, error: 'প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' };
  }

  revalidatePath('/');
  revalidatePath('/profile');
  return { success: true, fullName: savedProfile.full_name };
}
