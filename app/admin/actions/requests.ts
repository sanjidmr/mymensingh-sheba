'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';

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
    const allowed = ['new', 'contacted', 'closed'];
    if (!allowed.includes(status)) {
      return { ok: false, error: 'অবৈধ স্ট্যাটাস।' };
    }

    const { error } = await client
      .from('vehicle_requests')
      .update({ status })
      .eq('id', requestId);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/vehicle-requests');
    return { ok: true, message: 'রিকোয়েস্টের স্ট্যাটাস আপডেট হয়েছে।' };
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

export async function deleteVehicleRequest(requestId: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const { error } = await client.from('vehicle_requests').delete().eq('id', requestId);
    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/vehicle-requests');
    return { ok: true, message: 'রিকোয়েস্টটি মুছে ফেলা হয়েছে।' };
  });
}