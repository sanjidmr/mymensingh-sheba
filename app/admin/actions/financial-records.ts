'use server';

import { revalidatePath } from 'next/cache';
import { runAdminAction, type ActionResult } from '@/lib/admin/actions';
import type { AdminFinancialService } from '@/lib/admin/queries';

const SERVICES: AdminFinancialService[] = [
  'tolet',
  'tutor',
  'blood_donor',
  'wifi',
  'coaching',
  'vehicle',
  'staff',
  'other',
];

interface FinancialRecordInput {
  serviceKey: AdminFinancialService;
  incomeAmount: number;
  dueAmount: number;
  recordDate: string;
  notes: string;
}

function validate(input: FinancialRecordInput): string | null {
  if (!SERVICES.includes(input.serviceKey)) return 'সার্ভিসের ধরন নির্বাচন করুন।';
  if (
    !Number.isFinite(input.incomeAmount) || input.incomeAmount < 0 || input.incomeAmount > 9_999_999_999.99 ||
    !Number.isFinite(input.dueAmount) || input.dueAmount < 0 || input.dueAmount > 9_999_999_999.99 ||
    Math.round(input.incomeAmount * 100) !== input.incomeAmount * 100 ||
    Math.round(input.dueAmount * 100) !== input.dueAmount * 100
  ) return 'আয় ও বকেয়া ০ বা তার বেশি এবং সর্বোচ্চ ২ দশমিক ঘর পর্যন্ত লিখুন।';
  if (input.incomeAmount === 0 && input.dueAmount === 0) return 'আয় অথবা বকেয়ার অন্তত একটি পরিমাণ দিতে হবে।';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.recordDate)) return 'তারিখটি সঠিক নয়।';
  const parsedDate = new Date(`${input.recordDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== input.recordDate) {
    return 'তারিখটি সঠিক নয়।';
  }
  if (typeof input.notes !== 'string' || input.notes.trim().length > 2000) {
    return 'বিস্তারিত নোট সর্বোচ্চ ২০০০ অক্ষরের মধ্যে লিখুন।';
  }
  return null;
}

export async function createFinancialRecord(input: FinancialRecordInput): Promise<ActionResult> {
  return runAdminAction(async (client, userId) => {
    const validationError = validate(input);
    if (validationError) return { ok: false, error: validationError };
    const { error } = await client.from('admin_financial_records').insert({
      service_key: input.serviceKey,
      income_amount: input.incomeAmount,
      due_amount: input.dueAmount,
      record_date: input.recordDate,
      notes: input.notes.trim(),
      created_by: userId,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/admin/finance');
    return { ok: true, message: 'আর্থিক হিসাব সংরক্ষণ হয়েছে।' };
  });
}

export async function updateFinancialRecord(
  id: string,
  input: FinancialRecordInput
): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return { ok: false, error: 'হিসাবের আইডি সঠিক নয়।' };
    }
    const validationError = validate(input);
    if (validationError) return { ok: false, error: validationError };
    const { data, error } = await client
      .from('admin_financial_records')
      .update({
        service_key: input.serviceKey,
        income_amount: input.incomeAmount,
        due_amount: input.dueAmount,
        record_date: input.recordDate,
        notes: input.notes.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'হিসাবটি পাওয়া যায়নি।' };
    revalidatePath('/admin/finance');
    return { ok: true, message: 'আর্থিক হিসাব হালনাগাদ হয়েছে।' };
  });
}

export async function deleteFinancialRecord(id: string): Promise<ActionResult> {
  return runAdminAction(async (client) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return { ok: false, error: 'হিসাবের আইডি সঠিক নয়।' };
    }
    const { data, error } = await client
      .from('admin_financial_records')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'হিসাবটি পাওয়া যায়নি।' };
    revalidatePath('/admin/finance');
    return { ok: true, message: 'আর্থিক হিসাব মুছে ফেলা হয়েছে।' };
  });
}
