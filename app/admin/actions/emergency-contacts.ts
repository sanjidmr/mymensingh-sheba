'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import type { EmergencyService } from '@/lib/catalog-types';

export interface EmergencyContactFormData {
  service: EmergencyService;
  nameBn?: string;
  organizationBn?: string;
  areaId?: string;
  addressBn?: string;
  phone: string;
  sourceNote?: string;
  sortOrder?: number;
}

function toEnglishDigits(value: string): string {
  return value.replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
}

export async function saveEmergencyContact(
  contactId: string | null,
  input: EmergencyContactFormData
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    const allowedServices: EmergencyService[] = ['doctor', 'police', 'ambulance', 'fire_service'];
    const nameBn = input.nameBn?.trim() ?? '';
    const organizationBn = input.organizationBn?.trim() ?? '';
    const areaId = input.areaId?.trim() ?? '';
    const addressBn = input.addressBn?.trim() ?? '';
    const sourceNote = input.sourceNote?.trim() ?? '';
    const phone = toEnglishDigits(input.phone).replace(/[^\d+]/g, '');
    const digits = phone.replace(/\D/g, '');
    const sortOrder = input.sortOrder === undefined ? 0 : Number(input.sortOrder);
    const serviceLabels: Record<EmergencyService, string> = {
      doctor: 'চিকিৎসক',
      police: 'পুলিশ',
      ambulance: 'অ্যাম্বুলেন্স',
      fire_service: 'ফায়ার সার্ভিস',
    };

    if (!allowedServices.includes(input.service)) {
      return { ok: false, error: 'জরুরি সেবার ধরন সঠিক নয়।' };
    }
    if (!contactId && input.service !== 'police' && input.service !== 'ambulance') {
      return { ok: false, error: 'নতুন যোগাযোগের জন্য পুলিশ বা অ্যাম্বুলেন্স নির্বাচন করুন।' };
    }
    if (contactId && (input.service === 'doctor' || input.service === 'fire_service')) {
      const { data: existing, error: existingError } = await client
        .from('emergency_contacts')
        .select('service')
        .eq('id', contactId)
        .maybeSingle();
      if (existingError) return { ok: false, error: `পুরোনো যোগাযোগ যাচাই ব্যর্থ হয়েছে: ${existingError.message}` };
      if (!existing || existing.service !== input.service) {
        return { ok: false, error: 'ডাক্তার ও ফায়ার সার্ভিস নতুন করে যোগ করা যাবে না।' };
      }
    }
    if (nameBn.length > 120) {
      return { ok: false, error: 'নাম সর্বোচ্চ ১২০ অক্ষরের মধ্যে লিখুন।' };
    }
    if (!/^\+?\d{7,15}$/.test(phone) || digits.length < 7 || digits.length > 15) {
      return { ok: false, error: 'সঠিক ফোন নম্বর লিখুন।' };
    }
    if (sourceNote.length > 500) {
      return { ok: false, error: 'তথ্য যাচাইয়ের নোট সর্বোচ্চ ৫০০ অক্ষরের মধ্যে লিখুন।' };
    }
    if (
      organizationBn.length > 160 ||
      areaId.length > 100 ||
      addressBn.length > 300 ||
      !Number.isInteger(sortOrder) ||
      sortOrder < 0 ||
      sortOrder > 9999
    ) {
      return { ok: false, error: 'প্রতিষ্ঠান, ঠিকানা বা তালিকার ক্রমের তথ্য সঠিক নয়।' };
    }

    const values: Record<string, unknown> = {
      service: input.service,
      phone,
      is_active: true,
    };
    if (input.nameBn !== undefined || !contactId) {
      values.name_bn = nameBn || serviceLabels[input.service];
    }
    if (input.organizationBn !== undefined || !contactId) values.organization_bn = organizationBn || null;
    if (input.areaId !== undefined || !contactId) values.area_id = areaId || null;
    if (input.addressBn !== undefined || !contactId) values.address_bn = addressBn || null;
    if (input.sourceNote !== undefined || !contactId) values.source_note = sourceNote || null;
    if (input.sortOrder !== undefined || !contactId) values.sort_order = sortOrder;

    const write = contactId
      ? await client.from('emergency_contacts').update(values).eq('id', contactId).select('id').maybeSingle()
      : await client.from('emergency_contacts').insert(values).select('id').single();

    if (write.error) return { ok: false, error: write.error.message };
    if (!write.data) return { ok: false, error: 'জরুরি যোগাযোগের রেকর্ডটি পাওয়া যায়নি।' };

    revalidatePath('/admin/emergency-contacts');
    revalidatePath('/doctors');
    revalidatePath('/doctor');
    revalidatePath('/police');
    revalidatePath('/ambulance');
    revalidatePath('/fireservice');
    revalidatePath('/fire-service');
    return {
      ok: true,
      message: contactId ? 'জরুরি যোগাযোগের তথ্য আপডেট ও প্রকাশিত হয়েছে।' : 'জরুরি যোগাযোগ যোগ ও প্রকাশিত হয়েছে।',
    };
  });
}
