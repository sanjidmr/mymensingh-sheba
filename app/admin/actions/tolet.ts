'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import type { ToletListingStatus } from '@/lib/tolet-types';

const TOLET_STATUSES: ToletListingStatus[] = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'unavailable',
  'suspended',
  'archived',
];

export async function moderateToletListing(input: {
  id: string;
  status: ToletListingStatus;
  reason?: string;
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
        title: `বিজ্ঞাপনের অবস্থা: ${label}`,
        body: input.status === 'rejected' ? input.reason!.trim() : 'আপনার বিজ্ঞাপনের পর্যালোচনা সম্পন্ন হয়েছে।',
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
