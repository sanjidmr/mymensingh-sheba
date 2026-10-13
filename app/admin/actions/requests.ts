'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import { HOME_SERVICE_SLUGS, SERVICE_REQUEST_STATUSES } from '@/lib/admin/service-request-constants';
import type { StaffServiceKey } from '@/lib/staff-types';

/**
 * Request queues: service requests, to-let enquiries and vehicle requests.
 *
 * Status changes are the core of the operations workflow — a request moves
 * from "someone asked" to "we are on it" to "done", and the customer's own
 * request page reads the same column. The allowed values here are exactly the
 * CHECK constraints on each table; offering anything else would produce a
 * constraint violation the admin would have to interpret.
 */

export async function setServiceRequestStatus(
  requestId: string,
  status: string,
  quotation?: string,
  adminNotes?: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { data: existing, error: readError } = await client
      .from('service_requests')
      .select('id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (readError || !existing) {
      return { ok: false, error: 'রিকোয়েস্টটি পাওয়া যায়নি।' };
    }
    const allowed = [
      'new', 'submitted', 'reviewing', 'assigned',
      'contacted', 'in_progress', 'completed', 'cancelled', 'rejected',
    ];
    if (!allowed.includes(status)) {
      return { ok: false, error: 'অবৈধ স্ট্যাটাস।' };
    }

    const patch: Record<string, string | null> = { status };
    if (quotation !== undefined) patch.quotation = quotation.trim() || null;
    if (adminNotes !== undefined) patch.admin_notes = adminNotes.trim() || null;

    const { error } = await client
      .from('service_requests')
      .update(patch)
      .eq('id', requestId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/requests');
    return { ok: true, message: 'রিকোয়েস্টের স্ট্যাটাস আপডেট হয়েছে।' };
  });
}

export async function updateHomeServiceRequest(input: {
  requestId: string;
  status: string;
  adminNotes: string;
  quotation?: string;
  workerId?: string | null;
}): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (
      typeof input?.requestId !== 'string' ||
      typeof input.status !== 'string' ||
      typeof input.adminNotes !== 'string' ||
      (input.quotation !== undefined && typeof input.quotation !== 'string') ||
      (input.workerId !== undefined && input.workerId !== null && typeof input.workerId !== 'string')
    ) {
      return { ok: false, error: 'রিকোয়েস্টের পরিবর্তনগুলো সঠিক নয়।' };
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.requestId)) {
      return { ok: false, error: 'রিকোয়েস্ট আইডি সঠিক নয়।' };
    }
    if (!SERVICE_REQUEST_STATUSES.includes(input.status as (typeof SERVICE_REQUEST_STATUSES)[number])) {
      return { ok: false, error: 'স্ট্যাটাসের মান সঠিক নয়।' };
    }
    if (input.adminNotes.length > 5000 || (input.quotation?.length ?? 0) > 500) {
      return { ok: false, error: 'নোট বা কোটেশনের দৈর্ঘ্য অনুমোদিত সীমার বেশি।' };
    }

    const { data: existing, error: readError } = await client
      .from('service_requests')
      .select('id, customer_id, service_slug, service_meta, status, profile_id, contact_name, area_id')
      .eq('id', input.requestId)
      .in('service_slug', [...HOME_SERVICE_SLUGS])
      .maybeSingle();
    if (readError) return { ok: false, error: `রিকোয়েস্ট যাচাই ব্যর্থ হয়েছে: ${readError.message}` };
    if (!existing) return { ok: false, error: 'রিকোয়েস্টটি পাওয়া যায়নি।' };

    let worker: { id: string; name_bn: string } | null = null;
    if (input.workerId) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.workerId)) {
        return { ok: false, error: 'কর্মী আইডি সঠিক নয়।' };
      }
      const workerService = existing.service_slug as StaffServiceKey;
      if (!['kajer-bua', 'electrician', 'plumber'].includes(workerService)) {
        return { ok: false, error: 'এই সেবার জন্য কর্মী ক্যাটাগরি এখনো পরিচালিত হয় না।' };
      }
      const { data, error } = await client
        .from('staff_profiles')
        .select('id, name_bn, service_slug, areas, work_types, availability, is_active')
        .eq('id', input.workerId)
        .maybeSingle();
      if (error) return { ok: false, error: `কর্মী যাচাই ব্যর্থ হয়েছে: ${error.message}` };
      if (!data || !data.is_active || data.availability === 'busy' || data.service_slug !== workerService) {
        return { ok: false, error: 'নির্বাচিত কর্মী সক্রিয়, উপযুক্ত বা উপলভ্য নন।' };
      }
      const serviceMeta = existing.service_meta as { serviceTypeId?: unknown } | null;
      const requestedWorkType = typeof serviceMeta?.serviceTypeId === 'string'
        ? serviceMeta.serviceTypeId
        : null;
      if (requestedWorkType && !(data.work_types ?? []).includes(requestedWorkType)) {
        return { ok: false, error: 'নির্বাচিত কর্মীর প্রোফাইলে এই নির্দিষ্ট কাজের দক্ষতা নেই।' };
      }
      const workerAreas = data.areas ?? [];
      if (existing.area_id && (!workerAreas.length || !workerAreas.includes(existing.area_id))) {
        return { ok: false, error: 'নির্বাচিত কর্মী এই রিকোয়েস্টের এলাকায় কাজ করেন না।' };
      }
      worker = { id: data.id, name_bn: data.name_bn };
    }

    if (
      ['completed', 'cancelled', 'rejected'].includes(existing.status) &&
      input.status === 'assigned'
    ) {
      return { ok: false, error: 'সম্পন্ন, বাতিল বা প্রত্যাখ্যাত রিকোয়েস্টে কর্মী নির্ধারণ করা যাবে না।' };
    }
    if (input.status === 'assigned' && !input.workerId) {
      return { ok: false, error: 'কর্মী নির্ধারণের আগে একজন উপযুক্ত কর্মী বাছাই করুন।' };
    }
    const assignmentChanged =
      input.workerId !== undefined && (existing.profile_id ?? null) !== (worker?.id ?? null);
    if (assignmentChanged && ['completed', 'cancelled', 'rejected'].includes(existing.status)) {
      return { ok: false, error: 'সম্পন্ন, বাতিল বা প্রত্যাখ্যাত রিকোয়েস্টে কর্মী পরিবর্তন করা যাবে না।' };
    }

    const patch: Record<string, string | null> = {
      status: input.status,
      admin_notes: input.adminNotes.trim() || null,
      quotation: input.quotation?.trim() || null,
    };
    if (input.workerId !== undefined) {
      patch.profile_id = worker?.id ?? null;
      patch.profile_title = worker?.name_bn ?? null;
    }

    const { error: updateError } = await client
      .from('service_requests')
      .update(patch)
      .eq('id', input.requestId);
    if (updateError) return { ok: false, error: `রিকোয়েস্ট সংরক্ষণ ব্যর্থ হয়েছে: ${updateError.message}` };

    const statusChanged = existing.status !== input.status;
    let notificationError: string | null = null;
    if (statusChanged || assignmentChanged) {
      const title = assignmentChanged
        ? 'আপনার সেবা রিকোয়েস্টে কর্মী নির্ধারণ হয়েছে'
        : `আপনার সেবা রিকোয়েস্টের অবস্থা: ${input.status}`;
      const body = assignmentChanged
        ? `আপনার রিকোয়েস্টে ${worker?.name_bn ?? 'নির্ধারিত কর্মী'}-কে যুক্ত করা হয়েছে।`
        : `আপনার রিকোয়েস্টের বর্তমান অবস্থা "${input.status}"।`;
      const { error } = await client.from('notifications').insert({
        user_id: existing.customer_id,
        target_role: 'customer',
        title,
        body,
        type: input.status === 'completed' ? 'success' : 'info',
        related_type: 'service_request',
        related_id: input.requestId,
      });
      if (error) {
        notificationError = error.message;
        console.error('Service request notification could not be recorded.');
      }
    }

    revalidatePath('/admin/requests');
    revalidatePath(`/admin/requests/${input.requestId}`);
    revalidatePath(`/admin/requests/${input.requestId}/operations`);
    revalidatePath('/admin/services');
    revalidatePath('/admin');
    revalidatePath('/profile');
    return {
      ok: true,
      message: notificationError
        ? 'রিকোয়েস্ট সংরক্ষিত হয়েছে, তবে গ্রাহক নোটিফিকেশন সংরক্ষণ করা যায়নি।'
        : 'রিকোয়েস্ট সংরক্ষিত হয়েছে।',
    };
  });
}

export async function setToletRequestStatus(
  requestId: string,
  status: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const allowed = ['submitted', 'contacted', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return { ok: false, error: 'অবৈধ স্ট্যাটাস।' };
    }

    const { error } = await client
      .from('tolet_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/tolet-requests');
    return { ok: true, message: 'অনুসন্ধানের স্ট্যাটাস আপডেট হয়েছে।' };
  });
}

export async function setVehicleRequestStatus(
  requestId: string,
  status: string
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)) {
      return { ok: false, error: 'রিকোয়েস্ট আইডি সঠিক নয়।' };
    }
    const allowed = ['new', 'contacted', 'closed'];
    if (!allowed.includes(status)) {
      return { ok: false, error: 'অবৈধ স্ট্যাটাস।' };
    }

    const { data, error } = await client
      .from('vehicle_requests')
      .update({ status })
      .eq('id', requestId)
      .select('id')
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'রিকোয়েস্টটি পাওয়া যায়নি অথবা আপডেটের অনুমতি নেই।' };

    revalidatePath('/admin/vehicle-requests');
    revalidatePath(`/admin/vehicle-requests/${requestId}`);
    revalidatePath('/profile/requests');
    return { ok: true, message: status === 'closed' ? 'রিকোয়েস্টটি বন্ধ হয়েছে; বুকিং বা পেমেন্ট নিশ্চিত করা হয়নি।' : 'রিকোয়েস্টের অবস্থা আপডেট হয়েছে।' };
  });
}

export async function deleteServiceRequest(requestId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('service_requests').delete().eq('id', requestId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/requests');
    return { ok: true, message: 'রিকোয়েস্টটি মুছে ফেলা হয়েছে।' };
  });
}

export async function deleteToletRequest(requestId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('tolet_requests').delete().eq('id', requestId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/tolet-requests');
    return { ok: true, message: 'অনুসন্ধানটি মুছে ফেলা হয়েছে।' };
  });
}
