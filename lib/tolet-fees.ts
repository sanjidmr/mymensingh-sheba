/**
 * To-Let Platform Fee Engine (single source of truth).
 *
 * Default slables:
 *  - Mess / Hostel / Seat: ৳50
 *  - Rent up to ৳10,000:    ৳100
 *  - ৳10,000 < rent <= ৳20,000: ৳200
 *  - Rent above ৳20,000:    ৳400
 *
 * Admins can persist overrides to `platform_settings` (key: tolet_fee_rules).
 */
import { isSupabaseConfigured, createClient } from './supabase/client';
import type { ToletPropertyType } from './tolet-types';

export interface ToletFeeRules {
  messSeatFee: number;
  tier1Max10k: number;
  tier2Max20k: number;
  tier3Above20k: number;
}

export const DEFAULT_TOLET_FEE_RULES: ToletFeeRules = {
  messSeatFee: 50,
  tier1Max10k: 100,
  tier2Max20k: 200,
  tier3Above20k: 400,
};

const FEE_SETTINGS_KEY = 'tolet_fee_rules';

const MESS_LIKE_TYPES: ToletPropertyType[] = ['mess', 'hostel', 'seat'];

let currentRules: ToletFeeRules = { ...DEFAULT_TOLET_FEE_RULES };

export function getToletFeeRules(): ToletFeeRules {
  return { ...currentRules };
}

export function setToletFeeRules(rules: Partial<ToletFeeRules>): void {
  currentRules = { ...DEFAULT_TOLET_FEE_RULES, ...rules };
}

export function calculateToletFee(rentPrice: number, propertyType: ToletPropertyType | string): number {
  const rent = Math.max(0, Number(rentPrice) || 0);
  if (MESS_LIKE_TYPES.includes(propertyType as ToletPropertyType)) {
    return currentRules.messSeatFee;
  }
  if (rent <= 10000) return currentRules.tier1Max10k;
  if (rent <= 20000) return currentRules.tier2Max20k;
  return currentRules.tier3Above20k;
}

export function calculateToletTotal(rentPrice: number, propertyType: ToletPropertyType | string): number {
  return Math.max(0, Number(rentPrice) || 0) + calculateToletFee(rentPrice, propertyType);
}

export function getToletFeeDescription(): string {
  return `মেস/হোস্টেল/সিট: ৳${currentRules.messSeatFee}, ১০ হাজার পর্যন্ত ভাড়ায়: ৳${currentRules.tier1Max10k}, ১০–২০ হাজার ভাড়ায়: ৳${currentRules.tier2Max20k}, ২০ হাজারের ঊর্ধ্বে: ৳${currentRules.tier3Above20k}`;
}

export async function loadToletFeeRules(): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase সংযুক্ত নেই; সংরক্ষিত প্ল্যাটফর্ম ফি লোড করা যায়নি।');
  }
  const client = createClient();
  if (!client) throw new Error('Supabase ক্লায়েন্ট তৈরি করা যায়নি; আবার চেষ্টা করুন।');
  const { data, error } = await client
    .from('platform_settings')
    .select('value')
    .eq('key', FEE_SETTINGS_KEY)
    .maybeSingle();
  if (error) throw new Error(`প্ল্যাটফর্ম ফি লোড ব্যর্থ হয়েছে: ${error.message}`);
  if (data?.value && typeof data.value === 'object') {
    setToletFeeRules(data.value as Partial<ToletFeeRules>);
  }
}