'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import type { EmergencyService } from '@/lib/catalog-types';

export interface EmergencyContactFormData {
  service: EmergencyService;
  nameBn: string;
  organizationBn: string;
  areaId: string;
  addressBn: string;
  phone: string;
  sourceNote: string;
  sortOrder: number;
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
    const nameBn = input.nameBn.trim();
    const organizationBn = input.organizationBn.trim();
    const areaId = input.areaId.trim();
    const addressBn = input.addressBn.trim();
    const sourceNote = input.sourceNote.trim();
    const phone = toEnglishDigits(input.phone).replace(/[^\d+]/g, '');
    const digits = phone.replace(/\D/g, '');
    const sortOrder = Number(input.sortOrder);

    if (!allowedServices.includes(input.service)) {
      return { ok: false, error: 'জরুরি সেবার ধরন সঠিক নয়।' };
    }
    if (!nameBn || nameBn.length > 120) {
      return { ok: false, error: 'নাম ১ থেকে ১২০ অক্ষরের মধ্যে লিখুন।' };
    }
    if (!/^\+?\d{7,15}$/.test(phone) || digits.length < 7 || digits.length > 15) {
      return { ok: false, error: 'সঠিক ফোন নম্বর লিখুন।' };
    }
    if (!sourceNote || sourceNote.length > 500) {
      return { ok: false, error: 'যাচাইকৃত নম্বরের উৎস উল্লেখ করুন (সর্বোচ্চ ৫০০ অক্ষর)।' };
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

    const values = {
      service: input.service,
      name_bn: nameBn,
      organization_bn: organizationBn || null,
      area_id: areaId || null,
      address_bn: addressBn || null,
      phone,
      source_note: sourceNote,
      sort_order: sortOrder,
    };

    const write = contactId
      ? await client.from('emergency_contacts').update(values).eq('id', contactId).select('id').maybeSingle()
      : await client.from('emergency_contacts').insert({ ...values, is_active: false }).select('id').single();

    if (write.error) return { ok: false, error: write.error.message };
    if (!write.data) return { ok: false, error: 'জরুরি যোগাযোগের রেকর্ডটি পাওয়া যায়নি।' };

    revalidatePath('/admin/catalog');
    revalidatePath('/doctors');
    revalidatePath('/doctor');
    revalidatePath('/police');
    revalidatePath('/ambulance');
    revalidatePath('/fireservice');
    revalidatePath('/fire-service');
    return {
      ok: true,
      message: contactId ? 'জরুরি যোগাযোগের তথ্য আপডেট হয়েছে।' : 'তথ্য যোগ হয়েছে; প্রকাশের আগে চালু করুন।',
    };
  });
}
